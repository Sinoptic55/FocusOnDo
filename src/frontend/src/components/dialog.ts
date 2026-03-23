/**
 * Base Dialog component for modals and overlays
 */

import { Component } from './component';

export abstract class Dialog<S = any, P = any> extends Component<S, P> {
  protected overlay: HTMLElement;

  constructor(className: string = '', props: P = {} as P, initialState: S = {} as S) {
    super('div', `dialog ${className}`, props, initialState);
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'dialog-overlay hidden';
    this.overlay.appendChild(this.element);
    document.body.appendChild(this.overlay);
  }

  public open(): void {
    this.overlay.classList.remove('hidden');
    this.onOpen();
  }

  public close(): void {
    this.overlay.classList.add('hidden');
    this.onClose();
  }

  protected onOpen(): void {}
  protected onClose(): void {}

  public unmount(): void {
    super.unmount();
    this.overlay.remove();
  }
}
