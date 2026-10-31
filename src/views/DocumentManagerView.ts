import { store } from '../services/store.js';
import { icon } from '../utils/ui.js';
import { DocumentItem } from '../types.js';

export function renderDocumentManager(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 animate-fade-in';

  const documents = store.documents;
  let activePreviewDoc: DocumentItem | null = null;

  const renderContent = () => {
    container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">Multimodal Knowledge Hub</span>
            <span class="text-xs font-mono text-slate-400">${documents.length} Files Ingested</span>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Course Documents & Source Material</h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Ingest PDFs, slides, and notes. Extracted into structured chunks with preserved page & slide citations for verifiable AI answers.
          </p>
        </div>

        <button id="doc-btn-ask-tutor" class="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-2 shrink-0">
          ${icon('sparkles', 'w-3.5 h-3.5')}
          <span>Ask Tutor in Video</span>
        </button>
      </div>

      <!-- Drag & Drop Upload Deck -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Upload Zone (1 Col) -->
        <div class="lg:col-span-1 glass-panel rounded-xl border border-dashed border-white/20 hover:border-violet-500/50 p-6 text-center hover:bg-white/[0.02] transition-all flex flex-col justify-center items-center shadow-lg">
          <input type="file" id="file-upload-input" accept=".pdf,.ppt,.pptx,.txt,.doc,.docx" class="hidden" />
          <div class="w-11 h-11 rounded-lg bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center mb-3">
            ${icon('upload', 'w-5 h-5')}
          </div>
          <h3 class="text-sm font-semibold text-white mb-1">Add Course Material</h3>
          <p class="text-xs text-slate-400 mb-4 max-w-xs leading-relaxed">Drag files or click below. Supports PDF, PPT/PPTX slides, and text notes.</p>
          <div class="flex flex-col gap-2 w-full max-w-xs">
            <button id="btn-trigger-upload" class="w-full px-3.5 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
              Browse Files
            </button>
            <button id="btn-paste-notes" class="w-full px-3.5 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors">
              + Paste Text Notes
            </button>
          </div>
          <span class="text-[10px] font-mono text-slate-500 mt-3">Max size: 5MB &bull; PDF / PPTX / TXT</span>
        </div>

        <!-- Document Knowledge Library (2 Cols) -->
        <div class="lg:col-span-2 glass-panel rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 class="text-xs font-mono uppercase tracking-wider text-slate-400">Attached Knowledge Bases</h3>
            <span class="text-[11px] font-mono text-cyan-300">Checked files are included in RAG context</span>
          </div>

          <div class="divide-y divide-white/[0.06]">
            ${documents.map(doc => {
              const isChecked = store.selectedDocumentIds.includes(doc.id);
              const isSlide = doc.type === 'pptx';
              return `
                <div class="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div class="flex items-center gap-3.5 min-w-0">
                    <input type="checkbox" data-doc-check="${doc.id}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-600" />
                    <div class="w-9 h-9 rounded-md ${doc.type === 'pdf' ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40' : doc.type === 'pptx' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' : 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40'} flex items-center justify-center shrink-0">
                      ${icon('fileText', 'w-4 h-4')}
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <h4 class="text-xs font-semibold text-white truncate">${doc.title}</h4>
                        <span class="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300">${doc.type}</span>
                      </div>
                      <p class="text-xs text-slate-400 line-clamp-1 mt-0.5">${doc.summary}</p>
                      <div class="flex items-center gap-2 text-[11px] font-mono text-slate-500 mt-1">
                        <span>${doc.pageCount} ${isSlide ? 'slides' : 'pages'}</span>
                        <span>·</span>
                        <span>${doc.chunks.length} chunks</span>
                        <span>·</span>
                        <span>${Math.round(doc.sizeBytes / 1024)} KB</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button data-preview-doc="${doc.id}" class="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04] transition-colors" title="Inspect Chunks">
                      ${icon('eye', 'w-4 h-4')}
                    </button>
                    <button data-delete-doc="${doc.id}" class="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-white/[0.04] transition-colors" title="Remove Document">
                      ${icon('trash', 'w-4 h-4')}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Document Chunks Preview Drawer / Inspector -->
      ${activePreviewDoc ? `
        <div class="glass-panel rounded-xl border border-violet-500/30 p-5 space-y-4 animate-fade-in">
          <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              <h3 class="text-xs font-mono font-semibold text-slate-200">Extracted Chunks: ${activePreviewDoc.title}</h3>
            </div>
            <button id="btn-close-preview" class="text-xs font-mono text-slate-400 hover:text-slate-200">
              Close ✕
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
            ${activePreviewDoc.chunks.map(chunk => `
              <div class="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono font-semibold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
                    ${chunk.type === 'slide' ? `Slide ${chunk.pageOrSlideNumber}` : `Page ${chunk.pageOrSlideNumber}`}
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono">ID: ${chunk.id}</span>
                </div>
                <h5 class="text-xs font-semibold text-slate-200">${chunk.title || 'Untitled Section'}</h5>
                <p class="text-xs text-slate-400 leading-relaxed font-sans">${chunk.content}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Event Wire-up
    container.querySelector('#btn-trigger-upload')?.addEventListener('click', () => {
      (container.querySelector('#file-upload-input') as HTMLInputElement)?.click();
    });

    container.querySelector('#file-upload-input')?.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const title = file.name;
        const ext = title.split('.').pop()?.toLowerCase() || 'txt';
        const type = ext === 'pdf' ? 'pdf' : ext === 'pptx' || ext === 'ppt' ? 'pptx' : 'txt';

        const newDoc: DocumentItem = {
          id: 'doc_' + Date.now(),
          title,
          type: type as any,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          pageCount: 3,
          summary: `Uploaded ${type.toUpperCase()} file processed with ${type === 'pptx' ? 'slide' : 'page'} boundaries.`,
          chunks: [
            {
              id: 'chk_' + Date.now() + '_1',
              documentId: 'doc_' + Date.now(),
              pageOrSlideNumber: 1,
              type: (type === 'pptx' ? 'slide' : 'page') as any,
              title: `${type === 'pptx' ? 'Slide' : 'Page'} 1: Introduction`,
              content: `Key concepts extracted from ${title}. Ready for grounding in AI Tutor answers.`,
            },
            {
              id: 'chk_' + Date.now() + '_2',
              documentId: 'doc_' + Date.now(),
              pageOrSlideNumber: 2,
              type: (type === 'pptx' ? 'slide' : 'page') as any,
              title: `${type === 'pptx' ? 'Slide' : 'Page'} 2: Theoretical Models`,
              content: `Formulas, architectures, and system design specifications parsed from ${title}.`,
            },
          ],
        };

        store.addDocument(newDoc);
        renderContent();
      }
    });

    container.querySelector('#btn-paste-notes')?.addEventListener('click', () => {
      const title = prompt('Enter a title for your Study Notes:', 'Algorithm Complexity Notes.txt');
      if (title) {
        const content = prompt('Enter your notes content:', 'Binary Search runs in O(log n) time. Merge Sort runs in O(n log n). Quick Sort average O(n log n), worst case O(n^2).');
        if (content) {
          store.addDocument({
            id: 'doc_' + Date.now(),
            title,
            type: 'notes',
            sizeBytes: content.length * 4,
            uploadedAt: new Date().toISOString(),
            pageCount: 1,
            summary: 'Personal notes on algorithmic complexity.',
            chunks: [
              {
                id: 'chk_' + Date.now() + '_1',
                documentId: 'doc_' + Date.now(),
                pageOrSlideNumber: 1,
                type: 'section',
                title: 'Section 1: Notes Summary',
                content,
              },
            ],
          });
          renderContent();
        }
      }
    });

    container.querySelector('#doc-btn-ask-tutor')?.addEventListener('click', () => {
      store.setRoute('video');
    });

    container.querySelectorAll('[data-doc-check]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const docId = (e.currentTarget as HTMLElement).getAttribute('data-doc-check');
        if (docId) store.toggleDocumentSelection(docId);
      });
    });

    container.querySelectorAll('[data-delete-doc]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docId = (e.currentTarget as HTMLElement).getAttribute('data-delete-doc');
        if (docId && confirm('Remove this document from course library?')) {
          store.deleteDocument(docId);
          renderContent();
        }
      });
    });

    container.querySelectorAll('[data-preview-doc]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docId = (e.currentTarget as HTMLElement).getAttribute('data-preview-doc');
        if (docId) {
          activePreviewDoc = store.documents.find(d => d.id === docId) || null;
          renderContent();
        }
      });
    });

    container.querySelector('#btn-close-preview')?.addEventListener('click', () => {
      activePreviewDoc = null;
      renderContent();
    });
  };

  renderContent();
  return container;
}
