export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'student' | 'educator' | 'admin';
  enrolledCourses: string[];
  joinedAt: string;
}

export interface TranscriptSegment {
  id: string;
  start: number; // in seconds
  end: number; // in seconds
  timestampFormatted: string; // "18:42"
  title?: string;
  text: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  youtubeUrl: string;
  durationSeconds: number;
  durationFormatted: string;
  thumbnailUrl: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  transcripts: TranscriptSegment[];
  keyTopics: { timestamp: number; label: string }[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  pageOrSlideNumber: number;
  type: 'page' | 'slide' | 'section';
  title?: string;
  content: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: 'pdf' | 'pptx' | 'txt' | 'notes';
  sizeBytes: number;
  uploadedAt: string;
  pageCount: number;
  summary: string;
  chunks: DocumentChunk[];
}

export interface SourceReference {
  type: 'video' | 'pdf' | 'pptx' | 'txt' | 'notes';
  title: string;
  identifier: string; // e.g. "Video 18:42", "Page 3", "Slide 7"
  timestampSeconds?: number;
  pageNumber?: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  videoTimestampSeconds?: number;
  videoTimestampFormatted?: string;
  evidenceGrounded: boolean;
  insufficientEvidence?: boolean;
  futureContentBlocked?: boolean;
  blockedExplanationTime?: string;
  sources?: SourceReference[];
  isSimulated?: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  starterCode: {
    python: string;
    javascript: string;
    java: string;
    cpp: string;
  };
  testCases: {
    input: string;
    expected: string;
    hidden?: boolean;
  }[];
}

export interface CodeVerificationResult {
  status: 'VERIFIED' | 'PARTIALLY VERIFIED' | 'NOT VERIFIED';
  summary: string;
  details: string;
  testCasesPassed: number;
  totalTestCases: number;
  timeComplexity: string;
  spaceComplexity: string;
  testResults: {
    caseNumber: number;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }[];
  aiExplanation: string;
  debuggingHints: string[];
  isSimulatedExecution: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceReference: string;
  maxTimestampSeconds?: number;
}

export interface Quiz {
  id: string;
  title: string;
  sourceType: 'video' | 'document' | 'notes';
  sourceTitle: string;
  timestampLimitFormatted?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  userAnswers: { [questionId: string]: number };
  completedAt: string;
  feedback: string;
}

export interface InterviewQuestion {
  id: string;
  domain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  hints: string[];
  idealKeyPoints: string[];
}

export interface InterviewFeedback {
  scoreOverall: number; // 0-100
  technicalScore: number; // 0-100
  communicationScore: number; // 0-100
  confidenceScore: number; // 0-100
  strengths: string[];
  improvementAreas: string[];
  suggestedIdealAnswer: string;
  followUpQuestion?: string;
}

export interface LearningAnalytics {
  totalHours: number;
  completedVideos: number;
  quizzesAttempted: number;
  averageQuizScore: number;
  codeProblemsSolved: number;
  interviewSessionsCompleted: number;
  weeklyActivity: { day: string; minutes: number }[];
  weakTopics: { topic: string; score: number }[];
  strongTopics: { topic: string; score: number }[];
  recentLessons: {
    videoId: string;
    title: string;
    thumbnailUrl: string;
    progressPercentage: number;
    lastWatchedTimestamp: string;
  }[];
}
