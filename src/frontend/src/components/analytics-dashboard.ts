/**
 * Analytics Dashboard component - summary metrics
 */

import type { DashboardStats } from '../models';
import { api } from '../api';
import { formatTime, showSuccess, showError } from '../utils';

export class AnalyticsDashboard {
  private element: HTMLElement | null = null;
  private data: DashboardStats | null = null;

  constructor() {
    this.createElements();
  }

  /**
   * Create dialog elements
   */
  private createElements(): void {
    this.element = document.createElement('div');
    this.element.className = 'analytics-dashboard';
    this.element.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card today">
          <h3>Сегодня</h3>
          <div class="stat-value" id="today-tasks">0</div>
          <div class="stat-label">задач</div>
        </div>
        <div class="stat-card week">
          <h3>Эта неделя</h3>
          <div class="stat-value" id="week-tasks">0</div>
          <div class="stat-label">задач</div>
        </div>
        <div class="stat-card total">
          <h3>Всего</h3>
          <div class="stat-value" id="total-tasks">0</div>
          <div class="stat-label">задач</div>
        </div>
        <div class="stat-card time">
          <h3>Время</h3>
          <div class="stat-value" id="total-time">0ч 0м</div>
          <div class="stat-label">потрачено</div>
        </div>
      </div>
    `;
  }

  /**
   * Load data and render
   */
  async load(startDate?: string, endDate?: string): Promise<void> {
    try {
      this.data = await api.getAnalytics(startDate, endDate);
      this.render();
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      showError('Не удалось загрузить статистику');
    }
  }

  /**
   * Render data
   */
  private render(): void {
    if (!this.element || !this.data) return;

    const todayTasks = this.element.querySelector('#today-tasks')!;
    const weekTasks = this.element.querySelector('#week-tasks')!;
    const totalTasks = this.element.querySelector('#total-tasks')!;
    const totalTime = this.element.querySelector('#total-time')!;

    todayTasks.textContent = this.data.today.tasks_completed.toString();
    weekTasks.textContent = this.data.week.tasks_completed.toString();
    totalTasks.textContent = this.data.total.tasks_completed.toString();
    totalTime.textContent = this.formatTime(this.data.total.total_time_seconds);
  }

  /**
   * Format time
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes.toString().padStart(2, '0')}м`;
    }
    return `${minutes}м`;
  }

  /**
   * Get element
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Global instance
export const analyticsDashboard = new AnalyticsDashboard();
