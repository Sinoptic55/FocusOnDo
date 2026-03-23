/**
 * RegisterView component for user registration
 */

import { Component } from '../components/component';
import { authService } from '../auth-service';
import { toastManager } from '../components/toast';

export class RegisterView extends Component {
  constructor() {
    super('div', 'view register-view');
  }

  protected render(): void {
    this.element.innerHTML = `
      <div class="auth-container">
        <h1>Регистрация в Pomodoro TMS</h1>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="username">Имя пользователя</label>
            <input type="text" id="username" name="username" required placeholder="Выберите имя пользователя" autocomplete="username">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="Введите ваш email" autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Пароль</label>
            <input type="password" id="password" name="password" required placeholder="Придумайте пароль" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label for="confirm-password">Подтверждение пароля</label>
            <input type="password" id="confirm-password" name="confirm-password" required placeholder="Повторите пароль" autocomplete="new-password">
          </div>
          <button type="submit" id="register-submit" class="btn btn-primary btn-block">Зарегистрироваться</button>
        </form>
        <p class="auth-footer">
          Уже есть аккаунт? <a href="/login">Войти</a>
        </p>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const form = this.element.querySelector('#register-form') as HTMLFormElement;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirm-password') as string;
      
      if (!username || !email || !password || !confirmPassword) {
        toastManager.warning('Пожалуйста, заполните все поля');
        return;
      }
      
      if (password !== confirmPassword) {
        toastManager.error('Пароли не совпадают');
        return;
      }
      
      const submitBtn = this.element.querySelector('#register-submit') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Регистрация...';
      
      try {
        await authService.register({ username, email, password });
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Зарегистрироваться';
      }
    });
  }
}
