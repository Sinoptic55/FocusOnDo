# Pomodoro TMS - Task Management System

Система управления задачами с интегрированным таймером Помодоро для личной продуктивности и деловой отчётности.

## Технологический стек

- **Frontend**: TypeScript, JavaScript, HTML (Vanilla, без фреймворков)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL 12+
- **Authentication**: JWT в HTTP-only cookies
- **Migrations**: Alembic

## Быстрый старт

### Требования

- Python 3.9+
- Node.js 18+
- PostgreSQL 12+

### Установка

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd webapp
```

2. **Настройка Backend**

```bash
cd src/backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

3. **Настройка Frontend**

```bash
cd ../frontend
npm install
```

4. **Настройка базы данных**

Создайте файл `.env` в корне проекта:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/pomodoro_tms
JWT_SECRET=your-secret-key-here-change-in-production
```

5. **Запуск миграций**

```bash
cd src/backend
alembic upgrade head
```

6. **Запуск приложения**

Backend (на порту 8000):
```bash
cd src/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (на порту 5173):
```bash
cd src/frontend
npm run dev
```

7. **Доступ к приложению**

Откройте в браузере: http://localhost:5173

API документация: http://localhost:8000/docs

## Структура проекта

```
webapp/
├── src/
│   ├── backend/          # FastAPI backend
│   │   ├── api/        # API endpoints
│   │   ├── models/     # SQLAlchemy ORM модели
│   │   ├── schemas/    # Pydantic схемы
│   │   ├── services/   # Бизнес логика
│   │   ├── db/         # Database connection
│   │   └── auth/       # Аутентификация
│   └── frontend/        # TypeScript frontend
│       ├── components/  # UI компоненты
│       ├── services/    # API клиенты
│       ├── models/      # TypeScript типы
│       ├── views/       # Страницы
│       └── utils/       # Хелперы
├── openspec/           # OpenSpec change artifacts
└── README.md
```

## Разработка

## Тестирование

### Backend

Система поддерживает как автоматическое тестирование через `pytest`, так и ручное тестирование через скрипты (в случае отсутствия установленного `pytest` в окружении).

**Автоматические тесты (рекомендуется):**
```bash
cd src/backend
pytest
```

**Ручное тестирование (fallback):**
В каталоге `src/backend/tests` находятся скрипты для проверки основных модулей:
- `python tests/test_auth_manual.py` - Тестирование аутентификации и JWT
- `python tests/test_smart_manual.py` - Тестирование алгоритмов приоритизации
- `python tests/test_tasks_manual.py` - Тестирование API задач
- `python tests/test_analytics_manual.py` - Тестирование API аналитики
- `python tests/test_timer_manual.py` - Тестирование таймера и отрезков времени
- `python tests/test_recurring_manual.py` - Тестирование повторяющихся задач

### Frontend

```bash
cd src/frontend
# Запуск dev сервера
npm run dev

# Сборка для production
npm run build

# Проверка типов
npm run type-check
```

## Основные функции

- ✅ Управление задачами с иерархией (задачи → шаги)
- ✅ Три вида отображения (списки, доска по дате, доска по статусу)
- ✅ Таймер Помодоро с настраиваемыми интервалами
- ✅ Автоматический учёт времени (фактическое vs выставленное)
- ✅ Умные инструменты (быстрый захват, автовыбор задачи, утренний ритуал)
- ✅ Аналитика продуктивности
- ✅ Повторяющиеся задачи
- ✅ Аутентификация и защита данных

## Лицензия

[Добавьте лицензию]

## Контакт

[Добавьте контактную информацию]
