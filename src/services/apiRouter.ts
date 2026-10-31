import { GoogleGenAI } from '@google/genai';
import { DEMO_USER, INITIAL_VIDEOS, INITIAL_DOCUMENTS, CODING_PROBLEMS, INITIAL_ANALYTICS, INTERVIEW_QUESTIONS } from '../constants.js';
import { performChronoScopedRag, formatSecondsToTime } from './ragEngine.js';
import { verifyCode } from './codeVerifier.js';
import { generateQuizFromVideo, generateQuizFromDocument, evaluateQuizAttempt } from './quizEngine.js';
import { evaluateInterviewAnswer } from './interviewEngine.js';
import { VideoItem, DocumentItem } from '../types.js';
import { initDatabase, getDatabaseStatus, queryDb } from '../db/dbClient.js';

let geminiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
} catch (e) {
  console.warn('Gemini client initialization notice:', e);
}

// In-memory cache to prevent duplicate expensive LLM calls for identical query & evidence
const geminiResponseCache = new Map<string, string>();

// Input sanitization & security helpers
function sanitizeText(val: any, maxLen = 255): string {
  if (typeof val !== 'string') return '';
  return val.replace(/<[^>]*>?/gm, '').trim().substring(0, maxLen);
}

const ALLOWED_DOC_TYPES = ['pdf', 'pptx', 'txt', 'notes'];
const DANGEROUS_EXTENSIONS = ['exe', 'sh', 'bat', 'cmd', 'ps1', 'html', 'htm', 'php', 'js', 'py', 'vbs', 'dll', 'bin', 'svg', 'jar'];

// Initialize DB in background if DATABASE_URL is present
void initDatabase();

// In-memory data store for server-side demo sessions
let serverVideos: VideoItem[] = [...INITIAL_VIDEOS];
let serverDocuments: DocumentItem[] = [...INITIAL_DOCUMENTS];

export async function handleApiRequest(
  method: string,
  pathname: string,
  body: any = {}
): Promise<{ status: number; data: any }> {
  const url = pathname.replace(/\/$/, '');

  // 0. HEALTH CHECK
  if (url === '/api/health' && method === 'GET') {
    const dbStatus = getDatabaseStatus();
    return {
      status: 200,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        gemini: {
          configured: Boolean(process.env.GEMINI_API_KEY),
          model: 'gemini-3.8-flash',
        },
      },
    };
  }

  // 1. AUTHENTICATION
  if (url === '/api/auth/me' && method === 'GET') {
    return { status: 200, data: { user: DEMO_USER, authenticated: true, database: getDatabaseStatus() } };
  }

  if (url === '/api/auth/login' && method === 'POST') {
    const { email, password } = body || {};
    if (!email || !password) {
      return { status: 400, data: { error: 'Email and password are required.' } };
    }
    const emailClean = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      return { status: 400, data: { error: 'Invalid email address format.' } };
    }
    if (typeof password !== 'string' || password.length < 6) {
      return { status: 400, data: { error: 'Password must be at least 6 characters long.' } };
    }
    return {
      status: 200,
      data: {
        user: { ...DEMO_USER, email: emailClean },
        token: 'ln_token_' + Math.random().toString(36).substring(2),
        message: 'Logged in successfully.',
      },
    };
  }

  if (url === '/api/auth/register' && method === 'POST') {
    const { name, email, password } = body || {};
    if (!name || !email || !password) {
      return { status: 400, data: { error: 'All registration fields (name, email, password) are required.' } };
    }
    const nameClean = sanitizeText(name, 100);
    const emailClean = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      return { status: 400, data: { error: 'Invalid email address format.' } };
    }
    if (typeof password !== 'string' || password.length < 6) {
      return { status: 400, data: { error: 'Password must be at least 6 characters long.' } };
    }
    return {
      status: 201,
      data: {
        user: { ...DEMO_USER, name: nameClean, email: emailClean },
        token: 'ln_token_' + Math.random().toString(36).substring(2),
        message: 'Account created successfully.',
      },
    };
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    return { status: 200, data: { message: 'Logged out successfully.' } };
  }

  // 2. VIDEOS
  if (url === '/api/videos' && method === 'GET') {
    return { status: 200, data: { videos: serverVideos } };
  }

  if (url === '/api/videos' && method === 'POST') {
    const { title, youtubeUrl, description, transcripts } = body || {};
    const titleClean = sanitizeText(title, 200);
    if (!titleClean || !youtubeUrl || typeof youtubeUrl !== 'string') {
      return { status: 400, data: { error: 'Valid title and YouTube URL are required.' } };
    }
    const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (!match) {
      return { status: 400, data: { error: 'Invalid YouTube URL. Please provide a standard YouTube video link.' } };
    }
    const youtubeId = match[1];
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
          id: 'ts_usr_1',
          start: 0,
          end: 1800,
          timestampFormatted: '00:00',
          title: 'Full Video Transcript',
          text: 'This video covers essential concepts for students.',
        },
      ],
    };
    serverVideos.unshift(newVideo);
    return { status: 201, data: { video: newVideo } };
  }

  if (url.startsWith('/api/videos/') && method === 'GET') {
    const vidId = url.replace('/api/videos/', '');
    const found = serverVideos.find(v => v.id === vidId);
    if (!found) return { status: 404, data: { error: 'Video not found.' } };
    return { status: 200, data: { video: found } };
  }

  // 3. DOCUMENTS
  if (url === '/api/documents' && method === 'GET') {
    return { status: 200, data: { documents: serverDocuments } };
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
      : 'Uploaded document content covering computer science and software development.';
    
    // Chunk document into pages/slides
    const chunks = [];
    const paragraphs = rawContent.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
    const itemsPerPage = Math.max(1, Math.ceil(paragraphs.length / pages));
    
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
      summary: `Document containing ${pages} ${docType === 'pptx' ? 'slides' : 'pages'} with extracted semantic search chunks.`,
      chunks,
    };

    serverDocuments.unshift(newDoc);
    return { status: 201, data: { document: newDoc } };
  }

  if (url.startsWith('/api/documents/') && method === 'DELETE') {
    const docId = url.replace('/api/documents/', '');
    serverDocuments = serverDocuments.filter(d => d.id !== docId);
    return { status: 200, data: { message: 'Document deleted successfully.' } };
  }

  // 4. CHRONO-SCOPED RAG & AI TUTOR
  if (url === '/api/ai/ask' && method === 'POST') {
    const { question, videoId, currentTimestampSeconds, documentIds } = body || {};
    const qClean = sanitizeText(question, 1000);
    if (!qClean) return { status: 400, data: { error: 'Question is required and cannot be empty.' } };

    const video = serverVideos.find(v => v.id === videoId) || serverVideos[0];
    const timestamp = typeof currentTimestampSeconds === 'number' && !isNaN(currentTimestampSeconds)
      ? Math.max(0, Math.floor(currentTimestampSeconds))
      : 0;
    const docs = Array.isArray(documentIds)
      ? serverDocuments.filter(d => documentIds.includes(d.id))
      : serverDocuments;

    // Execute core Chrono-Scoped evidence filter
    const ragResult = performChronoScopedRag(qClean, video, timestamp, docs);

    // Check cache to avoid repeated AI requests for identical question & timestamp
    const cacheKey = `${video.id}_${timestamp}_${qClean.toLowerCase()}`;
    if (geminiResponseCache.has(cacheKey) && ragResult.evidenceGrounded && !ragResult.futureContentBlocked) {
      return {
        status: 200,
        data: {
          ...ragResult,
          answer: geminiResponseCache.get(cacheKey)!,
          isGeminiPowered: true,
          cached: true,
        },
      };
    }

    // If Gemini API is available and content is NOT blocked by timestamp boundary
    if (geminiClient && ragResult.evidenceGrounded && !ragResult.futureContentBlocked && ragResult.sources.length > 0) {
      try {
        const evidenceText = ragResult.sources.map(s => `[Source: ${s.identifier}]: ${s.snippet}`).join('\n\n');
        const prompt = `You are Learnova AI Tutor, an evidence-grounded interactive learning assistant.
CRITICAL CONSTRAINT: You must ONLY answer using the provided evidence below, covered up to video timestamp ${formatSecondsToTime(timestamp)}.
Do NOT introduce concepts that are not mentioned in this evidence.
If the evidence does not support an answer, state: "I could not find sufficient evidence in your available learning materials."
Always cite the source timestamp or page badge.

Question: ${qClean}

Retrieved Evidence:
${evidenceText}

Provide an intuitive, clear, step-by-step response for the student with exact citations.`;

        const response = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          geminiResponseCache.set(cacheKey, response.text);

          // Optional DB persistence
          void queryDb(
            `INSERT INTO chat_messages (id, user_id, video_id, sender, content, video_timestamp_seconds, video_timestamp_formatted, evidence_grounded, future_content_blocked, sources_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING`,
            ['msg_' + Date.now(), DEMO_USER.id, video.id, 'assistant', response.text, timestamp, formatSecondsToTime(timestamp), true, false, JSON.stringify(ragResult.sources)]
          ).catch(() => {});

          return {
            status: 200,
            data: {
              ...ragResult,
              answer: response.text,
              isGeminiPowered: true,
            },
          };
        }
      } catch (geminiErr: any) {
        console.warn('Gemini generateContent fallback to local RAG:', geminiErr?.message);
      }
    }

    // Fallback to local Chrono-Scoped RAG engine
    return {
      status: 200,
      data: {
        ...ragResult,
        isGeminiPowered: false,
        geminiNotice: process.env.GEMINI_API_KEY ? undefined : 'GEMINI_API_KEY not configured. Operating with local Chrono-Scoped RAG engine.',
      },
    };
  }

  // 5. CODING
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

  // 6. QUIZZES
  if (url === '/api/quizzes/generate' && method === 'POST') {
    const { sourceType, sourceId, maxTimestampSeconds, difficulty } = body || {};
    const diff = difficulty || 'Medium';

    if (sourceType === 'document' || sourceType === 'notes') {
      const doc = serverDocuments.find(d => d.id === sourceId) || serverDocuments[0];
      const quiz = generateQuizFromDocument(doc, diff);
      return { status: 200, data: { quiz } };
    }

    // Default to video quiz with timestamp constraint
    const video = serverVideos.find(v => v.id === sourceId) || serverVideos[0];
    const quiz = generateQuizFromVideo(video, maxTimestampSeconds || 1122, diff);
    return { status: 200, data: { quiz } };
  }

  if (url === '/api/quizzes/submit' && method === 'POST') {
    const { quiz, userAnswers } = body || {};
    if (!quiz || !userAnswers) return { status: 400, data: { error: 'Quiz and answers are required.' } };
    const attempt = evaluateQuizAttempt(quiz, userAnswers);

    // Optional DB persistence
    void queryDb(
      `INSERT INTO quiz_attempts (id, user_id, quiz_id, score, total_questions, percentage, user_answers, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
      [attempt.id, DEMO_USER.id, quiz.id, attempt.score, attempt.totalQuestions, attempt.percentage, JSON.stringify(userAnswers), attempt.feedback]
    ).catch(() => {});

    return { status: 200, data: { attempt, database: getDatabaseStatus() } };
  }

  // 7. INTERVIEW
  if (url === '/api/interview/start' && method === 'POST') {
    const { domain, difficulty } = body || {};
    const d = domain || 'Machine Learning';
    const questions = INTERVIEW_QUESTIONS[d] || INTERVIEW_QUESTIONS['Machine Learning'];
    return { status: 200, data: { question: questions[0] } };
  }

  if (url === '/api/interview/answer' && method === 'POST') {
    const { question, answer } = body || {};
    if (!question || !answer) return { status: 400, data: { error: 'Question and answer are required.' } };

    if (geminiClient) {
      try {
        const prompt = `You are a Principal Software Engineer conducting a technical mock interview.
Evaluate this candidate answer for a ${question.domain} question.
Question: ${question.question}
Ideal Key Points: ${question.idealKeyPoints.join('; ')}
Candidate Answer: ${answer}

Return valid JSON adhering strictly to this format:
{
  "scoreOverall": number (0-100),
  "technicalScore": number (0-100),
  "communicationScore": number (0-100),
  "confidenceScore": number (0-100),
  "strengths": string[],
  "improvementAreas": string[],
  "suggestedIdealAnswer": string,
  "followUpQuestion": string
}`;

        const res = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        if (res.text) {
          const parsed = JSON.parse(res.text);
          if (typeof parsed.scoreOverall === 'number') {
            return { status: 200, data: { feedback: parsed, isGeminiPowered: true } };
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini interview evaluation fallback:', geminiErr?.message);
      }
    }

    const feedback = evaluateInterviewAnswer(question, answer);
    return { status: 200, data: { feedback, isGeminiPowered: false } };
  }

  // 8. ANALYTICS
  if (url === '/api/analytics/dashboard' && method === 'GET') {
    return { status: 200, data: { analytics: INITIAL_ANALYTICS, database: getDatabaseStatus() } };
  }

  return { status: 404, data: { error: `Endpoint not found: ${method} ${pathname}` } };
}
