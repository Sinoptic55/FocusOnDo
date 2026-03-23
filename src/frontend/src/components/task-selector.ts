/**
 * Task selector dialog component
 */

import { Dialog } from './dialog';
import type { Task, TaskList } from '../models';
import { api } from '../api';
import { escapeHtml, formatDate } from '../utils';

interface TaskSelectorState {
  tasks: Task[];
  lists: TaskList[];
  loading: boolean;
  search: string;
  listFilter: string;
  selectedTaskId: number | null;
}

interface TaskSelectorProps {
  onSelect: (taskId: number) => void;
}

export class TaskSelector extends Dialog<TaskSelectorState, TaskSelectorProps> {
  constructor(props: TaskSelectorProps) {
    super('task-selector-dialog', props, {
      tasks: [],
      lists: [],
      loading: true,
      search: '',
      listFilter: '',
      selectedTaskId: null
    });
  }

  protected async onOpen(): Promise<void> {
    this.setState({ loading: true });
    try {
      const [tasks, lists] = await Promise.all([
        api.getTasks(),
        api.getLists()
      ]);
      this.setState({ tasks, lists, loading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      this.setState({ loading: false });
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = `
        <div class="dialog-header"><h2>Выберите задачу</h2></div>
        <div class="dialog-body"><div class="loader">Загрузка задач...</div></div>
      `;
      return;
    }

    const filteredTasks = this.state.tasks.filter(task => {
      const matchesList = !this.state.listFilter || task.list_id === parseInt(this.state.listFilter);
      const matchesSearch = !this.state.search || 
        task.title.toLowerCase().includes(this.state.search.toLowerCase());
      return matchesList && matchesSearch;
    });

    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>Выберите задачу</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body">
        <div class="task-filters">
          <select id="task-list-filter">
            <option value="">Все списки</option>
            ${this.state.lists.map(l => `<option value="${l.id}" ${this.state.listFilter === String(l.id) ? 'selected' : ''}>${escapeHtml(l.name)}</option>`).join('')}
          </select>
          <input type="text" id="task-search" placeholder="Поиск..." value="${escapeHtml(this.state.search)}">
        </div>
        <div class="task-selector-list">
          ${filteredTasks.length ? filteredTasks.map(task => `
            <div class="task-selector-item ${this.state.selectedTaskId === task.id ? 'selected' : ''}" data-id="${task.id}">
              <div class="task-info">
                <span class="task-title">${escapeHtml(task.title)}</span>
                <span class="task-meta">${task.list_id ? this.state.lists.find(l => l.id === task.list_id)?.name || '' : ''}</span>
              </div>
            </div>
          `).join('') : '<p class="empty-msg">Задачи не найдены</p>'}
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Отмена</button>
        <button class="btn btn-primary select-btn" ${!this.state.selectedTaskId ? 'disabled' : ''}>Выбрать</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());
    this.element.querySelector('.cancel-btn')?.addEventListener('click', () => this.close());
    
    const searchInput = this.element.querySelector('#task-search') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.setState({ search: (e.target as HTMLInputElement).value });
    });

    const listFilter = this.element.querySelector('#task-list-filter') as HTMLSelectElement;
    listFilter?.addEventListener('change', (e) => {
      this.setState({ listFilter: (e.target as HTMLSelectElement).value });
    });

    this.element.querySelectorAll('.task-selector-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.getAttribute('data-id') || '0');
        this.setState({ selectedTaskId: id });
      });
    });

    this.element.querySelector('.select-btn')?.addEventListener('click', () => {
      if (this.state.selectedTaskId) {
        this.props.onSelect(this.state.selectedTaskId);
        this.close();
      }
    });
  }
}
