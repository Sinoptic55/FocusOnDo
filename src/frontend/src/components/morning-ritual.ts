/**
 * Morning Ritual component - daily planning screen
 */

import { Dialog } from './dialog';
import type { Task, AppSettingsData } from '../models';
import { api } from '../api';
import { escapeHtml, showSuccess, showError } from '../utils';

interface MorningRitualState {
  overdue: Task[];
  today: Task[];
  inbox: Task[];
  settings: AppSettingsData | null;
  loading: boolean;
}

export class MorningRitual extends Dialog<MorningRitualState> {
  constructor() {
    super('morning-ritual-dialog', {}, {
      overdue: [],
      today: [],
      inbox: [],
      settings: null,
      loading: true
    });
  }

  protected async onOpen(): Promise<void> {
    this.setState({ loading: true });
    try {
      const [tasks, settingsRes] = await Promise.all([
        api.getTasks(),
        api.getSettings()
      ]);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const overdue: Task[] = [];
      const today: Task[] = [];
      const inbox: Task[] = [];

      tasks.forEach(t => {
        // Exclude done/completed tasks - assuming status_id indicates progress, but for strictness:
        // For now, if no status, it's considered open. Or we can filter by your logic.
        if (t.status_id) return; // Simplified assumption: completed tasks have a specific status, but let's just group them

        if (t.deadline && new Date(t.deadline) < now) {
          overdue.push(t);
        } else if (t.planned_date && new Date(t.planned_date).getTime() <= now.getTime()) {
          today.push(t);
        } else if (!t.planned_date && !t.deadline) {
          inbox.push(t);
        }
      });

      this.setState({
        overdue,
        today,
        inbox,
        settings: settingsRes.settings_json,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load morning ritual data:', error);
      showError('Ошибка загрузки данных утреннего ритуала');
      this.close();
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = `
        <div class="dialog-header"><h2>Утренний ритуал</h2><button class="dialog-close">&times;</button></div>
        <div class="dialog-body"><div class="loader">Сбор данных...</div></div>
      `;
      this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());
      return;
    }

    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>🌅 Утренний ритуал</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body morning-ritual-body">
        
        <div class="ritual-columns">
          <!-- Overdue & Inbox -->
          <div class="ritual-column">
            
            <div class="ritual-section">
              <h3>Просрочено <span class="badge badge-danger">\${this.state.overdue.length}</span></h3>
              <div class="ritual-task-list" data-zone="overdue">
                \${this.state.overdue.map(t => this.renderTaskItem(t)).join('')}
                \${this.state.overdue.length === 0 ? '<p class="empty-msg">Нет просроченных задач</p>' : ''}
              </div>
            </div>

            <div class="ritual-section">
              <h3>Inbox <span class="badge">\${this.state.inbox.length}</span></h3>
              <div class="ritual-task-list" data-zone="inbox">
                \${this.state.inbox.map(t => this.renderTaskItem(t)).join('')}
                \${this.state.inbox.length === 0 ? '<p class="empty-msg">Inbox пуст</p>' : ''}
              </div>
            </div>

          </div>

          <!-- Today -->
          <div class="ritual-column highlight-column">
            <div class="ritual-section">
              <h3>Сделать сегодня <span class="badge badge-primary">\${this.state.today.length}</span></h3>
              <p class="text-muted text-sm">Перетащите сюда задачи из Inbox или Просроченных</p>
              <div class="ritual-task-list drop-zone-today" data-zone="today">
                \${this.state.today.map(t => this.renderTaskItem(t)).join('')}
                \${this.state.today.length === 0 ? '<p class="empty-msg">План на сегодня пока пуст</p>' : ''}
              </div>
            </div>
          </div>
        </div>

      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Пропустить</button>
        <button class="btn btn-primary start-day-btn">Начать день</button>
      </div>
    `;

    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  private renderTaskItem(task: Task): string {
    return `
      <div class="ritual-task-item" draggable="true" data-id="\${task.id}">
        <span class="drag-handle">☰</span>
        <div class="task-info">
          <span class="task-title">\${escapeHtml(task.title)}</span>
          \${task.pomodoro_estimate ? \`<span class="task-est">🍅 \${task.pomodoro_estimate}</span>\` : ''}
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const closeHandler = () => this.close();
    this.element.querySelector('.dialog-close')?.addEventListener('click', closeHandler);
    this.element.querySelector('.cancel-btn')?.addEventListener('click', closeHandler);

    this.element.querySelector('.start-day-btn')?.addEventListener('click', async () => {
      try {
        const btn = this.element.querySelector('.start-day-btn') as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        // Update settings last_ritual_date
        const newSettings = { ...this.state.settings };
        newSettings.last_ritual_date = new Date().toISOString();
        await api.updateSettings(newSettings);

        showSuccess('Отличного дня!');
        
        // Refresh the underlying view if possible
        const refreshEvent = new CustomEvent('pomodoro-tms:refresh-view');
        window.dispatchEvent(refreshEvent);

        this.close();
      } catch (error) {
        showError('Не удалось сохранить настройки ритуала');
      }
    });
  }

  private setupDragAndDrop(): void {
    const lists = this.element.querySelectorAll('.ritual-task-list');
    
    lists.forEach(list => {
      list.addEventListener('dragover', (e: any) => {
        e.preventDefault();
        list.classList.add('drag-over');
      });

      list.addEventListener('dragleave', () => {
        list.classList.remove('drag-over');
      });

      list.addEventListener('drop', async (e: any) => {
        e.preventDefault();
        list.classList.remove('drag-over');
        
        const taskIdStr = e.dataTransfer?.getData('text/plain');
        if (!taskIdStr) return;
        const taskId = parseInt(taskIdStr, 10);
        
        const zone = (list as HTMLElement).dataset.zone;
        if (zone === 'today') {
          // Move task to today
          try {
            const todayStr = new Date().toISOString();
            await api.updateTask(taskId, { planned_date: todayStr });
            // Reload internal state
            this.onOpen();
          } catch (error) {
            showError('Не удалось обновить задачу');
          }
        }
      });
    });

    this.element.querySelectorAll('.ritual-task-item').forEach(item => {
      item.addEventListener('dragstart', (e: any) => {
        e.dataTransfer.setData('text/plain', (item as HTMLElement).dataset.id);
        setTimeout(() => item.classList.add('dragging'), 0);
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });
    });
  }
}
