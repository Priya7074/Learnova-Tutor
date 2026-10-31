import confetti from 'canvas-confetti';
import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';
import { apiCall } from '../services/apiClient.js';
import { Quiz, QuizAttempt } from '../types.js';
import { formatSecondsToTime } from '../services/ragEngine.js';

const PASSING_PERCENTAGE = 70;

export function renderQuizView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 animate-fade-in';

  let currentSourceType: 'video' | 'document' | 'notes' = 'video';
  let selectedDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
  let userAnswers: { [questionId: string]: number } = {};
  let isSubmitting = false;
  let lastAttempt: QuizAttempt | null = null;
  let submitError = '';
  let generationError = '';
  let currentAttemptId: string | null = null;

  const activeVideo = store.getActiveVideo();
  const currentTimestampFormatted = formatSecondsToTime(store.currentPlaybackTimestamp);

  const renderContent = () => {
    const quiz = store.activeQuiz;

    container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">Timestamp-Grounded Quiz</span>
            <span class="text-xs font-mono text-slate-400">Strict Non-Spoiler</span>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Interactive Knowledge Assessment</h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Questions are generated strictly from concepts covered up to your video playback point or active documents.
          </p>
        </div>

        <button id="btn-new-quiz-modal" class="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 shrink-0">
          ${icon('sparkles', 'w-3.5 h-3.5')}
          <span>New Quiz</span>
        </button>
      </div>

      <!-- Quiz Generation Config Card (if no quiz active) -->
      ${!quiz ? `
        <div class="glass-panel rounded-xl border border-white/[0.1] p-8 space-y-6 text-center max-w-2xl mx-auto shadow-2xl">
          <div class="w-12 h-12 rounded-lg bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
            ${icon('award', 'w-6 h-6')}
          </div>
          <div>
            <h2 class="text-lg font-semibold text-white mb-1.5">Configure Assessment Scope</h2>
            <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Select knowledge source. For lecture videos, questions will strictly cover material up to <span class="font-mono text-cyan-300 font-semibold">${currentTimestampFormatted}</span>.
            </p>
          </div>

          <!-- Source Selectors -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <button class="p-3.5 rounded-lg border transition-all ${currentSourceType === 'video' ? 'border-violet-500 bg-violet-950/40 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]'}" data-source-type="video">
              <div class="w-7 h-7 rounded bg-violet-950/60 text-violet-400 flex items-center justify-center mb-2 border border-violet-800/40">
                ${icon('video', 'w-3.5 h-3.5')}
              </div>
              <div class="text-xs font-semibold text-slate-200">Current Video</div>
              <div class="text-[11px] font-mono text-cyan-400">&le; ${currentTimestampFormatted}</div>
            </button>

            <button class="p-3.5 rounded-lg border transition-all ${currentSourceType === 'document' ? 'border-violet-500 bg-violet-950/40 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]'}" data-source-type="document">
              <div class="w-7 h-7 rounded bg-cyan-950/60 text-cyan-400 flex items-center justify-center mb-2 border border-cyan-800/40">
                ${icon('fileText', 'w-3.5 h-3.5')}
              </div>
              <div class="text-xs font-semibold text-slate-200">Course PDF / PPT</div>
              <div class="text-[11px] font-mono text-slate-400">${store.documents.length} Docs Synced</div>
            </button>

            <button class="p-3.5 rounded-lg border transition-all ${currentSourceType === 'notes' ? 'border-violet-500 bg-violet-950/40 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]'}" data-source-type="notes">
              <div class="w-7 h-7 rounded bg-indigo-950/60 text-indigo-400 flex items-center justify-center mb-2 border border-indigo-800/40">
                ${icon('book', 'w-3.5 h-3.5')}
              </div>
              <div class="text-xs font-semibold text-slate-200">Study Notes</div>
              <div class="text-[11px] font-mono text-slate-400">Handwritten / TXT</div>
            </button>
          </div>

          <!-- Difficulty -->
          <div class="flex items-center justify-center gap-2 pt-2">
            <span class="text-xs font-mono text-slate-400 mr-2">Difficulty:</span>
            ${(['Easy', 'Medium', 'Hard'] as const).map(diff => `
              <button class="px-3 py-1 rounded-md text-xs font-mono transition-all ${selectedDifficulty === diff ? 'bg-violet-600 text-white font-medium' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}" data-diff="${diff}">
                ${diff}
              </button>
            `).join('')}
          </div>

          <button id="btn-start-generating-quiz" class="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2 mx-auto">
            ${icon('sparkles', 'w-3.5 h-3.5')}
            <span>Generate Grounded Quiz</span>
          </button>
          <p id="quiz-generation-error" role="alert" class="text-sm text-rose-300"></p>
        </div>
      ` : `
        <!-- Active Quiz Player -->
        <div class="space-y-6">
          
          <!-- Quiz Meta Card -->
          <div class="glass-panel rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-xs font-mono mb-1">
                <span class="text-violet-400">${quiz.sourceType.toUpperCase()} QUIZ</span>
                <span class="text-slate-600">·</span>
                <span class="text-slate-400">${quiz.questions.length} Questions</span>
                <span class="text-slate-600">·</span>
                <span class="text-cyan-400">${quiz.difficulty}</span>
              </div>
              <h2 class="text-base font-semibold text-white">${quiz.title}</h2>
            </div>
            ${quiz.timestampLimitFormatted ? `
              <div class="px-2.5 py-1 rounded-md bg-violet-950/50 border border-violet-800/40 text-violet-300 text-xs font-mono">
                🔒 Boundary &le; ${quiz.timestampLimitFormatted}
              </div>
            ` : ''}
          </div>

          <!-- Questions List -->
          <div class="space-y-4">
            ${quiz.questions.map((q, qIndex) => {
              const selectedOpt = userAnswers[q.id];
              const isSubmitted = Boolean(lastAttempt);
              const isCorrect = isSubmitted && selectedOpt === q.correctIndex;

              return `
                <div class="glass-panel rounded-xl border ${
                  isSubmitted ? (isCorrect ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-rose-500/40 bg-rose-950/15') : 'border-white/[0.08]'
                } p-5 space-y-3.5">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center gap-2.5">
                      <span class="w-5 h-5 rounded bg-violet-950/80 text-violet-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-violet-800/40">
                        ${qIndex + 1}
                      </span>
                      <h3 class="text-sm font-semibold text-white leading-snug">${q.question}</h3>
                    </div>
                    ${q.sourceReference ? `
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400 shrink-0">
                        ${q.sourceReference}
                      </span>
                    ` : ''}
                  </div>

                  <!-- 4 Options -->
                  <div class="grid grid-cols-1 gap-2 pt-1">
                    ${q.options.map((opt, optIndex) => {
                      const isChosen = selectedOpt === optIndex;
                      const isActualCorrect = q.correctIndex === optIndex;

                      let optClass = 'border-white/[0.08] hover:border-violet-500/40 bg-white/[0.02] text-slate-300 hover:text-white';
                      if (isSubmitted) {
                        if (isActualCorrect) optClass = 'border-emerald-500 bg-emerald-950/30 text-emerald-200 font-medium';
                        else if (isChosen && !isActualCorrect) optClass = 'border-rose-500 bg-rose-950/30 text-rose-200';
                        else optClass = 'border-white/[0.04] text-slate-600 opacity-50';
                      } else if (isChosen) {
                        optClass = 'border-violet-500 bg-violet-950/40 text-violet-200 font-medium shadow-xs';
                      }

                      return `
                        <button 
                          class="w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center gap-3 ${optClass}"
                          data-opt-q="${q.id}" 
                          data-opt-idx="${optIndex}"
                          ${isSubmitted ? 'disabled' : ''}
                        >
                          <span class="w-5 h-5 rounded border border-current flex items-center justify-center font-mono text-[10px] shrink-0">
                            ${String.fromCharCode(65 + optIndex)}
                          </span>
                          <span class="flex-1">${opt}</span>
                        </button>
                      `;
                    }).join('')}
                  </div>

                  <!-- Post-Submission Grounded Explanation -->
                  ${isSubmitted ? `
                    <div class="p-3 rounded-lg ${isCorrect ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-200' : 'bg-rose-950/20 border border-rose-500/30 text-rose-200'} text-xs space-y-1 animate-fade-in">
                      <div class="font-mono text-xs font-semibold flex items-center gap-1.5">
                        ${isCorrect ? icon('check', 'w-3.5 h-3.5 text-emerald-400') : icon('alert', 'w-3.5 h-3.5 text-rose-400')}
                        <span>${isCorrect ? 'Correct' : 'Incorrect'} &bull; Evidence:</span>
                      </div>
                      <p class="leading-relaxed font-sans text-xs text-slate-300"><strong>Correct answer:</strong> ${q.options[q.correctIndex]}</p>
                      <p class="leading-relaxed font-sans text-xs text-slate-300">${q.explanation}</p>
                    </div>
                  ` : ''}

                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Action Deck -->
          <div class="flex items-center justify-between pt-2">
            <button id="btn-cancel-quiz" class="px-3 py-1.5 text-xs font-mono text-slate-500 hover:text-slate-300">
              Discard Quiz
            </button>

            ${!lastAttempt ? `
              <button id="btn-submit-quiz" ${isSubmitting ? 'disabled' : ''} class="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-2 disabled:cursor-wait disabled:opacity-60">
                ${isSubmitting ? icon('clock', 'w-3.5 h-3.5 animate-spin') : icon('award', 'w-3.5 h-3.5')}
                <span>${isSubmitting ? 'Evaluating...' : 'Submit Quiz'}</span>
              </button>
            ` : `
              <button id="btn-retake-quiz" class="px-4 py-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all flex items-center gap-2">
                ${icon('refresh', 'w-3.5 h-3.5')}
                <span>Retry Quiz</span>
              </button>
            `}
          </div>
          <p id="quiz-submit-error" role="alert" class="text-right text-xs text-rose-300"></p>

          <!-- Score Card Modal / Banner if Submitted -->
          ${lastAttempt ? `
            <div class="glass-panel border border-violet-500/40 rounded-xl p-6 shadow-2xl text-center space-y-3 animate-fade-in">
              <div class="text-[11px] font-mono uppercase tracking-widest text-cyan-400">Quiz Results</div>
              <div class="text-4xl font-bold font-mono text-white tabular-nums">${lastAttempt.percentage}%</div>
              <div class="grid grid-cols-3 gap-3 text-xs">
                <div class="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3"><div class="text-lg font-semibold text-white">${lastAttempt.totalQuestions}</div><div class="text-slate-400">Total questions</div></div>
                <div class="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3"><div class="text-lg font-semibold text-emerald-300">${lastAttempt.score}</div><div class="text-slate-400">Correct</div></div>
                <div class="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3"><div class="text-lg font-semibold text-rose-300">${lastAttempt.totalQuestions - lastAttempt.score}</div><div class="text-slate-400">Incorrect</div></div>
              </div>
              <p class="text-sm font-semibold ${lastAttempt.percentage >= PASSING_PERCENTAGE ? 'text-emerald-300' : 'text-amber-300'}">${lastAttempt.percentage >= PASSING_PERCENTAGE ? 'Passed' : 'Not passed'} <span class="text-xs font-normal text-slate-400">(pass mark: ${PASSING_PERCENTAGE}%)</span></p>
              <div class="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 max-w-lg mx-auto">
                ${lastAttempt.feedback}
              </div>
            </div>
          ` : ''}

        </div>
      `}
    `;

    const submitErrorElement = container.querySelector<HTMLElement>('#quiz-submit-error');
    if (submitErrorElement) submitErrorElement.textContent = submitError;
    const generationErrorElement = container.querySelector<HTMLElement>('#quiz-generation-error');
    if (generationErrorElement) generationErrorElement.textContent = generationError;

    // Event Wire-up
    container.querySelectorAll('[data-source-type]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentSourceType = (e.currentTarget as HTMLElement).getAttribute('data-source-type') as any;
        renderContent();
      });
    });

    container.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        selectedDifficulty = (e.currentTarget as HTMLElement).getAttribute('data-diff') as any;
        renderContent();
      });
    });

    container.querySelector('#btn-start-generating-quiz')?.addEventListener('click', async (event) => {
      const generateButton = event.currentTarget as HTMLButtonElement;
      if (generateButton.disabled) return;
      let sourceId = activeVideo.id;
      if (currentSourceType === 'document' || currentSourceType === 'notes') {
        sourceId = store.documents[0].id;
      }

      generateButton.disabled = true;
      generationError = '';
      try {
        const res = await apiCall('POST', '/api/quizzes/generate', {
          sourceType: currentSourceType,
          sourceId,
          maxTimestampSeconds: store.currentPlaybackTimestamp,
          difficulty: selectedDifficulty,
        });

        userAnswers = {};
        lastAttempt = null;
        store.setActiveQuiz(res.quiz);
        renderContent();
      } catch (error) {
        generationError = error instanceof Error ? error.message : 'Unable to generate a quiz for this scope.';
        renderContent();
      }
    });

    container.querySelectorAll('[data-opt-q]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qId = (e.currentTarget as HTMLElement).getAttribute('data-opt-q');
        const optIdx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-opt-idx') || '0', 10);
        if (qId) {
          userAnswers[qId] = optIdx;
          renderContent();
        }
      });
    });

    container.querySelector('#btn-submit-quiz')?.addEventListener('click', async () => {
      if (isSubmitting || !quiz) return;
      const unansweredCount = quiz.questions.filter(question => !Number.isInteger(userAnswers[question.id])).length;
      if (unansweredCount > 0) {
        submitError = `Please select an answer for all ${quiz.questions.length} questions before submitting.`;
        renderContent();
        return;
      }

      isSubmitting = true;
      submitError = '';
      currentAttemptId ||= globalThis.crypto?.randomUUID?.() || `attempt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      renderContent();

      try {
        const res = await apiCall('POST', '/api/quizzes/submit', {
          quizId: quiz.id,
          attemptId: currentAttemptId,
          userAnswers,
        });

        lastAttempt = res.attempt;
        store.recordQuizAttempt(res.attempt);

        if (res.attempt.percentage >= PASSING_PERCENTAGE) {
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch (e) {
            // confetti fallback
          }
        }
      } catch (err: any) {
        submitError = err instanceof Error ? err.message : 'Quiz evaluation failed. Please try again.';
      } finally {
        isSubmitting = false;
        renderContent();
      }
    });

    container.querySelector('#btn-retake-quiz')?.addEventListener('click', () => {
      lastAttempt = null;
      userAnswers = {};
      submitError = '';
      currentAttemptId = null;
      renderContent();
    });

    container.querySelector('#btn-cancel-quiz')?.addEventListener('click', () => {
      store.setActiveQuiz(null);
      lastAttempt = null;
      userAnswers = {};
      submitError = '';
      currentAttemptId = null;
      renderContent();
    });

    container.querySelector('#btn-new-quiz-modal')?.addEventListener('click', () => {
      store.setActiveQuiz(null);
      lastAttempt = null;
      userAnswers = {};
      submitError = '';
      currentAttemptId = null;
      renderContent();
    });
  };

  renderContent();
  return container;
}
