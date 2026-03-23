/**
 * Main Layout component
 */

import { Component } from './component';
import { timerManager } from './timer';
import { TaskSelector } from './task-selector';

export class Layout extends Component {
  private header: HTMLElement | null = null;
  private sidebar: HTMLElement | null = null;
  private main: HTMLElement | null = null;
  private footer: HTMLElement | null = null;
  private taskSelector: TaskSelector | null = null;

  constructor() {
    super('div', 'app-layout');
    this.initTimer();
  }

  private initTimer(): void {
    timerManager.subscribe((state) => {
      this.updateTimer(
        timerManager.getFormattedTime(),
        timerManager.getIntervalLabel(),
        state.currentTask?.title || 'Не выбрана',
        state.currentInterval?.type || 'work'
      );
      this.updateTimerControls(state.active);
    });
  }

  private updateTimerControls(active: boolean): void {
    const startBtn = this.element.querySelector('#timer-start-btn');
    const pauseBtn = this.element.querySelector('#timer-pause-btn');

    if (active) {
      startBtn?.classList.add('hidden');
      pauseBtn?.classList.remove('hidden');
    } else {
      startBtn?.classList.remove('hidden');
      pauseBtn?.classList.add('hidden');
    }
  }

  public updateUserInfo(username: string): void {
    const nameEl = this.element.querySelector('#user-name');
    if (nameEl) {
      nameEl.textContent = username;
    }
  }

  public updateTimer(time: string, typeLabel: string, taskName: string, typeId: string): void {
    const timeEl = this.element.querySelector('#timer-time');
    const typeEl = this.element.querySelector('#timer-type');
    const taskEl = this.element.querySelector('#timer-task-name');
    const widgetEl = this.element.querySelector('#timer-widget');
    
    if (timeEl) timeEl.textContent = time;
    if (typeEl) {
      typeEl.textContent = typeLabel;
      typeEl.className = `timer-type interval-${typeId}`;
    }
    if (taskEl) taskEl.textContent = taskName;
    if (widgetEl) {
      widgetEl.className = `timer-widget interval-${typeId}`;
    }
  }

  protected render(): void {
    this.element.innerHTML = `
      <header id="header" class="header">
        <div class="header-left">
          <button id="sidebar-toggle" class="btn-icon">☰</button>
          <div class="logo">Pomodoro TMS</div>
        </div>
        <div class="header-right">
          <span id="user-name" class="user-name"></span>
          <button id="logout-btn" class="btn-link">Выйти</button>
        </div>
      </header>
      
      <div class="app-body">
        <aside id="sidebar" class="app-sidebar">
          <nav class="sidebar-nav">
            <a href="/" class="nav-item active" data-path="/">
              <span class="icon">📋</span>
              <span class="label">Задачи</span>
            </a>
            <a href="/analytics" class="nav-item" data-path="/analytics">
              <span class="icon">📊</span>
              <span class="label">Аналитика</span>
            </a>
            <a href="/settings" class="nav-item" data-path="/settings">
              <span class="icon">⚙️</span>
              <span class="label">Настройки</span>
            </a>
          </nav>
        </aside>
        
        <main id="main-content" class="main">
          <div id="view-container"></div>
        </main>
      </div>
      
      <div id="timer-widget" class="timer-widget interval-work">
        <div class="timer-task">
          <span id="timer-task-name" class="task-name">Не выбрана</span>
        </div>
        <div class="timer-info">
          <span id="timer-time" class="timer-time">25:00</span>
          <span id="timer-type" class="timer-type interval-work">Работа</span>
        </div>
        <div class="timer-controls">
          <button id="timer-start-btn" class="btn-circle btn-primary" title="Старт">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          <button id="timer-pause-btn" class="btn-circle btn-secondary hidden" title="Пауза">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          </button>
          <button id="timer-skip-btn" class="btn-circle btn-tertiary" title="Пропустить">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.makeTimerDraggable();
  }

  private setupEventListeners(): void {
    const toggle = this.element.querySelector('#sidebar-toggle');
    const sidebar = this.element.querySelector('#sidebar');
    
    toggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
    });

    const startBtn = this.element.querySelector('#timer-start-btn');
    const pauseBtn = this.element.querySelector('#timer-pause-btn');
    const skipBtn = this.element.querySelector('#timer-skip-btn');

    startBtn?.addEventListener('click', () => {
      const state = timerManager.getState();
      if (!state.currentTaskId) {
        if (!this.taskSelector) {
          this.taskSelector = new TaskSelector({
            onSelect: async (taskId) => {
              await timerManager.start(taskId);
            }
          });
        }
        this.taskSelector.open();
      } else {
        timerManager.start(state.currentTaskId);
      }
    });

    pauseBtn?.addEventListener('click', () => {
      timerManager.pause();
    });

    skipBtn?.addEventListener('click', () => {
      timerManager.skip();
    });
  }

  private makeTimerDraggable(): void {
    const widget = this.element.querySelector('#timer-widget') as HTMLElement;
    if (!widget) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let startRight = 0, startBottom = 0;
    
    const savedPos = localStorage.getItem('timer-widget-pos');
    if (savedPos) {
      try {
        const pos = JSON.parse(savedPos);
        widget.style.right = pos.right;
        widget.style.bottom = pos.bottom;
      } catch (e) {}
    }

    widget.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const computedStyle = window.getComputedStyle(widget);
      startRight = parseInt(computedStyle.right, 10) || 20;
      startBottom = parseInt(computedStyle.bottom, 10) || 20;
      
      widget.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = startX - e.clientX;
      const deltaY = startY - e.clientY;
      
      widget.style.right = `${startRight + deltaX}px`;
      widget.style.bottom = `${startBottom + deltaY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        widget.style.transition = 'opacity 0.2s';
        
        localStorage.setItem('timer-widget-pos', JSON.stringify({
          right: widget.style.right,
          bottom: widget.style.bottom
        }));
      }
    });
  }

  public getViewContainer(): HTMLElement {
    return this.element.querySelector('#view-container') as HTMLElement;
  }

  public setActiveNavItem(path: string): void {
    this.element.querySelectorAll('.nav-item').forEach(item => {
      const itemPath = item.getAttribute('data-path');
      if (itemPath === path) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  public showAuth(show: boolean): void {
    const header = this.element.querySelector('#header');
    const sidebar = this.element.querySelector('#sidebar');
    const footer = this.element.querySelector('#timer-widget');
    
    if (show) {
      header?.classList.remove('hidden');
      sidebar?.classList.remove('hidden');
      footer?.classList.remove('hidden');
    } else {
      header?.classList.add('hidden');
      sidebar?.classList.add('hidden');
      footer?.classList.add('hidden');
    }
  }
}
