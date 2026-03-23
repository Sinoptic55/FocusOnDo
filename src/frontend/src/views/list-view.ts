/**
 * List view component - tasks grouped by lists
 */

import { Component } from '../components/component';
import type { Task, TaskList, Project, Client } from '../models';
import { api } from '../api';
import { TaskCard } from '../components/task-card';
import { TaskForm } from '../components/task-form';
import { timerManager } from '../components/timer';

interface ListViewState {
  tasks: Task[];
  lists: TaskList[];
  projects: Project[];
  clients: Client[];
  loading: boolean;
  sortBy: 'none' | 'deadline' | 'priority';
}

interface ListViewProps {
  filters: {
    project_id?: number;
    client_id?: number;
  };
}

export class ListView extends Component<ListViewState, ListViewProps> {
  private taskCards: TaskCard[] = [];

  constructor(props: ListViewProps) {
    super('div', 'view list-view', props, {
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

  private async loadData(): Promise<void> {
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
      console.error('Failed to load list view data:', error);
      this.setState({ loading: false });
    }
  }

  public async updateFilters(filters: ListViewProps['filters']): Promise<void> {
    this.props.filters = filters;
    await this.loadData();
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = '<div class="loader">Загрузка списка...</div>';
      return;
    }

    this.element.innerHTML = `
      <div class="view-controls">
        <label>
          Сортировка:
          <select id="sort-select">
            <option value="none" \${this.state.sortBy === 'none' ? 'selected' : ''}>По умолчанию</option>
            <option value="deadline" \${this.state.sortBy === 'deadline' ? 'selected' : ''}>По дедлайну</option>
            <option value="priority" \${this.state.sortBy === 'priority' ? 'selected' : ''}>По приоритету</option>
          </select>
        </label>
      </div>
      <div id="lists-container" class="lists-container"></div>
    `;

    this.setupEventListeners();
    this.renderLists();
  }

  private setupEventListeners(): void {
    this.element.querySelector('#sort-select')?.addEventListener('change', (e) => {
      this.setState({ sortBy: (e.target as HTMLSelectElement).value as any });
    });
  }

  private renderLists(): void {
    const container = this.element.querySelector('#lists-container');
    if (!container) return;
    
    // Clear previous task cards
    this.taskCards.forEach(c => c.unmount());
    this.taskCards = [];
    container.innerHTML = '';

    const tasksByList = new Map<number, Task[]>();
    // Filter root tasks
    const rootTasks = this.state.tasks.filter(t => !t.parent_task_id);

    rootTasks.forEach(task => {
      const listId = task.list_id || 0; // 0 for Uncategorized
      if (!tasksByList.has(listId)) {
        tasksByList.set(listId, []);
      }
      tasksByList.get(listId)!.push(task);
    });

    // Add unassigned list if needed
    const allLists = [...this.state.lists];
    if (tasksByList.has(0)) {
      allLists.push({ id: 0, name: 'Без списка', color: '#999', user_id: 0, order: 999 });
    }

    allLists.sort((a, b) => a.order - b.order).forEach(list => {
      let listTasks = tasksByList.get(list.id) || [];
      if (listTasks.length === 0) return;

      listTasks = this.sortTasks(listTasks);

      const section = document.createElement('div');
      section.className = 'list-section';
      section.innerHTML = `
        <div class="list-header" style="border-left-color: ${list.color}">
          <h3 style="color: ${list.color}">${list.name}</h3>
          <span class="list-count">${listTasks.length}</span>
        </div>
        <div class="list-tasks"></div>
      `;

      const tasksContainer = section.querySelector('.list-tasks') as HTMLElement;
      listTasks.forEach(task => {
        this.renderTaskTree(task, tasksContainer, 0);
      });

      container.appendChild(section);
    });

    if (tasksByList.size === 0) {
      container.innerHTML = '<p class="empty-msg">Задач не найдено</p>';
    }
  }

  private renderTaskTree(task: Task, container: HTMLElement, level: number): void {
    const card = new TaskCard({
      task,
      lists: this.state.lists,
      projects: this.state.projects,
      indentLevel: level,
      onEdit: (t) => this.handleEditTask(t),
      onDelete: (t) => this.handleDeleteTask(t),
      onStartTimer: (t) => timerManager.start(t.id)
    });
    
    card.mount(container);
    this.taskCards.push(card);

    // Find and render subtasks
    const subtasks = this.state.tasks.filter(t => t.parent_task_id === task.id);
    if (subtasks.length > 0) {
      const sortedSubtasks = this.sortTasks(subtasks);
      sortedSubtasks.forEach(st => this.renderTaskTree(st, container, level + 1));
    }
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
      // Assuming status or pomodoro estimate defines priority for now
      sorted.sort((a, b) => (b.pomodoro_estimate || 0) - (a.pomodoro_estimate || 0));
    }
    return sorted;
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
