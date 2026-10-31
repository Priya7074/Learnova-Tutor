import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';
import { apiCall } from '../services/apiClient.js';
import { INTERVIEW_DOMAINS } from '../constants.js';

export function renderInterviewView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 animate-fade-in';

  let currentDomain = store.interviewDomain;
  let currentDifficulty = store.interviewDifficulty;
  let currentAnswer = '';
  let isEvaluating = false;

  const renderContent = () => {
    const question = store.currentInterviewQuestion;
    const feedback = store.lastInterviewFeedback;

    container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">AI Mock Technical Interview</span>
            <span class="text-xs font-mono text-slate-400">Senior Staff Rubric</span>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Technical Interview Preparation</h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate real tech interview scenarios. Receive comprehensive evaluations on technical depth, trade-off analysis, and communication clarity.
          </p>
        </div>
      </div>

      <!-- Domain Selection Chips -->
      <div class="space-y-2">
        <label class="block text-xs font-mono uppercase tracking-wider text-slate-400">Select Technical Domain (8 Tracks)</label>
        <div class="flex flex-wrap gap-1.5">
          ${INTERVIEW_DOMAINS.map(domain => `
            <button class="px-3 py-1.5 rounded-md text-xs font-mono transition-all ${domain === currentDomain ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] text-slate-400'}" data-domain="${domain}">
              ${domain}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Main Interview Workspace: Question Prompt & Answer Console -->
      <div class="grid grid-cols-1 gap-6">
        
        <!-- Interviewer Card -->
        <div class="glass-panel rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center">
                ${icon('brain', 'w-4 h-4')}
              </div>
              <div>
                <h3 class="text-xs font-mono uppercase tracking-wider text-slate-400">Interviewer Prompt (${currentDomain})</h3>
                <span class="text-[10px] font-mono text-cyan-400">${question?.difficulty || 'Medium'}</span>
              </div>
            </div>

            <button id="btn-next-question" class="text-xs font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              <span>Next Question</span>
              ${icon('chevronRight', 'w-3 h-3')}
            </button>
          </div>

          <div class="p-4 rounded-lg bg-black/40 border border-white/[0.06] text-sm font-semibold text-slate-100 leading-relaxed font-sans">
            "${question?.question}"
          </div>

          <!-- Hints accordion -->
          ${question?.hints && question.hints.length > 0 ? `
            <div class="pt-1">
              <span class="text-xs font-mono text-slate-400">Themes to address:</span>
              <div class="flex flex-wrap gap-1.5 mt-1.5">
                ${question.hints.map(h => `
                  <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950/40 text-violet-300 border border-violet-800/40">
                    &bull; ${h}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Candidate Answer Box -->
        <div class="glass-panel rounded-xl p-5 space-y-3.5">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase tracking-wider text-slate-300">Your Technical Response</h3>
            <span class="text-xs font-mono text-slate-500 tabular-nums" id="char-counter">${currentAnswer.length} characters</span>
          </div>

          <textarea 
            id="interview-answer-textarea" 
            placeholder="Structure your answer clearly:&#10;1. Core concept and algorithmic definition&#10;2. Underlying data structures, complexity, and mechanisms&#10;3. Real-world edge cases, trade-offs, and design choices..."
            class="w-full h-44 p-3.5 rounded-lg bg-black/40 border border-white/[0.1] text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-sans leading-relaxed selection:bg-violet-500/30"
          >${currentAnswer}</textarea>

          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span class="text-[11px] font-mono text-slate-500">
              Evaluated against Staff Engineer rubric (Correctness, Trade-offs, Clarity).
            </span>

            <button id="btn-submit-interview" class="w-full sm:w-auto px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2">
              ${isEvaluating ? icon('clock', 'w-3.5 h-3.5 animate-spin') : icon('shieldCheck', 'w-3.5 h-3.5')}
              <span>${isEvaluating ? 'Evaluating Answer...' : 'Submit Response'}</span>
            </button>
          </div>
        </div>

        <!-- AI Evaluation Feedback Report -->
        ${feedback ? `
          <div class="glass-panel border border-violet-500/30 rounded-xl p-6 space-y-5 animate-fade-in shadow-2xl">
            
            <!-- Score Deck -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div>
                <span class="text-xs font-mono text-violet-400">PERFORMANCE EVALUATION</span>
                <h3 class="text-lg font-bold text-white">Staff Engineer Feedback</h3>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="p-2.5 rounded-lg bg-violet-950/60 border border-violet-800/40 text-center min-w-[75px]">
                  <div class="text-xl font-bold font-mono text-violet-300 tabular-nums">${feedback.scoreOverall}/100</div>
                  <div class="text-[9px] font-mono uppercase text-violet-400">Overall</div>
                </div>
                <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-center min-w-[70px]">
                  <div class="text-base font-bold font-mono text-cyan-300 tabular-nums">${feedback.technicalScore}</div>
                  <div class="text-[9px] font-mono uppercase text-slate-400">Technical</div>
                </div>
                <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-center min-w-[70px]">
                  <div class="text-base font-bold font-mono text-slate-200 tabular-nums">${feedback.communicationScore}</div>
                  <div class="text-[9px] font-mono uppercase text-slate-400">Clarity</div>
                </div>
              </div>
            </div>

            <!-- Strengths & Improvements Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <!-- Strengths -->
              <div class="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
                <div class="font-mono text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  ${icon('check', 'w-3.5 h-3.5 text-emerald-400')}
                  <span>Key Strengths</span>
                </div>
                <ul class="space-y-1 text-slate-300 ml-4 list-disc font-sans text-xs">
                  ${feedback.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>

              <!-- Improvements -->
              <div class="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
                <div class="font-mono text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  ${icon('alert', 'w-3.5 h-3.5 text-amber-400')}
                  <span>Areas for Improvement</span>
                </div>
                <ul class="space-y-1 text-slate-300 ml-4 list-disc font-sans text-xs">
                  ${feedback.improvementAreas.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- Ideal Answer Benchmark -->
            <div class="p-4 rounded-lg bg-black/50 border border-white/[0.08] text-xs space-y-2">
              <div class="text-cyan-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                ${icon('award', 'w-3.5 h-3.5 text-cyan-400')}
                <span>Ideal Senior Engineer Response Framework</span>
              </div>
              <p class="leading-relaxed font-mono text-slate-300 text-xs">${feedback.suggestedIdealAnswer}</p>
            </div>

            <!-- Next Follow-up Question -->
            ${feedback.followUpQuestion ? `
              <div class="p-3.5 rounded-lg bg-violet-950/30 border border-violet-800/40 text-xs text-violet-200 flex items-start gap-3">
                <div class="w-5 h-5 rounded bg-violet-900/60 text-violet-300 flex items-center justify-center shrink-0 font-mono font-bold text-xs">?</div>
                <div>
                  <strong class="block text-violet-300 font-mono text-xs mb-0.5">Recommended Follow-up Question:</strong>
                  <span class="text-slate-300">${feedback.followUpQuestion}</span>
                </div>
              </div>
            ` : ''}

          </div>
        ` : ''}

      </div>
    `;

    // Event Wire-up
    container.querySelectorAll('[data-domain]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dom = (e.currentTarget as HTMLElement).getAttribute('data-domain');
        if (dom) {
          store.setInterviewDomain(dom);
          currentDomain = dom;
          currentAnswer = '';
          renderContent();
        }
      });
    });

    const textarea = container.querySelector('#interview-answer-textarea') as HTMLTextAreaElement;
    textarea?.addEventListener('input', () => {
      currentAnswer = textarea.value;
      const counter = container.querySelector('#char-counter');
      if (counter) counter.textContent = `${currentAnswer.length} characters`;
    });

    container.querySelector('#btn-next-question')?.addEventListener('click', () => {
      store.setInterviewDomain(currentDomain);
      currentAnswer = '';
      renderContent();
    });

    container.querySelector('#btn-submit-interview')?.addEventListener('click', async () => {
      if (isEvaluating || !question) return;
      if (!currentAnswer.trim()) {
        alert('Please type an answer to the technical question before submitting.');
        return;
      }
      isEvaluating = true;
      renderContent();

      try {
        const res = await apiCall('POST', '/api/interview/answer', {
          question,
          answer: currentAnswer,
        });

        store.setInterviewFeedback(res.feedback);
      } catch (err: any) {
        alert('Evaluation error: ' + err.message);
      } finally {
        isEvaluating = false;
        renderContent();
      }
    });
  };

  renderContent();
  return container;
}
