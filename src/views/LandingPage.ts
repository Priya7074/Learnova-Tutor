import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';

export function renderLandingPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'relative flex min-h-[calc(100vh-64px)] flex-col overflow-hidden bg-[#090d16] text-slate-100 selection:bg-violet-500/30 selection:text-white';

  container.innerHTML = `
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[360px] max-w-5xl bg-gradient-to-b from-violet-600/15 via-cyan-500/10 to-transparent blur-3xl"></div>
    <div class="pointer-events-none absolute left-1/4 top-1/4 -z-0 h-56 w-56 bg-violet-600/10 blur-[100px]"></div>
    <div class="pointer-events-none absolute right-1/4 top-1/4 -z-0 h-56 w-56 bg-cyan-500/10 blur-[100px]"></div>

    <section class="relative z-10 flex flex-1 flex-col justify-center px-4 pb-8 pt-10 sm:px-6 lg:px-8 lg:pt-12">
      <div class="mx-auto w-full max-w-5xl text-center">
        <h1 class="mx-auto mb-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Learn Smarter.<br class="sm:hidden" />
          <span class="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent"> Build Better.</span>
        </h1>
        <p class="mx-auto mb-7 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Your AI-powered learning companion. Understand concepts, practice coding, and prepare for your career — all in one place.
        </p>

        <div class="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button id="btn-hero-start" class="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 hover:shadow-violet-600/30 sm:w-auto">
            <span>Get Started</span>
            ${icon('arrowRight', 'h-4 w-4')}
          </button>
          <button id="btn-hero-video" class="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.05] px-6 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] sm:w-auto">
            ${icon('play', 'h-4 w-4 text-cyan-400')}
            <span>Explore Demo</span>
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          <article class="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:border-violet-500/40 hover:bg-white/[0.05]">
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-violet-800/40 bg-violet-950/60 text-violet-400 transition-transform group-hover:scale-105">
              ${icon('clock', 'h-5 w-5')}
            </div>
            <h2 class="mb-1.5 text-sm font-semibold text-white">AI Video Tutor</h2>
            <p class="text-xs leading-relaxed text-slate-400">Learn concepts with timestamp-aware AI assistance.</p>
          </article>

          <article class="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:border-cyan-500/40 hover:bg-white/[0.05]">
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-800/40 bg-cyan-950/60 text-cyan-400 transition-transform group-hover:scale-105">
              ${icon('fileText', 'h-5 w-5')}
            </div>
            <h2 class="mb-1.5 text-sm font-semibold text-white">Smart Documents</h2>
            <p class="text-xs leading-relaxed text-slate-400">Ask questions from your PDFs, slides, and notes.</p>
          </article>

          <article class="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:border-indigo-500/40 hover:bg-white/[0.05]">
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-800/40 bg-indigo-950/60 text-indigo-400 transition-transform group-hover:scale-105">
              ${icon('terminal', 'h-5 w-5')}
            </div>
            <h2 class="mb-1.5 text-sm font-semibold text-white">Code Practice</h2>
            <p class="text-xs leading-relaxed text-slate-400">Solve coding problems and check your solutions.</p>
          </article>

          <article class="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:border-emerald-500/40 hover:bg-white/[0.05]">
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-800/40 bg-emerald-950/60 text-emerald-400 transition-transform group-hover:scale-105">
              ${icon('users', 'h-5 w-5')}
            </div>
            <h2 class="mb-1.5 text-sm font-semibold text-white">Mock Interviews</h2>
            <p class="text-xs leading-relaxed text-slate-400">Practice technical interviews and improve your skills.</p>
          </article>
        </div>
      </div>
    </section>

    <footer class="relative z-10 border-t border-white/[0.08] px-4 py-5 text-center text-xs text-slate-500">
      <span class="font-medium text-slate-300">Learnova Tutor</span>
      <span class="mx-2">|</span>
      <span>Team NOEXNOVA</span>
    </footer>
  `;

  container.querySelector('#btn-hero-start')?.addEventListener('click', () => {
    store.setRoute('dashboard');
  });

  container.querySelector('#btn-hero-video')?.addEventListener('click', () => {
    store.setActiveVideo('vid_ml_01');
    store.setPlaybackTimestamp(1122);
    store.setRoute('video');
  });

  return container;
}
