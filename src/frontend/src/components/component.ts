/**
 * Base Component class for UI elements
 */

export abstract class Component<S = any, P = any> {
  protected element: HTMLElement;
  protected state: S;
  protected props: P;

  constructor(tagName: string = 'div', className: string = '', props: P = {} as P, initialState: S = {} as S) {
    this.element = document.createElement(tagName);
    if (className) {
      this.element.className = className;
    }
    this.props = props;
    this.state = initialState;
  }

  /**
   * Update component state and re-render
   */
  public setState(newState: Partial<S>): void {
    this.state = { ...this.state, ...newState };
    this.update();
  }

  /**
   * Initial render of the component
   */
  public mount(parent: HTMLElement): void {
    this.render();
    parent.appendChild(this.element);
    this.onMount();
  }

  /**
   * Remove component from DOM
   */
  public unmount(): void {
    this.onUnmount();
    this.element.remove();
  }

  /**
   * Re-render component content
   */
  protected update(): void {
    this.render();
  }

  /**
   * Get the component's root element
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Abstract method to be implemented by child components
   * Should update this.element.innerHTML or manipulate this.element.children
   */
  protected abstract render(): void;

  /**
   * Lifecycle hook called after component is added to DOM
   */
  protected onMount(): void {}

  /**
   * Lifecycle hook called before component is removed from DOM
   */
  protected onUnmount(): void {}
}
