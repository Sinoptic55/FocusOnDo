/**
 * LoginView component for user authentication
 */

import { Component } from '../components/component';
import { authService } from '../auth-service';
import { toastManager } from '../components/toast';

export class LoginView extends Component {
  constructor() {
    super('div', 'view login-view');
  }

  protected render(): void {
    this.element.innerHTML = `
      <div class="auth-container">
        <h1>Вход в Pomodoro TMS</h1>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="username">Имя пользователя</label>
            <input type="text" id="username" name="username" required placeholder="Введите ваше имя" autocomplete="username">
          </div>
          <div class="form-group">
            <label for="password">Пароль</label>
            <input type="password" id="password" name="password" required placeholder="Введите пароль" autocomplete="current-password">
          </div>
          <button type="submit" id="login-submit" class="btn btn-primary btn-block">Войти</button>
        </form>
        <p class="auth-footer">
          Нет аккаунта? <a href="/register">Зарегистрироваться</a>
        </p>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const form = this.element.querySelector('#login-form') as HTMLFormElement;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      
      if (!username || !password) {
        toastManager.warning('Пожалуйста, заполните все поля');
        return;
      }
      
      const submitBtn = this.element.querySelector('#login-submit') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Вход...';
      
      try {
        await authService.login({ username, password });
      } catch (error) {
        // Error is handled in authService (toastManager.error)
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти';
      }
    });
  }
}
