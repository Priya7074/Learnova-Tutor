import { store, AppRoute } from '../services/store.js';
import { icon } from '../utils/ui.js';
import { formatSecondsToTime } from '../services/ragEngine.js';

export function renderNavbar(): HTMLElement {
  const nav = document.createElement('header');
  nav.className = 'sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-white/[0.08] transition-all';

  const currentRoute = store.currentRoute;
  const currentTimestampFormatted = formatSecondsToTime(store.currentPlaybackTimestamp);

  nav.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">
        
        <!-- Left: Logo & Title -->
        <div class="flex items-center gap-3 cursor-pointer group shrink-0" id="btn-logo">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-sm">
            <div class="w-full h-full bg-[#090d16] rounded-[7px] flex items-center justify-center text-violet-400 group-hover:text-cyan-300 transition-colors">
              ${icon('brain', 'w-5 h-5')}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-1.5">
              <span>Learnova</span>
              <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-violet-950/60 text-violet-400 border border-violet-800/40">TUTOR</span>
            </span>
          </div>
        </div>

        <!-- Middle: Primary Nav Links -->
        <nav class="hidden lg:flex items-center gap-1">
          <button data-route="dashboard" class="px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentRoute === 'dashboard' ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}">
            Dashboard
          </button>
          
          <button data-route="video" class="relative px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${currentRoute === 'video' ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}">
            <span>Video RAG</span>
            <span class="inline-flex items-center gap-1 font-mono text-[10px] tabular-nums px-1.5 py-0.2 rounded ${currentRoute === 'video' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-slate-800/80 text-slate-400'}">
              ${icon('clock', 'w-3 h-3')}
              <span>${currentTimestampFormatted}</span>
            </span>
          </button>

          <button data-route="documents" class="px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentRoute === 'documents' ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}">
            Documents
          </button>

          <button data-route="coding" class="px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentRoute === 'coding' ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}">
            Code Lab
          </button>

          <button data-route="quiz" class="px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentRoute === 'quiz' ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}">
            Quizzes
          </button>

          <button data-route="interview" class="px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentRoute === 'interview' ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}">
            Mock Interview
          </button>

          <button data-route="analytics" class="px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentRoute === 'analytics' ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}">
            Analytics
          </button>
        </nav>

        <!-- Right: Actions & User -->
        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Spatial XR Mode -->
          <button data-route="spatial" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-950/70 hover:border-cyan-500/50 transition-all">
            ${icon('cube', 'w-3.5 h-3.5 text-cyan-400')}
            <span class="hidden sm:inline">XR Classroom</span>
          </button>

          <!-- DB Mode Indicator -->
          <button id="btn-toggle-demo" title="${store.isPostgresConnected ? 'Connected to PostgreSQL Database' : 'Running in In-Memory Demo Mode'}" class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${store.isPostgresConnected ? 'bg-violet-950/30 text-violet-300 border-violet-800/40' : 'bg-slate-800/60 text-slate-300 border-slate-700/60'}">
            ${icon('database', 'w-3 h-3 ' + (store.isPostgresConnected ? 'text-violet-400' : 'text-slate-400'))}
            <span>${store.isPostgresConnected ? 'PostgreSQL' : 'Demo Mode'}</span>
          </button>

          <!-- User Menu / Auth -->
          ${store.isLoggedIn ? `
            <div class="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <div class="w-8 h-8 rounded-full ring-1 ring-violet-500/40 overflow-hidden bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-200">
                ${store.user?.avatarUrl ? `<img src="${store.user?.avatarUrl}" alt="${store.user?.name}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />` : 'AR'}
              </div>
              <button id="btn-logout" title="Sign Out" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-white/[0.04] transition-colors">
                ${icon('trash', 'w-3.5 h-3.5')}
              </button>
            </div>
          ` : `
            <button id="btn-login" class="px-3.5 py-1.5 rounded-md text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 shadow-sm transition-all">
              Sign In
            </button>
          `}
        </div>

      </div>
    </div>
  `;

  // Attach event handlers
  nav.querySelector('#btn-logo')?.addEventListener('click', () => {
    store.setRoute(store.isLoggedIn ? 'dashboard' : 'landing');
  });

  nav.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = (e.currentTarget as HTMLElement).getAttribute('data-route') as AppRoute;
      if (target) store.setRoute(target);
    });
  });

  nav.querySelector('#btn-toggle-demo')?.addEventListener('click', () => {
    store.toggleDemoMode();
  });

  nav.querySelector('#btn-logout')?.addEventListener('click', () => {
    store.logout();
  });

  nav.querySelector('#btn-login')?.addEventListener('click', () => {
    store.login({
      id: 'usr_demo',
      name: 'Alex Rivera',
      email: 'alex.rivera@learnova.edu',
      role: 'student',
      enrolledCourses: ['course_ml_101'],
      joinedAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    });
    store.setRoute('dashboard');
  });

  return nav;
}
