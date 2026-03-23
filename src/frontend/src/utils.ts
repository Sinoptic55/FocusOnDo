/**
 * Utility functions for Pomodoro TMS
 */

import type { ApiResponse } from './models';

import { toastManager, ToastType } from './components/toast';

/**
 * Show a toast notification
 */
export function showToast(type: ToastType, message: string, duration: number = 3000): void {
  toastManager.show(type, message, duration);
}

/**
 * Remove toast by ID
 */
export function removeToast(id: string): void {
  toastManager.remove(id);
}

/**
 * Show success toast
 */
export function showSuccess(message: string): void {
  toastManager.success(message);
}

/**
 * Show error toast
 */
export function showError(message: string): void {
  toastManager.error(message);
}

/**
 * Show warning toast
 */
export function showWarning(message: string): void {
  toastManager.warning(message);
}

/**
 * Show info toast
 */
export function showInfo(message: string): void {
  toastManager.info(message);
}

/**
 * Handle API error
 */
export function handleApiError(error: unknown): void {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    showError(error.message);
  } else {
    showError('Произошла ошибка. Попробуйте снова.');
  }
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to localized string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format datetime to localized string
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: string | Date | null): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Local storage helpers
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
  
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
};

/**
 * URL helpers
 */
export function getCurrentView(): string {
  const hash = window.location.hash.slice(1);
  return hash || 'tasks';
}

export function setView(view: string): void {
  window.location.hash = view;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return storage.get('authenticated', false);
}

/**
 * Set authentication state
 */
export function setAuthenticated(authenticated: boolean): void {
  storage.set('authenticated', authenticated);
}
