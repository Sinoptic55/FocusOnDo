## ADDED Requirements

### Requirement: Unpaid tasks report data

Система ДОЛЖНА предоставлять отчёт по выполненным, не оплаченным задачам с агрегированным временем и фильтрами.

#### Scenario: Get unpaid tasks report without filters

- **WHEN** пользователь открывает отчёт "Неоплаченные задачи" без выбора фильтров
- **THEN** система возвращает все задачи со статусом is_completed=true и is_paid=false, сгруппированные по родительским задачам

#### Scenario: Filter unpaid tasks by project

- **WHEN** пользователь выбирает конкретный проект в фильтре
- **THEN** отчёт показывает только задачи этого проекта

#### Scenario: Filter unpaid tasks by client

- **WHEN** пользователь выбирает конкретного клиента в фильтре
- **THEN** отчёт показывает только задачи этого клиента

#### Scenario: Filter unpaid tasks by task list

- **WHEN** пользователь выбирает конкретный список задач в фильтре
- **THEN** отчёт показывает только задачи этого списка

#### Scenario: Report columns display

- **WHEN** отображается отчёт
- **THEN** каждая строка содержит: Задача (название), Дата окончания (максимальная start_time сегментов), Продолжительность (сумма actual_time_seconds в минутах), Продолжительность к оплате (сумма billed_time_seconds в минутах)

#### Scenario: Aggregate time from subtasks

- **WHEN** родительская задача имеет подзадачи (steps) с сегментами времени
- **THEN** время подзадач агрегируется в родительскую задачу

### Requirement: Unpaid tasks report ODS export

Система ДОЛЖНА позволять экспортировать отчёт "Неоплаченные задачи" в формат ODS (OpenDocument Spreadsheet).

#### Scenario: Export report to ODS

- **WHEN** пользователь нажимает кнопку "Экспорт в ODS"
- **THEN** система генерирует и скачивает файл в формате ODS с данными текущего отчёта (с учётом активных фильтров)

#### Scenario: ODS file structure

- **WHEN** открывается экспортированный ODS файл
- **THEN** первая строка содержит заголовки колонок: Задача, Дата окончания, Продолжительность (мин), Продолжительность к оплате (мин)

#### Scenario: ODS encoding

- **WHEN** ODS файл содержит кириллические символы
- **THEN** файл корректно отображается в LibreOffice Calc и Microsoft Excel

### Requirement: Reference data for filters

Система ДОЛЖНА предоставлять списки проектов, клиентов и списков задач для заполнения фильтров отчёта.

#### Scenario: Load projects for filter dropdown

- **WHEN** пользователь открывает фильтр по проекту
- **THEN** выпадающий список содержит все проекты пользователя

#### Scenario: Load clients for filter dropdown

- **WHEN** пользователь открывает фильтр по клиенту
- **THEN** выпадающий список содержит всех клиентов пользователя

#### Scenario: Load task lists for filter dropdown

- **WHEN** пользователь открывает фильтр по списку задач
- **THEN** выпадающий список содержит все списки задач пользователя
