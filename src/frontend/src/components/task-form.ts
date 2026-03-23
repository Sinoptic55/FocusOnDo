/**
 * Task form component for creating/editing tasks
 */

import { Dialog } from './dialog';
import type { Task, TaskList, TaskStatus, Project, Client, TaskCreate, TaskUpdate, RecurringTask, RecurringTaskCreate } from '../models';
import { api } from '../api';
import { escapeHtml, showSuccess, showError } from '../utils';

interface TaskFormState {
  task: Task | null;
  lists: TaskList[];
  statuses: TaskStatus[];
  projects: Project[];
  clients: Client[];
  subtasks: Partial<Task>[];
  recurringTask: RecurringTask | null;
  loading: boolean;
  
  // Recurrence settings
  recurrenceEnabled: boolean;
  recurrenceType: 'daily' | 'weekly' | 'monthly';
  weeklyDays: number[];
  monthlyDay: number;
  endType: 'never' | 'date' | 'count';
  endDate: string;
  endCount: number;
}

interface TaskFormProps {
  taskId?: number;
  initialData?: Partial<TaskCreate>;
  onSave: (task: Task) => void;
}

export class TaskForm extends Dialog<TaskFormState, TaskFormProps> {
  constructor(props: TaskFormProps) {
    super('task-form-dialog', props, {
      task: null,
      lists: [],
      statuses: [],
      projects: [],
      clients: [],
      subtasks: [],
      recurringTask: null,
      loading: true,
      recurrenceEnabled: false,
      recurrenceType: 'daily',
      weeklyDays: [],
      monthlyDay: 1,
      endType: 'never',
      endDate: '',
      endCount: 10
    });
  }

  protected async onOpen(): Promise<void> {
    this.setState({ loading: true });
    try {
      const [lists, statuses, projects, clients] = await Promise.all([
        api.getLists(),
        api.getStatuses(),
        api.getProjects(),
        api.getClients()
      ]);

      let task: Task | null = null;
      let subtasks: Partial<Task>[] = [];
      let recurringTask: RecurringTask | null = null;
      let recState: Partial<TaskFormState> = {};

      if (this.props.taskId) {
        task = await api.getTask(this.props.taskId);
        // Assuming the API returns subtasks if populated, or we might need another call
        // For simplicity, let's assume it returns `subtasks` in the task object
        subtasks = task.subtasks || [];
        
        // Load recurrence if exists (Mocking for now, adjust based on actual API)
        // recurringTask = await api.getRecurringTask(this.props.taskId); 
      }

      this.setState({
        task,
        lists,
        statuses,
        projects,
        clients,
        subtasks,
        recurringTask,
        loading: false,
        ...recState
      });
    } catch (error) {
      showError('Не удалось загрузить данные для формы');
      this.close();
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = `
        <div class="dialog-header"><h2>Загрузка...</h2><button class="dialog-close">&times;</button></div>
        <div class="dialog-body"><div class="loader"></div></div>
      `;
      this.setupClose();
      return;
    }

    const t = this.state.task || this.props.initialData || {};
    const isEdit = !!this.state.task;

    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>${isEdit ? 'Редактирование задачи' : 'Новая задача'}</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body">
        <form id="task-form">
          <div class="form-section">
            <h3>Основное</h3>
            <div class="form-group">
              <label for="task-title">Название *</label>
              <input type="text" id="task-title" name="title" required maxlength="200" value="${escapeHtml(t.title || '')}">
            </div>
            <div class="form-group">
              <label for="task-description">Описание (Markdown поддерживается)</label>
              <textarea id="task-description" name="description" rows="3">${escapeHtml(t.description || '')}</textarea>
            </div>
            <div class="form-group">
              <label for="task-screenshot">Прикрепить скриншот</label>
              <input type="file" id="task-screenshot" name="screenshot" accept="image/*">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="task-planned-date">Планируемая дата</label>
                <input type="date" id="task-planned-date" name="planned_date" value="${t.planned_date ? t.planned_date.split('T')[0] : ''}">
              </div>
              <div class="form-group">
                <label for="task-deadline">Дедлайн</label>
                <input type="date" id="task-deadline" name="deadline" value="${t.deadline ? t.deadline.split('T')[0] : ''}">
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h3>Организация</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="task-list">Список</label>
                <select id="task-list" name="list_id">
                  <option value="">Без списка</option>
                  ${this.state.lists.map(l => `<option value="${l.id}" ${t.list_id === l.id ? 'selected' : ''}>${escapeHtml(l.name)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="task-status">Статус</label>
                <select id="task-status" name="status_id">
                  <option value="">Без статуса</option>
                  ${this.state.statuses.map(s => `<option value="${s.id}" ${t.status_id === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="task-project">Проект</label>
                <select id="task-project" name="project_id">
                  <option value="">Без проекта</option>
                  ${this.state.projects.map(p => `<option value="${p.id}" ${t.project_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="task-client">Клиент</label>
                <select id="task-client" name="client_id">
                  <option value="">Без клиента</option>
                  ${this.state.clients.map(c => `<option value="${c.id}" ${t.client_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h3>Помодоро</h3>
            <div class="form-group">
              <label for="task-pomodoro">Оценка (помодоро)</label>
              <input type="number" id="task-pomodoro" name="pomodoro_estimate" min="0" step="1" value="${t.pomodoro_estimate || ''}">
            </div>
          </div>
          
          <div class="form-section">
            <h3>Дополнительно</h3>
            <div class="form-group">
              <label for="task-first-action">Первое действие</label>
              <input type="text" id="task-first-action" name="first_action" maxlength="500" value="${escapeHtml(t.first_action || '')}">
            </div>
            <div class="form-group">
              <label for="task-external-link">Внешняя ссылка</label>
              <input type="url" id="task-external-link" name="external_link" maxlength="500" value="${escapeHtml(t.external_link || '')}">
            </div>
          </div>
          
          <div class="form-section">
            <h3>Шаги (подзадачи)</h3>
            <div id="subtasks-container" class="subtasks-container">
              ${this.state.subtasks.map((st, i) => `
                <div class="subtask-item">
                  <input type="text" class="subtask-input" data-index="${i}" value="${escapeHtml(st.title || '')}" placeholder="Название шага">
                  <button type="button" class="btn-icon text-danger remove-subtask" data-index="${i}">&times;</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-secondary btn-sm mt-sm" id="add-subtask-btn">
              + Добавить шаг
            </button>
          </div>

          <div class="form-section">
            <h3>🔄 Повторение</h3>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="enable-recurrence" ${this.state.recurrenceEnabled ? 'checked' : ''}>
                Повторяющаяся задача
              </label>
            </div>
            
            ${this.state.recurrenceEnabled ? `
            <div class="recurrence-options">
              <div class="form-group">
                <label>Тип повторения</label>
                <select id="recurrence-type">
                  <option value="daily" ${this.state.recurrenceType === 'daily' ? 'selected' : ''}>Ежедневно</option>
                  <option value="weekly" ${this.state.recurrenceType === 'weekly' ? 'selected' : ''}>Еженедельно</option>
                  <option value="monthly" ${this.state.recurrenceType === 'monthly' ? 'selected' : ''}>Ежемесячно</option>
                </select>
              </div>

              ${this.state.recurrenceType === 'weekly' ? `
              <div class="form-group">
                <label>Дни недели</label>
                <div class="checkbox-group inline">
                  ${[1, 2, 3, 4, 5, 6, 0].map(day => `
                    <label><input type="checkbox" class="weekly-day" value="${day}" ${this.state.weeklyDays.includes(day) ? 'checked' : ''}> ${['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][day]}</label>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              ${this.state.recurrenceType === 'monthly' ? `
              <div class="form-group">
                <label>Число месяца</label>
                <input type="number" id="monthly-day" min="1" max="31" value="${this.state.monthlyDay}">
              </div>
              ` : ''}

              <div class="form-group">
                <label>Окончание</label>
                <select id="recurrence-end-type">
                  <option value="never" ${this.state.endType === 'never' ? 'selected' : ''}>Никогда</option>
                  <option value="date" ${this.state.endType === 'date' ? 'selected' : ''}>По дате</option>
                  <option value="count" ${this.state.endType === 'count' ? 'selected' : ''}>По количеству</option>
                </select>
              </div>

              ${this.state.endType === 'date' ? `
              <div class="form-group">
                <label>Дата окончания</label>
                <input type="date" id="recurrence-end-date" value="${this.state.endDate}">
              </div>
              ` : ''}

              ${this.state.endType === 'count' ? `
              <div class="form-group">
                <label>Количество повторений</label>
                <input type="number" id="recurrence-end-count" min="1" value="${this.state.endCount}">
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>

        </form>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Отмена</button>
        <button class="btn btn-primary submit-btn">Сохранить</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupClose(): void {
    this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());
  }

  private setupEventListeners(): void {
    this.setupClose();
    this.element.querySelector('.cancel-btn')?.addEventListener('click', () => this.close());

    // Subtasks
    this.element.querySelector('#add-subtask-btn')?.addEventListener('click', () => {
      this.setState({ subtasks: [...this.state.subtasks, { title: '' }] });
    });

    this.element.querySelectorAll('.subtask-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const idx = parseInt(target.dataset.index || '0');
        const subtasks = [...this.state.subtasks];
        subtasks[idx].title = target.value;
        // Don't call setState to avoid losing focus, just mutate state. 
        // We will collect values on submit anyway.
        this.state.subtasks = subtasks;
      });
    });

    this.element.querySelectorAll('.remove-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const idx = parseInt(target.dataset.index || '0');
        const subtasks = [...this.state.subtasks];
        subtasks.splice(idx, 1);
        this.setState({ subtasks });
      });
    });

    // Recurrence toggle
    this.element.querySelector('#enable-recurrence')?.addEventListener('change', (e) => {
      this.setState({ recurrenceEnabled: (e.target as HTMLInputElement).checked });
    });
    
    this.element.querySelector('#recurrence-type')?.addEventListener('change', (e) => {
      this.setState({ recurrenceType: (e.target as HTMLSelectElement).value as any });
    });

    this.element.querySelectorAll('.weekly-day').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const day = parseInt(target.value);
        const days = new Set(this.state.weeklyDays);
        if (target.checked) days.add(day);
        else days.delete(day);
        this.setState({ weeklyDays: Array.from(days) });
      });
    });

    this.element.querySelector('#monthly-day')?.addEventListener('input', (e) => {
      this.setState({ monthlyDay: parseInt((e.target as HTMLInputElement).value) || 1 });
    });

    this.element.querySelector('#recurrence-end-type')?.addEventListener('change', (e) => {
      this.setState({ endType: (e.target as HTMLSelectElement).value as any });
    });

    this.element.querySelector('#recurrence-end-date')?.addEventListener('input', (e) => {
      this.setState({ endDate: (e.target as HTMLInputElement).value });
    });

    this.element.querySelector('#recurrence-end-count')?.addEventListener('input', (e) => {
      this.setState({ endCount: parseInt((e.target as HTMLInputElement).value) || 1 });
    });

    // Submit
    this.element.querySelector('.submit-btn')?.addEventListener('click', async () => {
      const form = this.element.querySelector('#task-form') as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const fd = new FormData(form);
      const data: Partial<TaskCreate> = {
        title: fd.get('title') as string,
        description: fd.get('description') as string || undefined,
        planned_date: fd.get('planned_date') as string || undefined,
        deadline: fd.get('deadline') as string || undefined,
        status_id: fd.get('status_id') ? parseInt(fd.get('status_id') as string) : undefined,
        list_id: fd.get('list_id') ? parseInt(fd.get('list_id') as string) : undefined,
        project_id: fd.get('project_id') ? parseInt(fd.get('project_id') as string) : undefined,
        client_id: fd.get('client_id') ? parseInt(fd.get('client_id') as string) : undefined,
        pomodoro_estimate: fd.get('pomodoro_estimate') ? parseInt(fd.get('pomodoro_estimate') as string) : undefined,
        first_action: fd.get('first_action') as string || undefined,
        external_link: fd.get('external_link') as string || undefined,
      };

      try {
        let task: Task;
        if (this.state.task) {
          task = await api.updateTask(this.state.task.id, data as TaskUpdate);
        } else {
          task = await api.createTask(data as TaskCreate);
        }

        // Save subtasks if any
        for (const st of this.state.subtasks) {
          if (st.title && !st.id) {
            await api.createTask({ title: st.title, parent_task_id: task.id });
          }
        }

        // Handle recurrence
        if (this.state.recurrenceEnabled) {
          const recData: RecurringTaskCreate = {
            frequency_type: this.state.recurrenceType,
            frequency_data: {
              weeklyDays: this.state.recurrenceType === 'weekly' ? this.state.weeklyDays : undefined,
              monthlyDay: this.state.recurrenceType === 'monthly' ? this.state.monthlyDay : undefined
            },
            end_date: this.state.endType === 'date' ? this.state.endDate : undefined,
            end_count: this.state.endType === 'count' ? this.state.endCount : undefined
          };
          
          // In a real application, we would call an API endpoint to save the recurrence settings
          // await api.createRecurringTask(task.id, recData);
          console.log('Would save recurrence:', recData);
        }

        showSuccess('Задача сохранена');
        this.props.onSave(task);
        this.close();
      } catch (error) {
        // Error handled globally
      }
    });
  }
}
