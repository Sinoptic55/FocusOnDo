## 1. Backend: Dependencies and Setup

- [x] 1.1 Добавить `odfpy` в `src/backend/requirements.txt`
- [x] 1.2 Установить зависимость и проверить импорт

## 2. Backend: Unpaid Tasks Report API

- [x] 2.1 Создать Pydantic-схемы для ответа отчёта (`UnpaidTaskResponse`) и параметров запроса
- [x] 2.2 Реализовать endpoint `GET /api/analytics/unpaid-tasks` с фильтрами project_id, client_id, list_id
- [x] 2.3 Реализовать endpoint `GET /api/analytics/unpaid-tasks/export` для генерации ODS
- [x] 2.4 Добавить функцию генерации ODS через odfpy с кириллицей

## 3. Frontend: Models and API

- [x] 3.1 Добавить интерфейсы `UnpaidTaskData`, `UnpaidTasksFilters` в `src/frontend/src/models.ts`
- [x] 3.2 Добавить методы `getUnpaidTasks()` и `exportUnpaidTasksOds()` в `src/frontend/src/api.ts`

## 4. Frontend: Unpaid Tasks Report Component

- [x] 4.1 Создать компонент `src/frontend/src/components/unpaid-tasks-report.ts` с таблицей и фильтрами
- [x] 4.2 Добавить стили для компонента в `src/frontend/styles.css`
- [x] 4.3 Интегрировать компонент в `analytics-reports.ts` как новую вкладку "Неоплаченные"

## 5. Testing and Verification

- [x] 5.1 Протестировать endpoint `/api/analytics/unpaid-tasks` с различными фильтрами
- [x] 5.2 Протестировать экспорт ODS и открытие в LibreOffice Calc
- [x] 5.3 Протестировать фронтенд: фильтры, отображение, экспорт
