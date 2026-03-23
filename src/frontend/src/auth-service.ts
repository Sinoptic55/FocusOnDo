/**
 * AuthService for handling Login/Register/Logout flows
 */

import { api } from './api';
import { authStore } from './auth-store';
import { router } from './router';
import { toastManager } from './components/toast';
import type { LoginRequest, RegisterRequest } from './models';

export class AuthService {
  private static instance: AuthService;

  private constructor() {
    // Register global error interceptor for 401 Unauthorized
    api.addErrorInterceptor((error) => {
      if (error.status === 401) {
        this.handleUnauthorized();
      }
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(data: LoginRequest): Promise<void> {
    try {
      await api.login(data);
      // After login, we need to get user info. 
      // Assuming GET /api/settings or some other endpoint returns current user info.
      // For now, let's fetch settings which contains user_id and settings.
      const settings = await api.getSettings();
      
      // In a real app, we'd have a /api/auth/me endpoint.
      // For this project, we'll construct a minimal user from settings if needed,
      // or just set authenticated to true.
      authStore.setAuth(true, { 
        id: settings.user_id, 
        username: data.username, 
        email: '', 
        created_at: new Date().toISOString() 
      });
      
      toastManager.success('Вход выполнен успешно');
      router.navigate('/');
    } catch (error: any) {
      toastManager.error(`Ошибка входа: ${error.message}`);
      throw error;
    }
  }

  public async register(data: RegisterRequest): Promise<void> {
    try {
      const user = await api.register(data);
      // Auto-login after registration
      await this.login({ username: data.username, password: data.password });
    } catch (error: any) {
      toastManager.error(`Ошибка регистрации: ${error.message}`);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await api.logout();
      this.handleUnauthorized();
      toastManager.info('Вы вышли из системы');
    } catch (error: any) {
      this.handleUnauthorized();
    }
  }

  private handleUnauthorized(): void {
    authStore.clear();
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      router.navigate('/login');
    }
  }

  /**
   * Try to recover session on app init
   */
  public async recoverSession(): Promise<void> {
    if (authStore.isAuthenticated()) {
      try {
        // Verify token/session by calling a protected endpoint
        const settings = await api.getSettings();
        
        // Sync theme from server
        const theme = settings?.settings_json?.theme;
        if (theme) {
          localStorage.setItem('app-theme', theme);
          document.body.className = '';
          if (theme !== 'auto') {
            document.body.classList.add(`theme-${theme}`);
          }
        }
      } catch (error) {
        // If it fails, session is likely expired
        this.handleUnauthorized();
      }
    }
  }
}

export const authService = AuthService.getInstance();
