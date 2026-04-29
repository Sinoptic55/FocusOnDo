## Why

На тулбаре задач (tasks-view) есть фильтры по проекту и клиенту, но отсутствует фильтр по Списку задач. Пользователям необходимо быстро ограничивать отображение задач на обеих досках (Date board, Status board) конкретным списком, чтобы сфокусироваться на нужном контексте.

## What Changes

- Добавить выпадающий список (select) «Все списки» / `<название списка>` в тулбар `tasks-view.ts` рядом с существующими фильтрами по проекту и клиенту.
- Передавать выбранный `list_id` в объект `filters`, который уже прокидывается в `DateBoardView` и `StatusBoardView`.
- API `getTasks(filters)` уже поддерживает параметр `list_id` — изменений на бэкенде не требуется.

## Capabilities

### New Capabilities

_Нет новых capabilities._

### Modified Capabilities

- `task-views`: Добавляется требование фильтрации задач по Списку на досках (Date board и Status board) через единый фильтр в тулбаре.

## Impact

- **Frontend**: `src/frontend/src/views/tasks-view.ts` — добавление `filterListId` в state, загрузка списков, рендер `<select>`, передача `list_id` в filters.
- **Frontend**: `src/frontend/src/views/date-board-view.ts` — тип `DateBoardViewProps.filters` расширится полем `list_id` (уже передаётся через `api.getTasks`).
- **Frontend**: `src/frontend/src/views/status-board-view.ts` — аналогично, тип `StatusBoardViewProps.filters` расширится.
- **Backend**: Без изменений — `GET /api/tasks` уже поддерживает `list_id` как параметр запроса.
- **API**: Без изменений.
