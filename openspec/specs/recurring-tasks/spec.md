## ADDED Requirements

### Requirement: Configure task as recurring

Система ДОЛЖНА позволять настроить задачу как повторяющуюся с указанием периодичности.

#### Scenario: Set daily recurrence

- **WHEN** пользователь настраивает задачу на повторение каждый день
- **THEN** система сохраняет настройку recurrence с типом "daily"

#### Scenario: Set weekly recurrence with specific days

- **WHEN** пользователь настраивает задачу на повторение каждую неделю по понедельникам и средам
- **THEN** система сохраняет настройку recurrence с типом "weekly" и днями [Monday, Wednesday]

#### Scenario: Set monthly recurrence

- **WHEN** пользователь настраивает задачу на повторение каждый месяц 15 числа
- **THEN** система сохраняет настройку recurrence с типом "monthly" и днём месяца 15

#### Scenario: Set custom interval recurrence

- **WHEN** пользователь настраивает задачу на повторение каждые 3 дня
- **THEN** система сохраняет настройку recurrence с типом "interval" и значением 3 дня

### Requirement: Auto-create next occurrence on completion

Система ДОЛЖНА автоматически создавать следующую задачу при завершении повторяющейся задачи.

#### Scenario: Complete daily recurring task creates next

- **WHEN** пользователь завершает задачу с daily recurrence
- **THEN** система автоматически создаёт новую задачу на следующий день со всеми полями исходной задачи

#### Scenario: Complete weekly task creates next occurrence

- **WHEN** пользователь завершает задачу с weekly recurrence по понедельникам
- **THEN** система создаёт новую задачу на следующий понедельник

#### Scenario: New task copies all fields except dates and status

- **WHEN** создаётся следующая повторяющаяся задача
- **THEN** новая задача копирует название, описание, проект, клиента, оценку, но имеет новую planned_date и статус "Новая"

### Requirement: Recurring task includes steps

Система ДОЛЖНА копировать шаги (подзадачи) при создании следующей повторяющейся задачи.

#### Scenario: Copy all steps to new occurrence

- **WHEN** создаётся следующая повторяющаяся задача имеющая шаги
- **THEN** система создаёт копии всех шагов для новой задачи

#### Scenario: Steps reset to incomplete

- **WHEN** шаги копируются в новую задачу
- **THEN** все шаги имеют статус "Новая" независимо от статуса в предыдущей задаче

### Requirement: Edit recurrence settings

Система ДОЛЖНА позволять изменять настройки повторения существующей задачи.

#### Scenario: Change recurrence frequency

- **WHEN** пользователь изменяет повторяющуюся задачу с daily на weekly
- **THEN** система обновляет настройку и следующая задача создаётся по новому расписанию

#### Scenario: Disable recurrence

- **WHEN** пользователь отключает повторение для задачи
- **THEN** система удаляет настройку recurrence и следующая задача не создаётся при завершении

### Requirement: View recurring task indicator

Система ДОЛЖНА визуально отмечать повторяющиеся задачи.

#### Scenario: Display recurrence icon on task card

- **WHEN** пользователь просматривает задачу с настроенным повторением
- **THEN** карточка задачи отображает иконку повторения

#### Scenario: Show recurrence details in task form

- **WHEN** пользователь открывает форму повторяющейся задачи
- **THEN** система отображает детали повторения (тип, периодичность, дни)

### Requirement: Skip occurrence

Система ДОЛЖНА позволять пропустить одно повторение задачи.

#### Scenario: Skip next occurrence

- **WHEN** пользователь выбирает "Пропустить следующее повторение" для задачи
- **THEN** система создаёт следующую задачу через один период (например, через 2 дня для daily вместо 1)

### Requirement: Stop recurrence after N times

Система ДОЛЖНА позволять ограничить количество повторений.

#### Scenario: Set recurrence end count

- **WHEN** пользователь настраивает задачу повторяться 10 раз
- **THEN** система создаёт новые задачи до достижения 10-го повторения

#### Scenario: Last occurrence has no recurrence

- **WHEN** создаётся последнее (10-е) повторение задачи
- **THEN** эта задача не имеет настройки recurrence

### Requirement: Recurrence end date

Система ДОЛЖНА позволять установить дату окончания повторений.

#### Scenario: Set recurrence end date

- **WHEN** пользователь устанавливает дату окончания повторений 31 декабря
- **THEN** система создаёт новые задачи только до этой даты

#### Scenario: No task created after end date

- **WHEN** следующее повторение выходит за дату окончания
- **THEN** система не создаёт новую задачу

### Requirement: Recurring task history

Система ДОЛЖНА связывать повторяющиеся задачи для отображения истории.

#### Scenario: View all occurrences of recurring task

- **WHEN** пользователь открывает историю повторяющейся задачи
- **THEN** система отображает все созданные повторения (прошлые и текущее)

#### Scenario: Link to previous occurrence

- **WHEN** пользователь просматривает повторяющуюся задачу
- **THEN** система предоставляет ссылку на предыдущее повторение этой задачи

### Requirement: Pause recurrence

Система ДОЛЖНА позволять временно приостановить повторение задачи.

#### Scenario: Pause recurring task

- **WHEN** пользователь ставит повторяющуюся задачу на паузу
- **THEN** система не создаёт следующее повторение при завершении текущей задачи

#### Scenario: Resume recurring task

- **WHEN** пользователь возобновляет повторение
- **THEN** следующая задача создаётся при завершении текущей по исходному расписанию
