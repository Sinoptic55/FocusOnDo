/**
 * Time Segments Editor Dialog - полный редактор сегментов времени задачи
 * Открывается из формы задачи по кнопке рядом с заголовком "Основное"
 */

import { Dialog } from './dialog';
import type { TimeSegment } from '../models';
import { api } from '../api';
import { formatTime, formatDateTime, showSuccess, showError } from '../utils';

interface TimeSegmentsEditorState {
  segments: TimeSegment[];
  loading: boolean;
  editingId: number | null;
  showAddForm: boolean;
}

interface TimeSegmentsEditorProps {
  taskId: number;
  onSegmentsChanged?: () => void;
}

export class TimeSegmentsEditorDialog extends Dialog<TimeSegmentsEditorState, TimeSegmentsEditorProps> {
  constructor(props: TimeSegmentsEditorProps) {
    super('time-segments-editor-dialog', props, {
      segments: [],
      loading: true,
      editingId: null,
      showAddForm: false
    });
  }

  protected async onOpen(): Promise<void> {
    this.setState({ loading: true });
    try {
      const segments = await api.getTimeSegments(this.props.taskId);
      // Сортировка: newest first
      segments.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      this.setState({ segments, loading: false, editingId: null, showAddForm: false });
    } catch (e) {
      showError('Не удалось загрузить историю времени');
      this.setState({ loading: false });
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = `
        <div class="dialog-header">
          <h2>⏱ Сегменты времени</h2>
          <button class="dialog-close">&times;</button>
        </div>
        <div class="dialog-body"><div class="loader">Загрузка...</div></div>
      `;
      this.setupCloseHandler();
      return;
    }

    const totalActual = this.state.segments.reduce((acc, s) => acc + s.actual_time_seconds, 0);
    const totalBilled = this.state.segments.reduce((acc, s) => acc + s.billed_time_seconds, 0);

    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>⏱ Сегменты времени</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body">
        <div class="ts-editor-summary mb-md">
          <span>Фактическое: <strong>${formatTime(totalActual)}</strong></span> |
          <span>Выставленное: <strong>${formatTime(totalBilled)}</strong></span> |
          <span>Записей: <strong>${this.state.segments.length}</strong></span>
        </div>

        <div class="ts-editor-actions mb-md">
          <button class="btn btn-sm btn-secondary" id="btn-add-segment">+ Добавить сегмент</button>
        </div>

        ${this.state.showAddForm ? this.renderAddForm() : ''}

        <div class="ts-editor-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Начало</th>
                <th>Длительность</th>
                <th>Факт</th>
                <th>Выставлено</th>
                <th>Энергия</th>
                <th>Прогресс</th>
                <th>Застревание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              ${this.state.segments.length === 0 ? '<tr><td colspan="8" class="text-center">Нет записей</td></tr>' : ''}
              ${this.state.segments.map(s => this.renderRow(s)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Закрыть</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private renderAddForm(): string {
    const now = new Date();
    now.setSeconds(0, 0);
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);

    return `
      <div class="add-segment-form mb-md">
        <h4>Новый сегмент</h4>
        <form id="add-segment-form">
          <div class="form-row">
            <div class="form-group">
              <label>Начало</label>
              <input type="datetime-local" name="start_time" value="${localISOTime}" required>
            </div>
            <div class="form-group">
              <label>Длительность (мин)</label>
              <input type="number" name="duration_seconds" value="25" min="1" required>
            </div>
            <div class="form-group">
              <label>Факт (мин)</label>
              <input type="number" name="actual_time_seconds" value="25" min="1" required>
            </div>
            <div class="form-group">
              <label>Выставлено (мин)</label>
              <input type="number" name="billed_time_seconds" value="25" min="1" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Энергия (1-5)</label>
              <input type="number" name="energy_level" value="3" min="1" max="5">
            </div>
            <div class="form-group checkbox-group">
              <label><input type="checkbox" name="task_progressed"> Прогресс</label>
            </div>
            <div class="form-group checkbox-group">
              <label><input type="checkbox" name="stuck"> Застревание</label>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-sm btn-secondary" id="btn-cancel-add">Отмена</button>
            <button type="submit" class="btn btn-sm btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    `;
  }

  private renderRow(s: TimeSegment): string {
    const isEditing = this.state.editingId === s.id;

    if (isEditing) {
      const durMins = Math.round(s.duration_seconds / 60);
      const actMins = Math.round(s.actual_time_seconds / 60);
      const billMins = Math.round(s.billed_time_seconds / 60);

      return `
        <tr class="ts-editing-row">
          <td>${formatDateTime(s.start_time)}</td>
          <td><input type="number" class="edit-duration form-control" value="${durMins}" min="0" style="width:70px"> мин</td>
          <td><input type="number" class="edit-actual form-control" value="${actMins}" min="0" style="width:70px"> мин</td>
          <td><input type="number" class="edit-billed form-control" value="${billMins}" min="0" style="width:70px"> мин</td>
          <td>
            <input type="number" class="edit-energy form-control" value="${s.energy_level || 3}" min="1" max="5" style="width:60px">
          </td>
          <td>
            <input type="checkbox" class="edit-progressed" ${s.task_progressed ? 'checked' : ''}>
          </td>
          <td>
            <input type="checkbox" class="edit-stuck" ${s.stuck ? 'checked' : ''}>
          </td>
          <td>
            <button class="btn-icon text-success btn-save-edit" data-id="${s.id}" title="Сохранить">✓</button>
            <button class="btn-icon text-muted btn-cancel-edit" title="Отмена">&times;</button>
          </td>
        </tr>
      `;
    }

    return `
      <tr>
        <td>${formatDateTime(s.start_time)}</td>
        <td>${formatTime(s.duration_seconds)}</td>
        <td>${formatTime(s.actual_time_seconds)}</td>
        <td>${formatTime(s.billed_time_seconds)}</td>
        <td>${s.energy_level ? '⚡'.repeat(s.energy_level) : '—'}</td>
        <td>${s.task_progressed ? '<span class="text-success">✓</span>' : '—'}</td>
        <td>${s.stuck ? '<span class="text-warning">⚠</span>' : '—'}</td>
        <td>
          <button class="btn-icon btn-edit-ts" data-id="${s.id}" title="Редактировать">✏️</button>
          <button class="btn-icon text-danger btn-delete-ts" data-id="${s.id}" title="Удалить">🗑️</button>
        </td>
      </tr>
    `;
  }

  private setupCloseHandler(): void {
    this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());
  }

  private setupEventListeners(): void {
    this.setupCloseHandler();
    this.element.querySelector('.cancel-btn')?.addEventListener('click', () => this.close());

    // Show add form
    this.element.querySelector('#btn-add-segment')?.addEventListener('click', () => {
      this.setState({ showAddForm: true });
    });

    // Cancel add form
    this.element.querySelector('#btn-cancel-add')?.addEventListener('click', () => {
      this.setState({ showAddForm: false });
    });

    // Submit add form
    this.element.querySelector('#add-segment-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const fd = new FormData(form);
      const startTime = new Date(fd.get('start_time') as string).toISOString();
      const durationSecs = parseInt(fd.get('duration_seconds') as string) * 60;
      const actualSecs = parseInt(fd.get('actual_time_seconds') as string) * 60;
      const billedSecs = parseInt(fd.get('billed_time_seconds') as string) * 60;
      const energyLevel = parseInt(fd.get('energy_level') as string);

      try {
        await api.createTimeSegment({
          task_id: this.props.taskId,
          start_time: startTime,
          duration_seconds: durationSecs,
          actual_time_seconds: actualSecs,
          billed_time_seconds: billedSecs,
          energy_level: energyLevel,
          task_progressed: fd.get('task_progressed') === 'on',
          stuck: fd.get('stuck') === 'on'
        });
        showSuccess('Сегмент добавлен');
        this.onOpen(); // Reload data
        this.props.onSegmentsChanged?.();
      } catch (err) {
        showError('Ошибка добавления сегмента');
      }
    });

    // Delete segment
    this.element.querySelectorAll('.btn-delete-ts').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
        if (confirm('Удалить этот сегмент времени?')) {
          try {
            await api.deleteTimeSegment(id);
            showSuccess('Сегмент удалён');
            this.onOpen();
            this.props.onSegmentsChanged?.();
          } catch (err) {
            showError('Не удалось удалить сегмент');
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

        const durMins = parseInt((tr.querySelector('.edit-duration') as HTMLInputElement).value);
        const actMins = parseInt((tr.querySelector('.edit-actual') as HTMLInputElement).value);
        const billMins = parseInt((tr.querySelector('.edit-billed') as HTMLInputElement).value);
        const energy = parseInt((tr.querySelector('.edit-energy') as HTMLInputElement).value);
        const progressed = (tr.querySelector('.edit-progressed') as HTMLInputElement).checked;
        const stuck = (tr.querySelector('.edit-stuck') as HTMLInputElement).checked;

        try {
          await api.updateTimeSegment(id, {
            duration_seconds: durMins * 60,
            actual_time_seconds: actMins * 60,
            billed_time_seconds: billMins * 60,
            energy_level: energy,
            task_progressed: progressed,
            stuck: stuck
          });
          showSuccess('Изменения сохранены');
          this.onOpen();
          this.props.onSegmentsChanged?.();
        } catch (err) {
          showError('Не удалось сохранить изменения');
        }
      });
    });
  }
}
