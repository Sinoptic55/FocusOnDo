/**
 * Inbox Processing component - for processing incoming tasks
 */

import { Dialog } from './dialog';
import type { Task, TaskList, Project, TaskStatus } from '../models';
import { api } from '../api';
import { escapeHtml, showSuccess, showError } from '../utils';

interface InboxProcessingState {
  tasks: Task[];
  lists: TaskList[];
  projects: Project[];
  statuses: TaskStatus[];
  selectedTaskIds: Set<number>;
  loading: boolean;
}

export class InboxProcessing extends Dialog<InboxProcessingState> {
  constructor() {
    super('inbox-processing-dialog', {}, {
      tasks: [],
      lists: [],
      projects: [],
      statuses: [],
      selectedTaskIds: new Set(),
      loading: true
    });
  }

  protected async onOpen(): Promise<void> {
    this.setState({ loading: true, selectedTaskIds: new Set() });
    try {
      const [tasks, lists, projects, statuses] = await Promise.all([
        api.getTasks(),
        api.getLists(),
        api.getProjects(),
        api.getStatuses()
      ]);
      
      // Inbox tasks = no list, no project, no planned date, no status
      // We'll broaden it to just tasks that lack both a planned date and a status, as they are unprocessed.
      const inboxTasks = tasks.filter(t => !t.planned_date && !t.status_id);

      this.setState({
        tasks: inboxTasks,
        lists,
        projects,
        statuses,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load inbox data:', error);
      showError('Не удалось загрузить данные Inbox');
      this.close();
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = `
        <div class="dialog-header"><h2>Обработка Inbox</h2><button class="dialog-close">&times;</button></div>
        <div class="dialog-body"><div class="loader">Сбор данных...</div></div>
      `;
      this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());
      return;
    }

    const allSelected = this.state.tasks.length > 0 && this.state.selectedTaskIds.size === this.state.tasks.length;

    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>📥 Обработка Inbox (\${this.state.tasks.length})</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body inbox-processing-body">
        
        <div class="inbox-layout">
          <div class="inbox-tasks-list">
            \${this.state.tasks.length === 0 ? '<p class="empty-msg">Inbox пуст! Отличная работа.</p>' : `
              <div class="inbox-list-header">
                <label>
                  <input type="checkbox" id="select-all-inbox" \${allSelected ? 'checked' : ''}>
                  Выбрать все
                </label>
              </div>
              <div class="inbox-scroll-area">
                \${this.state.tasks.map(t => `
                  <label class="inbox-task-item \${this.state.selectedTaskIds.has(t.id) ? 'selected' : ''}">
                    <input type="checkbox" class="task-checkbox" value="\${t.id}" \${this.state.selectedTaskIds.has(t.id) ? 'checked' : ''}>
                    <div class="task-info">
                      <span class="task-title">\${escapeHtml(t.title)}</span>
                      \${t.description ? \`<span class="task-desc">\${escapeHtml(t.description.substring(0, 50))}...</span>\` : ''}
                    </div>
                  </label>
                `).join('')}
              </div>
            `}
          </div>

          <div class="inbox-actions">
            <h3>Действия для \${this.state.selectedTaskIds.size} задач</h3>
            
            <div class="form-group">
              <label>Переместить в проект:</label>
              <select id="action-project">
                <option value="">(Без изменений)</option>
                \${this.state.projects.map(p => \`<option value="\${p.id}">\${escapeHtml(p.name)}</option>\`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Добавить в список:</label>
              <select id="action-list">
                <option value="">(Без изменений)</option>
                \${this.state.lists.map(l => \`<option value="\${l.id}">\${escapeHtml(l.name)}</option>\`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Установить статус:</label>
              <select id="action-status">
                <option value="">(Без изменений)</option>
                \${this.state.statuses.map(s => \`<option value="\${s.id}">\${escapeHtml(s.name)}</option>\`).join('')}
              </select>
            </div>

            <div class="action-buttons">
              <button class="btn btn-primary btn-block" id="btn-apply-actions" \${this.state.selectedTaskIds.size === 0 ? 'disabled' : ''}>
                Применить
              </button>
              <button class="btn btn-danger btn-block" id="btn-delete-tasks" \${this.state.selectedTaskIds.size === 0 ? 'disabled' : ''}>
                Удалить выбранные
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());

    // Select all
    this.element.querySelector('#select-all-inbox')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      if (checked) {
        this.setState({ selectedTaskIds: new Set(this.state.tasks.map(t => t.id)) });
      } else {
        this.setState({ selectedTaskIds: new Set() });
      }
    });

    // Individual select
    this.element.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const id = parseInt(target.value);
        const newSet = new Set(this.state.selectedTaskIds);
        
        if (target.checked) newSet.add(id);
        else newSet.delete(id);

        this.setState({ selectedTaskIds: newSet });
      });
    });

    // Apply Actions
    this.element.querySelector('#btn-apply-actions')?.addEventListener('click', async () => {
      if (this.state.selectedTaskIds.size === 0) return;

      const projVal = (this.element.querySelector('#action-project') as HTMLSelectElement).value;
      const listVal = (this.element.querySelector('#action-list') as HTMLSelectElement).value;
      const statusVal = (this.element.querySelector('#action-status') as HTMLSelectElement).value;

      const updates: any = {};
      if (projVal) updates.project_id = parseInt(projVal);
      if (listVal) updates.list_id = parseInt(listVal);
      if (statusVal) updates.status_id = parseInt(statusVal);

      if (Object.keys(updates).length === 0) {
        showError('Выберите хотя бы одно действие');
        return;
      }

      const btn = this.element.querySelector('#btn-apply-actions') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Обработка...';

      try {
        for (const id of this.state.selectedTaskIds) {
          await api.updateTask(id, updates);
        }
        showSuccess(\`Обработано задач: \${this.state.selectedTaskIds.size}\`);
        
        // Refresh view
        const refreshEvent = new CustomEvent('pomodoro-tms:refresh-view');
        window.dispatchEvent(refreshEvent);

        this.close();
      } catch (error) {
        showError('Ошибка при обработке задач');
        btn.disabled = false;
        btn.textContent = 'Применить';
      }
    });

    // Delete tasks
    this.element.querySelector('#btn-delete-tasks')?.addEventListener('click', async () => {
      if (this.state.selectedTaskIds.size === 0) return;

      if (confirm(\`Удалить \${this.state.selectedTaskIds.size} задач навсегда?\`)) {
        try {
          for (const id of this.state.selectedTaskIds) {
            await api.deleteTask(id);
          }
          showSuccess('Задачи удалены');
          
          const refreshEvent = new CustomEvent('pomodoro-tms:refresh-view');
          window.dispatchEvent(refreshEvent);

          this.close();
        } catch (error) {
          showError('Ошибка при удалении задач');
        }
      }
    });
  }
}
