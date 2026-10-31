import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';

export function renderAnalyticsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 animate-fade-in';

  const analytics = store.analytics;

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">Adaptive Telemetry</span>
          <span class="text-xs font-mono text-slate-400">Live Retention Tracking</span>
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Student Learning Analytics</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time metrics derived from your Chrono-Scoped video retention, quiz attempts, and code verifications.
        </p>
      </div>
    </div>

    <!-- Metrics 4-Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Total Study Time</span>
        <div class="text-3xl font-bold font-mono text-white mt-1 tabular-nums">${analytics.totalHours} <span class="text-xs font-sans text-slate-500 font-normal">hours</span></div>
        <div class="text-[11px] font-mono text-emerald-400 mt-1.5">&uarr; On track for milestone</div>
      </div>

      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Average Quiz Accuracy</span>
        <div class="text-3xl font-bold font-mono text-white mt-1 tabular-nums">${analytics.averageQuizScore}%</div>
        <div class="text-[11px] font-mono text-violet-300 mt-1.5">Top 10% cohort percentile</div>
      </div>

      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Verified Code Solutions</span>
        <div class="text-3xl font-bold font-mono text-white mt-1 tabular-nums">${analytics.codeProblemsSolved}</div>
        <div class="text-[11px] font-mono text-cyan-400 mt-1.5">Zero unhandled edge cases</div>
      </div>

      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Mock Interviews</span>
        <div class="text-3xl font-bold font-mono text-white mt-1 tabular-nums">${analytics.interviewSessionsCompleted}</div>
        <div class="text-[11px] font-mono text-slate-400 mt-1.5">86/100 Avg Communication</div>
      </div>
    </div>

    <!-- Weak vs Strong Topics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Strong Topics -->
      <div class="p-5 rounded-xl glass-panel space-y-4">
        <div class="flex items-center gap-2.5 pb-2 border-b border-white/[0.06]">
          <div class="w-7 h-7 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold">
            ${icon('check', 'w-3.5 h-3.5')}
          </div>
          <div>
            <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">Mastered Concepts</h3>
            <p class="text-[11px] text-slate-400">Consistently scored &ge; 85% in check-ins</p>
          </div>
        </div>

        <div class="space-y-3 pt-1">
          ${analytics.strongTopics.map(st => `
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-300">${st.topic}</span>
                <span class="text-emerald-400 font-semibold tabular-nums">${st.score}%</span>
              </div>
              <div class="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full" style="width: ${st.score}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Weak Topics & Recommendations -->
      <div class="p-5 rounded-xl glass-panel space-y-4">
        <div class="flex items-center gap-2.5 pb-2 border-b border-white/[0.06]">
          <div class="w-7 h-7 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center font-bold">
            ${icon('alert', 'w-3.5 h-3.5')}
          </div>
          <div>
            <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">Recommended Revisions</h3>
            <p class="text-[11px] text-slate-400">Identified from recent quiz & code evaluation logs</p>
          </div>
        </div>

        <div class="space-y-2.5 pt-1">
          ${analytics.weakTopics.map(wt => `
            <div class="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
              <div>
                <h4 class="text-xs font-medium text-slate-200">${wt.topic}</h4>
                <span class="text-[11px] font-mono text-amber-400">Current Score: ${wt.score}%</span>
              </div>
              <button class="px-2.5 py-1 rounded text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-950/70 transition-colors" data-review-topic="${wt.topic}">
                Review Lecture
              </button>
            </div>
          `).join('')}
        </div>
      </div>

    </div>

    <!-- AI Personalized Recommendations Banner -->
    <div class="glass-panel border border-violet-500/30 rounded-xl p-6 shadow-2xl space-y-3">
      <div class="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
        ${icon('sparkles', 'w-3.5 h-3.5')}
        <span>AI STRATEGIC STUDY PLAN</span>
      </div>
      <h3 class="text-base font-semibold text-white">Suggested 45-Minute Focus Session Today</h3>
      <div class="text-slate-300 text-xs leading-relaxed max-w-2xl space-y-1 font-sans">
        <p>1. Watch Machine Learning lecture starting from timestamp <strong class="text-cyan-300 font-mono">35:00</strong> to unlock Overfitting & Regularization.</p>
        <p>2. Complete the 4-question Checkpoint Quiz on High Variance & Regularization.</p>
        <p>3. Solve the "Binary Search" problem in the Code Lab to verify logarithmic boundary conditions.</p>
      </div>
      <div class="pt-2">
        <button id="btn-start-recommended" class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5">
          <span>Launch Recommended Session</span>
          ${icon('chevronRight', 'w-3.5 h-3.5')}
        </button>
      </div>
    </div>
  `;

  container.querySelector('#btn-start-recommended')?.addEventListener('click', () => {
    store.setActiveVideo('vid_ml_01');
    store.setPlaybackTimestamp(2100); // 35:00
    store.setRoute('video');
  });

  container.querySelectorAll('[data-review-topic]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.setActiveVideo('vid_ml_01');
      store.setRoute('video');
    });
  });

  return container;
}
