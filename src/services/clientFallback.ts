import { DEMO_USER, INITIAL_VIDEOS, INITIAL_DOCUMENTS, CODING_PROBLEMS, INITIAL_ANALYTICS, INTERVIEW_QUESTIONS } from '../constants.js';
import { performChronoScopedRag } from './ragEngine.js';
import { verifyCode } from './codeVerifier.js';
import { generateQuizFromVideo, generateQuizFromDocument, evaluateQuizAttempt, validateQuizAnswers } from './quizEngine.js';
import { evaluateInterviewAnswer } from './interviewEngine.js';
import { VideoItem, DocumentItem, Quiz } from '../types.js';
import { extractYouTubeVideoId } from '../utils/youtube.js';

// Browser-safe local fallback store (no Node.js or native database dependencies)
let fallbackVideos: VideoItem[] = [...INITIAL_VIDEOS];
let fallbackDocuments: DocumentItem[] = [...INITIAL_DOCUMENTS];
const fallbackIssuedQuizzes = new Map<string, Quiz>();
const fallbackSubmittedQuizAttemptIds = new Set<string>();

function sanitizeText(val: any, maxLen = 255): string {
  if (typeof val !== 'string') return '';
  return val.replace(/<[^>]*>?/gm, '').trim().substring(0, maxLen);
}

const ALLOWED_DOC_TYPES = ['pdf', 'pptx', 'txt', 'notes'];
const DANGEROUS_EXTENSIONS = ['exe', 'sh', 'bat', 'cmd', 'ps1', 'html', 'htm', 'php', 'js', 'py', 'vbs', 'dll', 'bin', 'svg', 'jar'];

export function handleClientFallback(
  method: string,
  pathname: string,
  body: any = {}
): { status: number; data: any } {
  const url = pathname.replace(/\/$/, '');

  if (url === '/api/health' && method === 'GET') {
    return {
      status: 200,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'browser-client',
        database: {
          configured: false,
          connected: false,
          engine: 'In-Memory (Demo Mode)',
          message: 'Running in Demo Mode with in-memory browser persistence.',
        },
        gemini: {
          configured: false,
          model: 'gemini-3.8-flash',
        },
      },
    };
  }

  if (url === '/api/auth/me' && method === 'GET') {
    try {
      if (sessionStorage.getItem('learnova_demo_session') === 'active') {
        return { status: 200, data: { user: DEMO_USER, authenticated: true } };
      }
    } catch {
      return { status: 401, data: { error: 'Please sign in to continue.' } };
    }
    return { status: 401, data: { error: 'Please sign in to continue.' } };
  }

  if ((url === '/api/auth/login' || url === '/api/auth/register') && method === 'POST') {
    return { status: 503, data: { error: 'Email sign-in requires the authenticated API with a configured database. Use Demo Login for local preview.' } };
  }

  if (url === '/api/auth/demo' && method === 'POST') {
    try {
      sessionStorage.setItem('learnova_demo_session', 'active');
    } catch {
      return { status: 503, data: { error: 'Browser session storage is unavailable for Demo Login.' } };
    }
    return { status: 200, data: { user: DEMO_USER, authenticated: true } };
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    try {
      sessionStorage.removeItem('learnova_demo_session');
    } catch {
      // The client-side demo session is already unavailable.
    }
    return { status: 200, data: { message: 'Logged out successfully.' } };
  }

  if (url === '/api/videos' && method === 'GET') {
    return { status: 200, data: { videos: fallbackVideos } };
  }

  if (url === '/api/videos' && method === 'POST') {
    const { title, youtubeUrl, description, transcripts } = body || {};
    const titleClean = sanitizeText(title, 200);
    if (!titleClean || !youtubeUrl || typeof youtubeUrl !== 'string') {
      return { status: 400, data: { error: 'Valid title and YouTube URL are required.' } };
    }
    const youtubeId = extractYouTubeVideoId(youtubeUrl);
    if (!youtubeId) {
      return { status: 400, data: { error: 'Invalid YouTube URL. Please provide a standard YouTube video link.' } };
    }
    const descClean = sanitizeText(description, 1000);

    const newVideo: VideoItem = {
      id: 'vid_' + Date.now(),
      title: titleClean,
      description: descClean || 'User uploaded video',
      youtubeId,
      youtubeUrl,
      durationSeconds: 1800,
      durationFormatted: '30:00',
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      category: 'General',
      level: 'Beginner',
      keyTopics: [{ timestamp: 0, label: '00:00 - Introduction' }],
      transcripts: Array.isArray(transcripts) && transcripts.length > 0 ? transcripts : [
        {
          id: 'ts_fb_1',
          start: 0,
          end: 1800,
          timestampFormatted: '00:00',
          title: 'Full Video Transcript',
          text: 'This video covers essential concepts for students.',
        },
      ],
    };
    fallbackVideos.unshift(newVideo);
    return { status: 201, data: { video: newVideo } };
  }

  if (url.startsWith('/api/videos/') && method === 'GET') {
    const vidId = url.replace('/api/videos/', '');
    const found = fallbackVideos.find(v => v.id === vidId);
    if (!found) return { status: 404, data: { error: 'Video not found.' } };
    return { status: 200, data: { video: found } };
  }

  if (url === '/api/documents' && method === 'GET') {
    return { status: 200, data: { documents: fallbackDocuments } };
  }

  if (url === '/api/documents/upload' && method === 'POST') {
    const { title, type, content, pageCount } = body || {};
    const titleClean = sanitizeText(title, 200);
    if (!titleClean) return { status: 400, data: { error: 'Valid document title is required.' } };

    const docType = String(type || 'pdf').toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(docType) || !ALLOWED_DOC_TYPES.includes(docType)) {
      return {
        status: 400,
        data: { error: `Restricted or unsupported file format "${docType}". Allowed file formats: PDF, PPTX, TXT, Notes.` },
      };
    }

    if (content && typeof content === 'string' && content.length > 500000) {
      return { status: 400, data: { error: 'Document content exceeds 500,000 character maximum limit.' } };
    }

    const pages = typeof pageCount === 'number' && pageCount > 0 ? Math.min(Math.floor(pageCount), 200) : 3;
    const rawContent = typeof content === 'string' && content.trim().length > 0
      ? content
      : 'Uploaded document content covering computer science.';
    const paragraphs = rawContent.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
    const itemsPerPage = Math.max(1, Math.ceil(paragraphs.length / pages));
    
    const chunks = [];
    for (let p = 1; p <= pages; p++) {
      const pageParagraphs = paragraphs.slice((p - 1) * itemsPerPage, p * itemsPerPage);
      chunks.push({
        id: `chk_${Date.now()}_${p}`,
        documentId: 'doc_' + Date.now(),
        pageOrSlideNumber: p,
        type: (docType === 'pptx' ? 'slide' : 'page') as 'page' | 'slide',
        title: `${docType === 'pptx' ? 'Slide' : 'Page'} ${p}: ${titleClean.substring(0, 30)}`,
        content: pageParagraphs.length > 0 ? pageParagraphs.join('\n\n') : `Extracted content for section ${p} of ${titleClean}.`,
      });
    }

    const newDoc: DocumentItem = {
      id: 'doc_' + Date.now(),
      title: titleClean,
      type: docType as any,
      sizeBytes: rawContent.length * 8,
      uploadedAt: new Date().toISOString(),
      pageCount: pages,
      summary: `Document containing ${pages} ${docType === 'pptx' ? 'slides' : 'pages'} with extracted chunks.`,
      chunks,
    };
    fallbackDocuments.unshift(newDoc);
    return { status: 201, data: { document: newDoc } };
  }

  if (url.startsWith('/api/documents/') && method === 'DELETE') {
    const docId = url.replace('/api/documents/', '');
    fallbackDocuments = fallbackDocuments.filter(d => d.id !== docId);
    return { status: 200, data: { message: 'Document deleted successfully.' } };
  }

  if (url === '/api/ai/ask' && method === 'POST') {
    const { question, videoId, currentTimestampSeconds, documentIds } = body || {};
    const qClean = sanitizeText(question, 1000);
    if (!qClean) return { status: 400, data: { error: 'Question is required and cannot be empty.' } };

    const video = fallbackVideos.find(v => v.id === videoId) || fallbackVideos[0];
    const timestamp = typeof currentTimestampSeconds === 'number' && !isNaN(currentTimestampSeconds)
      ? Math.max(0, Math.floor(currentTimestampSeconds))
      : 0;
    const docs = Array.isArray(documentIds)
      ? fallbackDocuments.filter(d => documentIds.includes(d.id))
      : fallbackDocuments;

    const ragResult = performChronoScopedRag(qClean, video, timestamp, docs);
    return {
      status: 200,
      data: {
        ...ragResult,
        isGeminiPowered: false,
      },
    };
  }

  if (url === '/api/code/problems' && method === 'GET') {
    return { status: 200, data: { problems: CODING_PROBLEMS } };
  }

  if (url === '/api/code/verify' && method === 'POST') {
    const { problemId, language, code } = body || {};
    const allowedLangs = ['javascript', 'python', 'java', 'cpp'];
    const lang = String(language || 'javascript').toLowerCase();
    if (!allowedLangs.includes(lang)) {
      return { status: 400, data: { error: `Invalid language "${language}". Allowed: ${allowedLangs.join(', ')}` } };
    }
    if (typeof code !== 'string' || code.length > 50000) {
      return { status: 400, data: { error: 'Code submission exceeds the 50,000 character limit.' } };
    }

    const problem = CODING_PROBLEMS.find(p => p.id === problemId) || CODING_PROBLEMS[0];
    const result = verifyCode(problem, lang as any, code);
    return { status: 200, data: { verification: result } };
  }

  if (url === '/api/quizzes/generate' && method === 'POST') {
    const { sourceType, sourceId, maxTimestampSeconds, difficulty } = body || {};
    const diff = difficulty || 'Medium';
    let quiz: Quiz;
    if (sourceType === 'document' || sourceType === 'notes') {
      const doc = fallbackDocuments.find(d => d.id === sourceId);
      if (!doc) return { status: 404, data: { error: 'The selected document was not found.' } };
      quiz = generateQuizFromDocument(doc, diff);
    } else if (sourceType === 'video') {
      const video = fallbackVideos.find(v => v.id === sourceId);
      if (!video) return { status: 404, data: { error: 'The selected video was not found.' } };
      const requestedLimit = Number(maxTimestampSeconds);
      const timeLimit = Number.isFinite(requestedLimit)
        ? Math.max(0, Math.min(Math.floor(requestedLimit), video.durationSeconds))
        : 0;
      quiz = generateQuizFromVideo(video, timeLimit, diff);
    } else {
      return { status: 400, data: { error: 'Choose a supported quiz source.' } };
    }
    if (!quiz.questions.length) {
      return { status: 400, data: { error: 'No quiz questions are available for this video in the selected timestamp scope.' } };
    }
    fallbackIssuedQuizzes.set(quiz.id, quiz);
    return { status: 200, data: { quiz } };
  }

  if (url === '/api/quizzes/submit' && method === 'POST') {
    const { quizId, attemptId, userAnswers } = body || {};
    if (typeof quizId !== 'string' || typeof attemptId !== 'string' || !/^[\w-]{8,100}$/.test(attemptId)) {
      return { status: 400, data: { error: 'Quiz, attempt, and answers are required.' } };
    }
    const quiz = fallbackIssuedQuizzes.get(quizId);
    if (!quiz) return { status: 404, data: { error: 'This quiz is no longer available. Generate a new quiz and try again.' } };
    if (fallbackSubmittedQuizAttemptIds.has(attemptId)) return { status: 409, data: { error: 'This quiz attempt has already been submitted.' } };
    const validationError = validateQuizAnswers(quiz, userAnswers);
    if (validationError) return { status: 400, data: { error: validationError } };
    const attempt = evaluateQuizAttempt(quiz, userAnswers as Record<string, number>, attemptId);
    fallbackSubmittedQuizAttemptIds.add(attemptId);
    return {
      status: 200,
      data: { attempt, correctAnswers: attempt.score, incorrectAnswers: attempt.totalQuestions - attempt.score },
    };
  }

  if (url === '/api/interview/start' && method === 'POST') {
    const { domain } = body || {};
    const d = domain || 'Machine Learning';
    const questions = INTERVIEW_QUESTIONS[d] || INTERVIEW_QUESTIONS['Machine Learning'];
    return { status: 200, data: { question: questions[0] } };
  }

  if (url === '/api/interview/answer' && method === 'POST') {
    const { question, answer } = body || {};
    if (!question || !answer) return { status: 400, data: { error: 'Question and answer are required.' } };
    const feedback = evaluateInterviewAnswer(question, answer);
    return { status: 200, data: { feedback, isGeminiPowered: false } };
  }

  if (url === '/api/analytics/dashboard' && method === 'GET') {
    return { status: 200, data: { analytics: INITIAL_ANALYTICS } };
  }

  return { status: 404, data: { error: `Endpoint not found: ${method} ${pathname}` } };
}
