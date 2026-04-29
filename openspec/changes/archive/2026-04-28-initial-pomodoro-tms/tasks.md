## 1. Project Setup & Infrastructure

- [x] 1.1 Создать структуру каталогов проекта (src/backend, src/frontend)
- [x] 1.2 Инициализировать Git репозиторий с .gitignore
- [x] 1.3 Создать requirements.txt для Python зависимостей (FastAPI, SQLAlchemy, Alembic, asyncpg, pydantic, python-jose)
- [x] 1.4 Создать package.json для frontend с TypeScript зависимостями
- [x] 1.5 Настроить tsconfig.json со strict mode
- [x] 1.6 Создать README.md с инструкциями по запуску
- [x] 1.7 Настроить .env.example с переменными окружения (DB_URL, JWT_SECRET)

## 2. Database Schema & Migrations

- [x] 2.1 Установить и настроить PostgreSQL локально
- [x] 2.2 Инициализировать Alembic для миграций
- [x] 2.3 Создать SQLAlchemy модель User (id, username, email, password_hash, created_at)
- [x] 2.4 Создать модель TaskList (id, user_id, name, color, order)
- [x] 2.5 Создать модель TaskStatus (id, user_id, name, board_visible, order)
- [x] 2.6 Создать модель Project (id, user_id, name, color, archived)
- [x] 2.7 Создать модель Client (id, user_id, name)
- [x] 2.8 Создать модель Task (id, user_id, parent_task_id, title, description, planned_date, deadline, status_id, list_id, project_id, client_id, pomodoro_estimate, first_action, external_link)
- [x] 2.9 Создать модель TimeSegment (id, task_id, user_id, start_time, duration_seconds, actual_time_seconds, billed_time_seconds, energy_level, task_progressed, stuck)
- [x] 2.10 Создать модель PomodoroInterval (id, user_id, order, type, duration_minutes)
- [x] 2.11 Создать модель RecurringTask (id, task_id, frequency_type, frequency_data_json, last_created_date, end_date, end_count)
- [x] 2.12 Создать модель AppSettings (id, user_id, settings_json)
- [x] 2.13 Добавить индексы на tasks (user_id, planned_date), (user_id, status_id), (user_id, list_id)
- [x] 2.14 Добавить индексы на time_segments (task_id), (user_id, start_time)
- [x] 2.15 Создать начальную миграцию Alembic
- [x] 2.16 Применить миграцию и проверить создание таблиц

## 3. Backend Authentication

- [x] 3.1 Создать модуль auth с функциями hash_password и verify_password (bcrypt)
- [x] 3.2 Реализовать функцию create_jwt_token с user_id в payload
- [x] 3.3 Реализовать функцию decode_jwt_token с валидацией
- [x] 3.4 Создать middleware для проверки JWT из HTTP-only cookie
- [x] 3.5 Создать dependency get_current_user для защищённых эндпоинтов
- [x] 3.6 Создать POST /api/auth/register endpoint (username, email, password)
- [x] 3.7 Создать POST /api/auth/login endpoint (username, password) → set cookie
- [x] 3.8 Создать POST /api/auth/logout endpoint → clear cookie
- [x] 3.9 Добавить rate limiting для /api/auth/login (5 попыток на 15 минут)
- [x] 3.10 Создать Pydantic схемы для RegisterRequest, LoginRequest, UserResponse

## 4. Backend Core Setup

- [x] 4.1 Создать FastAPI приложение в main.py с CORS middleware
- [x] 4.2 Настроить подключение к PostgreSQL через asyncpg
- [x] 4.3 Создать database session dependency
- [x] 4.4 Настроить автоматическую документацию API (Swagger UI)
- [x] 4.5 Создать базовую структуру роутеров (api/tasks.py, api/time.py, api/analytics.py и т.д.)
- [x] 4.6 Добавить обработчик исключений для красивых ошибок

## 5. Task Management API

- [x] 5.1 Создать POST /api/tasks endpoint (создание задачи)
- [x] 5.2 Создать GET /api/tasks endpoint (список задач пользователя с фильтрами)
- [x] 5.3 Создать GET /api/tasks/{task_id} endpoint (одна задача)
- [x] 5.4 Создать PUT /api/tasks/{task_id} endpoint (обновление задачи)
- [x] 5.5 Создать DELETE /api/tasks/{task_id} endpoint (удаление задачи)
- [x] 5.6 Реализовать логику создания подзадач (parent_task_id)
- [x] 5.7 Реализовать каскадное удаление задачи с подзадачами
- [x] 5.8 Добавить вычисление total_time для задачи из time_segments
- [x] 5.9 Создать POST /api/tasks/quick endpoint для быстрого захвата
- [x] 5.10 Создать Pydantic схемы TaskCreate, TaskUpdate, TaskResponse

## 6. Reference Data API

- [x] 6.1 Создать CRUD эндпоинты для task_lists (/api/lists)
- [x] 6.2 Создать CRUD эндпоинты для task_statuses (/api/statuses)
- [x] 6.3 Создать CRUD эндпоинты для projects (/api/projects)
- [x] 6.4 Создать CRUD эндпоинты для clients (/api/clients)
- [x] 6.5 Создать CRUD эндпоинты для pomodoro_intervals (/api/intervals)
- [x] 6.6 Добавить валидацию уникальности имён в пределах пользователя
- [x] 6.7 Реализовать проверку наличия связанных задач перед удалением
- [x] 6.8 Создать seed данные по умолчанию (Inbox список, базовые статусы)

## 7. Pomodoro Timer Backend

- [x] 7.1 Создать GET /api/timer/state endpoint (получение состояния таймера)
- [x] 7.2 Создать POST /api/timer/start endpoint (старт таймера на задаче)
- [x] 7.3 Создать POST /api/timer/pause endpoint (пауза таймера)
- [x] 7.4 Создать POST /api/timer/skip endpoint (пропуск интервала)
- [x] 7.5 Реализовать логику сохранения состояния таймера в app_settings

## 8. Time Tracking API

- [x] 8.1 Создать POST /api/time-segments endpoint (фиксация отрезка времени)
- [x] 8.2 Создать GET /api/time-segments endpoint (история времени для задачи)
- [x] 8.3 Создать PUT /api/time-segments/{id} endpoint (редактирование времени, billed_time)
- [x] 8.4 Создать DELETE /api/time-segments/{id} endpoint (удаление отрезка)
- [x] 8.5 Реализовать сохранение energy_level, task_progressed, stuck в time_segment
- [x] 8.6 Создать Pydantic схемы TimeSegmentCreate, TimeSegmentUpdate, TimeSegmentResponse

## 9. Smart Tools API

- [x] 9.1 Создать GET /api/smart/next-task endpoint (автовыбор приоритетной задачи)
- [x] 9.2 Реализовать алгоритм приоритизации (просроченные → сегодня → остальные)
- [x] 9.3 Создать GET /api/smart/morning-ritual endpoint (данные для утреннего ритуала)
- [x] 9.4 Создать GET /api/smart/weekly-review endpoint (данные для недельного обзора)
- [x] 9.5 Реализовать детекцию паттерна застревания (подсчёт stuck=true)
- [x] 9.6 Создать GET /api/smart/inbox endpoint (задачи в Inbox для обработки)

## 10. Analytics API

- [x] 10.1 Создать GET /api/analytics/projects endpoint (время по проектам)
- [x] 10.2 Создать GET /api/analytics/clients endpoint (время по клиентам)
- [x] 10.3 Создать GET /api/analytics/productivity-peaks endpoint (пики продуктивности по часам)
- [x] 10.4 Создать GET /api/analytics/estimation-accuracy endpoint (точность оценок)
- [x] 10.5 Создать GET /api/analytics/work-speed endpoint (скорость работы - задачи/день)
- [x] 10.6 Создать GET /api/analytics/stuck-patterns endpoint (паттерны застревания)
- [x] 10.7 Создать GET /api/analytics/dashboard endpoint (суммарная статистика)
- [x] 10.8 Реализовать фильтрацию по date_range для всех аналитических эндпоинтов
- [x] 10.9 Добавить агрегированные SQL запросы с JOIN для оптимизации

## 11. Settings API

- [x] 11.1 Создать GET /api/settings endpoint (получение настроек пользователя)
- [x] 11.2 Создать PUT /api/settings endpoint (обновление настроек)
- [x] 11.3 Создать Pydantic схему AppSettingsSchema (theme, sounds, hotkey, morning_ritual_enabled, review_day, stuck_threshold и т.д.)
- [x] 11.4 Реализовать валидацию настроек при обновлении
- [x] 11.5 Создать настройки по умолчанию при регистрации пользователя

## 12. Recurring Tasks API

- [x] 12.1 Создать POST /api/tasks/{task_id}/recurrence endpoint (настройка повторения)
- [x] 12.2 Создать DELETE /api/tasks/{task_id}/recurrence endpoint (отключение повторения)
- [x] 12.3 Реализовать функцию create_next_occurrence для создания следующей задачи
- [x] 12.4 Добавить триггер на изменение статуса задачи на "Завершено" → создание next occurrence
- [x] 12.5 Реализовать копирование шагов (подзадач) в новое повторение

## 13. Frontend Core Structure

- [x] 13.1 Инициализировать фронтенд проект и настроить сборку через esbuild
- [x] 13.2 Создать базовый класс Component для работы с DOM и управления состоянием
- [x] 13.3 Определить строгие TypeScript интерфейсы для всех моделей данных
- [x] 13.4 Реализовать централизованный ApiService с поддержкой перехвата ошибок
- [x] 13.5 Создать легковесный Router на базе History API с поддержкой параметров
- [x] 13.6 Реализовать систему уведомлений (Toast) для обратной связи с пользователем
- [x] 13.7 Разработать основной Layout с адаптивным сайдбаром и футером таймера

## 14. Frontend Authentication

- [x] 14.1 Реализовать AuthStore для управления состоянием сессии и пользователя
- [x] 14.2 Создать AuthService для обработки Login/Register/Logout потоков
- [x] 14.3 Разработать компонент LoginView с валидацией полей и обработкой ошибок API
- [x] 14.4 Разработать компонент RegisterView с подтверждением пароля
- [x] 14.5 Реализовать механизм восстановления сессии при инициализации приложения
- [x] 14.6 Добавить защитные фильтры (Guards) для маршрутов (авторизован/гость)
- [x] 14.7 Реализовать логику выхода из системы с очисткой локального кеша и редиректом

## 15. Frontend Pomodoro Timer

- [x] 15.1 Создать Timer component (отображение времени, кнопки управления)
- [x] 15.2 Реализовать setInterval для обратного отсчёта времени
- [x] 15.3 Реализовать сохранение состояния в localStorage (active_task_id, start_time, duration)
- [x] 15.4 Реализовать восстановление состояния при перезагрузке страницы
- [x] 15.5 Добавить функционал Start/Pause/Skip
- [x] 15.6 Создать диалог выбора задачи при старте без активной задачи
- [x] 15.7 Реализовать переключение между рабочими и отдыхательными интервалами
- [x] 15.8 Создать диалог post-work вопросов (прогресс, энергия)
- [x] 15.9 Реализовать звуковые уведомления при завершении интервала
- [x] 15.10 Добавить визуальный индикатор типа интервала (работа/отдых)
- [x] 15.11 Реализовать отправку time_segment на сервер при завершении интервала
- [x] 15.12 Добавить детекцию множественных вкладок и предупреждение

## 16. Frontend Task Management

- [x] 16.1 Создать TaskForm component для создания/редактирования задачи
- [x] 16.2 Добавить все поля задачи (title, description, dates, status, project, client и т.д.)
- [x] 16.3 Реализовать rich text editor для description (или простой markdown)
- [x] 16.4 Добавить загрузку и отображение скриншотов в описании
- [x] 16.5 Создать TaskCard component для отображения задачи в списке/доске
- [x] 16.6 Добавить цветовую индикацию списка и проекта на TaskCard
- [x] 16.7 Создать UI для добавления/редактирования шагов (подзадач)
- [x] 16.8 Реализовать иерархическое отображение задач с отступами
- [x] 16.9 Добавить отображение total_time в формате ЧЧ:ММ:СС
- [x] 16.10 Реализовать real-time обновление времени на карточке при работающем таймере
- [x] 16.11 Добавить диалог подтверждения удаления задачи с подзадачами

## 17. Frontend Task Views

- [x] 17.1 Создать ListView component (группировка задач по спискам)
- [x] 17.2 Создать DateBoardView component (6 колонок по датам)
- [x] 17.3 Реализовать логику группировки задач по датам (сегодня, завтра, неделя и т.д.)
- [x] 17.4 Создать StatusBoardView component (колонки по статусам)
- [x] 17.5 Реализовать фильтрацию статусов с board_visible=true
- [x] 17.6 Добавить drag-and-drop для перемещения задач между колонками
- [x] 17.7 Реализовать обновление задачи при drop (изменение planned_date или status_id)
- [x] 17.8 Добавить переключатель между тремя видами (tabs или dropdown)
- [x] 17.9 Сохранять выбранный вид в localStorage
- [x] 17.10 Реализовать фильтры (по проекту, клиенту)
- [x] 17.11 Реализовать сортировку внутри групп (по deadline, приоритету)

## 18. Frontend Reference Data Management

- [x] 18.1 Создать Settings page с табами для разных справочников
- [x] 18.2 Создать ListsManager component для управления списками задач
- [x] 18.3 Добавить color picker для выбора цвета списка
- [x] 18.4 Создать StatusesManager component для управления статусами
- [x] 18.5 Добавить toggle для board_visible и drag-and-drop для reorder
- [x] 18.6 Создать ProjectsManager component для управления проектами
- [x] 18.7 Добавить возможность архивирования проектов
- [x] 18.8 Создать ClientsManager component для управления клиентами
- [x] 18.9 Создать IntervalsManager component для настройки последовательности интервалов
- [x] 18.10 Добавить drag-and-drop для изменения порядка интервалов
- [x] 18.11 Реализовать кнопку "Reset to defaults" для интервалов

## 19. Frontend Smart Tools

- [x] 19.1 Создать кнопку "Не знаю, с чего начать" на главной странице
- [x] 19.2 Реализовать вызов /api/smart/next-task и старт таймера на выбранной задаче
- [x] 19.3 Отобразить причину выбора задачи (просрочен, на сегодня и т.д.)
- [x] 19.4 Создать MorningRitual component (экран планирования дня)
- [x] 19.5 Отобразить просроченные задачи, задачи на сегодня, Inbox count
- [x] 19.6 Реализовать drag-and-drop задач на область "Сегодня"
- [x] 19.7 Сохранять last_ritual_date в settings при закрытии ритуала
- [x] 19.8 Создать WeeklyReview component (экран недельного обзора)
- [x] 19.9 Отобразить статистику недели (завершённые, незавершённые, время по проектам)
- [x] 19.10 Реализовать перенос незавершённых задач на следующую неделю
- [x] 19.11 Реализовать детекцию застревания и уведомление с предложением разбить задачу
- [x] 19.12 Создать InboxProcessing component для обработки входящих

## 20. Frontend Analytics

- [x] 20.1 Создать Analytics page с выбором типа отчёта
- [x] 20.2 Создать ProjectTimeReport component (таблица + bar chart)
- [x] 20.3 Создать ClientTimeReport component с drill-down по проектам
- [x] 20.4 Создать ProductivityPeaksReport component (line chart по часам дня)
- [x] 20.5 Создать EstimationAccuracyReport component (scatter plot оценка vs факт)
- [x] 20.6 Создать WorkSpeedReport component (tasks completed per week line chart)
- [x] 20.7 Создать StuckPatternsReport component (top stuck tasks таблица)
- [x] 20.8 Создать Dashboard component с ключевыми метриками (сегодня, неделя)
- [x] 20.9 Добавить DateRangePicker для фильтрации периода
- [x] 20.10 Реализовать пресеты дат (сегодня, неделя, месяц)
- [x] 20.11 Использовать Chart.js или аналогичную библиотеку для графиков

## 21. Frontend Settings

- [x] 21.1 Создать Settings page с секциями (Внешний вид, Уведомления, Умные функции и т.д.)
- [x] 21.2 Добавить выбор темы (светлая/тёмная/авто) с переключателем
- [x] 21.3 Реализовать применение темы через CSS variables или классы
- [x] 21.4 Добавить настройку звуковых уведомлений (вкл/выкл, выбор звука)
- [x] 21.5 Реализовать preview звуков при выборе
- [x] 21.6 Добавить настройку горячей клавиши для quick capture
- [x] 21.7 Реализовать запись комбинации клавиш
- [x] 21.8 Добавить toggle для утреннего ритуала
- [x] 21.9 Добавить выбор дня недели для недельного обзора
- [x] 21.10 Добавить slider для порога детекции застревания
- [x] 21.11 Добавить выбор языка интерфейса (RU/EN)
- [x] 21.12 Реализовать сохранение настроек на сервер при изменении
- [x] 21.13 Добавить кнопку "Reset to defaults"

## 22. Frontend Recurring Tasks

- [x] 22.1 Добавить секцию "Повторение" в TaskForm
- [x] 22.2 Создать UI для выбора типа повторения (daily, weekly, monthly, custom)
- [x] 22.3 Для weekly добавить выбор дней недели
- [x] 22.4 Для monthly добавить выбор числа месяца
- [x] 22.5 Добавить опцию end date или end count
- [ ] 22.6 Отобразить иконку повторения на TaskCard
- [ ] 22.7 Создать RecurrenceHistory component для просмотра всех повторений
- [ ] 22.8 Добавить кнопку "Пропустить следующее повторение"

## 23. Frontend Time Tracking

- [x] 23.1 Создать TimeSegmentsList component (история времени для задачи)
- [x] 23.2 Отобразить все time_segments с датой, длительностью, energy_level
- [x] 23.3 Реализовать inline редактирование actual_time и billed_time
- [x] 23.4 Добавить возможность удаления time_segment
- [x] 23.5 Создать ManualTimeEntry dialog для ручного добавления времени
- [x] 23.6 Отобразить разницу между фактическим и выставленным временем

## 24. Styling & UX Polish

- [x] 24.1 Создать общую CSS стилизацию (или использовать Tailwind/Bootstrap)
- [x] 24.2 Добавить responsive дизайн для планшетов и мобильных (базовая поддержка)
- [x] 24.3 Реализовать loading spinners для асинхронных операций
- [x] 24.4 Добавить toast уведомления для успешных/ошибочных действий
- [x] 24.5 Добавить анимации для drag-and-drop
- [x] 24.6 Добавить визуальную индикацию просроченных дедлайнов (красный цвет)
- [x] 24.7 Реализовать dark theme стили
- [x] 24.8 Добавить keyboard shortcuts для основных действий
- [x] 24.9 Оптимизировать производительность рендеринга больших списков задач

## 25. Testing & Quality Assurance

- [x] 25.1 Написать unit тесты для backend auth модуля
- [x] 25.2 Написать unit тесты для priority task selection алгоритма
- [x] 25.3 Написать integration тесты для tasks API endpoints
- [x] 25.4 Написать integration тесты для analytics API endpoints
- [x] 25.5 Протестировать создание и завершение recurring tasks
- [x] 25.6 Протестировать таймер (старт/пауза/skip, фиксация времени)
- [x] 25.7 Протестировать три вида отображения задач
- [x] 25.8 Протестировать drag-and-drop функционал
- [x] 25.9 Протестировать работу в разных браузерах (Chrome, Firefox, Edge)
- [x] 25.10 Протестировать восстановление таймера после перезагрузки
- [x] 25.11 Провести smoke tests всех ключевых функций

## 26. Documentation & Deployment

- [x] 26.1 Обновить README с инструкциями по установке зависимостей
- [x] 26.2 Документировать API endpoints (использовать Swagger/OpenAPI)
- [x] 26.3 Создать CHANGELOG.md для отслеживания изменений
- [x] 26.4 Написать инструкцию по настройке production окружения
- [x] 26.5 Создать Docker Compose файл для запуска всего стека (DB, Backend, Frontend)
- [x] 26.6 Настроить nginx конфигурацию для reverse proxy
- [x] 26.7 Настроить автоматические бэкапы PostgreSQL
- [x] 26.8 Создать systemd service файл для автозапуска backend
- [x] 26.9 Провести final testing на production-like окружении
- [x] 26.10 Задеплоить на Windows Server и провести smoke tests
