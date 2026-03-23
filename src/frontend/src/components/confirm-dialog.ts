/**
 * Confirm dialog component
 */

import { Dialog } from './dialog';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

export class ConfirmDialog extends Dialog<any, ConfirmDialogProps> {
  constructor(props: ConfirmDialogProps) {
    super('confirm-dialog', props);
  }

  protected render(): void {
    const { title, message, confirmText = 'Подтвердить', isDanger = false } = this.props;

    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>${title}</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body">
        <p>${message}</p>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Отмена</button>
        <button class="btn btn-primary ${isDanger ? 'btn-danger' : ''} confirm-btn">${confirmText}</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.querySelector('.dialog-close')?.addEventListener('click', () => this.close());
    this.element.querySelector('.cancel-btn')?.addEventListener('click', () => this.close());
    
    this.element.querySelector('.confirm-btn')?.addEventListener('click', () => {
      this.props.onConfirm();
      this.close();
    });
  }
}
