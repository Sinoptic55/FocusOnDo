/**
 * Status board view component - columns by statuses
 */

import { Component } from '../components/component';
import type { Task, TaskStatus, TaskList, Project, Client } from '../models';
import { api } from '../api';
import { TaskCard } from '../components/task-card';
import { TaskForm } from '../components/task-form';
import { timerManager } from '../components/timer';

interface StatusBoardViewState {
  tasks: Task[];
  statuses: TaskStatus[];
  lists: TaskList[];
  projects: Project[];
  clients: Client[];
  loading: boolean;
  sortBy: 'none' | 'deadline' | 'priority';
}

interface StatusBoardViewProps {
  filters: {
    project_id?: number;
    client_id?: number;
  };
}

export class StatusBoardView extends Component<StatusBoardViewState, StatusBoardViewProps> {
  private taskCards: TaskCard[] = [];

  constructor(props: StatusBoardViewProps) {
    super('div', 'view status-board-view', props, {
      tasks: [],
      statuses: [],
      lists: [],
      projects: [],
      clients: [],
      loading: true,
      sortBy: 'none'
    });
  }

  protected async onMount(): Promise<void> {
    await this.loadData();
  }

  public async loadData(): Promise<void> {
    this.setState({ loading: true });
    try {
      const [tasks, allStatuses, lists, projects, clients] = await Promise.all([
        api.getTasks(this.props.filters),
        api.getStatuses(),
        api.getLists(),
        api.getProjects(),
        api.getClients()
      ]);
      
      // Filter for board visible statuses (Task 17.5)
      const statuses = allStatuses.filter(s => s.board_visible);
      
      this.setState({ tasks, statuses, lists, projects, clients, loading: false });
    } catch (error) {
      console.error('Failed to load status board data:', error);
      this.setState({ loading: false });
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = '<div class="loader">Загрузка доски...</div>';
      return;
    }

    if (this.state.statuses.length === 0) {
      this.element.innerHTML = '<p class="empty-state">Нет статусов для отображения на доске</p>';
      return;
    }

    this.element.innerHTML = `
      <div class="view-controls">
        <label>
          Сортировка:
          <select id="sort-select">
            <option value="none" ${this.state.sortBy === 'none' ? 'selected' : ''}>По умолчанию</option>
            <option value="deadline" ${this.state.sortBy === 'deadline' ? 'selected' : ''}>По дедлайну</option>
            <option value="priority" ${this.state.sortBy === 'priority' ? 'selected' : ''}>По приоритету</option>
          </select>
        </label>
      </div>
      <div id="status-columns" class="board-columns">
        ${this.state.statuses.map(status => `
          <div class="board-column" data-status-id="${status.id}">
            <div class="column-header"><h3>${status.name}</h3></div>
            <div class="column-content" data-drop-zone="${status.id}"></div>
          </div>
        `).join('')}
      </div>
    `;

    this.setupEventListeners();
    this.renderColumns();
    this.setupDragAndDrop();
  }

  private setupEventListeners(): void {
    this.element.querySelector('#sort-select')?.addEventListener('change', (e) => {
      this.setState({ sortBy: (e.target as HTMLSelectElement).value as any });
    });
  }

  private renderColumns(): void {
    this.taskCards.forEach(c => c.unmount());
    this.taskCards = [];

    const tasksByStatus = new Map<number, Task[]>();
    
    // Initialize map
    this.state.statuses.forEach(s => tasksByStatus.set(s.id, []));

    // Filter root tasks
    const rootTasks = this.state.tasks.filter(t => !t.parent_task_id);
    rootTasks.forEach(t => {
      if (t.status_id && tasksByStatus.has(t.status_id)) {
        tasksByStatus.get(t.status_id)!.push(t);
      }
    });

    tasksByStatus.forEach((tasks, statusId) => {
      const container = this.element.querySelector(`.column-content[data-drop-zone="${statusId}"]`) as HTMLElement;
      if (!container) return;

      let sortedTasks = this.sortTasks(tasks);

      sortedTasks.forEach(task => {
        const card = new TaskCard({
          task,
          lists: this.state.lists,
          projects: this.state.projects,
          onEdit: (t) => this.handleEditTask(t),
          onDelete: (t) => this.handleDeleteTask(t),
          onStartTimer: (t) => timerManager.start(t.id)
        });
        
        // Wrap card in draggable container
        const dragWrapper = document.createElement('div');
        dragWrapper.className = 'draggable-task';
        dragWrapper.draggable = true;
        dragWrapper.dataset.taskId = String(task.id);
        
        // Drag events
        dragWrapper.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', String(task.id));
          setTimeout(() => dragWrapper.classList.add('dragging'), 0);
        });
        dragWrapper.addEventListener('dragend', () => {
          dragWrapper.classList.remove('dragging');
        });

        card.mount(dragWrapper);
        container.appendChild(dragWrapper);
        this.taskCards.push(card);
      });
    });
  }

  private sortTasks(tasks: Task[]): Task[] {
    const sorted = [...tasks];
    if (this.state.sortBy === 'deadline') {
      sorted.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else if (this.state.sortBy === 'priority') {
      sorted.sort((a, b) => (b.pomodoro_estimate || 0) - (a.pomodoro_estimate || 0));
    }
    return sorted;
  }

  private setupDragAndDrop(): void {
    const zones = this.element.querySelectorAll('.column-content');
    
    zones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', async (e: any) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        
        const taskId = parseInt(e.dataTransfer.getData('text/plain'));
        if (!taskId) return;

        const targetStatusId = parseInt((zone as HTMLElement).dataset.dropZone || '0');
        if (targetStatusId) {
          await this.handleTaskDrop(taskId, targetStatusId);
        }
      });
    });
  }

  private async handleTaskDrop(taskId: number, statusId: number): Promise<void> {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task || task.status_id === statusId) return;

    try {
      await api.updateTask(taskId, { status_id: statusId });
      await this.loadData();
    } catch (error) {
      console.error('Failed to move task status:', error);
    }
  }

  private handleEditTask(task: Task): void {
    const form = new TaskForm({
      taskId: task.id,
      onSave: () => this.loadData()
    });
    form.open();
  }

  private async handleDeleteTask(task: Task): Promise<void> {
    try {
      await api.deleteTask(task.id);
      await this.loadData();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  }
}
