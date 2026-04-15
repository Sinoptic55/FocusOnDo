/**
 * Time Segments List component - displays and manages time segments for a task
 */

import { Component } from './component';
import { Dialog } from './dialog';
import type { TimeSegment } from '../models';
import { api } from '../api';
import { formatTime, formatDateTime, showSuccess, showError } from '../utils';

// --- Manual Entry Dialog (Task 23.5) ---
interface ManualEntryState {
  startTime: string;
  actualMins: number;
  billedMins: number;
  energyLevel: number;
  progressed: boolean;
}

interface ManualEntryProps {
  taskId: number;
  onSave: () => void;
}

class ManualTimeEntryDialog extends Dialog<ManualEntryState, ManualEntryProps> {
  constructor(props: ManualEntryProps) {
    const now = new Date();
    // Round down to nearest minute for datetime-local
    now.setSeconds(0, 0);
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);

    super('manual-time-dialog', props, {
      startTime: localISOTime,
      actualMins: 25,
      billedMins: 25,
      energyLevel: 3,
      progressed: true
    });
  }

  protected render(): void {
    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>Добавить время вручную</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body">
        <form id="manual-time-form">
          <div class="form-group">
            <label>Время начала</label>
            <input type="datetime-local" name="startTime" value="${this.state.startTime}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Фактическое (мин)</label>
              <input type="number" name="actualMins" min="1" value="${this.state.actualMins}" required>
            </div>
            <div class="form-group">
              <label>Выставленное (мин)</label>
              <input type="number" name="billedMins" min="1" value="${this.state.billedMins}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Уровень энергии (1-5)</label>
              <input type="number" name="energyLevel" min="1" max="5" value="${this.state.energyLevel}">
            </div>
            <div class="form-group checkbox-group" style="align-items: flex-start; justify-content: center; height: 100%;">
              <label>
                <input type="checkbox" name="progressed" ${this.state.progressed ? 'checked' : ''}>
                Задача продвинулась
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Отмена</button>
        <button class="btn btn-primary save-btn">Сохранить</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const closeHandler = () => this.close();
    this.element.querySelector('.dialog-close')?.addEventListener('click', closeHandler);
    this.element.querySelector('.cancel-btn')?.addEventListener('click', closeHandler);

    this.element.querySelector('.save-btn')?.addEventListener('click', async () => {
      const form = this.element.querySelector('#manual-time-form') as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      const fd = new FormData(form);
      const startIso = new Date(fd.get('startTime') as string).toISOString();
      const actualSecs = parseInt(fd.get('actualMins') as string) * 60;
      const billedSecs = parseInt(fd.get('billedMins') as string) * 60;

      try {
        await api.createTimeSegment({
          task_id: this.props.taskId,
          start_time: startIso,
          duration_seconds: actualSecs, // Treat duration same as actual for simplicity
          actual_time_seconds: actualSecs,
          billed_time_seconds: billedSecs,
          energy_level: parseInt(fd.get('energyLevel') as string),
          task_progressed: fd.get('progressed') === 'on'
        });
        showSuccess('Время добавлено');
        this.props.onSave();
        this.close();
      } catch (e) {
        showError('Ошибка добавления времени');
      }
    });
  }
}

// --- Time Segments List (Task 23.1, 23.2, 23.3, 23.4, 23.6) ---

interface TimeSegmentsListState {
  segments: TimeSegment[];
  loading: boolean;
  editingId: number | null;
}

interface TimeSegmentsListProps {
  taskId: number;
}

export class TimeSegmentsList extends Component<TimeSegmentsListState, TimeSegmentsListProps> {
  constructor(props: TimeSegmentsListProps) {
    super('div', 'time-segments-component', props, {
      segments: [],
      loading: true,
      editingId: null
    });
  }

  protected async onMount(): Promise<void> {
    await this.loadData();
  }

  public async loadData(): Promise<void> {
    this.setState({ loading: true });
    try {
      const segments = await api.getTimeSegments(this.props.taskId);
      // Sort newest first
      segments.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      this.setState({ segments, loading: false, editingId: null });
    } catch (e) {
      showError('Не удалось загрузить историю времени');
      this.setState({ loading: false });
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = '<div class="loader">Загрузка истории...</div>';
      return;
    }

    const totalActual = this.state.segments.reduce((acc, s) => acc + s.actual_time_seconds, 0);
    const totalBilled = this.state.segments.reduce((acc, s) => acc + s.billed_time_seconds, 0);
    const diff = totalBilled - totalActual;
    const diffClass = diff >= 0 ? 'text-success' : 'text-danger';

    this.element.innerHTML = `
      <div class="ts-header flex justify-between align-center mb-md">
        <h3>⏱ История времени</h3>
        <button class="btn btn-sm btn-secondary" id="btn-add-manual">+ Вручную</button>
      </div>

      <div class="ts-summary stats-grid mb-md">
        <div class="stat-card">
          <span class="stat-label">Фактическое</span>
          <span class="stat-value">${formatTime(totalActual)}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Выставленное</span>
          <span class="stat-value">${formatTime(totalBilled)}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Разница (Bill - Act)</span>
          <span class="stat-value ${diffClass}">${diff >= 0 ? '+' : '-'}${formatTime(Math.abs(diff))}</span>
        </div>
      </div>

      <div class="ts-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Начало</th>
              <th>Факт</th>
              <th>Выставлено</th>
              <th>Энергия</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.segments.length === 0 ? '<tr><td colspan="5" class="text-center">Нет записей</td></tr>' : ''}
            ${this.state.segments.map(s => this.renderRow(s)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.setupEventListeners();
  }

  private renderRow(s: TimeSegment): string {
    const isEditing = this.state.editingId === s.id;
    
    if (isEditing) {
      const actMins = Math.round(s.actual_time_seconds / 60);
      const billMins = Math.round(s.billed_time_seconds / 60);

      return `
        <tr class="ts-editing-row">
          <td>${formatDateTime(s.start_time)}</td>
          <td><input type="number" class="edit-actual form-control" value="${actMins}" min="0" style="width:70px"> мин</td>
          <td><input type="number" class="edit-billed form-control" value="${billMins}" min="0" style="width:70px"> мин</td>
          <td>
            <input type="number" class="edit-energy form-control" value="${s.energy_level || 3}" min="1" max="5" style="width:60px">
          </td>
          <td>
            <button class="btn-icon text-success btn-save-edit" data-id="${s.id}">✓</button>
            <button class="btn-icon text-muted btn-cancel-edit">&times;</button>
          </td>
        </tr>
      `;
    }

    return `
      <tr>
        <td>${formatDateTime(s.start_time)}</td>
        <td>${formatTime(s.actual_time_seconds)}</td>
        <td>${formatTime(s.billed_time_seconds)}</td>
        <td>${s.energy_level ? '⚡'.repeat(s.energy_level) : '—'}</td>
        <td>
          <button class="btn-icon btn-edit-ts" data-id="${s.id}" title="Редактировать">✏️</button>
          <button class="btn-icon text-danger btn-delete-ts" data-id="${s.id}" title="Удалить">🗑️</button>
        </td>
      </tr>
    `;
  }

  private setupEventListeners(): void {
    // Add manual
    this.element.querySelector('#btn-add-manual')?.addEventListener('click', () => {
      const dialog = new ManualTimeEntryDialog({
        taskId: this.props.taskId,
        onSave: () => this.loadData()
      });
      dialog.open();
    });

    // Delete
    this.element.querySelectorAll('.btn-delete-ts').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
        if (confirm('Точно удалить эту запись времени?')) {
          try {
            await api.deleteTimeSegment(id);
            this.loadData();
          } catch (error) {
            showError('Не удалось удалить');
          }
        }
      });
    });

    // Start inline edit
    this.element.querySelectorAll('.btn-edit-ts').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
        this.setState({ editingId: id });
      });
    });

    // Cancel edit
    this.element.querySelectorAll('.btn-cancel-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setState({ editingId: null });
      });
    });

    // Save inline edit
    this.element.querySelectorAll('.btn-save-edit').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tr = (e.currentTarget as HTMLElement).closest('tr')!;
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
        
        const actMins = parseInt((tr.querySelector('.edit-actual') as HTMLInputElement).value);
        const billMins = parseInt((tr.querySelector('.edit-billed') as HTMLInputElement).value);
        const energy = parseInt((tr.querySelector('.edit-energy') as HTMLInputElement).value);

        try {
          await api.updateTimeSegment(id, {
            actual_time_seconds: actMins * 60,
            billed_time_seconds: billMins * 60,
            energy_level: energy
          });
          this.loadData();
        } catch (error) {
          showError('Не удалось сохранить изменения');
        }
      });
    });
  }
}
