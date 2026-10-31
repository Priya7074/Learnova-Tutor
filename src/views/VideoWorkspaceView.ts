import { store } from '../services/store.js';
import { icon, renderMarkdownSimple } from '../utils/ui.js';
import { formatSecondsToTime } from '../services/ragEngine.js';
import { apiCall } from '../services/apiClient.js';
import { ChatMessage, VideoItem } from '../types.js';
import { extractYouTubeVideoId } from '../utils/youtube.js';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let youtubeIframeApiPromise: Promise<void> | null = null;

function ensureYouTubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeIframeApiPromise) return youtubeIframeApiPromise;

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>;
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      clearTimeout(timeout);
      if (window.YT?.Player) resolve();
      else reject(new Error('YouTube player API did not initialize.'));
    };

    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('error', () => {
      clearTimeout(timeout);
      youtubeIframeApiPromise = null;
      reject(new Error('Unable to load the YouTube player. Check your connection and try again.'));
    }, { once: true });

    timeout = setTimeout(() => {
      youtubeIframeApiPromise = null;
      reject(new Error('YouTube player initialization timed out. Please try again.'));
    }, 15000);
  });

  return youtubeIframeApiPromise;
}

export function renderVideoWorkspace(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-100 animate-fade-in';

  const video = store.getActiveVideo();
  let currentTimestamp = store.currentPlaybackTimestamp;
  let isSending = false;
  let ytPlayer: any = null;
  let pollInterval: any = null;

  container.innerHTML = `
    <!-- Top Action Bar & Video Metadata -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-xs font-mono font-medium text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">Chrono-Scoped Video Workspace</span>
          <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">Player API Synced</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">${video.title}</h1>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 w-full md:w-auto">
        <form id="vw-youtube-form" class="flex min-w-0 flex-1 items-center gap-2 md:flex-initial">
          <label for="vw-youtube-url" class="sr-only">YouTube video URL</label>
          <input id="vw-youtube-url" type="text" inputmode="url" placeholder="Paste YouTube URL" class="min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-violet-500 md:w-56 md:flex-none" />
          <button type="submit" class="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08]">
            ${icon('upload', 'h-3.5 w-3.5 text-violet-400')}
            <span>Load Video</span>
          </button>
        </form>
        <button id="vw-btn-generate-quiz" class="px-3.5 py-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0">
          ${icon('award', 'w-3.5 h-3.5 text-cyan-400')}
          <span>Quiz on Current Scope</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace Split: Player (60%) vs Chrono-Scoped AI Tutor (40%) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- Left: Video Player, Custom Controls, Chapters (7 Cols) -->
      <div class="lg:col-span-7 space-y-4">
        
        <!-- Player Container -->
        <div class="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/[0.1] aspect-video flex items-center justify-center">
          <div id="youtube-player-container" class="w-full h-full"></div>
          <div id="vw-video-error" class="absolute inset-x-4 bottom-4 hidden rounded-lg border border-rose-500/40 bg-black/90 p-3 text-xs text-rose-200"></div>
        </div>
        <a id="vw-watch-youtube" href="https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}" target="_blank" rel="noopener noreferrer" class="inline-flex text-xs text-cyan-300 underline decoration-cyan-500/40 underline-offset-4 hover:text-cyan-200">Watch on YouTube</a>

        <!-- Custom Player Control Deck & Real-time Scrubber -->
        <div class="glass-panel rounded-xl p-4 space-y-3">
          
          <!-- Scrubber Timeline Bar -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono font-medium">
              <span id="vw-time-current" class="text-cyan-300 tabular-nums">${formatSecondsToTime(currentTimestamp)}</span>
              <span class="text-slate-500 tabular-nums">${video.durationFormatted}</span>
            </div>
            <input id="vw-timeline-slider" type="range" min="0" max="${video.durationSeconds}" value="${currentTimestamp}" class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500" />
          </div>

          <!-- Playback Controls & Barrier Status -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div class="flex items-center gap-2">
              <button id="vw-btn-play-pause" class="w-9 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors shadow-sm">
                ${icon('play', 'w-4 h-4 ml-0.5')}
              </button>
              <button id="vw-btn-rewind" class="px-2.5 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-mono text-xs transition-colors">
                -10s
              </button>
              <button id="vw-btn-forward" class="px-2.5 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-mono text-xs transition-colors">
                +10s
              </button>
            </div>

            <!-- Active Chrono-Scoped Barrier Status -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-950/40 border border-violet-800/40 text-violet-300 text-xs font-mono">
              ${icon('lock', 'w-3.5 h-3.5 text-violet-400')}
              <span>RAG Barrier:</span>
              <strong id="vw-boundary-badge" class="font-bold text-cyan-300 tabular-nums">${formatSecondsToTime(currentTimestamp)}</strong>
            </div>
          </div>

          <!-- Lecture Chapter Markers -->
          <div class="pt-2.5 border-t border-white/[0.06]">
            <div class="text-[11px] font-mono text-slate-400 mb-2">LECTURE CHAPTERS (CLICK TO TEST RAG BARRIER)</div>
            <div class="flex flex-wrap gap-1.5">
              ${video.keyTopics.map(topic => `
                <button class="px-2.5 py-1 rounded-md text-xs font-mono border border-white/[0.08] hover:border-violet-500/40 hover:bg-white/[0.05] text-slate-300 transition-all ${topic.timestamp === 1122 ? 'bg-violet-950/50 border-violet-500/40 text-violet-200' : 'bg-black/20'}" data-jump="${topic.timestamp}">
                  ${topic.label}
                </button>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Lecture Overview & Linked Knowledge -->
        <div class="glass-panel rounded-xl p-5">
          <h3 class="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Lecture Overview</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-4">${video.description}</p>
          
          <div class="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs font-mono text-slate-400">
            <span>Linked Course Sources:</span>
            <div class="flex gap-2">
              <span class="px-2 py-0.5 rounded bg-violet-950/40 text-violet-300 border border-violet-800/40">5 Transcripts</span>
              <span class="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">${store.documents.length} Docs Synced</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Right: Chrono-Scoped AI Tutor Chat Panel (5 Cols) -->
      <div class="lg:col-span-5 glass-panel rounded-xl border border-white/[0.1] shadow-2xl flex flex-col h-[650px] overflow-hidden">
        
        <!-- Chat Header -->
        <div class="p-3.5 bg-white/[0.03] border-b border-white/[0.08] text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-violet-400">
              ${icon('sparkles', 'w-3.5 h-3.5')}
            </div>
            <div>
              <h2 class="text-xs font-semibold leading-tight text-slate-100">Learnova AI Tutor</h2>
              <p class="text-[10px] text-slate-400 font-mono">
                Chrono-Scoped &bull; Timestamp Evidence
              </p>
            </div>
          </div>
          <button id="vw-btn-clear-chat" title="Clear Chat" class="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-white/[0.04] transition-colors">
            ${icon('refresh', 'w-3.5 h-3.5')}
          </button>
        </div>

        <!-- Active Barrier Banner -->
        <div class="px-3.5 py-1.5 bg-violet-950/30 border-b border-violet-900/30 flex items-center justify-between text-xs text-violet-200 shrink-0 font-mono">
          <div class="flex items-center gap-1.5 truncate">
            ${icon('lock', 'w-3 h-3 text-violet-400 shrink-0')}
            <span class="truncate">Context Barrier: <strong id="chat-lock-time" class="text-cyan-300 tabular-nums">${formatSecondsToTime(currentTimestamp)}</strong></span>
          </div>
          <span class="text-[10px] text-violet-300 bg-violet-900/40 px-1.5 py-0.5 rounded border border-violet-700/40 shrink-0">Strict Filter</span>
        </div>

        <!-- Quick Test Prompts Carousel -->
        <div class="px-3.5 py-2.5 bg-black/20 border-b border-white/[0.06] shrink-0">
          <div class="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Verification Quick Tests</div>
          <div class="flex flex-wrap gap-1.5">
            <button class="px-2 py-1 rounded text-xs font-mono bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 border border-amber-600/30 transition-colors" data-quick-prompt="Explain overfitting.">
              "Explain overfitting" (18:42 Locked)
            </button>
            <button class="px-2 py-1 rounded text-xs font-mono bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-300 border border-emerald-600/30 transition-colors" data-quick-prompt="What is supervised learning?">
              "Supervised Learning" (05:00)
            </button>
            <button class="px-2 py-1 rounded text-xs font-mono bg-cyan-950/30 hover:bg-cyan-950/50 text-cyan-300 border border-cyan-600/30 transition-colors" data-quick-prompt="What is unsupervised learning?">
              "Unsupervised Learning" (10:00)
            </button>
          </div>
        </div>

        <!-- Chat Stream Message Area -->
        <div id="vw-chat-stream" class="flex-1 p-4 overflow-y-auto space-y-4">
          <!-- Populated dynamically -->
        </div>

        <!-- Question Input Bar -->
        <div class="p-3 bg-black/20 border-t border-white/[0.08] shrink-0">
          <form id="vw-chat-form" class="flex items-center gap-2">
            <input 
              id="vw-chat-input" 
              type="text" 
              placeholder="Ask a question about content covered up to ${formatSecondsToTime(currentTimestamp)}..." 
              class="flex-1 px-3.5 py-2 rounded-lg bg-black/40 border border-white/[0.1] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors font-sans" 
            />
            <button 
              id="vw-btn-send" 
              type="submit" 
              class="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center justify-center shrink-0 shadow-sm"
            >
              ${icon('send', 'w-3.5 h-3.5')}
            </button>
          </form>
          <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-1">
            <span>Chrono-Scoped RAG Active</span>
            <span class="text-violet-400">Zero Future Leakage</span>
          </div>
        </div>

      </div>

    </div>
  `;

  // --- YouTube IFrame API Integration ---
  const cleanupPlayer = () => {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;
    if (ytPlayer && typeof ytPlayer.destroy === 'function') ytPlayer.destroy();
    ytPlayer = null;
  };

  const lifecycleObserver = new MutationObserver(() => {
    if (!container.isConnected) {
      cleanupPlayer();
      lifecycleObserver.disconnect();
    }
  });
  lifecycleObserver.observe(document.body, { childList: true, subtree: true });

  const initYoutubePlayer = async () => {
    const playerTarget = container.querySelector<HTMLElement>('#youtube-player-container');
    if (!playerTarget) return;
    try {
      await ensureYouTubeIframeApi();
      if (!container.isConnected || !playerTarget.isConnected) return;

      ytPlayer = new window.YT.Player(playerTarget, {
        videoId: video.youtubeId,
        playerVars: { playsinline: 1, controls: 1, rel: 0, start: currentTimestamp },
        events: {
          onReady: (event: any) => {
            if (currentTimestamp > 0) event.target.seekTo(currentTimestamp, true);
            pollInterval = setInterval(() => {
              if (!container.isConnected) {
                cleanupPlayer();
                return;
              }
              const time = ytPlayer?.getCurrentTime?.();
              if (typeof time === 'number' && Number.isFinite(time) && time >= 0) {
                updateTimestampUI(Math.floor(time));
              }
            }, 1000);
          },
          onStateChange: (event: any) => {
            const isPlaying = event.data === window.YT.PlayerState.PLAYING;
            store.setVideoPlaying(isPlaying);
            updatePlayPauseIcon(isPlaying);
          },
          onError: (event: any) => {
            const error = container.querySelector<HTMLElement>('#vw-video-error');
            if (!error) return;
            error.textContent = event.data === 101 || event.data === 150
              ? 'This video cannot be played here because its owner has disabled embedding. You can still watch it on YouTube.'
              : 'YouTube could not load this video. Check the URL or try another video.';
            error.classList.remove('hidden');
          },
        },
      });
    } catch (error) {
      const errorElement = container.querySelector<HTMLElement>('#vw-video-error');
      if (errorElement) {
        errorElement.textContent = error instanceof Error ? error.message : 'Unable to load the YouTube player.';
        errorElement.classList.remove('hidden');
      }
    }
  };

  const updatePlayPauseIcon = (playing: boolean) => {
    const btn = container.querySelector('#vw-btn-play-pause');
    if (btn) {
      btn.innerHTML = playing ? icon('pause', 'w-4 h-4') : icon('play', 'w-4 h-4 ml-0.5');
    }
  };

  const updateTimestampUI = (timeSec: number) => {
    currentTimestamp = timeSec;
    store.currentPlaybackTimestamp = timeSec;
    const formatted = formatSecondsToTime(timeSec);

    const curEl = container.querySelector('#vw-time-current');
    if (curEl) curEl.textContent = formatted;

    const slider = container.querySelector('#vw-timeline-slider') as HTMLInputElement;
    if (slider && document.activeElement !== slider) slider.value = String(timeSec);

    const badge = container.querySelector('#vw-boundary-badge');
    if (badge) badge.textContent = formatted;

    const lockBadge = container.querySelector('#chat-lock-time');
    if (lockBadge) lockBadge.textContent = formatted;

    const input = container.querySelector('#vw-chat-input') as HTMLInputElement;
    if (input && !input.value) {
      input.placeholder = `Ask a question about content covered up to ${formatted}...`;
    }
  };

  const jumpTo = (timeSec: number) => {
    updateTimestampUI(timeSec);
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      ytPlayer.seekTo(timeSec, true);
    }
  };

  // Render chat messages into the stream
  const renderChatStream = () => {
    const stream = container.querySelector('#vw-chat-stream');
    if (!stream) return;

    stream.innerHTML = store.chatMessages.map(msg => {
      const isUser = msg.sender === 'user';
      return `
        <div class="flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1">
          <!-- Sender info & timestamp badge -->
          <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 px-1">
            <span class="font-medium">${isUser ? 'You' : 'Learnova Tutor'}</span>
            ${msg.videoTimestampFormatted ? `
              <span class="px-1 py-0.2 rounded bg-white/[0.04] text-cyan-300 font-mono">
                ${msg.videoTimestampFormatted}
              </span>
            ` : ''}
          </div>

          <!-- Message bubble -->
          <div class="max-w-[90%] p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-sm ${
            isUser 
              ? 'bg-violet-600 text-white rounded-tr-xs' 
              : msg.futureContentBlocked 
                ? 'bg-amber-950/20 text-amber-200 border border-amber-500/30 rounded-tl-xs' 
                : 'bg-white/[0.03] text-slate-200 border border-white/[0.08] rounded-tl-xs'
          }">
            <div>${renderMarkdownSimple(msg.content)}</div>

            <!-- Source References Badges -->
            ${msg.sources && msg.sources.length > 0 ? `
              <div class="mt-3 pt-2.5 border-t ${isUser ? 'border-violet-500/40' : 'border-white/[0.08]'} space-y-1.5">
                <div class="text-[10px] font-mono uppercase tracking-wider ${isUser ? 'text-violet-200' : 'text-slate-400'}">
                  Verified Learning References
                </div>
                <div class="flex flex-wrap gap-1.5">
                  ${msg.sources.map(src => `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      src.type === 'video'
                        ? 'bg-violet-950/60 text-violet-300 border border-violet-800/40'
                        : src.type === 'pdf'
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                          : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                    }">
                      ${icon(src.type === 'video' ? 'video' : 'file', 'w-3 h-3')}
                      <span>${src.identifier}</span>
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    stream.scrollTop = stream.scrollHeight;
  };

  // Chat Submission handler
  const sendQuestion = async (qText: string) => {
    if (!qText.trim() || isSending) return;
    isSending = true;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      content: qText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      videoTimestampSeconds: currentTimestamp,
      videoTimestampFormatted: formatSecondsToTime(currentTimestamp),
      evidenceGrounded: false,
    };
    store.addChatMessage(userMsg);
    renderChatStream();

    // Show typing placeholder
    const stream = container.querySelector('#vw-chat-stream');
    const typingId = 'typing_' + Date.now();
    if (stream) {
      const typingEl = document.createElement('div');
      typingEl.id = typingId;
      typingEl.className = 'flex items-center gap-2 p-2.5 bg-white/[0.03] rounded-lg text-xs font-mono text-slate-400 animate-pulse border border-white/[0.08] w-fit';
      typingEl.innerHTML = `${icon('sparkles', 'w-3 h-3 text-violet-400')}<span>Applying Chrono-Scoped validation (&le; ${formatSecondsToTime(currentTimestamp)})...</span>`;
      stream.appendChild(typingEl);
      stream.scrollTop = stream.scrollHeight;
    }

    try {
      const response = await apiCall('POST', '/api/ai/ask', {
        question: qText.trim(),
        videoId: video.id,
        currentTimestampSeconds: currentTimestamp,
        documentIds: store.selectedDocumentIds,
      });

      document.getElementById(typingId)?.remove();

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        videoTimestampSeconds: currentTimestamp,
        videoTimestampFormatted: formatSecondsToTime(currentTimestamp),
        evidenceGrounded: response.evidenceGrounded,
        insufficientEvidence: response.insufficientEvidence,
        futureContentBlocked: response.futureContentBlocked,
        blockedExplanationTime: response.blockedExplanationTime,
        sources: response.sources,
      };

      store.addChatMessage(aiMsg);
      renderChatStream();
    } catch (err: any) {
      document.getElementById(typingId)?.remove();
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        content: `Error evaluating learning boundary: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceGrounded: false,
      };
      store.addChatMessage(errorMsg);
      renderChatStream();
    } finally {
      isSending = false;
    }
  };

  // Wire UI events
  container.querySelector('#vw-btn-play-pause')?.addEventListener('click', () => {
    if (!ytPlayer) return;
    const state = ytPlayer.getPlayerState();
    if (state === 1) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  });

  container.querySelector('#vw-btn-rewind')?.addEventListener('click', () => {
    jumpTo(Math.max(0, currentTimestamp - 10));
  });

  container.querySelector('#vw-btn-forward')?.addEventListener('click', () => {
    jumpTo(Math.min(video.durationSeconds, currentTimestamp + 10));
  });

  container.querySelector('#vw-timeline-slider')?.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    jumpTo(val);
  });

  container.querySelectorAll('[data-jump]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const t = parseInt((e.currentTarget as HTMLElement).getAttribute('data-jump') || '0', 10);
      jumpTo(t);
    });
  });

  container.querySelector('#vw-btn-clear-chat')?.addEventListener('click', () => {
    store.clearChatHistory();
    renderChatStream();
  });

  container.querySelectorAll('[data-quick-prompt]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prompt = (e.currentTarget as HTMLElement).getAttribute('data-quick-prompt');
      if (prompt) {
        const input = container.querySelector('#vw-chat-input') as HTMLInputElement;
        if (input) input.value = prompt;
        sendQuestion(prompt);
      }
    });
  });

  container.querySelector('#vw-chat-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = container.querySelector('#vw-chat-input') as HTMLInputElement;
    if (input) {
      const val = input.value;
      input.value = '';
      sendQuestion(val);
    }
  });

  container.querySelector('#vw-youtube-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const urlInput = container.querySelector<HTMLInputElement>('#vw-youtube-url');
    const errorElement = container.querySelector<HTMLElement>('#vw-video-error');
    const inputUrl = urlInput?.value.trim() || '';
    const youtubeId = extractYouTubeVideoId(inputUrl);

    if (!youtubeId) {
      if (errorElement) {
        errorElement.textContent = 'Enter a valid YouTube video URL (watch, youtu.be, embed, or Shorts).';
        errorElement.classList.remove('hidden');
      }
      return;
    }

    const loadButton = container.querySelector<HTMLButtonElement>('#vw-youtube-form button[type="submit"]');
    if (loadButton) loadButton.disabled = true;
    if (errorElement) errorElement.classList.add('hidden');
    try {
      const response = await apiCall<{ video: VideoItem; captionsUnavailable?: boolean }>('POST', '/api/videos', {
        title: `YouTube Video (${youtubeId})`,
        youtubeUrl: inputUrl,
        description: 'Custom YouTube video loaded in the Learnova Tutor player.',
      });
      store.addVideo(response.video);

      // Show warning if captions are unavailable
      if (response.captionsUnavailable && errorElement) {
        errorElement.textContent = '⚠️ This video does not have available captions. AI Tutor will rely on uploaded documents only.';
        errorElement.classList.remove('hidden');
      }
    } catch (error) {
      if (errorElement) {
        errorElement.textContent = error instanceof Error ? error.message : 'Unable to load this video.';
        errorElement.classList.remove('hidden');
      }
    } finally {
      if (loadButton?.isConnected) loadButton.disabled = false;
    }
  });

  container.querySelector('#vw-btn-generate-quiz')?.addEventListener('click', () => {
    store.setRoute('quiz');
  });

  setTimeout(() => {
    void initYoutubePlayer();
    renderChatStream();
  }, 100);

  return container;
}
