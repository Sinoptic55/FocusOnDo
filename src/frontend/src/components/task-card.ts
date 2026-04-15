/**
 * Task card component for displaying tasks in lists/board
 */

import { Component } from './component';
import type { Task, TaskList, Project } from '../models';
import { escapeHtml, formatTime, formatDate, isOverdue } from '../utils';
import { timerManager } from './timer';
import { ConfirmDialog } from './confirm-dialog';

interface TaskCardProps {
  task: Task;
  lists: TaskList[];
  projects: Project[];
  indentLevel?: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStartTimer?: (task: Task) => void;
}

export class TaskCard extends Component<any, TaskCardProps> {
  private timerUnsubscribe: (() => void) | null = null;
  private currentTotalTime: number = 0;

  constructor(props: TaskCardProps) {
    super('div', 'task-card', props);
    this.currentTotalTime = props.task.total_time || 0;
    
    // Apply hierarchy indent
    if (props.indentLevel) {
      this.element.style.marginLeft = `${props.indentLevel * 24}px`;
      this.element.classList.add('task-card-subtask');
    }
  }

  protected onMount(): void {
    // Subscribe to timer for real-time updates (Task 16.10)
    this.timerUnsubscribe = timerManager.subscribe((state) => {
      if (state.active && state.currentTaskId === this.props.task.id) {
        let baseTime = this.props.task.total_time || 0;
        if (state.currentTask && state.currentTask.id === this.props.task.id) {
          baseTime = state.currentTask.total_time || baseTime;
        }

        let elapsedInSession = 0;
        if (state.segmentStartRemainingSeconds !== null) {
          elapsedInSession = Math.max(0, state.segmentStartRemainingSeconds - state.remainingSeconds);
        }

        const newTotal = baseTime + elapsedInSession;
        
        if (newTotal !== this.currentTotalTime) {
          this.currentTotalTime = newTotal;
          this.updateTimeDisplay();
        }
      }
    });
  }

  protected onUnmount(): void {
    if (this.timerUnsubscribe) {
      this.timerUnsubscribe();
    }
  }

  private updateTimeDisplay(): void {
    const timeEl = this.element.querySelector('.task-card-time');
    if (timeEl) {
      timeEl.textContent = `⏱ ${formatTime(this.currentTotalTime)}`;
    }
  }

  protected render(): void {
    const { task, lists, projects } = this.props;

    const list = lists.find(l => l.id === task.list_id);
    const project = projects.find(p => p.id === task.project_id);
    const isTaskOverdue = task.deadline ? isOverdue(task.deadline) : false;

    if (isTaskOverdue) {
      this.element.classList.add('task-overdue');
    }
    if (task.is_completed) {
      this.element.classList.add('task-completed');
    }
    if (task.is_paid) {
      this.element.classList.add('task-paid');
    }

    this.element.innerHTML = `
      <div class="task-card-header">
        <div class="task-card-meta">
          ${(task as any).recurring_task_id ? '<span class="badge task-recurring-badge" title="Повторяющаяся задача">🔄</span>' : ''}
          ${task.is_completed ? '<span class="badge task-completed-badge" title="Выполнена">✅</span>' : ''}
          ${task.is_paid ? '<span class="badge task-paid-badge" title="Оплачена">💰</span>' : ''}
          ${list ? `<span class="badge task-list-badge" style="background-color: ${list.color}">${escapeHtml(list.name)}</span>` : ''}
          ${project ? `<span class="badge task-project-badge" style="background-color: ${project.color}">${escapeHtml(project.name)}</span>` : ''}
        </div>
        <h3 class="task-card-title">${escapeHtml(task.title)}</h3>
      </div>
      
      ${task.description ? `<p class="task-card-description">${escapeHtml(task.description)}</p>` : ''}
      
      <div class="task-card-footer">
        <div class="task-card-stats">
          <span class="task-card-time">⏱ ${formatTime(this.currentTotalTime)}</span>
          ${task.deadline ? `<span class="task-card-deadline ${isTaskOverdue ? 'overdue' : ''}">📅 ${formatDate(task.deadline)}</span>` : ''}
        </div>
        <div class="task-card-actions">
          ${this.props.onStartTimer ? `<button class="btn btn-icon btn-start" title="Запустить таймер">▶️</button>` : ''}
          <button class="btn btn-icon btn-edit" title="Редактировать">✏️</button>
          <button class="btn btn-icon btn-delete" title="Удалить">🗑️</button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.querySelector('.btn-edit')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.props.onEdit(this.props.task);
    });

    this.element.querySelector('.btn-delete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const dialog = new ConfirmDialog({
        title: 'Удалить задачу?',
        message: `Вы уверены, что хотите удалить задачу "${this.props.task.title}"? Все подзадачи также будут удалены.`,
        confirmText: 'Удалить',
        isDanger: true,
        onConfirm: () => {
          this.props.onDelete(this.props.task);
        }
      });
      dialog.open();
    });

    this.element.querySelector('.btn-start')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.props.onStartTimer) {
        this.props.onStartTimer(this.props.task);
      }
    });
  }
}
