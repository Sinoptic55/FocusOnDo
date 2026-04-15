/**
 * Date board view component - 6 columns by dates
 */

import { Component } from '../components/component';
import type { Task, TaskList, Project, Client } from '../models';
import { api } from '../api';
import { TaskCard } from '../components/task-card';
import { TaskForm } from '../components/task-form';
import { timerManager } from '../components/timer';

interface DateBoardViewState {
  tasks: Task[];
  lists: TaskList[];
  projects: Project[];
  clients: Client[];
  loading: boolean;
  sortBy: 'none' | 'deadline' | 'priority';
}

interface DateBoardViewProps {
  filters: {
    project_id?: number;
    client_id?: number;
    list_id?: number;
  };
}

export class DateBoardView extends Component<DateBoardViewState, DateBoardViewProps> {
  private taskCards: TaskCard[] = [];

  constructor(props: DateBoardViewProps) {
    super('div', 'view date-board-view', props, {
      tasks: [],
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
      const [tasks, lists, projects, clients] = await Promise.all([
        api.getTasks(this.props.filters),
        api.getLists(),
        api.getProjects(),
        api.getClients()
      ]);
      
      this.setState({ tasks, lists, projects, clients, loading: false });
    } catch (error) {
      console.error('Failed to load date board data:', error);
      this.setState({ loading: false });
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = '<div class="loader">Загрузка доски...</div>';
      return;
    }

    const grouped = {
      'overdue': 0,
      'today': 0,
      'tomorrow': 0,
      'this-week': 0,
      'later': 0,
      'no-date': 0
    };

    // Count root tasks for each group
    const rootTasks = this.state.tasks.filter(t => !t.parent_task_id && !t.is_completed && !t.is_paid);
    rootTasks.forEach(t => {
      const group = this.getGroupForTask(t) as keyof typeof grouped;
      grouped[group]++;
    });

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
      <div id="date-columns" class="board-columns">
        <div class="board-column" data-column="overdue">
          <div class="column-header">
            <div class="list-title-group">
              <h3>Просрочено</h3>
              <span class="list-count-badge">${grouped['overdue']}</span>
            </div>
          </div>
          <div class="column-content" data-drop-zone="overdue"></div>
        </div>
        <div class="board-column" data-column="today">
          <div class="column-header">
            <div class="list-title-group">
              <h3>Сегодня</h3>
              <span class="list-count-badge">${grouped['today']}</span>
            </div>
          </div>
          <div class="column-content" data-drop-zone="today"></div>
        </div>
        <div class="board-column" data-column="tomorrow">
          <div class="column-header">
            <div class="list-title-group">
              <h3>Завтра</h3>
              <span class="list-count-badge">${grouped['tomorrow']}</span>
            </div>
          </div>
          <div class="column-content" data-drop-zone="tomorrow"></div>
        </div>
        <div class="board-column" data-column="this-week">
          <div class="column-header">
            <div class="list-title-group">
              <h3>На этой неделе</h3>
              <span class="list-count-badge">${grouped['this-week']}</span>
            </div>
          </div>
          <div class="column-content" data-drop-zone="this-week"></div>
        </div>
        <div class="board-column" data-column="later">
          <div class="column-header">
            <div class="list-title-group">
              <h3>Позже</h3>
              <span class="list-count-badge">${grouped['later']}</span>
            </div>
          </div>
          <div class="column-content" data-drop-zone="later"></div>
        </div>
        <div class="board-column" data-column="no-date">
          <div class="column-header">
            <div class="list-title-group">
              <h3>Без даты</h3>
              <span class="list-count-badge">${grouped['no-date']}</span>
            </div>
          </div>
          <div class="column-content" data-drop-zone="no-date"></div>
        </div>
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

  private getGroupForTask(task: Task): string {
    if (!task.planned_date) return 'no-date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

    const planned = new Date(task.planned_date);
    planned.setHours(0, 0, 0, 0);

    if (planned < today) return 'overdue';
    if (planned.getTime() === today.getTime()) return 'today';
    if (planned.getTime() === tomorrow.getTime()) return 'tomorrow';
    if (planned > tomorrow && planned <= endOfWeek) return 'this-week';
    
    return 'later';
  }

  private renderColumns(): void {
    this.taskCards.forEach(c => c.unmount());
    this.taskCards = [];

    const grouped = {
      'overdue': [] as Task[],
      'today': [] as Task[],
      'tomorrow': [] as Task[],
      'this-week': [] as Task[],
      'later': [] as Task[],
      'no-date': [] as Task[]
    };

    // Filter root tasks
    const rootTasks = this.state.tasks.filter(t => !t.parent_task_id && !t.is_completed && !t.is_paid);
    rootTasks.forEach(t => grouped[this.getGroupForTask(t) as keyof typeof grouped].push(t));

    Object.keys(grouped).forEach(key => {
      const container = this.element.querySelector(`.column-content[data-drop-zone="${key}"]`) as HTMLElement;
      if (!container) return;

      let tasks = grouped[key as keyof typeof grouped];
      tasks = this.sortTasks(tasks);

      tasks.forEach(task => {
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

        const targetColumn = (zone as HTMLElement).dataset.dropZone;
        await this.handleTaskDrop(taskId, targetColumn || 'no-date');
      });
    });
  }

  private async handleTaskDrop(taskId: number, column: string): Promise<void> {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    let newDate: string | null = null;
    const today = new Date();
    
    switch (column) {
      case 'today':
      case 'overdue': // Dropping into overdue just means today practically
        newDate = today.toISOString();
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        newDate = tomorrow.toISOString();
        break;
      case 'this-week':
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        newDate = endOfWeek.toISOString();
        break;
      case 'later':
        const later = new Date(today);
        later.setDate(today.getDate() + 14); // Arbitrary later date
        newDate = later.toISOString();
        break;
      case 'no-date':
        newDate = null;
        break;
    }

    try {
      await api.updateTask(taskId, { planned_date: newDate || undefined });
      await this.loadData();
    } catch (error) {
      console.error('Failed to move task:', error);
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
