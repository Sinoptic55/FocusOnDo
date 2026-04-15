/**
 * Unpaid Tasks Report component - displays completed but unpaid tasks with time aggregation
 */

import type { UnpaidTaskData, UnpaidTasksFilters, Project, Client, TaskList } from '../models';
import { api } from '../api';
import { showSuccess, showError } from '../utils';

export class UnpaidTasksReport {
  private element: HTMLElement | null = null;
  private tasks: UnpaidTaskData[] = [];
  private filters: UnpaidTasksFilters = {};
  private projects: Project[] = [];
  private clients: Client[] = [];
  private lists: TaskList[] = [];

  constructor() {
    this.createElements();
  }

  /**
   * Create component elements
   */
  private createElements(): void {
    this.element = document.createElement('div');
    this.element.className = 'unpaid-tasks-report';
    this.element.innerHTML = `
      <div class="unpaid-report-header">
        <h3>Неоплаченные задачи</h3>
        <button class="btn btn-primary" id="export-unpaid-ods">Экспорт в ODS</button>
      </div>
      <div class="unpaid-filters">
        <div class="filter-group">
          <label for="filter-project">Проект:</label>
          <select id="filter-project">
            <option value="">Все проекты</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-client">Клиент:</label>
          <select id="filter-client">
            <option value="">Все клиенты</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-list">Список задач:</label>
          <select id="filter-list">
            <option value="">Все списки</option>
          </select>
        </div>
        <button class="btn btn-secondary" id="apply-filters">Применить</button>
      </div>
      <div class="unpaid-content">
        <div id="unpaid-tasks-table" class="data-table">
          <p class="empty-state">Загрузка...</p>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.element) return;

    const applyBtn = this.element.querySelector('#apply-filters');
    applyBtn?.addEventListener('click', () => this.applyFilters());

    const exportBtn = this.element.querySelector('#export-unpaid-ods');
    exportBtn?.addEventListener('click', () => this.exportToOds());

    // Load reference data
    this.loadReferenceData();
  }

  /**
   * Load reference data for filters
   */
  private async loadReferenceData(): Promise<void> {
    try {
      const [projects, clients, lists] = await Promise.all([
        api.getProjects(),
        api.getClients(),
        api.getLists()
      ]);
      
      this.projects = projects.filter((p: Project) => !p.archived);
      this.clients = clients;
      this.lists = lists;
      
      this.populateFilters();
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  }

  /**
   * Populate filter dropdowns
   */
  private populateFilters(): void {
    if (!this.element) return;

    const projectSelect = this.element.querySelector('#filter-project') as HTMLSelectElement;
    const clientSelect = this.element.querySelector('#filter-client') as HTMLSelectElement;
    const listSelect = this.element.querySelector('#filter-list') as HTMLSelectElement;

    // Projects
    projectSelect.innerHTML = '<option value="">Все проекты</option>' +
      this.projects.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('');

    // Clients
    clientSelect.innerHTML = '<option value="">Все клиенты</option>' +
      this.clients.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');

    // Lists
    listSelect.innerHTML = '<option value="">Все списки</option>' +
      this.lists.map(l => `<option value="${l.id}">${this.escapeHtml(l.name)}</option>`).join('');
  }

  /**
   * Apply filters and reload data
   */
  private applyFilters(): void {
    if (!this.element) return;

    const projectSelect = this.element.querySelector('#filter-project') as HTMLSelectElement;
    const clientSelect = this.element.querySelector('#filter-client') as HTMLSelectElement;
    const listSelect = this.element.querySelector('#filter-list') as HTMLSelectElement;

    this.filters = {
      project_id: projectSelect.value ? parseInt(projectSelect.value) : null,
      client_id: clientSelect.value ? parseInt(clientSelect.value) : null,
      list_id: listSelect.value ? parseInt(listSelect.value) : null
    };

    this.loadData();
  }

  /**
   * Load report data
   */
  private async loadData(): Promise<void> {
    try {
      this.tasks = await api.getUnpaidTasks(this.filters);
      this.renderTable();
    } catch (error) {
      console.error('Failed to load unpaid tasks:', error);
      showError('Не удалось загрузить отчёт по неоплаченным задачам');
    }
  }

  /**
   * Render tasks table
   */
  private renderTable(): void {
    if (!this.element) return;

    const table = this.element.querySelector('#unpaid-tasks-table')!;
    
    if (this.tasks.length === 0) {
      table.innerHTML = '<p class="empty-state">Нет неоплаченных задач</p>';
      return;
    }

    table.innerHTML = `
      <table class="unpaid-table">
        <thead>
          <tr>
            <th>Задача</th>
            <th>Дата окончания</th>
            <th>Продолжительность (мин)</th>
            <th>Продолжительность к оплате (мин)</th>
          </tr>
        </thead>
        <tbody>
          ${this.tasks.map(t => `
            <tr>
              <td>${this.escapeHtml(t.task_title)}</td>
              <td>${t.end_date ? this.formatDate(t.end_date) : '-'}</td>
              <td>${t.actual_time_minutes}</td>
              <td>${t.billed_time_minutes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Export to ODS
   */
  private async exportToOds(): Promise<void> {
    try {
      const blob = await api.exportUnpaidTasksOds(this.filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'unpaid_tasks.ods';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Отчёт экспортирован в ODS');
    } catch (error) {
      console.error('Export failed:', error);
      showError('Не удалось экспортировать отчёт');
    }
  }

  /**
   * Format date for display
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get the component element
   */
  public getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Refresh data
   */
  public refresh(): void {
    this.loadData();
  }
}
