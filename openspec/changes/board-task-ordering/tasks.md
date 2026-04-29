## 1. Backend: Модель и миграция

- [x] 1.1 Добавить поле `sort_order` (Integer, default=0, nullable=False) в модель `Task` в `src/backend/models/task.py`
- [x] 1.2 Добавить `sort_order` в Pydantic-схемы: `TaskBase`, `TaskUpdate` (Optional), `TaskResponse` в `src/backend/schemas/task.py`
- [x] 1.3 Создать Alembic-миграцию для добавления колонки `sort_order` в таблицу `tasks` со значением по умолчанию 0
- [x] 1.4 Применить миграцию и проверить, что существующие задачи получили sort_order=0

## 2. Backend: API reorder

- [x] 2.1 Создать Pydantic-схему `ReorderItem` (task_id: int, sort_order: int) и `ReorderRequest` (items: list[ReorderItem]) в `src/backend/schemas/task.py`
- [x] 2.2 Реализовать эндпоинт `PATCH /api/tasks/reorder` в `src/backend/api/tasks.py`: валидация владения задачами, пакетное обновление sort_order, коммит транзакции
- [x] 2.3 Добавить сортировку по `sort_order` в запросы получения задач (в `GET /api/tasks` и связанных) как secondary sort после created_at

## 3. Frontend: Модели и API

- [x] 3.1 Добавить поле `sort_order: number` в интерфейс `Task` в `src/frontend/src/models.ts`
- [x] 3.2 Добавить метод `reorderTasks(items: Array<{task_id: number, sort_order: number}>)` в `src/frontend/src/api.ts` (PATCH /api/tasks/reorder)

## 4. Frontend: Drag-and-drop с определением позиции

- [x] 4.1 Модифицировать `setupDragAndDrop()` в `src/frontend/src/views/date-board-view.ts`: при dragover над `.draggable-task` определять верхнюю/нижнюю половину элемента и показывать CSS-линию-индикатор вставки
- [x] 4.2 Модифицировать `handleTaskDrop()` в `src/frontend/src/views/date-board-view.ts`: вычислять новый sort_order на основе позиции вставки, вызывать `api.reorderTasks()` для обновления порядка задач в колонке
- [x] 4.3 Модифицировать `setupDragAndDrop()` в `src/frontend/src/views/status-board-view.ts`: аналогично — определение позиции вставки и визуальный индикатор
- [x] 4.4 Модифицировать `handleTaskDrop()` в `src/frontend/src/views/status-board-view.ts`: вычислять новый sort_order и вызывать `api.reorderTasks()`

## 5. Frontend: Сортировка по sort_order

- [x] 5.1 Обновить `sortTasks()` в `src/frontend/src/views/date-board-view.ts`: при `sortBy === 'none'` сортировать по `sort_order`, затем по `created_at`
- [x] 5.2 Обновить `sortTasks()` в `src/frontend/src/views/status-board-view.ts`: аналогично — при `sortBy === 'none'` сортировать по `sort_order`, затем по `created_at`

## 6. Frontend: CSS для визуальной обратной связи

- [x] 6.1 Добавить CSS-стили для линии-индикатора вставки (`.drop-indicator-before`, `.drop-indicator-after`) в `src/frontend/styles.css`
- [x] 6.2 Добавить/обновить стили для `.dragging` класса (полупрозрачность перетягиваемого элемента)
