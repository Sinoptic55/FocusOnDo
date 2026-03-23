/**
 * Drag and drop utility for task board views
 * Supports both date board (by planned_date) and status board (by status_id)
 */

import type { Task } from '../models';
import { api } from '../api';

export type DropTarget = {
  type: 'date' | 'status';
  value: string | number; // date column type or status_id
  element: HTMLElement;
};

export type DragDropOptions = {
  container: HTMLElement;
  onDragStart?: (taskId: number) => void;
  onDragEnd?: (taskId: number) => void;
  onDrop?: (taskId: number, target: DropTarget) => Promise<void>;
  onDropError?: (error: Error) => void;
};

export class DragDropManager {
  private draggedTaskId: number | null = null;
  private draggedElement: HTMLElement | null = null;
  private options: DragDropOptions;

  constructor(options: DragDropOptions) {
    this.options = options;
    this.setupEventListeners();
  }

  /**
   * Setup drag and drop event listeners
   */
  private setupEventListeners(): void {
    const { container } = this.options;

    // Use event delegation for drag start
    container.addEventListener('dragstart', this.handleDragStart.bind(this));
    container.addEventListener('dragend', this.handleDragEnd.bind(this));
    container.addEventListener('dragover', this.handleDragOver.bind(this));
    container.addEventListener('dragleave', this.handleDragLeave.bind(this));
    container.addEventListener('drop', this.handleDrop.bind(this));
  }

  /**
   * Handle drag start event
   */
  private handleDragStart(event: DragEvent): void {
    const target = event.target as HTMLElement;
    const taskItem = target.closest('.task-item') as HTMLElement;

    if (!taskItem) return;

    const taskId = parseInt(taskItem.getAttribute('data-task-id')!);
    if (!taskId) return;

    this.draggedTaskId = taskId;
    this.draggedElement = taskItem;

    // Add dragging class for visual feedback
    taskItem.classList.add('dragging');

    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', taskId.toString());
      event.dataTransfer.effectAllowed = 'move';
    }

    // Call drag start callback
    this.options.onDragStart?.(taskId);
  }

  /**
   * Handle drag end event
   */
  private handleDragEnd(event: DragEvent): void {
    if (this.draggedElement) {
      this.draggedElement.classList.remove('dragging');
    }

    // Remove all drop target highlights
    this.options.container.querySelectorAll('.drop-target').forEach(el => {
      el.classList.remove('drop-target');
    });

    const taskId = this.draggedTaskId;
    this.draggedTaskId = null;
    this.draggedElement = null;

    // Call drag end callback
    if (taskId) {
      this.options.onDragEnd?.(taskId);
    }
  }

  /**
   * Handle drag over event
   */
  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    // Find the column being hovered
    const column = this.findDropColumn(event.target as HTMLElement);
    if (column) {
      // Highlight the column
      this.options.container.querySelectorAll('.column-tasks').forEach(el => {
        el.classList.remove('drop-target');
      });
      column.classList.add('drop-target');
    }
  }

  /**
   * Handle drag leave event
   */
  private handleDragLeave(event: DragEvent): void {
    const target = event.target as HTMLElement;
    const column = target.closest('.column-tasks');

    if (column && !column.contains(event.relatedTarget as Node)) {
      column.classList.remove('drop-target');
    }
  }

  /**
   * Handle drop event
   */
  private async handleDrop(event: DragEvent): void {
    event.preventDefault();

    if (!this.draggedTaskId) return;

    // Find the drop target
    const column = this.findDropColumn(event.target as HTMLElement);
    if (!column) return;

    // Parse drop target data
    const targetType = column.closest('.date-column') ? 'date' : 'status';
    const targetValue = targetType === 'date'
      ? column.getAttribute('data-column')!
      : parseInt(column.getAttribute('data-status-id')!);

    const dropTarget: DropTarget = {
      type: targetType,
      value: targetValue,
      element: column
    };

    // Remove drop target highlight
    column.classList.remove('drop-target');

    try {
      // Call drop callback or use default behavior
      if (this.options.onDrop) {
        await this.options.onDrop(this.draggedTaskId, dropTarget);
      } else {
        await this.defaultDropHandler(this.draggedTaskId, dropTarget);
      }
    } catch (error) {
      console.error('Drop failed:', error);
      this.options.onDropError?.(error as Error);
    }
  }

  /**
   * Find the drop column from a target element
   */
  private findDropColumn(target: HTMLElement): HTMLElement | null {
    return target.closest('.column-tasks') as HTMLElement;
  }

  /**
   * Default drop handler - updates task based on target type
   */
  private async defaultDropHandler(taskId: number, target: DropTarget): Promise<void> {
    const task = await api.getTask(taskId);
    const updates: Partial<Task> = {};

    if (target.type === 'date') {
      // Update planned_date based on column
      updates.planned_date = this.getDateForColumn(target.value as string);
    } else if (target.type === 'status') {
      // Update status_id
      updates.status_id = target.value as number;
    }

    await api.updateTask(taskId, updates);
  }

  /**
   * Get date string for a date column
   */
  private getDateForColumn(columnType: string): string | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (columnType) {
      case 'no-date':
        return null;
      case 'today':
        return today.toISOString().split('T')[0];
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      case 'this-week':
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() + 1); // Tomorrow
        return thisWeek.toISOString().split('T')[0];
      case 'later':
        const later = new Date(today);
        later.setDate(later.getDate() + 8); // Next week
        return later.toISOString().split('T')[0];
      case 'someday':
        const someday = new Date(today);
        someday.setDate(someday.getDate() + 30); // Next month
        return someday.toISOString().split('T')[0];
      default:
        return null;
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    const { container } = this.options;
    container.removeEventListener('dragstart', this.handleDragStart.bind(this));
    container.removeEventListener('dragend', this.handleDragEnd.bind(this));
    container.removeEventListener('dragover', this.handleDragOver.bind(this));
    container.removeEventListener('dragleave', this.handleDragLeave.bind(this));
    container.removeEventListener('drop', this.handleDrop.bind(this));
  }
}
