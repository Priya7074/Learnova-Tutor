import { GoogleGenAI } from '@google/genai';
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { DEMO_USER, INITIAL_VIDEOS, INITIAL_DOCUMENTS, CODING_PROBLEMS, INITIAL_ANALYTICS, INTERVIEW_QUESTIONS } from '../constants.js';
import { performChronoScopedRag, formatSecondsToTime } from './ragEngine.js';
import { verifyCode } from './codeVerifier.js';
import { generateQuizFromVideo, generateQuizFromDocument, evaluateQuizAttempt, validateQuizAnswers } from './quizEngine.js';
import { evaluateInterviewAnswer } from './interviewEngine.js';
import { VideoItem, DocumentItem, User, Quiz } from '../types.js';
import { initDatabase, getDatabaseStatus, queryDb } from '../db/dbClient.js';
import { extractYouTubeVideoId, fetchYouTubeCaptions } from '../utils/youtube.js';

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
const scrypt = promisify(scryptCallback);
const demoSessions = new Map<string, User>();

interface ApiRequestContext {
  cookie?: string;
}

interface ApiResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSessionToken(cookieHeader?: string): string | undefined {
  return cookieHeader?.split(';').map(part => part.trim()).find(part => part.startsWith('learnova_session='))?.slice('learnova_session='.length);
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  return `learnova_session=${token}; HttpOnly; SameSite=None; Secure; Path=/; Max-Age=${maxAge}`;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [saltHex, keyHex] = passwordHash.split(':');
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function createDatabaseSession(user: User): Promise<ApiResponse> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  await queryDb(
    'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashSessionToken(token), user.id, expiresAt],
  );
  return {
    status: 200,
    data: { user, authenticated: true },
    headers: { 'Set-Cookie': sessionCookie(token) },
  };
}

async function findSessionUserId(context: ApiRequestContext): Promise<string | null> {
  const token = getSessionToken(context.cookie);
  if (!token || demoSessions.has(token) || !getDatabaseStatus().connected) return null;
  const rows = await queryDb<{ user_id: string }>(
    'SELECT user_id FROM auth_sessions WHERE token_hash = $1 AND expires_at > NOW()',
    [hashSessionToken(token)],
  );
  return rows[0]?.user_id || null;
}

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
const issuedQuizzes = new Map<string, Quiz>();
const submittedQuizAttemptIds = new Set<string>();

async function persistQuiz(quiz: Quiz): Promise<void> {
  if (!getDatabaseStatus().connected) return;
  await queryDb(
    `INSERT INTO quizzes (id, title, source_type, source_title, timestamp_limit_formatted, difficulty)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
    [quiz.id, quiz.title, quiz.sourceType, quiz.sourceTitle, quiz.timestampLimitFormatted || null, quiz.difficulty],
  );
  for (const question of quiz.questions) {
    await queryDb(
      `INSERT INTO quiz_questions (id, quiz_id, question, options, correct_index, explanation, source_reference, max_timestamp_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
      [question.id, quiz.id, question.question, JSON.stringify(question.options), question.correctIndex, question.explanation,
        question.sourceReference, question.maxTimestampSeconds ?? null],
    );
  }
}

export async function handleApiRequest(
  method: string,
  pathname: string,
  body: any = {},
  context: ApiRequestContext = {},
): Promise<ApiResponse> {
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
    const token = getSessionToken(context.cookie);
    if (!token) return { status: 401, data: { error: 'Please sign in to continue.' } };

    const demoUser = demoSessions.get(token);
    if (demoUser) return { status: 200, data: { user: demoUser, authenticated: true } };

    const session = await queryDb<any>(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.created_at
       FROM auth_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [hashSessionToken(token)],
    );
    if (!session[0]) return { status: 401, data: { error: 'Your session has expired. Please sign in again.' } };
    return {
      status: 200,
      data: {
        user: {
          id: session[0].id,
          name: session[0].name,
          email: session[0].email,
          avatarUrl: session[0].avatar_url || undefined,
          role: session[0].role,
          enrolledCourses: [],
          joinedAt: new Date(session[0].created_at).toISOString(),
        },
        authenticated: true,
      },
    };
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
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return { status: 400, data: { error: 'Password must be between 8 and 128 characters long.' } };
    }
    await initDatabase();
    if (!getDatabaseStatus().connected) {
      return { status: 503, data: { error: 'Email sign-in is unavailable because the authentication database is not connected. Use Demo Login for preview access.' } };
    }
    const matches = await queryDb<any>(
      'SELECT id, name, email, avatar_url, role, created_at, password_hash FROM users WHERE email = $1',
      [emailClean],
    );
    if (!matches[0]?.password_hash || !(await verifyPassword(password, matches[0].password_hash))) {
      return { status: 401, data: { error: 'Email or password is incorrect.' } };
    }
    const user: User = {
      id: matches[0].id,
      name: matches[0].name,
      email: matches[0].email,
      avatarUrl: matches[0].avatar_url || undefined,
      role: matches[0].role,
      enrolledCourses: [],
      joinedAt: new Date(matches[0].created_at).toISOString(),
    };
    return createDatabaseSession(user);
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
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return { status: 400, data: { error: 'Password must be between 8 and 128 characters long.' } };
    }
    if (nameClean.length < 2) return { status: 400, data: { error: 'Name must be at least 2 characters long.' } };

    await initDatabase();
    if (!getDatabaseStatus().connected) {
      return { status: 503, data: { error: 'Account registration is unavailable because the authentication database is not connected.' } };
    }
    const passwordHash = await hashPassword(password);
    const inserted = await queryDb<any>(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'student')
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, email, avatar_url, role, created_at`,
      [`usr_${randomUUID()}`, nameClean, emailClean, passwordHash],
    );
    if (!inserted[0]) return { status: 409, data: { error: 'An account with this email already exists.' } };
    const user: User = {
      id: inserted[0].id,
      name: inserted[0].name,
      email: inserted[0].email,
      avatarUrl: inserted[0].avatar_url || undefined,
      role: inserted[0].role,
      enrolledCourses: [],
      joinedAt: new Date(inserted[0].created_at).toISOString(),
    };
    const response = await createDatabaseSession(user);
    return { ...response, status: 201 };
  }

  if (url === '/api/auth/demo' && method === 'POST') {
    const token = randomBytes(32).toString('hex');
    demoSessions.set(token, DEMO_USER);
    return {
      status: 200,
      data: { user: DEMO_USER, authenticated: true },
      headers: { 'Set-Cookie': sessionCookie(token) },
    };
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    const token = getSessionToken(context.cookie);
    if (token) {
      demoSessions.delete(token);
      if (getDatabaseStatus().connected) {
        await queryDb('DELETE FROM auth_sessions WHERE token_hash = $1', [hashSessionToken(token)]);
      }
    }
    return {
      status: 200,
      data: { message: 'Logged out successfully.' },
      headers: { 'Set-Cookie': sessionCookie('', 0) },
    };
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
    const youtubeId = extractYouTubeVideoId(youtubeUrl);
    if (!youtubeId) {
      return { status: 400, data: { error: 'Invalid YouTube URL. Please provide a standard YouTube video link.' } };
    }
    const descClean = sanitizeText(description, 1000);

    // Fetch actual YouTube captions/transcript
    let videoTranscripts = Array.isArray(transcripts) && transcripts.length > 0 ? transcripts : null;
    let captionsUnavailable = false;

    if (!videoTranscripts) {
      const fetchedCaptions = await fetchYouTubeCaptions(youtubeId);
      if (fetchedCaptions && fetchedCaptions.length > 0) {
        videoTranscripts = fetchedCaptions;
      } else {
        captionsUnavailable = true;
      }
    }

    // Use provided transcripts or fallback to generic message if captions unavailable
    const finalTranscripts = videoTranscripts || [
      {
        id: 'ts_usr_1',
        start: 0,
        end: 1800,
        timestampFormatted: '00:00',
        title: 'Full Video Transcript',
        text: captionsUnavailable
          ? 'This video does not have available captions. AI Tutor answers will rely on uploaded documents only.'
          : 'This video covers essential concepts for students.',
      },
    ];

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
      transcripts: finalTranscripts,
    };
    serverVideos.unshift(newVideo);
    return { status: 201, data: { video: newVideo, captionsUnavailable } };
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
    if (!['Easy', 'Medium', 'Hard'].includes(diff)) {
      return { status: 400, data: { error: 'Choose Easy, Medium, or Hard difficulty.' } };
    }

    let quiz: Quiz;
    if (sourceType === 'document' || sourceType === 'notes') {
      const doc = serverDocuments.find(d => d.id === sourceId);
      if (!doc) return { status: 404, data: { error: 'The selected document was not found.' } };
      quiz = generateQuizFromDocument(doc, diff);
    } else if (sourceType === 'video') {
      const video = serverVideos.find(v => v.id === sourceId);
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

    await persistQuiz(quiz);
    issuedQuizzes.set(quiz.id, quiz);
    return { status: 200, data: { quiz } };
  }

  if (url === '/api/quizzes/submit' && method === 'POST') {
    const { quizId, attemptId, userAnswers } = body || {};
    if (typeof quizId !== 'string' || typeof attemptId !== 'string' || !/^[\w-]{8,100}$/.test(attemptId)) {
      return { status: 400, data: { error: 'Quiz, attempt, and answers are required.' } };
    }
    const quiz = issuedQuizzes.get(quizId);
    if (!quiz) return { status: 404, data: { error: 'This quiz is no longer available. Generate a new quiz and try again.' } };
    if (submittedQuizAttemptIds.has(attemptId)) return { status: 409, data: { error: 'This quiz attempt has already been submitted.' } };
    const validationError = validateQuizAnswers(quiz, userAnswers);
    if (validationError) return { status: 400, data: { error: validationError } };

    const answers = userAnswers as Record<string, number>;
    const attempt = evaluateQuizAttempt(quiz, answers, attemptId);
    submittedQuizAttemptIds.add(attemptId);
    try {
      if (getDatabaseStatus().connected) {
        const userId = await findSessionUserId(context);
        await queryDb(
          `INSERT INTO quiz_attempts (id, user_id, quiz_id, score, total_questions, percentage, user_answers, feedback)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [attempt.id, userId, quiz.id, attempt.score, attempt.totalQuestions, attempt.percentage, JSON.stringify(answers), attempt.feedback],
        );
      }
    } catch (error) {
      submittedQuizAttemptIds.delete(attemptId);
      throw error;
    }
    return {
      status: 200,
      data: {
        attempt,
        correctAnswers: attempt.score,
        incorrectAnswers: attempt.totalQuestions - attempt.score,
        database: getDatabaseStatus(),
      },
    };
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
