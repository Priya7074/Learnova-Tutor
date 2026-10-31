# Learnova Tutor 🎓⚡
> **Learn Smarter. Understand Deeper. Learn at Your Own Pace.**  
> *Project by Team NOEXNOVA*

Learnova Tutor is an AI-powered interactive learning assistant with **Chrono-Scoped Video RAG**, document-based question answering, verified coding practice, timestamp-locked quizzes, and AI mock interview preparation.

---

## 🌟 Key Innovations

1. **Chrono-Scoped Video RAG:**
   - Evaluates video playback timestamps in real time using the YouTube IFrame Player API.
   - **The Strict 18:42 Overfitting Rule:** When paused at `18:42`, asking about *overfitting* blocks the future explanation at `35:00` to prevent spoilers and cognitive overload. At `35:00+`, the topic is unlocked with source badges (`[Video 35:00]`).
   - Grounded citations (`[Video MM:SS]`) tied strictly to transcripts covered so far.

2. **Multimodal Document RAG:**
   - Upload and attach PDFs, PPT/PPTX slides, and study notes.
   - Preserves exact page numbers and slide metadata (`[Page 4: Bias-Variance]`, `[Slide 2: Backpropagation]`).

3. **Code Verification Bench:**
   - Practice in Python, JavaScript, Java, and C++.
   - Live browser sandbox execution for JavaScript testing edge cases, runtime outputs, and time/space complexity (`O(n)` vs `O(n²)`).
   - Distinguishes live executed test results (`VERIFIED`) from simulated algorithmic static analysis (`PARTIALLY VERIFIED`).

4. **Timestamp-Locked AI Quizzes:**
   - Generates MCQs dynamically from video content up to the current playback position.
   - Questions never reveal upcoming lecture topics.
   - Automatic scoring, option-by-option explanations, and performance tracking.

5. **AI Technical Mock Interviews:**
   - Practice across 8 domains: Machine Learning, Full Stack Development, React, Node.js, DSA, JavaScript, Java, and DBMS.
   - Quantitative evaluation across Technical Knowledge, Communication Clarity, and Confidence, with an ideal Staff Engineer model answer.

6. **3D Spatial XR Classroom:**
   - WebXR & Three.js 3D learning mode with an animated holographic AI tutor orb, floating canvas lecture monitor, and 3D spatial UI cards.

---

## 🛠️ Technology Stack

- **Frontend:** TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express / Connect REST API Middleware.
- **AI Engine:** Google Gemini API (`gemini-3.8-flash`) using `@google/genai` SDK with user query caching and deterministic Chrono-Scoped fallback.
- **Database:** Optional PostgreSQL via `DATABASE_URL` with auto-migration (`src/db/schema.sql`) and transparent in-memory Demo Mode fallback.
- **Spatial 3D:** XR Blocks v0.24.0, Three.js 0.186.

---

## 🏗️ Architecture & Data Flow

```
[Student View / Video Player] ──> Playback Timestamp (e.g. 18:42)
             │
             ▼
[User Question] ──> [Chrono-Scoped Barrier (≤ 18:42)]
             │
   ┌─────────┴────────────────────────────────┐
   │                                          │
[Topics ≤ 18:42: Unlocked]         [Topics > 18:42: Locked]
   │                                          │
   ▼                                          ▼
[Eligible Transcripts + Docs]       [Non-Spoiler Notice]
   │                                "Topic covered at 35:00.
   ▼                                 Content locked to prevent
[Google Gemini 3.8 Flash]            premature spoilers."
   │
   ▼
[Evidence-Grounded Answer + Citations]
```

---

## 📦 Installation & Local Development

### Prerequisites
- Node.js (v18+ or v20+)
- npm or bun

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the variables:
```env
# Google Gemini API Key (Server-side only)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional PostgreSQL Connection (Leave blank for Demo Mode)
DATABASE_URL=postgresql://postgres:password@localhost:5432/learnova

# Server Port
PORT=3000

# Environment
NODE_ENV=development
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🗄️ Database Setup (Optional PostgreSQL)

If you have a PostgreSQL instance:
1. Provide `DATABASE_URL=postgresql://user:password@host:5432/dbname` in `.env`.
2. When the server boots, it verifies the connection and auto-applies `/src/db/schema.sql`.
3. If `DATABASE_URL` is omitted, Learnova Tutor runs seamlessly in **Demo Mode (In-Memory)** with a transparent status pill displayed in the navigation header.

---

## 🧪 Demo Login & Testing Accounts

- **Pre-loaded Student:** Alex Rivera (`alex.rivera@learnova.edu`)
- **Default Flagship Lesson:** *Machine Learning Foundations: Supervised, Unsupervised & Evaluation* (42 mins)
- **Default Video Timestamp:** `18:42`

### Key Verification Test Scenarios:
1. **Timestamp 18:42 Overfitting Test:**
   - In the Video Workspace, ask: *"Explain overfitting."*
   - **Expected Result:** Blocked! AI explains that overfitting is covered later at timestamp `35:00`.
2. **Timestamp 18:42 Supervised Learning Test:**
   - Ask: *"What is supervised learning?"*
   - **Expected Result:** Answered with `[Video 05:00 - Supervised Learning]` citation.
3. **Timestamp 35:00 Unlocking Test:**
   - Jump timeline to `35:00` and ask: *"Explain overfitting."*
   - **Expected Result:** Fully unlocked with `[Video 35:00]` badge and regularization guidance.
4. **Document Multimodal RAG Test:**
   - Ask about documents in the Documents view to verify `[Page X]` or `[Slide Y]` citations.
5. **Code Verification Bench Test:**
   - Select JavaScript and run Two Sum to see `VERIFIED (All Tests Passed)`.
   - Select Python/Java to see `PARTIALLY VERIFIED (Simulated Analysis)` ensuring execution test integrity.

---

## 🚀 Production Deployment

### Build the Application
```bash
npm run build
```

### Run Full-Stack Server
```bash
npm run start
```
The server will start at `http://0.0.0.0:3000`, serving static frontend assets and handling `/api/*` endpoints with CORS and health checks.

### Health Check Endpoint
```bash
curl http://localhost:3000/api/health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-30T10:10:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "database": {
    "configured": false,
    "connected": false,
    "engine": "In-Memory (Demo Mode)",
    "message": "Running in Demo Mode with in-memory persistence."
  },
  "gemini": {
    "configured": true,
    "model": "gemini-3.8-flash"
  }
}
```

---

## ⚠️ Known Demo Limitations

- Native non-JavaScript code execution (Python/C++/Java) uses static AST parsing and algorithmic constraint simulation rather than a sandboxed Linux container. Live runtime execution is supported for JavaScript.
- YouTube transcript synchronization relies on the YouTube IFrame API; videos without public transcripts require manual transcript input or uploaded lecture notes.

---

## 📄 License
MIT License. Built for hackathon demonstration by Team NOEXNOVA.
