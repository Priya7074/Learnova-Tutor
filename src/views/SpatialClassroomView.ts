import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';

export function renderSpatialClassroomView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#070b12] text-slate-100 flex flex-col justify-between';

  container.innerHTML = `
    <!-- Top HUD overlay -->
    <div class="relative z-20 p-6 flex items-center justify-between bg-gradient-to-b from-[#070b12] via-[#070b12]/80 to-transparent">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-violet-950/80 border border-violet-800/40 text-violet-400 flex items-center justify-center shadow-lg">
          ${icon('cube', 'w-5 h-5')}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-semibold text-white">Learnova 3D Spatial Classroom</h1>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">WebXR / 3D Mode</span>
          </div>
          <p class="text-xs text-slate-400 font-mono">Holographic 3D AI Tutor &bull; Floating lecture monitor &bull; Spatial UI cards</p>
        </div>
      </div>

      <button id="btn-exit-spatial" class="px-3.5 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 hover:text-white font-medium text-xs border border-white/[0.1] transition-all flex items-center gap-1.5 backdrop-blur-md">
        <span>&larr; Return to Dashboard</span>
      </button>
    </div>

    <!-- Center Callout / Instructions for XR & Desktop -->
    <div class="relative z-20 max-w-lg mx-auto p-6 rounded-xl glass-panel border border-white/[0.1] text-center space-y-4 shadow-2xl mb-8">
      <div class="w-10 h-10 rounded-lg bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
        ${icon('sparkles', 'w-5 h-5')}
      </div>
      <div>
        <h2 class="text-base font-semibold text-white">Spatial AI Learning Environment</h2>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed">
          Interact with the holographic 3D AI Tutor orb, the floating spatial lecture screen, and the Chrono-Scoped control panel.
        </p>
      </div>

      <div class="p-3 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-slate-400 text-left font-mono space-y-1">
        <div>&bull; <strong class="text-slate-300">Android XR:</strong> Galaxy XR / XREAL AURA headset.</div>
        <div>&bull; <strong class="text-slate-300">Desktop:</strong> Click + drag to rotate camera, scroll to zoom.</div>
        <div>&bull; <strong class="text-slate-300">Chrono-Scoped Barrier:</strong> Locked to timestamp <strong class="text-cyan-400">18:42</strong>.</div>
      </div>

      <div class="flex items-center justify-center gap-2.5 pt-1">
        <button id="btn-quick-video" class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all">
          Open Video Learning Hub
        </button>
        <button id="btn-quick-quiz" class="px-4 py-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all">
          Take Timestamp Quiz
        </button>
      </div>
    </div>

    <!-- Bottom Notice -->
    <div class="relative z-20 pb-4 text-center text-[10px] font-mono text-slate-600">
      XR Blocks v0.24.0 &bull; Three.js 0.186 &bull; Chrono-Scoped RAG Engine
    </div>
  `;

  container.querySelector('#btn-exit-spatial')?.addEventListener('click', () => {
    store.setRoute('dashboard');
  });

  container.querySelector('#btn-quick-video')?.addEventListener('click', () => {
    store.setRoute('video');
  });

  container.querySelector('#btn-quick-quiz')?.addEventListener('click', () => {
    store.setRoute('quiz');
  });

  return container;
}
