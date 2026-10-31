import { VideoItem, DocumentItem, TranscriptSegment, DocumentChunk, SourceReference, ChatMessage } from '../types.js';

export interface RagResult {
  answer: string;
  evidenceGrounded: boolean;
  insufficientEvidence: boolean;
  futureContentBlocked: boolean;
  blockedExplanationTime?: string;
  sources: SourceReference[];
  eligibleTranscriptsCount: number;
  totalTranscriptsCount: number;
}

export function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function calculateTextSimilarity(
  query: string,
  text: string,
  queryVariants: string[] = []
): number {
  const stopWords = new Set([
    'the', 'is', 'are', 'was', 'were', 'what', 'which', 'when',
    'where', 'why', 'how', 'does', 'did', 'do', 'can', 'could',
    'would', 'should', 'explain', 'tell', 'about', 'this', 'that',
    'for', 'and', 'with', 'from', 'into', 'you', 'your',
    'hai', 'hain', 'kya', 'kaise', 'kyun', 'mein', 'me', 'ko',
    'ka', 'ki', 'ke', 'se', 'aur', 'ye', 'woh', 'batao', 'samjhao'
  ]);

  const tokenize = (value: string): string[] =>
    (value.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])
      .filter(word => !stopWords.has(word));

  const targetWords = new Set(tokenize(text));
  const variants = [query, ...queryVariants];

  let bestScore = 0;

  for (const variant of variants) {
    const terms = [...new Set(tokenize(variant))];

    if (terms.length === 0) continue;

    let matched = 0;

    for (const term of terms) {
      if (targetWords.has(term)) {
        matched++;
      }
    }

    const score = matched / terms.length;

    if (score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore;
}

export function performChronoScopedRag(
  question: string,
  video?: VideoItem | null,
  currentTimestampSeconds: number = 0,
  documents: DocumentItem[] = [],
  queryVariants: string[] = []
): RagResult {
  const sources: SourceReference[] = [];
  const qClean = question.trim();

  // 1. Separate transcripts by current timestamp
  let eligibleTranscripts: TranscriptSegment[] = [];
  let futureTranscripts: TranscriptSegment[] = [];

  if (video && video.transcripts && video.transcripts.length > 0) {
    eligibleTranscripts = video.transcripts.filter(t => t.start <= currentTimestampSeconds);
    futureTranscripts = video.transcripts.filter(t => t.start > currentTimestampSeconds);
  }

  // 2. Score eligible transcripts
  const eligibleMatches: { transcript: TranscriptSegment; score: number }[] = [];
  for (const t of eligibleTranscripts) {
   const score = calculateTextSimilarity(
  qClean,
  `${t.title || ''} ${t.text}`,
  queryVariants
);
    if (score > 0.3) {
      eligibleMatches.push({ transcript: t, score });
    }
  }
  // Sort by score first, then by timestamp (prefer later segments for same score to avoid always matching intro)
  eligibleMatches.sort((a, b) => {
    if (Math.abs(b.score - a.score) < 0.1) {
      return b.transcript.start - a.transcript.start; // Prefer later segments
    }
    return b.score - a.score;
  });

  // 3. Score future transcripts to identify if topic is coming up
  const futureMatches: { transcript: TranscriptSegment; score: number }[] = [];
  for (const t of futureTranscripts) {
    const score = calculateTextSimilarity(qClean, `${t.title || ''} ${t.text}`);
    if (score > 0.4) {
      futureMatches.push({ transcript: t, score });
    }
  }
  futureMatches.sort((a, b) => b.score - a.score);

  // 4. Score document chunks
  const documentMatches: { doc: DocumentItem; chunk: DocumentChunk; score: number }[] = [];
  for (const doc of documents) {
    for (const chunk of doc.chunks) {
     const score = calculateTextSimilarity(
  qClean,
  `${chunk.title || ''} ${chunk.content}`,
  queryVariants
);
      if (score > 0.18) {
        documentMatches.push({ doc, chunk, score });
      }
    }
  }
  documentMatches.sort((a, b) => b.score - a.score);

  // 5. Evaluate Chrono-Scoped rule
  const currentFormatted = formatSecondsToTime(currentTimestampSeconds);

  // CASE A: Topic is prominently in future video transcripts, but NOT in eligible video transcripts (≤ currentTimestampSeconds)
  if (futureMatches.length > 0 && eligibleMatches.length === 0) {
    const futureTop = futureMatches[0].transcript;
    const futureTimeFormatted = futureTop.timestampFormatted || formatSecondsToTime(futureTop.start);

    // Strict Chrono-Scoped lock: Future lecture content is blocked to prevent spoilers and ensure sequential learning
    return {
      answer: `⏱️ **Chrono-Scoped RAG Notice: Topic Not Covered Yet**\n\n` +
        `You asked: *"${qClean}"*\n\n` +
        `At your current playback position (**${currentFormatted}**), this concept has **not yet been introduced** in the video lecture. ` +
        `In accordance with Learnova's strict Chrono-Scoped RAG policy, future video transcript segments are locked to avoid confusion and prevent premature cognitive overload.\n\n` +
        `🔍 **Lecture Timeline:**\n` +
        `• Current Playback Position: **${currentFormatted}** (Unlocked segments: ${eligibleTranscripts.length}/${video?.transcripts.length || 0})\n` +
        `• Future Topic Coverage: **${futureTimeFormatted}** ("*${futureTop.title}*")\n\n` +
        `I could not find sufficient evidence in your available learning materials up to timestamp ${currentFormatted}. Please continue watching to timestamp **${futureTimeFormatted}** to unlock this explanation.`,
      evidenceGrounded: false,
      insufficientEvidence: true,
      futureContentBlocked: true,
      blockedExplanationTime: futureTimeFormatted,
      sources: [],
      eligibleTranscriptsCount: eligibleTranscripts.length,
      totalTranscriptsCount: video ? video.transcripts.length : 0,
    };
  }

  // CASE B: Supported by eligible video transcripts (video selected - ONLY use video transcript)
  if (eligibleMatches.length > 0) {
    const topVideoMatch = eligibleMatches[0].transcript;
    sources.push({
      type: 'video',
      title: video?.title || 'Video Lecture',
      identifier: `Video [${topVideoMatch.timestampFormatted}]`,
      timestampSeconds: topVideoMatch.start,
      snippet: topVideoMatch.text.substring(0, 160) + '...',
    });

    let answerText = `Based strictly on the content covered up to timestamp **${currentFormatted}** in **${video?.title}**:\n\n`;
    answerText += `📌 **Source: [Video ${topVideoMatch.timestampFormatted} - ${topVideoMatch.title}]**\n`;
    answerText += `${topVideoMatch.text}\n\n`;
    answerText += `💡 **Key Takeaway:** This answer is based exclusively on the selected video's transcript up to timestamp ${currentFormatted}.`;

    return {
      answer: answerText,
      evidenceGrounded: true,
      insufficientEvidence: false,
      futureContentBlocked: false,
      sources,
      eligibleTranscriptsCount: eligibleTranscripts.length,
      totalTranscriptsCount: video ? video.transcripts.length : 0,
    };
  }

  // CASE C: Video selected but no transcript matches - say so instead of using documents
  if (video && video.transcripts && video.transcripts.length > 0) {
    return {
      answer: `I could not find information about your question in the selected video's transcript up to timestamp **${currentFormatted}**.\n\n` +
        `The video has ${video.transcripts.length} transcript segments available, but none appear to match your query in the unlocked portion (≤ ${currentFormatted}).\n\n` +
        `Please try rephrasing your question or continue watching the video to find related content.`,
      evidenceGrounded: false,
      insufficientEvidence: true,
      futureContentBlocked: false,
      sources: [],
      eligibleTranscriptsCount: eligibleTranscripts.length,
      totalTranscriptsCount: video.transcripts.length,
    };
  }

  // CASE D: Supported purely by documents (no video selected, or video has no transcripts)
  if (documentMatches.length > 0) {
    const topDoc = documentMatches[0];
    const docLabel = topDoc.chunk.type === 'slide' ? `Slide ${topDoc.chunk.pageOrSlideNumber}` : `Page ${topDoc.chunk.pageOrSlideNumber}`;
    sources.push({
      type: topDoc.doc.type,
      title: topDoc.doc.title,
      identifier: `${topDoc.doc.title} [${docLabel}]`,
      pageNumber: topDoc.chunk.pageOrSlideNumber,
      snippet: topDoc.chunk.content.substring(0, 160) + '...',
    });

    return {
      answer: `Based on your uploaded course materials:\n\n` +
        `📄 **Source: [${topDoc.doc.title} - ${docLabel}]**\n` +
        `${topDoc.chunk.content}\n\n` +
        `This explanation is strictly grounded in the retrieved document chunk.`,
      evidenceGrounded: true,
      insufficientEvidence: false,
      futureContentBlocked: false,
      sources,
      eligibleTranscriptsCount: eligibleTranscripts.length,
      totalTranscriptsCount: video ? video.transcripts.length : 0,
    };
  }

  // CASE E: Neither video nor document contains sufficient evidence
  return {
    answer: `I could not find sufficient evidence in your available learning materials. Please refer to additional resources or review earlier course units. ` +
      (video ? `(Playback timestamp analyzed: ${currentFormatted})` : ''),
    evidenceGrounded: false,
    insufficientEvidence: true,
    futureContentBlocked: false,
    sources: [],
    eligibleTranscriptsCount: eligibleTranscripts.length,
    totalTranscriptsCount: video ? video.transcripts.length : 0,
  };
}
