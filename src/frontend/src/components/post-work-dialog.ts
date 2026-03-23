/**
 * Post-work dialog component
 */

import { Dialog } from './dialog';

export interface PostWorkResult {
  energyLevel: number; // 1-5
  taskProgressed: boolean;
  stuck: boolean;
  notes?: string;
}

interface PostWorkDialogProps {
  taskTitle: string;
  onSubmit: (result: PostWorkResult) => void;
}

export class PostWorkDialog extends Dialog<any, PostWorkDialogProps> {
  constructor(props: PostWorkDialogProps) {
    super('post-work-dialog', props);
  }

  protected render(): void {
    this.element.innerHTML = `
      <div class="dialog-header">
        <h2>Интервал завершен!</h2>
        <button class="dialog-close">&times;</button>
      </div>
      <div class="dialog-body">
        <p>Вы работали над: <strong>${this.props.taskTitle}</strong></p>
        
        <form id="post-work-form" class="mt-md">
          <div class="form-group">
            <label>Уровень энергии (1-5)</label>
            <div class="rating-group">
              <label><input type="radio" name="energyLevel" value="1"> 1 (Истощен)</label>
              <label><input type="radio" name="energyLevel" value="2"> 2</label>
              <label><input type="radio" name="energyLevel" value="3" checked> 3 (Нормально)</label>
              <label><input type="radio" name="energyLevel" value="4"> 4</label>
              <label><input type="radio" name="energyLevel" value="5"> 5 (Бодр)</label>
            </div>
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" name="taskProgressed" checked>
              Задача продвинулась?
            </label>
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" name="stuck">
              Я застрял(а)
            </label>
          </div>
          
          <div class="form-group">
            <label for="notes">Заметки (опционально)</label>
            <textarea id="notes" name="notes" rows="2"></textarea>
          </div>
        </form>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary cancel-btn">Пропустить</button>
        <button class="btn btn-primary submit-btn">Сохранить</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const close = () => {
      // Default to neutral stats if skipped
      this.props.onSubmit({
        energyLevel: 3,
        taskProgressed: true,
        stuck: false
      });
      this.close();
    };

    this.element.querySelector('.dialog-close')?.addEventListener('click', close);
    this.element.querySelector('.cancel-btn')?.addEventListener('click', close);

    this.element.querySelector('.submit-btn')?.addEventListener('click', () => {
      const form = this.element.querySelector('#post-work-form') as HTMLFormElement;
      const formData = new FormData(form);
      
      const result: PostWorkResult = {
        energyLevel: parseInt(formData.get('energyLevel') as string, 10) || 3,
        taskProgressed: formData.get('taskProgressed') === 'on',
        stuck: formData.get('stuck') === 'on',
        notes: formData.get('notes') as string || undefined
      };
      
      this.props.onSubmit(result);
      this.close();
    });
  }
}
