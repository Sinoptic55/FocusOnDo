/**
 * Analytics Reports component - project and client time reports
 */

import type { ProjectTimeData, ClientTimeData } from '../models';
import { api } from '../api';
import { formatTime, showSuccess, showError } from '../utils';
import { UnpaidTasksReport } from './unpaid-tasks-report';

export class AnalyticsReports {
  private element: HTMLElement | null = null;
  private projectData: ProjectTimeData[] = [];
  private clientData: ClientTimeData[] = [];
  private activeTab: 'projects' | 'clients' | 'unpaid' = 'projects';
  private unpaidReport: UnpaidTasksReport | null = null;

  constructor() {
    this.createElements();
  }

  /**
   * Create dialog elements
   */
  private createElements(): void {
    this.element = document.createElement('div');
    this.element.className = 'analytics-reports';
    this.element.innerHTML = `
      <div class="reports-header">
        <button class="tab-btn ${this.activeTab === 'projects' ? 'active' : ''}" data-tab="projects">Проекты</button>
        <button class="tab-btn ${this.activeTab === 'clients' ? 'active' : ''}" data-tab="clients">Клиенты</button>
        <button class="tab-btn ${this.activeTab === 'unpaid' ? 'active' : ''}" data-tab="unpaid">Неоплаченные</button>
      </div>
      <div class="reports-content">
        <div id="projects-report" class="report-section">
          <h3>Время по проектам</h3>
          <div id="projects-table" class="data-table">
            <!-- Projects data will be rendered here -->
          </div>
        </div>
        <div id="clients-report" class="report-section hidden">
          <h3>Время по клиентам</h3>
          <div id="clients-table" class="data-table">
            <!-- Clients data will be rendered here -->
          </div>
        </div>
        <div id="unpaid-report" class="report-section hidden">
          <!-- Unpaid tasks report component will be rendered here -->
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

    const tabButtons = this.element.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab')!;
        this.switchTab(tab as 'projects' | 'clients' | 'unpaid');
      });
    });
  }

  /**
   * Switch tab
   */
  private switchTab(tab: 'projects' | 'clients' | 'unpaid'): void {
    this.activeTab = tab;
    
    // Update button states
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Show/hide sections
    const projectsSection = this.element.querySelector('#projects-report')!;
    const clientsSection = this.element.querySelector('#clients-report')!;
    const unpaidSection = this.element.querySelector('#unpaid-report')!;
    
    projectsSection.classList.toggle('hidden', tab !== 'projects');
    clientsSection.classList.toggle('hidden', tab !== 'clients');
    unpaidSection.classList.toggle('hidden', tab !== 'unpaid');

    // Load data for active tab
    if (tab === 'projects') {
      this.loadProjectData();
    } else if (tab === 'clients') {
      this.loadClientData();
    } else if (tab === 'unpaid') {
      this.loadUnpaidReport();
    }
  }

  /**
   * Load unpaid tasks report
   */
  private loadUnpaidReport(): void {
    const container = this.element?.querySelector('#unpaid-report');
    if (!container) return;

    if (!this.unpaidReport) {
      this.unpaidReport = new UnpaidTasksReport();
      const reportEl = this.unpaidReport.getElement();
      if (reportEl) {
        container.appendChild(reportEl);
      }
    }
    
    this.unpaidReport?.refresh();
  }

  /**
   * Load project data
   */
  private async loadProjectData(): Promise<void> {
    try {
      const data = await api.getProjectTime();
      this.projectData = data.projects;
      this.renderProjectsTable();
    } catch (error) {
      console.error('Failed to load project time data:', error);
      showError('Не удалось загрузить данные по проектам');
    }
  }

  /**
   * Load client data
   */
  private async loadClientData(): Promise<void> {
    try {
      const data = await api.getClientTime();
      this.clientData = data.clients;
      this.renderClientsTable();
    } catch (error) {
      console.error('Failed to load client time data:', error);
      showError('Не удалось загрузить данные по клиентам');
    }
  }

  /**
   * Render projects table
   */
  private renderProjectsTable(): void {
    if (!this.element) return;

    const table = this.element.querySelector('#projects-table')!;
    
    if (this.projectData.length === 0) {
      table.innerHTML = '<p class="empty-state">Нет данных по проектам</p>';
      return;
    }

    table.innerHTML = this.projectData.map(p => `
      <div class="table-row">
        <div class="project-indicator" style="background-color: ${p.project_color}"></div>
        <div class="project-name">${this.escapeHtml(p.project_name)}</div>
        <div class="project-time">${this.formatTime(p.actual_time_seconds)}</div>
        <div class="project-time">${this.formatTime(p.billed_time_seconds)}</div>
      </div>
    `).join('');
  }

  /**
   * Render clients table
   */
  private renderClientsTable(): void {
    if (!this.element) return;

    const table = this.element.querySelector('#clients-table')!;
    
    if (this.clientData.length === 0) {
      table.innerHTML = '<p class="empty-state">Нет данных по клиентам</p>';
      return;
    }

    table.innerHTML = this.clientData.map(c => `
      <div class="table-row client-row" data-client-id="${c.client_id}">
        <div class="client-name">${this.escapeHtml(c.client_name)}</div>
        <div class="client-time">${this.formatTime(c.actual_time_seconds)}</div>
        <div class="client-time">${this.formatTime(c.billed_time_seconds)}</div>
        <button class="btn btn-sm btn-expand" data-client-id="${c.client_id}">▼</button>
      </div>
    `).join('');

    // Setup expand buttons
    this.setupClientExpand();
  }

  /**
   * Setup client expand buttons
   */
  private setupClientExpand(): void {
    if (!this.element) return;

    this.element.querySelectorAll('.client-row').forEach(row => {
      const expandBtn = row.querySelector('.btn-expand')!;
      
      expandBtn.addEventListener('click', () => {
        const clientId = parseInt(expandBtn.getAttribute('data-client-id')!);
        const clientProjects = this.clientData.find(c => c.client_id === clientId)?.projects || [];
        
        if (clientProjects.length === 0) {
          showError('Нет проектов для этого клиента');
          return;
        }

        // Show projects for this client
        const projectsDiv = document.createElement('div');
        projectsDiv.className = 'client-projects';
        projectsDiv.innerHTML = `
          <h4>Проекты клиента: ${this.escapeHtml(this.clientData.find(c => c.client_id === clientId)?.client_name || '')}</h4>
          ${clientProjects.map(p => `
            <div class="client-project-item">
              <div class="project-indicator" style="background-color: ${p.project_color}"></div>
              <div class="project-name">${this.escapeHtml(p.project_name)}</div>
              <div class="project-time">${this.formatTime(p.actual_time_seconds)}</div>
              <div class="project-time">${this.formatTime(p.billed_time_seconds)}</div>
            </div>
          `).join('')}
        `;

        // Replace row with expanded view
        const newRow = document.createElement('div');
        newRow.className = 'table-row client-row-expanded';
        newRow.innerHTML = `
          <div class="client-name">${this.escapeHtml(this.clientData.find(c => c.client_id === clientId)?.client_name || '')}</div>
          <div class="client-projects">${projectsDiv.outerHTML}</div>
          <button class="btn btn-sm btn-collapse" data-client-id="${clientId}">▲</button>
        `;

        row.replaceWith(newRow);

        // Setup collapse button
        const collapseBtn = newRow.querySelector('.btn-collapse')!;
        collapseBtn.addEventListener('click', () => {
          const originalRow = document.createElement('div');
          originalRow.className = 'table-row client-row';
          originalRow.innerHTML = `
            <div class="client-name">${this.escapeHtml(this.clientData.find(c => c.client_id === clientId)?.client_name || '')}</div>
            <button class="btn btn-sm btn-expand" data-client-id="${clientId}">▼</button>
          `;

          newRow.replaceWith(originalRow);
        });
      });
    });
  }

  /**
   * Format time
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes.toString().padStart(2, '0')}м`;
    }
    return `${minutes}м`;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get element
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Global instance
export const analyticsReports = new AnalyticsReports();
