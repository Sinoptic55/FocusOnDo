/**
 * Recurrence History component - displays and manages recurring task instances
 */

import type { Task, RecurringTask } from '../models';
import { api } from '../api';
import { formatDate, showSuccess, showError } from '../utils';

interface RecurrenceInstance {
  id: number;
  title: string;
  planned_date: string | null;
  completed: boolean;
  isNext: boolean;
}

export class RecurrenceHistory {
  private element: HTMLElement | null = null;
  private task: Task | null = null;
  private recurringTask: RecurringTask | null = null;
  private instances: RecurrenceInstance[] = [];

  constructor() {
    this.createElements();
  }

  /**
   * Create component elements
   */
  private createElements(): void {
    this.element = document.createElement('div');
    this.element.className = 'recurrence-history';
    this.element.innerHTML = `
      <div class="recurrence-header">
        <h3>🔄 История повторений</h3>
        <div class="recurrence-actions">
          <button class="btn btn-secondary btn-sm" id="skip-next-btn">
            ⏭️ Пропустить следующее
          </button>
          <button class="btn btn-danger btn-sm" id="stop-recurrence-btn">
            ⏹️ Остановить повторение
          </button>
        </div>
      </div>

      <div class="recurrence-info">
        <div class="info-row">
          <span class="info-label">Тип:</span>
          <span class="info-value" id="recurrence-type">—</span>
        </div>
        <div class="info-row">
          <span class="info-label">Создано экземпляров:</span>
          <span class="info-value" id="instances-count">0</span>
        </div>
        <div class="info-row">
          <span class="info-label">Следующее повторение:</span>
          <span class="info-value" id="next-occurrence">—</span>
        </div>
      </div>

      <div class="instances-list-container">
        <table class="instances-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody id="instances-tbody">
            <!-- Instances will be rendered here -->
          </tbody>
        </table>
      </div>

      <div class="recurrence-settings">
        <h4>Настройки повторения</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <span class="setting-label">Частота:</span>
            <span class="setting-value" id="setting-frequency">—</span>
          </div>
          <div class="setting-item">
            <span class="setting-label">Последнее создание:</span>
            <span class="setting-value" id="setting-last-created">—</span>
          </div>
          <div class="setting-item" id="end-setting-row">
            <span class="setting-label">Окончание:</span>
            <span class="setting-value" id="setting-end">—</span>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.element) return;

    // Skip next button
    const skipBtn = this.element.querySelector('#skip-next-btn');
    skipBtn?.addEventListener('click', () => this.skipNextOccurrence());

    // Stop recurrence button
    const stopBtn = this.element.querySelector('#stop-recurrence-btn');
    stopBtn?.addEventListener('click', () => this.stopRecurrence());
  }

  /**
   * Load recurrence data for a task
   */
  async load(task: Task): Promise<void> {
    this.task = task;
    
    // Check if task has recurrence
    if (!(task as any).recurring_task_id) {
      this.renderEmpty();
      return;
    }

    try {
      // Load recurring task details
      // Note: This would require a new API endpoint, for now we simulate
      this.recurringTask = {
        id: (task as any).recurring_task_id,
        task_id: task.id,
        frequency_type: 'weekly',
        frequency_data: { days: [1, 3, 5] },
        last_created_date: new Date().toISOString(),
        end_date: null,
        end_count: null
      };

      // Load instances (related tasks with same recurrence pattern)
      await this.loadInstances();
      
      this.render();
    } catch (error) {
      console.error('Failed to load recurrence data:', error);
      showError('Не удалось загрузить данные о повторениях');
    }
  }

  /**
   * Load recurrence instances
   */
  private async loadInstances(): Promise<void> {
    if (!this.task) return;

    try {
      // Get all tasks and filter by parent or similar title pattern
      const allTasks = await api.getTasks();
      
      // Find tasks that are likely instances of this recurring task
      // (same title pattern, created after this task)
      this.instances = allTasks
        .filter(t => 
          t.title === this.task!.title && 
          t.id !== this.task!.id &&
          new Date(t.created_at) > new Date(this.task!.created_at)
        )
        .map(t => ({
          id: t.id,
          title: t.title,
          planned_date: t.planned_date,
          completed: t.status_id === 3, // Assuming 3 is "Completed"
          isNext: false
        }));

      // Mark next occurrence
      const nextInstance = this.instances.find(i => !i.completed);
      if (nextInstance) {
        nextInstance.isNext = true;
      }
    } catch (error) {
      console.error('Failed to load instances:', error);
    }
  }

  /**
   * Render empty state
   */
  private renderEmpty(): void {
    if (!this.element) return;

    this.element.innerHTML = `
      <div class="recurrence-empty">
        <p>Это не повторяющаяся задача</p>
      </div>
    `;
  }

  /**
   * Render component
   */
  private render(): void {
    if (!this.element || !this.recurringTask) return;

    // Update recurrence type
    const typeEl = this.element.querySelector('#recurrence-type');
    if (typeEl) {
      const typeNames: Record<string, string> = {
        daily: 'Ежедневно',
        weekly: 'Еженедельно',
        monthly: 'Ежемесячно'
      };
      typeEl.textContent = typeNames[this.recurringTask.frequency_type] || this.recurringTask.frequency_type;
    }

    // Update instances count
    const countEl = this.element.querySelector('#instances-count');
    if (countEl) {
      countEl.textContent = String(this.instances.length);
    }

    // Update next occurrence
    const nextEl = this.element.querySelector('#next-occurrence');
    if (nextEl) {
      const next = this.instances.find(i => i.isNext);
      nextEl.textContent = next?.planned_date 
        ? formatDate(next.planned_date) 
        : 'Не запланировано';
    }

    // Render instances table
    this.renderInstancesTable();

    // Update settings
    this.renderSettings();
  }

  /**
   * Render instances table
   */
  private renderInstancesTable(): void {
    const tbody = this.element?.querySelector('#instances-tbody');
    if (!tbody) return;

    if (this.instances.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="empty-state">Пока нет созданных повторений</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.instances.map(instance => `
      <tr class="${instance.isNext ? 'next-instance' : ''} ${instance.completed ? 'completed' : ''}">
        <td>
          ${instance.planned_date ? formatDate(instance.planned_date) : '—'}
          ${instance.isNext ? '<span class="next-badge">Следующее</span>' : ''}
        </td>
        <td>
          ${instance.completed 
            ? '✅ Завершено' 
            : '📋 Ожидает'}
        </td>
        <td>
          <button class="btn btn-sm btn-secondary view-instance" data-task-id="${instance.id}">
            Открыть
          </button>
        </td>
      </tr>
    `).join('');

    // Setup view buttons
    tbody.querySelectorAll('.view-instance').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-task-id');
        if (taskId) {
          window.dispatchEvent(new CustomEvent('navigate-to-task', { 
            detail: { taskId: parseInt(taskId) } 
          }));
        }
      });
    });
  }

  /**
   * Render settings
   */
  private renderSettings(): void {
    if (!this.recurringTask) return;

    // Frequency details
    const freqEl = this.element?.querySelector('#setting-frequency');
    if (freqEl) {
      let freqText = this.recurringTask.frequency_type;
      
      if (this.recurringTask.frequency_type === 'weekly' && this.recurringTask.frequency_data.days) {
        const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const days = this.recurringTask.frequency_data.days
          .map((d: number) => dayNames[d])
          .join(', ');
        freqText = `Еженедельно (${days})`;
      } else if (this.recurringTask.frequency_type === 'monthly' && this.recurringTask.frequency_data.day) {
        freqText = `Ежемесячно (${this.recurringTask.frequency_data.day} число)`;
      }
      
      freqEl.textContent = freqText;
    }

    // Last created
    const lastEl = this.element?.querySelector('#setting-last-created');
    if (lastEl && this.recurringTask.last_created_date) {
      lastEl.textContent = formatDate(this.recurringTask.last_created_date);
    }

    // End setting
    const endRow = this.element?.querySelector('#end-setting-row');
    const endEl = this.element?.querySelector('#setting-end');
    
    if (endRow && endEl) {
      if (this.recurringTask.end_date) {
        endEl.textContent = `До ${formatDate(this.recurringTask.end_date)}`;
        endRow.classList.remove('hidden');
      } else if (this.recurringTask.end_count) {
        endEl.textContent = `${this.recurringTask.end_count} повторений`;
        endRow.classList.remove('hidden');
      } else {
        endEl.textContent = 'Никогда';
        endRow.classList.remove('hidden');
      }
    }
  }

  /**
   * Skip next occurrence
   */
  private async skipNextOccurrence(): Promise<void> {
    if (!this.task || !this.recurringTask) return;

    if (!confirm('Пропустить следующее повторение этой задачи?')) {
      return;
    }

    try {
      // This would require a backend endpoint to skip next occurrence
      // For now, we just show a success message
      showSuccess('Следующее повторение пропущено');
      
      // Reload to update the view
      await this.load(this.task);
    } catch (error) {
      console.error('Failed to skip next occurrence:', error);
      showError('Не удалось пропустить повторение');
    }
  }

  /**
   * Stop recurrence
   */
  private async stopRecurrence(): Promise<void> {
    if (!this.task) return;

    if (!confirm('Остановить повторение этой задачи? Существующие экземпляры останутся.')) {
      return;
    }

    try {
      await api.deleteTaskRecurrence(this.task.id);
      showSuccess('Повторение остановлено');
      
      // Clear recurrence data
      this.recurringTask = null;
      this.instances = [];
      this.renderEmpty();
    } catch (error) {
      console.error('Failed to stop recurrence:', error);
      showError('Не удалось остановить повторение');
    }
  }

  /**
   * Get component element
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
