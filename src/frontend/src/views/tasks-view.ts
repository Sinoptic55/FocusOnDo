/**
 * Tasks View container - manages view switching and global filters
 */

import { Component } from '../components/component';
import { storage } from '../utils';
import { api } from '../api';
import type { Task, Project, Client } from '../models';

import { ListView } from './list-view';
import { TaskForm } from '../components/task-form';
import { DateBoardView } from './date-board-view';
import { StatusBoardView } from './status-board-view';

interface TasksViewState {
  activeView: 'list' | 'date-board' | 'status-board';
  projects: Project[];
  clients: Client[];
  filterProjectId: number | null;
  filterClientId: number | null;
  loading: boolean;
}

export class TasksView extends Component<TasksViewState> {
  private activeViewComponent: any | null = null;

  constructor() {
    super('div', 'view tasks-view', {}, {
      activeView: storage.get('preferred_task_view', 'list'),
      projects: [],
      clients: [],
      filterProjectId: null,
      filterClientId: null,
      loading: true
    });
  }

  protected async onMount(): Promise<void> {
    try {
      const [projects, clients] = await Promise.all([
        api.getProjects(),
        api.getClients()
      ]);
      this.setState({ projects, clients, loading: false });
    } catch (error) {
      console.error('Failed to load filters', error);
      this.setState({ loading: false });
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = '<div class="loader">Загрузка задач...</div>';
      return;
    }

    this.element.innerHTML = `
      <div class="tasks-toolbar">
        <div class="view-switcher">
          <button class="btn ${this.state.activeView === 'list' ? 'btn-primary' : 'btn-secondary'}" data-view="list">Список</button>
          <button class="btn ${this.state.activeView === 'date-board' ? 'btn-primary' : 'btn-secondary'}" data-view="date-board">По дате</button>
          <button class="btn ${this.state.activeView === 'status-board' ? 'btn-primary' : 'btn-secondary'}" data-view="status-board">По статусу</button>
        </div>
        
        <div class="tasks-filters">
          <select id="filter-project">
            <option value="">Все проекты</option>
            ${this.state.projects.map(p => `<option value="${p.id}" ${this.state.filterProjectId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
          <select id="filter-client">
            <option value="">Все клиенты</option>
            ${this.state.clients.map(c => `<option value="${c.id}" ${this.state.filterClientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <button class="btn btn-secondary" id="btn-smart-start" title="Умный выбор следующей задачи">🪄 Что делать дальше?</button>
          <button class="btn btn-primary" id="btn-new-task">+ Новая задача</button>
        </div>
      </div>
      
      <div id="sub-view-container" class="sub-view-container"></div>
    `;

    this.setupEventListeners();
    this.renderSubView();
  }

  private setupEventListeners(): void {
    this.element.querySelectorAll('.view-switcher .btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = (e.target as HTMLElement).dataset.view as any;
        if (view && view !== this.state.activeView) {
          storage.set('preferred_task_view', view);
          this.setState({ activeView: view });
        }
      });
    });

    this.element.querySelector('#filter-project')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      this.setState({ filterProjectId: val ? parseInt(val) : null });
    });

    this.element.querySelector('#filter-client')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      this.setState({ filterClientId: val ? parseInt(val) : null });
    });

    this.element.querySelector('#btn-new-task')?.addEventListener('click', () => {
      const form = new TaskForm({
        onSave: () => {
          if (this.activeViewComponent && this.activeViewComponent.loadData) {
            this.activeViewComponent.loadData();
          }
        }
      });
      form.open();
    });

    this.element.querySelector('#btn-smart-start')?.addEventListener('click', async () => {
      try {
        const btn = this.element.querySelector('#btn-smart-start') as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = 'Думаю...';

        const suggestedTask = await api.getNextTask();
        
        btn.disabled = false;
        btn.textContent = '🪄 Что делать дальше?';

        if (!suggestedTask) {
          alert('Нет подходящих задач для выполнения прямо сейчас.');
          return;
        }

        // We can create a simple confirm dialog to show the task and reason
        import('../components/confirm-dialog').then(({ ConfirmDialog }) => {
          const reasonText = (suggestedTask as any).smart_reason || 'Эта задача обладает наивысшим приоритетом на данный момент.';
          
          const dialog = new ConfirmDialog({
            title: '💡 Умный выбор задачи',
            message: `<p>Предлагаю заняться задачей:</p>
                      <h3 style="margin: 10px 0;">${escapeHtml(suggestedTask.title)}</h3>
                      <p><strong>Почему:</strong> ${escapeHtml(reasonText)}</p>
                      <p>Запустить таймер для этой задачи?</p>`,
            confirmText: 'Начать работу',
            onConfirm: () => {
              import('../components/timer').then(({ timerManager }) => {
                timerManager.start(suggestedTask.id);
              });
            }
          });
          dialog.open();
        });

      } catch (error) {
        console.error('Smart start failed:', error);
        const btn = this.element.querySelector('#btn-smart-start') as HTMLButtonElement;
        btn.disabled = false;
        btn.textContent = '🪄 Что делать дальше?';
      }
    });
  }

  private renderSubView(): void {
    const container = this.element.querySelector('#sub-view-container');
    if (!container) return;

    if (this.activeViewComponent) {
      this.activeViewComponent.unmount();
      this.activeViewComponent = null;
    }

    const filters = {
      project_id: this.state.filterProjectId || undefined,
      client_id: this.state.filterClientId || undefined
    };

    switch (this.state.activeView) {
      case 'list':
        this.activeViewComponent = new ListView({ filters });
        break;
      case 'date-board':
        this.activeViewComponent = new DateBoardView({ filters });
        break;
      case 'status-board':
        this.activeViewComponent = new StatusBoardView({ filters });
        break;
    }

    if (this.activeViewComponent) {
      this.activeViewComponent.mount(container as HTMLElement);
    }
  }
}
