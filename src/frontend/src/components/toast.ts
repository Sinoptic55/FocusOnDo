/**
 * Toast component for notifications
 */

import { Component } from './component';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onRemove: (id: string) => void;
}

export class Toast extends Component<any, ToastProps> {
  private id: string;

  constructor(props: ToastProps) {
    super('div', `toast toast-${props.type}`, props);
    this.id = Math.random().toString(36).substring(2, 9);
    this.element.dataset.toastId = this.id;
  }

  protected render(): void {
    const icon = this.getIcon();
    this.element.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${this.escapeHtml(this.props.message)}</span>
      </div>
      <button class="toast-close">&times;</button>
    `;

    this.element.querySelector('.toast-close')?.addEventListener('click', () => {
      this.props.onRemove(this.id);
    });
  }

  private getIcon(): string {
    switch (this.props.type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public getId(): string {
    return this.id;
  }

  protected onMount(): void {
    const duration = this.props.duration || 3000;
    setTimeout(() => {
      this.element.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
      this.props.onRemove(this.id);
    }, duration);
  }
}

export class ToastManager {
  private static instance: ToastManager;
  private container: HTMLElement;
  private toasts: Map<string, Toast> = new Map();

  private constructor() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  }

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public show(type: ToastType, message: string, duration?: number): void {
    const toast = new Toast({
      type,
      message,
      duration,
      onRemove: (id) => this.remove(id)
    });

    this.toasts.set(toast.getId(), toast);
    toast.mount(this.container);
  }

  public remove(id: string): void {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.getElement().classList.remove('toast-show');
      toast.getElement().classList.add('toast-hide');
      setTimeout(() => {
        toast.unmount();
        this.toasts.delete(id);
      }, 300);
    }
  }

  public success(message: string): void { this.show('success', message); }
  public error(message: string): void { this.show('error', message, 5000); }
  public warning(message: string): void { this.show('warning', message); }
  public info(message: string): void { this.show('info', message); }
}

export const toastManager = ToastManager.getInstance();
