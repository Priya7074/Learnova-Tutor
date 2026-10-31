import * as xb from 'xrblocks';
import { store, AppRoute } from './services/store.js';
import { renderNavbar } from './components/Navbar.js';
import { renderLandingPage } from './views/LandingPage.js';
import { renderDashboard } from './views/DashboardView.js';
import { renderVideoWorkspace } from './views/VideoWorkspaceView.js';
import { renderDocumentManager } from './views/DocumentManagerView.js';
import { renderCodingPractice } from './views/CodingPracticeView.js';
import { renderQuizView } from './views/QuizView.js';
import { renderInterviewView } from './views/InterviewView.js';
import { renderAnalyticsView } from './views/AnalyticsView.js';
import { renderSpatialClassroomView } from './views/SpatialClassroomView.js';
import { SpatialClassroomScene } from './spatial/SpatialClassroom.js';

let isXrInitialized = false;

function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  // Clear root
  root.innerHTML = '';

  // 1. Render Top Navigation Bar
  const navbar = renderNavbar();
  root.appendChild(navbar);

  // 2. Main View Container
  const main = document.createElement('main');
  main.className = 'w-full min-h-[calc(100vh-64px)] transition-opacity duration-200';

  const route: AppRoute = store.currentRoute;

  switch (route) {
    case 'landing':
      main.appendChild(renderLandingPage());
      break;
    case 'dashboard':
      main.appendChild(renderDashboard());
      break;
    case 'video':
      main.appendChild(renderVideoWorkspace());
      break;
    case 'documents':
      main.appendChild(renderDocumentManager());
      break;
    case 'coding':
      main.appendChild(renderCodingPractice());
      break;
    case 'quiz':
      main.appendChild(renderQuizView());
      break;
    case 'interview':
      main.appendChild(renderInterviewView());
      break;
    case 'analytics':
      main.appendChild(renderAnalyticsView());
      break;
    case 'spatial':
      main.appendChild(renderSpatialClassroomView());
      // Initialize XR Blocks scene in spatial mode
      if (!isXrInitialized) {
        try {
          isXrInitialized = true;
          xb.add(new SpatialClassroomScene());
          xb.init(new xb.Options());
        } catch (e) {
          console.warn('XR Blocks initialization notice:', e);
        }
      }
      break;
    default:
      main.appendChild(renderDashboard());
      break;
  }

  root.appendChild(main);
}

// Subscribe to store updates
store.subscribe(() => {
  renderApp();
});

// Initial boot
document.addEventListener('DOMContentLoaded', async () => {
  renderApp();

  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      if (data?.database) {
        store.setDatabaseStatus(data.database.engine, Boolean(data.database.connected));
      }
    }
  } catch (e) {
    // Offline / static preview fallback
  }
});
