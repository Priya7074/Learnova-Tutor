import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';

export function renderLandingPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-[#090d16] text-slate-100 pb-24 selection:bg-violet-500/30 selection:text-white';

  container.innerHTML = `
    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
      <!-- Ambient Lighting Backdrops -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-violet-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10"></div>
      <div class="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-violet-600/10 blur-[100px] pointer-events-none -z-10"></div>
      <div class="absolute top-1/3 right-1/4 w-[350px] h-[250px] bg-cyan-500/10 blur-[100px] pointer-events-none -z-10"></div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <!-- Clean Kicker Metadata -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-slate-300 mb-8 backdrop-blur-sm animate-fade-in">
          <span class="text-violet-400 font-semibold">TEAM NOEXNOVA</span>
          <span class="text-slate-600">·</span>
          <span class="text-slate-300">Chrono-Scoped Video Intelligence</span>
          <span class="text-slate-600">·</span>
          <span class="text-cyan-400 font-mono">v1.0</span>
        </div>

        <!-- Headline -->
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] max-w-4xl mx-auto">
          Learn Smarter. Build Faster.<br/>
          <span class="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Master Every Concept.
          </span>
        </h1>

        <p class="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-10 leading-relaxed font-normal">
          The developer-grade AI learning assistant built on strict Chrono-Scoped RAG.
          Ask questions at any moment in a video lecture, and the AI answers
          <span class="text-slate-200 font-medium">using only content covered up to your current playback timestamp</span>,
          eliminating spoiler hallucinations.
        </p>

        <!-- Primary Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-20">
          <button id="btn-hero-start" class="w-full sm:w-auto px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center justify-center gap-2">
            <span>Launch Demo Workspace</span>
            ${icon('arrowRight', 'w-4 h-4')}
          </button>
          <button id="btn-hero-video" class="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 text-sm font-semibold border border-white/[0.1] hover:border-white/[0.2] transition-all flex items-center justify-center gap-2">
            ${icon('play', 'w-4 h-4 text-cyan-400')}
            <span>Try Video RAG (18:42 Test)</span>
          </button>
        </div>

        <!-- Live Interactive Chrono-Scoped Testbench Console -->
        <div class="max-w-3xl mx-auto glass-panel rounded-xl border border-white/[0.1] shadow-2xl overflow-hidden text-left p-6 sm:p-8">
          <div class="flex flex-wrap items-center justify-between pb-4 border-b border-white/[0.08] mb-6 gap-2">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span class="text-xs font-mono font-medium text-slate-400 ml-1">Chrono-Scoped RAG Engine Simulator</span>
            </div>
            <div class="text-[11px] font-mono text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
              Boundary: Overfitting Rule
            </div>
          </div>

          <div class="space-y-5">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono font-medium text-slate-400">Current Lecture Playback</span>
                <span id="demo-time-display" class="font-mono text-sm font-semibold text-cyan-300 bg-cyan-950/50 px-2.5 py-0.5 rounded border border-cyan-800/40 tabular-nums">18:42</span>
              </div>
              <input id="demo-time-slider" type="range" min="0" max="2520" value="1122" step="10" class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500" />
              <div class="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
                <span>00:00 Intro</span>
                <span>05:00 Supervised</span>
                <span class="text-cyan-400">18:42 Current</span>
                <span class="text-amber-400">35:00 Overfitting</span>
                <span>42:00 End</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-mono text-slate-400 mb-2">Student Query</label>
              <div class="flex gap-2">
                <input id="demo-question-input" type="text" value="Explain overfitting." class="flex-1 px-3.5 py-2 rounded-lg bg-black/40 border border-white/[0.1] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors font-mono" />
                <button id="demo-ask-btn" class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shrink-0">
                  ${icon('sparkles', 'w-3.5 h-3.5')}
                  <span>Ask AI</span>
                </button>
              </div>
            </div>

            <!-- Dynamic Result Box -->
            <div id="demo-result-box" class="p-4 rounded-lg border transition-all text-sm font-sans">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Key Architecture Pillars -->
    <section class="py-20 border-t border-white/[0.08] relative">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="max-w-2xl mx-auto text-center mb-16">
          <div class="text-xs font-mono text-violet-400 uppercase tracking-wider mb-2">System Architecture</div>
          <h2 class="text-3xl font-bold text-white tracking-tight">Four pillars of trustworthy AI learning</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Pillar 1 -->
          <div class="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/40 hover:bg-white/[0.04] transition-all group">
            <div class="w-10 h-10 rounded-lg bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              ${icon('clock', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-semibold text-white mb-2">Chrono-Scoped RAG</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Filters lecture transcripts at <code class="text-violet-300 font-mono">t &le; current_timestamp</code>. Locks future material to prevent knowledge leakage and spoilers.
            </p>
          </div>

          <!-- Pillar 2 -->
          <div class="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all group">
            <div class="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              ${icon('fileText', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-semibold text-white mb-2">Document Intelligence</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Ingests PDFs, slides, and notes into structured chunks. Answers include precise page, slide, and lecture citations.
            </p>
          </div>

          <!-- Pillar 3 -->
          <div class="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group">
            <div class="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              ${icon('terminal', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-semibold text-white mb-2">Verified Code Lab</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Executes solutions against hidden test vectors with algorithmic complexity analysis and transparent verification statuses.
            </p>
          </div>

          <!-- Pillar 4 -->
          <div class="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-white/[0.04] transition-all group">
            <div class="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              ${icon('users', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-semibold text-white mb-2">AI Mock Interviews</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Practices 8 technical domains with structured rubric evaluation across correctness, communication, and depth.
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- Why Chrono-Scoped AI Comparison -->
    <section class="py-20 border-t border-white/[0.08]">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <div class="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">Technical Differentiation</div>
          <h2 class="text-3xl font-bold text-white tracking-tight">Generic LLM RAG vs. Learnova Chrono-Scoped RAG</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Generic RAG -->
          <div class="p-6 rounded-xl bg-rose-950/10 border border-rose-900/30">
            <div class="flex items-center gap-2 mb-4 text-rose-400 font-semibold text-sm">
              ${icon('alert', 'w-4 h-4')}
              <span>Traditional AI Assistants (Generic RAG)</span>
            </div>
            <ul class="space-y-3 text-xs text-slate-400 leading-relaxed">
              <li class="flex items-start gap-2.5">
                <span class="text-rose-400 font-mono shrink-0">✕</span>
                <span>Ingests whole video transcripts upfront, leaking conclusions and spoiling early conceptual steps.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="text-rose-400 font-mono shrink-0">✕</span>
                <span>Answers student questions using advanced terms not yet introduced at the current timestamp.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="text-rose-400 font-mono shrink-0">✕</span>
                <span>Hallucinates page numbers and slide citations without verifying physical segment boundaries.</span>
              </li>
            </ul>
          </div>

          <!-- Learnova RAG -->
          <div class="p-6 rounded-xl bg-violet-950/15 border border-violet-800/40">
            <div class="flex items-center gap-2 mb-4 text-violet-300 font-semibold text-sm">
              ${icon('shieldCheck', 'w-4 h-4 text-cyan-400')}
              <span>Learnova Chrono-Scoped RAG</span>
            </div>
            <ul class="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li class="flex items-start gap-2.5">
                <span class="text-cyan-400 font-mono shrink-0">✓</span>
                <span>Temporal mask: future transcript segments are filtered prior to vector retrieval and LLM context.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="text-cyan-400 font-mono shrink-0">✓</span>
                <span>Gives locked notices pointing students directly to the future timestamp where the concept is taught.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="text-cyan-400 font-mono shrink-0">✓</span>
                <span>Grounds every answer in verified time segments ([18:42]) and real document pages ([Page 4]).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="pt-12 border-t border-white/[0.08] text-xs font-mono text-slate-500">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-slate-300 font-sans font-medium">Learnova Tutor</span>
          <span>·</span>
          <span>Team NOEXNOVA</span>
          <span>·</span>
          <span>Built for Production Hackathon</span>
        </div>
        <p class="text-slate-600">TypeScript · Vite · Tailwind · PostgreSQL · Google GenAI SDK</p>
      </div>
    </footer>
  `;

  // Attach interactive playground logic
  const timeSlider = container.querySelector('#demo-time-slider') as HTMLInputElement;
  const timeDisplay = container.querySelector('#demo-time-display') as HTMLElement;
  const questionInput = container.querySelector('#demo-question-input') as HTMLInputElement;
  const askBtn = container.querySelector('#demo-ask-btn') as HTMLButtonElement;
  const resultBox = container.querySelector('#demo-result-box') as HTMLElement;

  const updatePlayground = () => {
    const seconds = parseInt(timeSlider.value, 10);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    timeDisplay.textContent = formatted;

    const q = questionInput.value.trim().toLowerCase();
    const isOverfitting = q.includes('overfit');

    if (isOverfitting) {
      if (seconds < 2100) { // before 35:00
        resultBox.className = 'p-4 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-200';
        resultBox.innerHTML = `
          <div class="flex items-center gap-2 font-mono text-xs font-semibold text-amber-300 mb-1.5">
            ${icon('lock', 'w-3.5 h-3.5 text-amber-400')}
            <span>Chrono-Scoped Barrier Active (Playback: ${formatted} &lt; 35:00)</span>
          </div>
          <p class="text-xs text-amber-200/90 leading-relaxed font-sans">
            <strong>Topic Locked:</strong> Overfitting has <strong>not yet been covered</strong> at timestamp ${formatted}.
            Future segments are masked to prevent spoilers and concept overload.
            <br/><span class="font-mono text-amber-300">Upcoming chapter:</span> Timestamp <strong>35:00</strong> ("Overfitting & Underfitting").
          </p>
        `;
      } else {
        resultBox.className = 'p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-emerald-200';
        resultBox.innerHTML = `
          <div class="flex items-center gap-2 font-mono text-xs font-semibold text-emerald-300 mb-1.5">
            ${icon('unlock', 'w-3.5 h-3.5 text-emerald-400')}
            <span>Evidence Unlocked at ${formatted} [Video 35:00]</span>
          </div>
          <p class="text-xs text-emerald-200/90 leading-relaxed font-sans">
            <strong>Grounded Explanation:</strong> Overfitting occurs when a high-capacity model memorizes training noise rather than generalizable patterns.
            Evidenced by low training error but high validation loss (high variance). Remediated by regularization (L1/L2), dropout, and cross-validation.
          </p>
        `;
      }
    } else if (q.includes('supervised')) {
      if (seconds < 300) {
        resultBox.className = 'p-4 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-200';
        resultBox.innerHTML = `
          <div class="flex items-center gap-2 font-mono text-xs font-semibold text-amber-300 mb-1.5">
            ${icon('lock', 'w-3.5 h-3.5 text-amber-400')}
            <span>Timestamp Locked (${formatted} &lt; 05:00)</span>
          </div>
          <p class="text-xs text-amber-200/90">Supervised learning is introduced at 05:00. Slide timestamp slider past 05:00 to unlock.</p>
        `;
      } else {
        resultBox.className = 'p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-emerald-200';
        resultBox.innerHTML = `
          <div class="flex items-center gap-2 font-mono text-xs font-semibold text-emerald-300 mb-1.5">
            ${icon('check', 'w-3.5 h-3.5 text-emerald-400')}
            <span>Grounded Reference: [Video 05:00 - Supervised Learning]</span>
          </div>
          <p class="text-xs text-emerald-200/90 leading-relaxed">
            In supervised learning, the model trains on labeled data (X, y), covering classification (discrete outputs) and regression (continuous values).
          </p>
        `;
      }
    } else {
      resultBox.className = 'p-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-300';
      resultBox.innerHTML = `
        <div class="flex items-center gap-2 font-mono text-xs font-semibold text-slate-200 mb-1">
          ${icon('sparkles', 'w-3.5 h-3.5 text-violet-400')}
          <span>Grounded at ${formatted}</span>
        </div>
        <p class="text-xs text-slate-400">Answer retrieved strictly from video transcript segments covered up to ${formatted}.</p>
      `;
    }
  };

  timeSlider?.addEventListener('input', updatePlayground);
  askBtn?.addEventListener('click', updatePlayground);
  questionInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') updatePlayground();
  });

  // Initial call
  updatePlayground();

  // CTA clicks
  container.querySelector('#btn-hero-start')?.addEventListener('click', () => {
    store.setRoute('dashboard');
  });

  container.querySelector('#btn-hero-video')?.addEventListener('click', () => {
    store.setActiveVideo('vid_ml_01');
    store.setPlaybackTimestamp(1122); // 18:42
    store.setRoute('video');
  });

  return container;
}
