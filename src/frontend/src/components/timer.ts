/**
 * TimerManager for Pomodoro timer state and Ticker logic
 */

import type { PomodoroInterval, Task } from '../models';
import { api } from '../api';
import { formatTime, showSuccess, showWarning, storage } from '../utils';
import { PostWorkDialog } from './post-work-dialog';

export interface TimerState {
  active: boolean;
  currentInterval: PomodoroInterval | null;
  currentTaskId: number | null;
  currentTask: Task | null;
  remainingSeconds: number;
  intervalIndex: number;
  segmentStartTime: number | null;
  segmentStartRemainingSeconds: number | null;
}

export type TimerListener = (state: TimerState) => void;

export class TimerManager {
  private static instance: TimerManager;
  private state: TimerState;
  private intervals: PomodoroInterval[] = [];
  private tickerId: number | null = null;
  private listeners: TimerListener[] = [];
  private postWorkDialog: PostWorkDialog | null = null;
  private channel: BroadcastChannel;

  private constructor() {
    this.state = {
      active: false,
      currentInterval: null,
      currentTaskId: null,
      currentTask: null,
      remainingSeconds: 25 * 60,
      intervalIndex: 0,
      segmentStartTime: null,
      segmentStartRemainingSeconds: null
    };

    this.channel = new BroadcastChannel('pomodoro-tms-timer');
    this.setupBroadcastChannel();
    this.loadState();
  }

  private setupBroadcastChannel(): void {
    this.channel.addEventListener('message', (event) => {
      if (event.data.type === 'TIMER_STARTED') {
        if (this.state.active) {
          showWarning('Таймер запущен в другой вкладке! Эта вкладка будет приостановлена.');
          this.stopTicker();
          this.state.active = false;
          this.notify();
        } else {
          showWarning('Таймер запущен в другой вкладке.');
        }
      }
    });
  }

  public static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  private loadState(): void {
    const saved = storage.get<Partial<TimerState>>('timer-state', {});
    this.state = { ...this.state, ...saved };
    
    if (this.state.active && this.state.segmentStartTime && this.state.segmentStartRemainingSeconds) {
      const elapsedSinceStart = Math.floor((Date.now() - this.state.segmentStartTime) / 1000);
      this.state.remainingSeconds = Math.max(0, this.state.segmentStartRemainingSeconds - elapsedSinceStart);
      
      if (this.state.remainingSeconds === 0) {
        // Interval completed while away
        this.onComplete();
        return;
      } else {
        this.startTicker();
        this.channel.postMessage({ type: 'TIMER_STARTED' });
      }
    } else {
      this.state.active = false; // Failsafe
    }
  }

  private saveState(): void {
    storage.set('timer-state', {
      active: this.state.active,
      currentTaskId: this.state.currentTaskId,
      remainingSeconds: this.state.remainingSeconds,
      intervalIndex: this.state.intervalIndex,
      segmentStartTime: this.state.segmentStartTime,
      segmentStartRemainingSeconds: this.state.segmentStartRemainingSeconds
    });
  }

  public async init(): Promise<void> {
    try {
      this.intervals = await api.getIntervals();
      if (this.intervals.length > 0) {
        this.state.currentInterval = this.intervals[this.state.intervalIndex] || this.intervals[0];
        if (!this.state.active) {
          this.state.remainingSeconds = this.state.currentInterval!.duration_minutes * 60;
        } else if (this.state.currentTaskId && !this.state.currentTask) {
          // Restore task context if active
          this.state.currentTask = await api.getTask(this.state.currentTaskId);
        }
        this.notify();
      }
    } catch (error) {
      console.error('Failed to load intervals:', error);
    }
  }

  public subscribe(listener: TimerListener): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l(this.state));
  }

  public async start(taskId: number | null): Promise<void> {
    try {
      if (taskId) {
        this.state.currentTaskId = taskId;
        const task = await api.getTask(taskId);
        this.state.currentTask = task;
      }

      this.state.active = true;
      this.state.segmentStartTime = Date.now();
      this.state.segmentStartRemainingSeconds = this.state.remainingSeconds;
      
      this.saveState();
      this.startTicker();
      this.channel.postMessage({ type: 'TIMER_STARTED' });
      this.notify();
      showSuccess('Таймер запущен');
    } catch (error) {
      console.error('Failed to start timer:', error);
      showError('Ошибка запуска таймера');
    }
  }

  public async pause(): Promise<void> {
    try {
      await this.saveSegment();
      
      this.state.active = false;
      this.state.segmentStartTime = null;
      this.state.segmentStartRemainingSeconds = null;
      this.stopTicker();
      this.saveState();
      this.notify();
      showSuccess('Таймер на паузе');
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  }

  public async skip(): Promise<void> {
    try {
      if (this.state.active) {
        await this.saveSegment();
      }
      this.state.active = false;
      this.stopTicker();
      this.nextInterval();
      showWarning('Интервал пропущен');
    } catch (error) {
      console.error('Failed to skip interval:', error);
    }
  }

  private nextInterval(): void {
    this.state.intervalIndex = (this.state.intervalIndex + 1) % this.intervals.length;
    this.state.currentInterval = this.intervals[this.state.intervalIndex] || null;
    if (this.state.currentInterval) {
      this.state.remainingSeconds = this.state.currentInterval.duration_minutes * 60;
    }
    this.state.segmentStartTime = null;
    this.state.segmentStartRemainingSeconds = null;
    this.saveState();
    this.notify();
  }

  private startTicker(): void {
    if (this.tickerId) clearInterval(this.tickerId);
    this.tickerId = window.setInterval(() => {
      // Calculate true remaining time to avoid setInterval drift
      if (this.state.segmentStartTime && this.state.segmentStartRemainingSeconds) {
        const elapsed = Math.floor((Date.now() - this.state.segmentStartTime) / 1000);
        this.state.remainingSeconds = Math.max(0, this.state.segmentStartRemainingSeconds - elapsed);
      }

      if (this.state.remainingSeconds > 0) {
        if (this.state.remainingSeconds % 10 === 0) {
          this.saveState();
        }
        this.notify();
      } else {
        this.onComplete();
      }
    }, 1000);
  }

  private stopTicker(): void {
    if (this.tickerId) {
      clearInterval(this.tickerId);
      this.tickerId = null;
    }
  }

  private async saveSegment(postWorkData?: any): Promise<void> {
    if (!this.state.currentTaskId || !this.state.segmentStartTime || !this.state.segmentStartRemainingSeconds) return;

    const actualSeconds = this.state.segmentStartRemainingSeconds - this.state.remainingSeconds;
    if (actualSeconds <= 0) return;

    const startTimeIso = new Date(this.state.segmentStartTime).toISOString();

    try {
      await api.createTimeSegment({
        task_id: this.state.currentTaskId,
        start_time: startTimeIso,
        duration_seconds: actualSeconds,
        actual_time_seconds: actualSeconds,
        billed_time_seconds: actualSeconds,
        energy_level: postWorkData?.energyLevel || null,
        task_progressed: postWorkData?.taskProgressed ?? null,
        stuck: postWorkData?.stuck ?? null
      });
      
      // Update current task total time locally so UI can reflect it immediately upon refresh
      if (this.state.currentTask) {
        this.state.currentTask.total_time = (this.state.currentTask.total_time || 0) + actualSeconds;
      }
    } catch (error) {
      console.error('Failed to save time segment:', error);
    }
  }

  private async onComplete(): Promise<void> {
    this.stopTicker();
    this.state.active = false;
    this.saveState();
    this.notify();
    
    this.playSound();
    
    if (this.state.currentTask && this.state.currentInterval?.type === 'work') {
      if (this.postWorkDialog) {
        this.postWorkDialog.unmount();
      }
      
      this.postWorkDialog = new PostWorkDialog({
        taskTitle: this.state.currentTask.title,
        onSubmit: async (result) => {
          await this.saveSegment(result);
          showSuccess('Интервал завершен!');
          
          if (result.stuck) {
            import('./confirm-dialog').then(({ ConfirmDialog }) => {
              const dialog = new ConfirmDialog({
                title: 'Нужна помощь?',
                message: 'Кажется, вы застряли на этой задаче. Хотите разбить её на более мелкие шаги?',
                confirmText: 'Разбить задачу',
                onConfirm: () => {
                  import('./task-form').then(({ TaskForm }) => {
                    const form = new TaskForm({
                      taskId: this.state.currentTask!.id,
                      onSave: () => {}
                    });
                    form.open();
                  });
                }
              });
              dialog.open();
            });
          }

          this.nextInterval();
        }
      });
      this.postWorkDialog.open();
    } else {
      await this.saveSegment(false);
      showSuccess('Интервал завершен!');
      this.nextInterval();
    }
  }

  private playSound(): void {
    // Basic implementation, can be improved with settings
    const audio = new Audio('/sounds/work-end.mp3');
    audio.play().catch(() => {});
  }

  public getState(): TimerState {
    return this.state;
  }
  
  public getFormattedTime(): string {
    return formatTime(this.state.remainingSeconds);
  }

  public getIntervalLabel(): string {
    if (!this.state.currentInterval) return 'Работа';
    switch (this.state.currentInterval.type) {
      case 'work': return 'Работа';
      case 'short_break': return 'Короткий перерыв';
      case 'long_break': return 'Длинный перерыв';
      default: return 'Работа';
    }
  }
}

export const timerManager = TimerManager.getInstance();
