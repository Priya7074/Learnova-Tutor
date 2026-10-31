-- ==============================================================================
-- Learnova Tutor - PostgreSQL Relational Database Schema
-- Architecture: Team NOEXNOVA
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  avatar_url TEXT,
  role VARCHAR(32) DEFAULT 'student' CHECK (role IN ('student', 'educator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);

-- 2. Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_id VARCHAR(32) NOT NULL,
  youtube_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  duration_formatted VARCHAR(16) NOT NULL DEFAULT '00:00',
  thumbnail_url TEXT,
  category VARCHAR(64) DEFAULT 'General',
  level VARCHAR(32) DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Video Transcripts Table (Indexed by start_seconds for Chrono-Scoped RAG)
CREATE TABLE IF NOT EXISTS transcripts (
  id VARCHAR(64) PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  start_seconds INTEGER NOT NULL,
  end_seconds INTEGER NOT NULL,
  timestamp_formatted VARCHAR(16) NOT NULL,
  title VARCHAR(255),
  text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transcripts_video_start ON transcripts(video_id, start_seconds);

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('pdf', 'pptx', 'txt', 'notes')),
  size_bytes BIGINT NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 1,
  summary TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Document Chunks Table (Page and Slide references)
CREATE TABLE IF NOT EXISTS document_chunks (
  id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_or_slide_number INTEGER NOT NULL DEFAULT 1,
  type VARCHAR(16) NOT NULL CHECK (type IN ('page', 'slide', 'section')),
  title VARCHAR(255),
  content TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id, page_or_slide_number);

-- 6. Chat Messages Table (Evidence-grounded conversation history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  video_id VARCHAR(64) REFERENCES videos(id) ON DELETE CASCADE,
  sender VARCHAR(16) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  video_timestamp_seconds INTEGER,
  video_timestamp_formatted VARCHAR(16),
  evidence_grounded BOOLEAN DEFAULT FALSE,
  future_content_blocked BOOLEAN DEFAULT FALSE,
  sources_json JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  source_type VARCHAR(16) NOT NULL CHECK (source_type IN ('video', 'document', 'notes')),
  source_title VARCHAR(255) NOT NULL,
  timestamp_limit_formatted VARCHAR(16),
  difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id VARCHAR(64) PRIMARY KEY,
  quiz_id VARCHAR(64) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  source_reference VARCHAR(255),
  max_timestamp_seconds INTEGER
);

-- 9. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  quiz_id VARCHAR(64) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  user_answers JSONB NOT NULL,
  feedback TEXT,
  completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Coding Problems Table
CREATE TABLE IF NOT EXISTS coding_problems (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  category VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  input_format TEXT,
  output_format TEXT,
  examples JSONB NOT NULL,
  constraints JSONB NOT NULL,
  starter_code JSONB NOT NULL,
  test_cases JSONB NOT NULL
);

-- 11. Learning Progress Table
CREATE TABLE IF NOT EXISTS learning_progress (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id VARCHAR(64) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  last_timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, video_id)
);
