import { User, VideoItem, DocumentItem, ChatMessage, CodingProblem, CodeVerificationResult, Quiz, QuizAttempt, LearningAnalytics, InterviewQuestion, InterviewFeedback } from '../types.js';
import { DEMO_USER, INITIAL_VIDEOS, INITIAL_DOCUMENTS, CODING_PROBLEMS, INITIAL_ANALYTICS, INTERVIEW_QUESTIONS } from '../constants.js';

export type AppRoute =
  | 'landing'
  | 'dashboard'
  | 'video'
  | 'documents'
  | 'coding'
  | 'quiz'
  | 'interview'
  | 'analytics'
  | 'spatial';

class AppStore {
  currentRoute: AppRoute = 'landing';
  user: User | null = DEMO_USER;
  isLoggedIn: boolean = true;
  isDemoMode: boolean = true;
  databaseEngine: 'PostgreSQL' | 'In-Memory (Demo Mode)' = 'In-Memory (Demo Mode)';
  isPostgresConnected: boolean = false;

  videos: VideoItem[] = [...INITIAL_VIDEOS];
  activeVideoId: string = INITIAL_VIDEOS[0].id;
  currentPlaybackTimestamp: number = 1122; // default to 18:42 for testing!
  isVideoPlaying: boolean = false;

  documents: DocumentItem[] = [...INITIAL_DOCUMENTS];
  selectedDocumentIds: string[] = [INITIAL_DOCUMENTS[0].id];

  chatMessages: ChatMessage[] = [
    {
      id: 'msg_welcome',
      sender: 'assistant',
      content: `Hello Alex! I am **Learnova AI Tutor**, your interactive learning partner.\n\n` +
        `I operate under strict **Chrono-Scoped RAG**: I will only answer questions using the lecture content covered up to your current video timestamp (**18:42**), plus your uploaded course documents.\n\n` +
        `Try asking:\n` +
        `• *"What is supervised learning?"* (Explained at 05:00 → **Answerable**)\n` +
        `• *"What is unsupervised learning?"* (Explained at 10:00 → **Answerable**)\n` +
        `• *"Explain overfitting."* (Explained at 35:00 → **Locked until 35:00**)\n\n` +
        `How can I assist your studies today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      evidenceGrounded: true,
      videoTimestampSeconds: 1122,
      videoTimestampFormatted: '18:42',
    },
  ];

  codingProblems: CodingProblem[] = [...CODING_PROBLEMS];
  activeProblemId: string = CODING_PROBLEMS[0].id;
  codingLanguage: 'python' | 'javascript' | 'java' | 'cpp' = 'javascript';
  codeEditorContent: string = CODING_PROBLEMS[0].starterCode.javascript;
  lastVerificationResult: CodeVerificationResult | null = null;

  activeQuiz: Quiz | null = null;
  quizAttempts: QuizAttempt[] = [];

  interviewDomain: string = 'Machine Learning';
  interviewDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
  currentInterviewQuestion: InterviewQuestion | null = INTERVIEW_QUESTIONS['Machine Learning'][0];
  lastInterviewFeedback: InterviewFeedback | null = null;

  analytics: LearningAnalytics = { ...INITIAL_ANALYTICS };

  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.saveToStorage();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Store listener error', e);
      }
    }
  }

  setRoute(route: AppRoute) {
    this.currentRoute = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify();
  }

  login(user: User) {
    this.user = user;
    this.isLoggedIn = true;
    this.notify();
  }

  logout() {
    this.user = null;
    this.isLoggedIn = false;
    this.currentRoute = 'landing';
    this.notify();
  }

  toggleDemoMode() {
    this.isDemoMode = !this.isDemoMode;
    this.notify();
  }

  setActiveVideo(videoId: string) {
    this.activeVideoId = videoId;
    this.currentPlaybackTimestamp = 0;
    this.notify();
  }

  getActiveVideo(): VideoItem {
    return this.videos.find(v => v.id === this.activeVideoId) || this.videos[0];
  }

  setPlaybackTimestamp(seconds: number) {
    this.currentPlaybackTimestamp = Math.max(0, Math.floor(seconds));
    this.notify();
  }

  setVideoPlaying(playing: boolean) {
    this.isVideoPlaying = playing;
    this.notify();
  }

  addVideo(video: VideoItem) {
    this.videos.unshift(video);
    this.activeVideoId = video.id;
    this.currentPlaybackTimestamp = 0;
    this.notify();
  }

  addDocument(doc: DocumentItem) {
    this.documents.unshift(doc);
    if (!this.selectedDocumentIds.includes(doc.id)) {
      this.selectedDocumentIds.push(doc.id);
    }
    this.notify();
  }

  deleteDocument(docId: string) {
    this.documents = this.documents.filter(d => d.id !== docId);
    this.selectedDocumentIds = this.selectedDocumentIds.filter(id => id !== docId);
    this.notify();
  }

  toggleDocumentSelection(docId: string) {
    if (this.selectedDocumentIds.includes(docId)) {
      this.selectedDocumentIds = this.selectedDocumentIds.filter(id => id !== docId);
    } else {
      this.selectedDocumentIds.push(docId);
    }
    this.notify();
  }

  addChatMessage(message: ChatMessage) {
    this.chatMessages.push(message);
    this.notify();
  }

  clearChatHistory() {
    this.chatMessages = [];
    this.notify();
  }

  setActiveCodingProblem(problemId: string) {
    this.activeProblemId = problemId;
    const prob = this.codingProblems.find(p => p.id === problemId);
    if (prob) {
      this.codeEditorContent = prob.starterCode[this.codingLanguage];
    }
    this.lastVerificationResult = null;
    this.notify();
  }

  setCodingLanguage(lang: 'python' | 'javascript' | 'java' | 'cpp') {
    this.codingLanguage = lang;
    const prob = this.codingProblems.find(p => p.id === this.activeProblemId);
    if (prob) {
      this.codeEditorContent = prob.starterCode[lang];
    }
    this.lastVerificationResult = null;
    this.notify();
  }

  setCodeEditorContent(code: string) {
    this.codeEditorContent = code;
    // Don't notify on every keystroke to avoid re-rendering entire app while typing,
    // but keep store value fresh
  }

  setVerificationResult(res: CodeVerificationResult) {
    this.lastVerificationResult = res;
    if (res.status === 'VERIFIED') {
      this.analytics.codeProblemsSolved += 1;
    }
    this.notify();
  }

  setActiveQuiz(quiz: Quiz | null) {
    this.activeQuiz = quiz;
    this.notify();
  }

  recordQuizAttempt(attempt: QuizAttempt) {
    this.quizAttempts.unshift(attempt);
    this.analytics.quizzesAttempted += 1;
    const totalScore = this.quizAttempts.reduce((acc, a) => acc + a.percentage, 0);
    this.analytics.averageQuizScore = Math.round((totalScore / this.quizAttempts.length) * 10) / 10;
    this.notify();
  }

  setInterviewDomain(domain: string) {
    this.interviewDomain = domain;
    const questions = INTERVIEW_QUESTIONS[domain] || INTERVIEW_QUESTIONS['Machine Learning'];
    this.currentInterviewQuestion = questions[0];
    this.lastInterviewFeedback = null;
    this.notify();
  }

  setInterviewDifficulty(diff: 'Easy' | 'Medium' | 'Hard') {
    this.interviewDifficulty = diff;
    this.notify();
  }

  setInterviewFeedback(feedback: InterviewFeedback) {
    this.lastInterviewFeedback = feedback;
    this.analytics.interviewSessionsCompleted += 1;
    this.notify();
  }

  private saveToStorage() {
    try {
      const data = {
        activeVideoId: this.activeVideoId,
        currentPlaybackTimestamp: this.currentPlaybackTimestamp,
        isLoggedIn: this.isLoggedIn,
        isDemoMode: this.isDemoMode,
        selectedDocumentIds: this.selectedDocumentIds,
      };
      sessionStorage.setItem('learnova_store_v1', JSON.stringify(data));
    } catch (e) {
      // storage unavailable
    }
  }

  setDatabaseStatus(engine: 'PostgreSQL' | 'In-Memory (Demo Mode)', connected: boolean) {
    this.databaseEngine = engine;
    this.isPostgresConnected = connected;
    this.notify();
  }

  private loadFromStorage() {
    try {
      const raw = sessionStorage.getItem('learnova_store_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.activeVideoId) this.activeVideoId = parsed.activeVideoId;
        if (typeof parsed.currentPlaybackTimestamp === 'number') this.currentPlaybackTimestamp = parsed.currentPlaybackTimestamp;
        if (typeof parsed.isLoggedIn === 'boolean') this.isLoggedIn = parsed.isLoggedIn;
        if (typeof parsed.isDemoMode === 'boolean') this.isDemoMode = parsed.isDemoMode;
        if (Array.isArray(parsed.selectedDocumentIds)) this.selectedDocumentIds = parsed.selectedDocumentIds;
      }
    } catch (e) {
      // ignore
    }
  }
}

export const store = new AppStore();
