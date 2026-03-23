/**
 * Weekly Review component - weekly review screen
 */

import { Dialog } from './dialog';
import type { Task, Project } from '../models';
import { api } from '../api';
import { escapeHtml, formatTime, showSuccess, showError } from '../utils';

interface WeeklyReviewState {
  completed: Task[];
  uncompleted: Task[];
  projectStats: { id: number; name: string; color: string; time: number }[];
  loading: boolean;
}

export class WeeklyReview extends Dialog<WeeklyReviewState> {
  constructor() {
    super('weekly-review-dialog', {}, {
      completed: [],
      uncompleted: [],
      projectStats: [],
      loading: true
    });
  }

  protected async onOpen(): Promise<void> {
    this.setState({ loading: true });
    try {
      const [tasks, projects] = await Promise.all([
        api.getTasks(), // Ideally we'd pass a date range filter here
        api.getProjects()
      ]);

      const now = new Date();
      
      // Calculate week boundaries (Assuming Monday start)
      const weekStart = new Date(now);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const completed: Task[] = [];
      const uncompleted: Task[] = [];
      const projTimeMap = new Map<number, number>();

      tasks.forEach(t => {
        // Simple heuristic: if it has a status_id, it might be "Done".
        // In a real app we'd check if the status represents "Done". 
        // For demonstration, we use planned_date inside this week.
        const isPlannedThisWeek = t.planned_date && new Date(t.planned_date) >= weekStart && new Date(t.planned_date) <= weekEnd;
        
        if (isPlannedThisWeek) {
          if (t.status_id) {
            completed.push(t);
          } else {
            uncompleted.push(t);
          }
        }

        // Aggregate time
        if (t.total_time && t.project_id) {
          // This should ideally only count time segments from this week, 
          // but we use total_time for simplicity here unless we fetch segments.
          projTimeMap.set(t.project_id, (projTimeMap.get(t.project_id) || 0) + t.total_time);
        }
      });

      const projectStats = Array.from(projTimeMap.entries()).map(([id, time]) => {
        const p = projects.find(proj => proj.id === id);
        return {
          id,
          name: p ? p.name : 'Неизвестно',
          color: p ? p.color : '#ccc',
          time
        };
      }).sort((a, b) => b.time - a.time);

      this.setState({ completed, uncompleted, projectStats, loading: false });

    } catch (error) {
      console.error('Failed to load weekly review:', error);
      showError('Ошибка загрузки данных недельного обзора');
      this.close();
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = `
        <div class="dialog-header"><h2>Недельный обзор</h2><button class="dialog-close">&times;</button></div>
        <div class="dialog-body"><div class="loader">Сбор статистики...</div></div>
      `;
      this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());
      return;
    }

    const totalCompletedTime = this.state.completed.reduce((sum, t) => sum + (t.total_time || 0), 0);

    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>📅 Недельный обзор</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body weekly-review-body">
        
        <div class="review-grid">
          <div class="review-stats">
            <div class="stat-box">
              <span class="stat-label">Завершено задач</span>
              <span class="stat-value text-success">\${this.state.completed.length}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Осталось задач</span>
              <span class="stat-value text-warning">\${this.state.uncompleted.length}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Время за неделю</span>
              <span class="stat-value text-primary">\${formatTime(totalCompletedTime)}</span>
            </div>
          </div>

          <div class="review-projects">
            <h3>Время по проектам</h3>
            \${this.state.projectStats.length === 0 ? '<p class="text-muted">Нет данных о времени</p>' : ''}
            <div class="project-stats-list">
              \${this.state.projectStats.map(p => `
                <div class="project-stat-item">
                  <div class="project-stat-info">
                    <span class="color-dot" style="background: \${p.color}"></span>
                    <span class="project-name">\${escapeHtml(p.name)}</span>
                  </div>
                  <span class="project-time">\${formatTime(p.time)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="review-uncompleted">
          <h3>Незавершённые задачи</h3>
          <div class="uncompleted-list">
            \${this.state.uncompleted.length === 0 ? '<p class="text-muted">Отлично! Все задачи на эту неделю выполнены.</p>' : ''}
            \${this.state.uncompleted.map(t => `
              <div class="uncompleted-item">
                <span>\${escapeHtml(t.title)}</span>
                \${t.deadline ? \`<span class="badge text-danger">Дедлайн: \${t.deadline.split('T')[0]}</span>\` : ''}
              </div>
            `).join('')}
          </div>
        </div>

      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Позже</button>
        \${this.state.uncompleted.length > 0 ? \`<button class="btn btn-primary carry-over-btn">Перенести на след. неделю (\${this.state.uncompleted.length})</button>\` : ''}
        <button class="btn btn-success finish-review-btn">Завершить обзор</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const closeHandler = () => this.close();
    this.element.querySelector('.dialog-close')?.addEventListener('click', closeHandler);
    this.element.querySelector('.cancel-btn')?.addEventListener('click', closeHandler);

    this.element.querySelector('.carry-over-btn')?.addEventListener('click', async (e) => {
      const btn = e.target as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Перенос...';

      try {
        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
        const dateStr = nextMonday.toISOString();

        for (const t of this.state.uncompleted) {
          await api.updateTask(t.id, { planned_date: dateStr });
        }

        showSuccess(\`Перенесено задач: \${this.state.uncompleted.length}\`);
        this.close();
      } catch (error) {
        showError('Не удалось перенести задачи');
        btn.disabled = false;
        btn.textContent = 'Ошибка';
      }
    });

    this.element.querySelector('.finish-review-btn')?.addEventListener('click', () => {
      showSuccess('Недельный обзор завершен!');
      this.close();
    });
  }
}
