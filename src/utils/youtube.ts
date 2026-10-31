export function extractYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') {
      const parts = url.pathname.split('/').filter(Boolean);
      id = parts.length === 1 ? parts[0] : null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length === 2 && (parts[0] === 'embed' || parts[0] === 'shorts')) id = parts[1];
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

/**
 * Fetches YouTube captions using the public timedtext API (no authentication required).
 * Attempts to fetch English captions first, then falls back to auto-generated captions.
 * Returns null if captions are unavailable or the fetch fails.
 */
export async function fetchYouTubeCaptions(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    // Try standard English captions first
    let transcriptUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    let response = await fetch(transcriptUrl);

    // If English captions fail, try auto-generated captions
    if (!response.ok) {
      transcriptUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`;
      response = await fetch(transcriptUrl);
    }

    if (!response.ok) {
      return null;
    }

    const text = await response.text();

    // Parse the XML transcript format
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const textElements = xmlDoc.getElementsByTagName('text');

    if (textElements.length === 0) {
      return null;
    }

    const segments: TranscriptSegment[] = [];
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      const startStr = element.getAttribute('start');
      const durStr = element.getAttribute('dur');
      const content = element.textContent?.trim();

      if (!startStr || !durStr || !content) continue;

      const start = parseFloat(startStr);
      const duration = parseFloat(durStr);
      const end = start + duration;

      // Format timestamp as mm:ss
      const mins = Math.floor(start / 60);
      const secs = Math.floor(start % 60);
      const timestampFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      segments.push({
        id: `yt_${videoId}_${i}`,
        start,
        end,
        timestampFormatted,
        title: `Segment ${i + 1}`,
        text: content.replace(/<[^>]*>/g, ''), // Remove any HTML tags
      });
    }

    return segments.length > 0 ? segments : null;
  } catch (error) {
    console.warn('Failed to fetch YouTube captions:', error);
    return null;
  }
}
