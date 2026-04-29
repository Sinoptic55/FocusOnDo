## ADDED Requirements

### Requirement: User registration

Система ДОЛЖНА позволять новому пользователю зарегистрироваться с username и password.

#### Scenario: Register with valid credentials

- **WHEN** пользователь вводит уникальный username и пароль длиной минимум 8 символов
- **THEN** система создаёт учётную запись и автоматически авторизует пользователя

#### Scenario: Reject duplicate username

- **WHEN** пользователь пытается зарегистрироваться с уже существующим username
- **THEN** система отображает ошибку "Это имя пользователя уже занято"

#### Scenario: Enforce password minimum length

- **WHEN** пользователь вводит пароль короче 8 символов
- **THEN** система отображает ошибку "Пароль должен содержать минимум 8 символов"

#### Scenario: Hash password before storage

- **WHEN** пользователь регистрируется
- **THEN** система сохраняет hash пароля, а не сам пароль

### Requirement: User login

Система ДОЛЖНА позволять зарегистрированному пользователю войти в систему.

#### Scenario: Login with correct credentials

- **WHEN** пользователь вводит правильные username и password
- **THEN** система создаёт JWT токен и устанавливает его в HTTP-only cookie

#### Scenario: Reject incorrect password

- **WHEN** пользователь вводит неправильный пароль
- **THEN** система отображает ошибку "Неверные учётные данные"

#### Scenario: Reject non-existent username

- **WHEN** пользователь вводит несуществующий username
- **THEN** система отображает ошибку "Неверные учётные данные"

#### Scenario: Session token expires after 24 hours

- **WHEN** пользователь авторизован
- **THEN** JWT токен действителен 24 часа с момента создания

### Requirement: User logout

Система ДОЛЖНА позволять пользователю выйти из системы.

#### Scenario: Logout clears session

- **WHEN** пользователь нажимает "Выход"
- **THEN** система удаляет JWT токен из cookie и перенаправляет на страницу входа

#### Scenario: Logged out user cannot access protected pages

- **WHEN** пользователь разлогинен и пытается открыть страницу задач
- **THEN** система перенаправляет на страницу входа

### Requirement: Protected routes

Система ДОЛЖНА защищать все маршруты приложения требованием аутентификации.

#### Scenario: Access protected page with valid token

- **WHEN** авторизованный пользователь открывает страницу задач
- **THEN** система отображает страницу с данными этого пользователя

#### Scenario: Redirect to login without token

- **WHEN** неавторизованный пользователь пытается открыть защищённую страницу
- **THEN** система перенаправляет на страницу входа и сохраняет исходный URL для редиректа после входа

#### Scenario: API endpoints require authentication

- **WHEN** клиент вызывает API endpoint без валидного токена
- **THEN** сервер возвращает HTTP 401 Unauthorized

### Requirement: Data isolation between users

Система ДОЛЖНА полностью изолировать данные между пользователями.

#### Scenario: User sees only own tasks

- **WHEN** пользователь A запрашивает список задач
- **THEN** система возвращает только задачи созданные пользователем A

#### Scenario: User cannot access other user's data

- **WHEN** пользователь A пытается запросить задачу пользователя B по ID
- **THEN** система возвращает HTTP 404 Not Found

#### Scenario: All entities scoped to user

- **WHEN** создаётся любая сущность (задача, проект, клиент)
- **THEN** система автоматически привязывает её к текущему user_id

### Requirement: Remember me functionality

Система ДОЛЖНА предоставлять опцию "Запомнить меня" при входе.

#### Scenario: Extended session with remember me

- **WHEN** пользователь включает "Запомнить меня" при входе
- **THEN** токен действует 30 дней вместо 24 часов

#### Scenario: Auto-login on browser reopen

- **WHEN** пользователь с активным токеном "запомнить меня" открывает браузер
- **THEN** система автоматически восстанавливает сессию без повторного входа

### Requirement: Password change

Система ДОЛЖНА позволять пользователю изменить пароль.

#### Scenario: Change password with old password verification

- **WHEN** пользователь вводит старый пароль и новый пароль в настройках
- **THEN** система проверяет старый пароль и обновляет hash на новый

#### Scenario: Reject incorrect old password

- **WHEN** пользователь вводит неправильный старый пароль
- **THEN** система отображает ошибку "Неверный текущий пароль"

#### Scenario: Invalidate all sessions on password change

- **WHEN** пользователь меняет пароль
- **THEN** все активные сессии (токены) становятся недействительными

### Requirement: Password reset via email

Система ДОЛЖНА позволять восстановить пароль через email.

#### Scenario: Request password reset

- **WHEN** пользователь вводит email на странице восстановления
- **THEN** система отправляет письмо со ссылкой сброса (если email зарегистрирован)

#### Scenario: Reset link expires after 1 hour

- **WHEN** создаётся ссылка для сброса пароля
- **THEN** ссылка действительна только 1 час

#### Scenario: Set new password via reset link

- **WHEN** пользователь переходит по действительной ссылке и вводит новый пароль
- **THEN** система обновляет пароль и автоматически авторизует пользователя

#### Scenario: Security message for non-existent email

- **WHEN** пользователь запрашивает сброс для несуществующего email
- **THEN** система отображает "Если email зарегистрирован, письмо отправлено" (не раскрывая существование account)

### Requirement: Account security

Система ДОЛЖНА обеспечивать безопасность учётных записей.

#### Scenario: HTTP-only cookie prevents XSS

- **WHEN** JWT токен сохраняется в cookie
- **THEN** cookie имеет флаги HttpOnly и Secure для защиты от XSS

#### Scenario: CSRF protection on state-changing requests

- **WHEN** выполняется POST/PUT/DELETE запрос
- **THEN** система проверяет CSRF токен

#### Scenario: Rate limiting on login attempts

- **WHEN** пользователь делает 5 неудачных попыток входа подряд
- **THEN** система блокирует дальнейшие попытки на 15 минут

### Requirement: Token refresh

Система ДОЛЖНА позволять обновлять токен без повторного входа.

#### Scenario: Refresh expiring token

- **WHEN** токен близок к истечению (осталось менее 2 часов) и пользователь активен
- **THEN** система автоматически выдаёт новый токен

#### Scenario: Silent token refresh

- **WHEN** происходит обновление токена
- **THEN** пользователь не видит процесса и продолжает работу без прерывания

### Requirement: User profile information

Система ДОЛЖНА хранить минимальную информацию профиля пользователя.

#### Scenario: Store username and email

- **WHEN** пользователь регистрируется
- **THEN** система сохраняет username, email (для восстановления пароля), и password_hash

#### Scenario: Display username in UI

- **WHEN** пользователь авторизован
- **THEN** интерфейс отображает username в шапке приложения

#### Scenario: Edit profile email

- **WHEN** пользователь изменяет email в профиле
- **THEN** система обновляет email после подтверждения через старый email
