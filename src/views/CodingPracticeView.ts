import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';
import { apiCall } from '../services/apiClient.js';

export function renderCodingPractice(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-100 animate-fade-in';

  const problems = store.codingProblems;
  const currentProblem = problems.find(p => p.id === store.activeProblemId) || problems[0];
  const currentLang = store.codingLanguage;
  let isVerifying = false;

  const renderContent = () => {
    const result = store.lastVerificationResult;

    container.innerHTML = `
      <!-- Header & Problem Selector -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">Verified Code Lab</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded ${
              currentProblem.difficulty === 'Easy' 
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' 
                : currentProblem.difficulty === 'Medium' 
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' 
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
            }">${currentProblem.difficulty}</span>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">${currentProblem.title}</h1>
        </div>

        <!-- Problem Selector Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          ${problems.map(prob => `
            <button class="px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all shrink-0 ${prob.id === currentProblem.id ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}" data-select-problem="${prob.id}">
              ${prob.title}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Main Editor Grid: Problem (45%) vs Code Editor & Test Bench (55%) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Problem Description & Test Cases (5 Cols) -->
        <div class="lg:col-span-5 glass-panel rounded-xl p-5 space-y-5">
          
          <div>
            <div class="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Domain: ${currentProblem.category}</div>
            <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              ${currentProblem.description}
            </div>
          </div>

          <!-- Examples -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-mono uppercase tracking-wider text-slate-400">Examples</h4>
            ${currentProblem.examples.map((ex, idx) => `
              <div class="p-3 rounded-lg bg-black/40 border border-white/[0.06] font-mono text-xs space-y-1">
                <div class="text-slate-500 text-[10px]">Example ${idx + 1}:</div>
                <div><span class="text-slate-400">Input:</span> <span class="text-violet-300 font-semibold">${ex.input}</span></div>
                <div><span class="text-slate-400">Output:</span> <span class="text-cyan-300 font-semibold">${ex.output}</span></div>
                ${ex.explanation ? `<div class="text-slate-400 text-[11px] pt-1 border-t border-white/[0.06] font-sans">${ex.explanation}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Constraints -->
          <div class="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <h4 class="text-xs font-mono uppercase tracking-wider text-slate-400">Constraints</h4>
            <ul class="space-y-1 text-xs text-slate-400 font-mono">
              ${currentProblem.constraints.map(c => `<li>&bull; ${c}</li>`).join('')}
            </ul>
          </div>

        </div>

        <!-- Right: Code Editor & Execution Results (7 Cols) -->
        <div class="lg:col-span-7 space-y-4">
          
          <!-- Editor Card -->
          <div class="bg-[#0b0f19] rounded-xl border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col">
            
            <!-- Editor Header: Language selector & Actions -->
            <div class="px-4 py-2.5 bg-black/40 border-b border-white/[0.08] flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-slate-400 font-mono mr-1">Runtime:</span>
                ${(['javascript', 'python', 'java', 'cpp'] as const).map(lang => `
                  <button class="px-2.5 py-1 rounded text-xs font-mono transition-all ${lang === currentLang ? 'bg-violet-600 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}" data-lang="${lang}">
                    ${lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                `).join('')}
              </div>

              <div class="flex items-center gap-2">
                <button id="btn-reset-code" title="Reset starter code" class="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-white/[0.04] transition-colors">
                  ${icon('refresh', 'w-3.5 h-3.5')}
                </button>
              </div>
            </div>

            <!-- Code Textarea -->
            <div class="relative p-4 font-mono text-xs sm:text-sm bg-[#090d16] min-h-[300px]">
              <textarea 
                id="code-editor-textarea" 
                spellcheck="false" 
                class="w-full h-72 bg-transparent text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-y selection:bg-violet-500/30"
              >${store.codeEditorContent}</textarea>
            </div>

            <!-- Editor Action Deck -->
            <div class="p-3 bg-black/40 border-t border-white/[0.08] flex items-center justify-between">
              <span class="text-[11px] text-slate-400 font-mono">
                ${currentLang === 'javascript' ? '⚡ Live Client JS Execution' : '🔍 Static AST & Simulated Constraint Bench'}
              </span>

              <div class="flex items-center gap-2">
                <button id="btn-hint" class="px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors flex items-center gap-1.5">
                  ${icon('sparkles', 'w-3 h-3 text-cyan-400')}
                  <span>AI Hint</span>
                </button>
                <button id="btn-verify-code" class="px-4 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5">
                  ${isVerifying ? icon('clock', 'w-3.5 h-3.5 animate-spin') : icon('shieldCheck', 'w-3.5 h-3.5')}
                  <span>${isVerifying ? 'Verifying...' : 'Run & Verify'}</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Code Verification Result Card -->
          ${result ? `
            <div class="glass-panel rounded-xl border ${
              result.status === 'VERIFIED' ? 'border-emerald-500/40 bg-emerald-950/15' : result.status === 'PARTIALLY VERIFIED' ? 'border-amber-500/40 bg-amber-950/15' : 'border-rose-500/40 bg-rose-950/15'
            } p-5 space-y-4 animate-fade-in">
              
              <!-- Status Header Banner -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                <div class="flex items-center gap-2.5">
                  <span class="px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase ${
                    result.status === 'VERIFIED' ? 'bg-emerald-600 text-white' : result.status === 'PARTIALLY VERIFIED' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                  }">
                    ${result.status}
                  </span>
                  <span class="text-xs font-semibold text-white">${result.summary}</span>
                </div>
                
                <div class="flex items-center gap-3 text-xs font-mono text-slate-300">
                  <span>Time: <strong class="text-cyan-300 font-mono">${result.timeComplexity}</strong></span>
                  <span>Space: <strong class="text-cyan-300 font-mono">${result.spaceComplexity}</strong></span>
                  <span>Passed: <strong class="text-white font-mono">${result.testCasesPassed}/${result.totalTestCases}</strong></span>
                </div>
              </div>

              <p class="text-xs text-slate-300 leading-relaxed font-sans">${result.details}</p>

              <!-- Automated Test Cases Breakdown -->
              <div class="space-y-2">
                <div class="text-[11px] font-mono uppercase tracking-wider text-slate-400">Test Cases Execution Log</div>
                <div class="grid grid-cols-1 gap-1.5">
                  ${result.testResults.map(tc => `
                    <div class="p-2.5 rounded-md border ${tc.passed ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20'} text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full ${tc.passed ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
                        <span class="text-slate-400 font-medium">Case #${tc.caseNumber}:</span>
                        <span class="text-slate-200">${tc.input}</span>
                      </div>
                      <div class="flex items-center gap-3 text-[11px]">
                        <span>Exp: <strong class="text-slate-300">${tc.expected}</strong></span>
                        <span>Act: <strong class="${tc.passed ? 'text-emerald-300' : 'text-rose-400'}">${tc.actual}</strong></span>
                        <span class="font-bold ${tc.passed ? 'text-emerald-400' : 'text-rose-400'}">${tc.passed ? 'PASSED' : 'FAILED'}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- AI Logic Explanation -->
              <div class="p-3.5 rounded-lg bg-violet-950/30 border border-violet-800/40 text-xs space-y-1">
                <div class="font-mono text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                  ${icon('brain', 'w-3.5 h-3.5 text-violet-400')}
                  <span>Algorithmic Explanation</span>
                </div>
                <p class="text-slate-300 leading-relaxed font-sans">${result.aiExplanation}</p>
              </div>

              <!-- Debugging Hints -->
              ${result.debuggingHints.length > 0 ? `
                <div class="space-y-1 text-xs">
                  <span class="font-mono text-xs text-slate-300">Optimization & Debugging Hints:</span>
                  <ul class="space-y-0.5 text-slate-400 ml-4 list-disc font-sans">
                    ${result.debuggingHints.map(h => `<li>${h}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <div class="text-[10px] font-mono text-slate-500 text-right">
                ${result.isSimulatedExecution ? 'Tested via algorithmic static analysis bench' : 'Live sandbox execution in browser JavaScript engine'}
              </div>

            </div>
          ` : ''}

        </div>

      </div>
    `;

    // Event Wire-up
    const textarea = container.querySelector('#code-editor-textarea') as HTMLTextAreaElement;
    textarea?.addEventListener('input', () => {
      store.setCodeEditorContent(textarea.value);
    });

    container.querySelectorAll('[data-select-problem]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-select-problem');
        if (id) {
          store.setActiveCodingProblem(id);
          renderContent();
        }
      });
    });

    container.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang') as any;
        if (lang) {
          store.setCodingLanguage(lang);
          renderContent();
        }
      });
    });

    container.querySelector('#btn-reset-code')?.addEventListener('click', () => {
      store.setCodeEditorContent(currentProblem.starterCode[currentLang]);
      renderContent();
    });

    container.querySelector('#btn-hint')?.addEventListener('click', () => {
      alert(`💡 Hint for ${currentProblem.title}:\n\n` +
        `• Consider the target time complexity: can you do better than O(n²)?\n` +
        `• Think about using a Hash Map or Two Pointers to trade auxiliary space for speed.`);
    });

    container.querySelector('#btn-verify-code')?.addEventListener('click', async () => {
      if (isVerifying) return;
      isVerifying = true;
      renderContent();

      try {
        const res = await apiCall('POST', '/api/code/verify', {
          problemId: currentProblem.id,
          language: currentLang,
          code: store.codeEditorContent,
        });

        store.setVerificationResult(res.verification);
      } catch (err: any) {
        alert('Verification error: ' + err.message);
      } finally {
        isVerifying = false;
        renderContent();
      }
    });
  };

  renderContent();
  return container;
}
