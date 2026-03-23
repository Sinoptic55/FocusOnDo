/**
 * Main application entry point
 */

import { router } from './router';
import { authStore } from './auth-store';
import { authService } from './auth-service';
import { Layout } from './components/layout';
import { LoginView } from './views/login-view';
import { RegisterView } from './views/register-view';
import { toastManager } from './components/toast';

import { TasksView } from './views/tasks-view';
import { SettingsView } from './views/settings-view';
import { AnalyticsView } from './views/analytics-view';

class App {
  private layout: Layout;
  private currentView: any = null;

  constructor() {
    this.layout = new Layout();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const authGuard = () => {
      if (!authStore.isAuthenticated()) {
        return '/login';
      }
      return true;
    };

    const guestGuard = () => {
      if (authStore.isAuthenticated()) {
        return '/';
      }
      return true;
    };

    router.on('/', async () => {
      this.showLayout(true);
      this.layout.setActiveNavItem('/');
      this.renderView(new TasksView());
    }, authGuard);

    router.on('/analytics', async () => {
      this.showLayout(true);
      this.layout.setActiveNavItem('/analytics');
      this.renderView(new AnalyticsView());
    }, authGuard);

    router.on('/settings', async () => {
      this.showLayout(true);
      this.layout.setActiveNavItem('/settings');
      this.renderView(new SettingsView());
    }, authGuard);

    router.on('/login', async () => {
      this.showLayout(false);
      this.renderView(new LoginView());
    }, guestGuard);

    router.on('/register', async () => {
      this.showLayout(false);
      this.renderView(new RegisterView());
    }, guestGuard);
  }

  private showLayout(show: boolean): void {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    if (show) {
      if (!document.body.contains(this.layout.getElement())) {
        appEl.innerHTML = '';
        this.layout.mount(appEl);
      }
      this.layout.showAuth(true);
    } else {
      if (!document.body.contains(this.layout.getElement())) {
        appEl.innerHTML = '';
        this.layout.mount(appEl);
      }
      this.layout.showAuth(false);
    }
  }

  private renderView(view: any): void {
    if (this.currentView && this.currentView.unmount) {
      this.currentView.unmount();
    }
    this.currentView = view;
    
    const container = authStore.isAuthenticated() 
      ? this.layout.getViewContainer() 
      : this.layout.getElement(); // For login/register, render in layout root or specialized container
    
    // If guest view, we might want to clear layout or render in a different way.
    // In our Layout.showAuth(false), header/sidebar/footer are hidden.
    // The view should be mounted in the layout element but not in view-container if we want full screen.
    if (!authStore.isAuthenticated()) {
      // Clear view container just in case
      this.layout.getViewContainer().innerHTML = '';
      view.mount(this.layout.getElement());
    } else {
      view.mount(container);
    }
  }

  public async start(): Promise<void> {
    console.log('Starting Pomodoro TMS...');
    
    // Apply theme from local storage immediately to prevent FOUC
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && savedTheme !== 'auto') {
      document.body.classList.add(`theme-${savedTheme}`);
    }
    
    // 14.5 Session recovery
    await authService.recoverSession();
    
    // Initialize timer intervals
    import('./components/timer').then(({ timerManager }) => {
      timerManager.init();
    });
    
    // Subscribe to auth changes to update UI
    authStore.subscribe((isAuthenticated, user) => {
      if (user) {
        this.layout.updateUserInfo(user.username);
      }
    });

    // 14.7 Logout logic
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'logout-btn') {
        authService.logout();
      }
    });

    // Global keyboard shortcuts (Task 24.8)
    document.addEventListener('keydown', async (e) => {
      if (!authStore.isAuthenticated()) return;
      
      try {
        const settings = await import('./api').then(m => m.api.getSettings());
        const hotkey = settings?.settings_json?.hotkey || 'Ctrl+Shift+N';
        
        const keys = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.shiftKey) keys.push('Shift');
        if (e.altKey) keys.push('Alt');
        if (e.metaKey) keys.push('Meta');
        if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
          keys.push(e.key.toUpperCase());
        }
        
        if (keys.join('+') === hotkey) {
          e.preventDefault();
          import('./components/task-form').then(({ TaskForm }) => {
            const form = new TaskForm({
              onSave: () => {
                const refreshEvent = new CustomEvent('pomodoro-tms:refresh-view');
                window.dispatchEvent(refreshEvent);
              }
            });
            form.open();
          });
        }
      } catch (err) {
        // Ignore settings load error on keydown
      }
    });

    // Handle view refresh event
    window.addEventListener('pomodoro-tms:refresh-view', () => {
      if (this.currentView && this.currentView.loadData) {
        this.currentView.loadData();
      }
    });

    router.start();
    console.log('Pomodoro TMS started');
  }
}

const app = new App();
app.start();
