
import { Innertube } from 'youtubei.js';

export function extractYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input.trim());

    if (!['https:', 'http:'].includes(url.protocol)) return null;

    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let id: string | null = null;

    if (host === 'youtu.be') {
      const parts = url.pathname.split('/').filter(Boolean);
      id = parts.length === 1 ? parts[0] : null;
    } else if (
      ['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)
    ) {
      if (url.pathname === '/watch') {
        id = url.searchParams.get('v');
      } else {
        const parts = url.pathname.split('/').filter(Boolean);

        if (
          parts.length === 2 &&
          ['embed', 'shorts', 'live'].includes(parts[0])
        ) {
          id = parts[1];
        }
      }
    }

    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  timestampFormatted: string;
  title?: string;
  text: string;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Number(n))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    );
}

function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
const youtubeCaptionCache = new Map<string, TranscriptSegment[]>();
const MAX_CAPTION_CACHE_SIZE = 20;
export async function fetchYouTubeCaptions(
  videoId: string
): Promise<TranscriptSegment[] | null> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  const cachedCaptions = youtubeCaptionCache.get(videoId);

if (cachedCaptions) {
  console.log(`Using cached YouTube captions: ${videoId}`);
  return cachedCaptions;
}

  try {
    console.log(`Connecting to YouTube Android client: ${videoId}`);

    const youtube = await Innertube.create({
      lang: 'en',
      location: 'IN',
      generate_session_locally: true,
    });

   
    let tracks: any[] = [];

const clients = ['ANDROID', 'WEB', 'IOS'];

for (const client of clients) {
  try {
    console.log(`Trying YouTube client: ${client}`);

    const info: any = await youtube.getBasicInfo(videoId, {
      client: client as any,
    });
    console.log('YouTube playability status:', info.playability_status);

    tracks = info.captions?.caption_tracks ?? [];

    console.log(
      `Caption tracks from ${client}: ${tracks.length}`
    );

    if (tracks.length > 0) {
      break;
    }
  } catch (error: any) {
    console.warn(
      `YouTube ${client} client failed:`,
      error?.message || error
    );
  }
}
    console.log(`YouTube caption tracks found: ${tracks.length}`);

    if (tracks.length === 0) {
      console.warn('No caption tracks returned by YouTube.');
      return null;
    }

    const selectedTrack =
      tracks.find(
        (track: any) =>
          track.language_code === 'en' && track.kind !== 'asr'
      ) ||
      tracks.find((track: any) =>
        track.language_code?.startsWith('en')
      ) ||
      tracks[0];

    if (!selectedTrack?.base_url) {
      console.warn('Selected caption track has no URL.');
      return null;
    }

    console.log(
      `Fetching caption language: ${selectedTrack.language_code || 'unknown'}`
    );

    const response = await fetch(selectedTrack.base_url);

    if (!response.ok) {
      throw new Error(`Caption download failed: HTTP ${response.status}`);
    }

    const xml = await response.text();

    console.log(
      'Caption response content-type:',
      response.headers.get('content-type')
    );
    console.log('Caption response length:', xml.length);

    const segments: TranscriptSegment[] = [];
    let index = 0;

    // YouTube XML Format 3: captions use <p> and <s> tags.
    const paragraphRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
    let paragraphMatch: RegExpExecArray | null;

    while ((paragraphMatch = paragraphRegex.exec(xml)) !== null) {
      const attributes = paragraphMatch[1];
      const paragraph = paragraphMatch[2];

      const startMatch = attributes.match(/\bt="([^"]+)"/);
      const durationMatch = attributes.match(/\bd="([^"]+)"/);

      if (!startMatch) continue;

      const wordRegex = /<s\b[^>]*>([\s\S]*?)<\/s>/gi;
      const words: string[] = [];
      let wordMatch: RegExpExecArray | null;

      while ((wordMatch = wordRegex.exec(paragraph)) !== null) {
        const word = decodeXml(wordMatch[1])
          .replace(/<[^>]*>/g, '')
          .trim();

        if (word) words.push(word);
      }

      const text = words.join(' ').trim();

      if (!text) continue;

      // YouTube Format 3 timestamps are in milliseconds.
      const start = Number(startMatch[1]) / 1000;
      const duration = durationMatch
        ? Number(durationMatch[1]) / 1000
        : 0;

      if (!Number.isFinite(start)) continue;

      segments.push({
        id: `yt_${videoId}_${index}`,
        start,
        end: start + (Number.isFinite(duration) ? duration : 0),
        timestampFormatted: formatTimestamp(start),
        title: `Segment ${index + 1}`,
        text,
      });

      index++;
    }

    if (segments.length === 0) {
      console.warn('Caption URL returned no readable Format 3 segments.');
      console.log('Caption response preview:', xml.slice(0, 500));
      return null;
    }

    console.log(
      `YouTube captions fetched successfully: ${segments.length} segments`
    );

    console.log('First caption sample:', segments[0]);

if (youtubeCaptionCache.size >= MAX_CAPTION_CACHE_SIZE) {
  const oldestVideoId = youtubeCaptionCache.keys().next().value;

  if (oldestVideoId) {
    youtubeCaptionCache.delete(oldestVideoId);
  }
}

youtubeCaptionCache.set(videoId, segments);

return segments;
  } catch (error: any) {
    console.error(
      `YouTube caption fetch failed for ${videoId}:`,
      error?.message || error
    );

    return null;
  }
}

