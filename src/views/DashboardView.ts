import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';
import { formatSecondsToTime } from '../services/ragEngine.js';

export function renderDashboard(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-slate-100';

  const user = store.user;
  const analytics = store.analytics;
  const activeVideo = store.getActiveVideo();
  const currentTimestampFormatted = formatSecondsToTime(store.currentPlaybackTimestamp);
  const progressPercent = Math.min(100, Math.round((store.currentPlaybackTimestamp / activeVideo.durationSeconds) * 100));

  container.innerHTML = `
    <!-- Top Welcome Banner -->
    <div class="relative overflow-hidden rounded-xl glass-panel border border-white/[0.1] p-6 sm:p-8 shadow-2xl">
      <div class="absolute -right-16 -top-16 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-16 -bottom-16 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 text-violet-400 text-xs font-mono mb-2">
            <span>DEVELOPER WORKSPACE</span>
            <span class="text-slate-600">·</span>
            <span>SESSION ACTIVE</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, ${user?.name || 'Developer'}
          </h1>
          <p class="text-slate-400 mt-1 max-w-xl text-xs sm:text-sm leading-relaxed">
            Active lesson: <span class="text-slate-200 font-medium">${activeVideo.title}</span>. 
            Chrono-Scoped context is locked at <span class="font-mono text-cyan-300 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">${currentTimestampFormatted}</span>.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button id="dash-btn-resume" class="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md shadow-violet-600/20 transition-all flex items-center gap-2">
            ${icon('play', 'w-3.5 h-3.5')}
            <span>Resume (${currentTimestampFormatted})</span>
          </button>
          <button id="dash-btn-spatial" class="px-3.5 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white font-medium text-xs border border-white/[0.1] transition-all flex items-center gap-2">
            ${icon('cube', 'w-3.5 h-3.5 text-cyan-400')}
            <span class="hidden sm:inline">XR Mode</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Stats Overview Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Hours -->
      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Focus</span>
          <div class="w-7 h-7 rounded-md bg-violet-950/60 text-violet-400 flex items-center justify-center border border-violet-800/40">
            ${icon('clock', 'w-3.5 h-3.5')}
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">${analytics.totalHours} <span class="text-xs font-sans text-slate-500 font-normal">hrs</span></div>
        <div class="text-[11px] font-mono text-emerald-400 mt-1">↑ +4.2 hrs this week</div>
      </div>

      <!-- Videos Completed -->
      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Lessons Watched</span>
          <div class="w-7 h-7 rounded-md bg-cyan-950/60 text-cyan-400 flex items-center justify-center border border-cyan-800/40">
            ${icon('video', 'w-3.5 h-3.5')}
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">${analytics.completedVideos}</div>
        <div class="text-[11px] text-slate-400 mt-1">3 courses enrolled</div>
      </div>

      <!-- Quizzes Solved -->
      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Quizzes Solved</span>
          <div class="w-7 h-7 rounded-md bg-indigo-950/60 text-indigo-400 flex items-center justify-center border border-indigo-800/40">
            ${icon('award', 'w-3.5 h-3.5')}
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">${analytics.quizzesAttempted}</div>
        <div class="text-[11px] font-mono text-violet-300 mt-1">Avg Score: ${analytics.averageQuizScore}%</div>
      </div>

      <!-- Code Problems -->
      <div class="p-5 rounded-xl glass-panel glass-panel-hover">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Problems Solved</span>
          <div class="w-7 h-7 rounded-md bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
            ${icon('code', 'w-3.5 h-3.5')}
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">${analytics.codeProblemsSolved}</div>
        <div class="text-[11px] text-emerald-400 font-mono mt-1">98% Verified Accuracy</div>
      </div>
    </div>

    <!-- Main Grid: Continue Learning + Weekly Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Continue Learning Active Card (2 Cols) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-white flex items-center gap-2">
            ${icon('play', 'w-4 h-4 text-violet-400')}
            <span>Active Lecture</span>
          </h2>
          <button id="dash-btn-all-videos" class="text-xs font-mono text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-1">
            <span>Browse Library</span>
            ${icon('chevronRight', 'w-3 h-3')}
          </button>
        </div>

        <div class="glass-panel rounded-xl overflow-hidden flex flex-col sm:flex-row hover:border-violet-500/30 transition-all">
          <div class="sm:w-64 h-48 sm:h-auto relative bg-slate-950 shrink-0">
            <img src="${activeVideo.thumbnailUrl}" alt="${activeVideo.title}" class="w-full h-full object-cover opacity-80" referrerpolicy="no-referrer" />
            <div class="absolute bottom-2 right-2 bg-black/80 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/10">
              ${activeVideo.durationFormatted}
            </div>
            <div class="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors cursor-pointer group" id="dash-play-overlay">
              <div class="w-10 h-10 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                ${icon('play', 'w-4 h-4 ml-0.5')}
              </div>
            </div>
          </div>
          
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span>${activeVideo.category}</span>
                <span class="text-slate-600">·</span>
                <span>${activeVideo.level}</span>
                <span class="text-cyan-400 font-mono text-xs ml-auto font-medium">Locked at ${currentTimestampFormatted}</span>
              </div>
              <h3 class="text-base font-semibold text-white mb-1.5 leading-snug">${activeVideo.title}</h3>
              <p class="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">${activeVideo.description}</p>
            </div>

            <div>
              <!-- Progress Bar -->
              <div class="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mb-3">
                <div class="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full transition-all" style="width: ${progressPercent}%"></div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-slate-400 tabular-nums">
                  ${progressPercent}% Complete
                </span>
                <div class="flex gap-2">
                  <button id="dash-btn-ask-lesson" class="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] border border-white/[0.08] transition-colors flex items-center gap-1.5">
                    ${icon('sparkles', 'w-3 h-3 text-violet-400')}
                    <span>Ask Tutor</span>
                  </button>
                  <button id="dash-btn-quiz-lesson" class="px-3 py-1.5 rounded-md text-xs font-medium bg-cyan-950/40 text-cyan-300 hover:bg-cyan-950/70 border border-cyan-800/40 transition-colors flex items-center gap-1.5">
                    ${icon('award', 'w-3 h-3 text-cyan-400')}
                    <span>Quiz</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Recent Lessons List -->
        <div class="glass-panel rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-mono uppercase tracking-wider text-slate-400">Study History</h3>
            <span class="text-xs text-slate-500 font-mono">Last 3 lectures</span>
          </div>
          <div class="divide-y divide-white/[0.06]">
            ${analytics.recentLessons.map((item) => `
              <div class="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div class="flex items-center gap-3 min-w-0">
                  <img src="${item.thumbnailUrl}" class="w-12 h-8 rounded object-cover bg-slate-900 border border-white/[0.06] shrink-0" referrerpolicy="no-referrer" />
                  <div class="truncate">
                    <h4 class="text-xs font-medium text-slate-200 truncate">${item.title}</h4>
                    <span class="text-[11px] text-slate-400 font-mono">Paused at ${item.lastWatchedTimestamp}</span>
                  </div>
                </div>
                <button class="px-2.5 py-1 rounded text-xs font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-950/40 transition-colors shrink-0" data-play-video="${item.videoId}">
                  Resume &rarr;
                </button>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Right Column: Shortcuts & Weekly Activity -->
      <div class="space-y-6">
        
        <!-- Quick Action Hub -->
        <div class="glass-panel rounded-xl p-5">
          <h3 class="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Developer Tools</h3>
          <div class="grid grid-cols-2 gap-2.5">
            <button data-quick="video" class="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-violet-500/30 text-left transition-all group">
              <div class="w-7 h-7 rounded bg-violet-950/60 text-violet-400 flex items-center justify-center mb-2 border border-violet-800/40 group-hover:scale-105 transition-transform">
                ${icon('video', 'w-3.5 h-3.5')}
              </div>
              <div class="text-xs font-medium text-slate-200">Video RAG</div>
              <div class="text-[11px] text-slate-500 font-mono">Chrono-Scoped</div>
            </button>

            <button data-quick="coding" class="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-cyan-500/30 text-left transition-all group">
              <div class="w-7 h-7 rounded bg-cyan-950/60 text-cyan-400 flex items-center justify-center mb-2 border border-cyan-800/40 group-hover:scale-105 transition-transform">
                ${icon('terminal', 'w-3.5 h-3.5')}
              </div>
              <div class="text-xs font-medium text-slate-200">Code Lab</div>
              <div class="text-[11px] text-slate-500 font-mono">Verification</div>
            </button>

            <button data-quick="quiz" class="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-500/30 text-left transition-all group">
              <div class="w-7 h-7 rounded bg-indigo-950/60 text-indigo-400 flex items-center justify-center mb-2 border border-indigo-800/40 group-hover:scale-105 transition-transform">
                ${icon('award', 'w-3.5 h-3.5')}
              </div>
              <div class="text-xs font-medium text-slate-200">Quizzes</div>
              <div class="text-[11px] text-slate-500 font-mono">Timestamped</div>
            </button>

            <button data-quick="interview" class="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-emerald-500/30 text-left transition-all group">
              <div class="w-7 h-7 rounded bg-emerald-950/60 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-800/40 group-hover:scale-105 transition-transform">
                ${icon('users', 'w-3.5 h-3.5')}
              </div>
              <div class="text-xs font-medium text-slate-200">Interview</div>
              <div class="text-[11px] text-slate-500 font-mono">8 Domains</div>
            </button>
          </div>
        </div>

        <!-- Weekly Activity Visualizer -->
        <div class="glass-panel rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-mono uppercase tracking-wider text-slate-400">Weekly Focus</h3>
            <span class="text-xs font-mono text-cyan-300">12.8 hrs</span>
          </div>

          <div class="flex items-end justify-between h-32 pt-4 px-1 gap-2">
            ${analytics.weeklyActivity.map((day) => `
              <div class="flex flex-col items-center gap-1.5 flex-1">
                <span class="text-[10px] text-slate-500 font-mono">${Math.round(day.minutes / 60 * 10) / 10}h</span>
                <div class="w-full bg-slate-800/80 hover:bg-violet-500 rounded-t transition-all cursor-pointer" style="height: ${(day.minutes / 180) * 75}px" title="${day.day}: ${day.minutes} mins"></div>
                <span class="text-[11px] font-mono text-slate-400">${day.day}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

    </div>
  `;

  // Event bindings
  const resume = () => {
    store.setActiveVideo('vid_ml_01');
    store.setRoute('video');
  };

  container.querySelector('#dash-btn-resume')?.addEventListener('click', resume);
  container.querySelector('#dash-play-overlay')?.addEventListener('click', resume);
  container.querySelector('#dash-btn-all-videos')?.addEventListener('click', () => store.setRoute('video'));
  container.querySelector('#dash-btn-ask-lesson')?.addEventListener('click', () => store.setRoute('video'));
  container.querySelector('#dash-btn-quiz-lesson')?.addEventListener('click', () => store.setRoute('quiz'));
  container.querySelector('#dash-btn-spatial')?.addEventListener('click', () => store.setRoute('spatial'));

  container.querySelectorAll('[data-play-video]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const vidId = (e.currentTarget as HTMLElement).getAttribute('data-play-video');
      if (vidId) {
        store.setActiveVideo(vidId);
        store.setRoute('video');
      }
    });
  });

  container.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const q = (e.currentTarget as HTMLElement).getAttribute('data-quick');
      if (q) store.setRoute(q as any);
    });
  });

  return container;
}
