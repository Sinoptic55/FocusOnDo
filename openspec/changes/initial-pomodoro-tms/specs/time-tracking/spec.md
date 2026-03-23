## ADDED Requirements

### Requirement: Automatic time tracking during work intervals

Система ДОЛЖНА автоматически фиксировать время работы над задачей во время рабочих интервалов таймера.

#### Scenario: Create time segment on interval start

- **WHEN** пользователь запускает рабочий интервал на задаче
- **THEN** система создаёт запись time_segment с временем начала и привязкой к задаче

#### Scenario: Update duration on interval completion

- **WHEN** рабочий интервал завершается
- **THEN** система обновляет длительность time_segment в секундах

#### Scenario: Multiple intervals create multiple segments

- **WHEN** пользователь работает над задачей в несколько интервалов
- **THEN** система создаёт отдельную запись time_segment для каждого интервала

### Requirement: Actual vs billed time

Система ДОЛЖНА различать фактически затраченное время и выставленное время для выставления счетов.

#### Scenario: Initialize billed time equal to actual

- **WHEN** создаётся новая запись time_segment
- **THEN** billed_time_seconds инициализируется значением равным actual_time_seconds

#### Scenario: Adjust billed time manually

- **WHEN** пользователь вручную изменяет выставленное время для отрезка работы
- **THEN** система сохраняет новое значение billed_time_seconds без изменения actual_time_seconds

#### Scenario: Display both times on time segment

- **WHEN** пользователь просматривает отрезок времени
- **THEN** система отображает оба значения: "Фактическое: ЧЧ:ММ:СС, Выставленное: ЧЧ:ММ:СС"

### Requirement: Real-time total time display

Система ДОЛЖНА отображать суммарное затраченное время на задачу с обновлением в реальном времени.

#### Scenario: Calculate total from all segments

- **WHEN** пользователь открывает форму задачи
- **THEN** система вычисляет и отображает сумму всех actual_time_seconds из time_segments этой задачи

#### Scenario: Update total while timer running

- **WHEN** таймер работает на задаче
- **THEN** отображаемое суммарное время увеличивается каждую секунду

#### Scenario: Format total time as HH:MM:SS

- **WHEN** система отображает суммарное время
- **THEN** формат отображения: ЧЧ:ММ:СС (например, 02:34:15)

### Requirement: Store energy level from post-work questions

Система ДОЛЖНА сохранять уровень энергии указанный пользователем после рабочего интервала.

#### Scenario: Save energy level with segment

- **WHEN** пользователь отвечает "Высокий" на вопрос об уровне энергии
- **THEN** система сохраняет значение "high" в поле energy_level записи time_segment

#### Scenario: Allow three energy levels

- **WHEN** пользователь выбирает уровень энергии
- **THEN** доступны варианты: Высокий (high), Средний (medium), Низкий (low)

### Requirement: Store task progress status

Система ДОЛЖНА сохранять информацию о прогрессе задачи после рабочего интервала.

#### Scenario: Save task progressed flag

- **WHEN** пользователь отвечает "Да" на вопрос "Задача продвинулась?"
- **THEN** система сохраняет task_progressed=true в записи time_segment

#### Scenario: Save stuck flag

- **WHEN** пользователь отвечает "Застрял" на вопрос о прогрессе
- **THEN** система сохраняет stuck=true в записи time_segment

#### Scenario: No progress marks neither flag

- **WHEN** пользователь отвечает "Нет" на вопрос о прогрессе
- **THEN** система сохраняет task_progressed=false и stuck=false

### Requirement: View time segments history

Система ДОЛЖНА позволять просматривать историю всех отрезков времени для задачи.

#### Scenario: Display all segments for task

- **WHEN** пользователь открывает историю времени задачи
- **THEN** система отображает список всех time_segments с датой, длительностью, и энергией

#### Scenario: Edit past time segment

- **WHEN** пользователь редактирует отрезок времени из истории
- **THEN** система позволяет изменить actual_time и billed_time

#### Scenario: Delete incorrect time segment

- **WHEN** пользователь удаляет ошибочный отрезок времени
- **THEN** система удаляет запись и пересчитывает суммарное время задачи

### Requirement: Manual time entry

Система ДОЛЖНА позволять вручную добавлять отрезки времени для задач выполненных вне таймера.

#### Scenario: Add manual time entry

- **WHEN** пользователь добавляет время вручную указав задачу, дату, и длительность
- **THEN** система создаёт новую запись time_segment с указанными параметрами

#### Scenario: Manual entry without energy data

- **WHEN** создаётся ручная запись времени
- **THEN** поля energy_level, task_progressed, stuck остаются пустыми

### Requirement: Time tracking for subtasks

Система ДОЛЖНА отдельно учитывать время на подзадачи (шаги).

#### Scenario: Track time on step

- **WHEN** пользователь работает над шагом задачи
- **THEN** время фиксируется на конкретный шаг (task_id указывает на шаг)

#### Scenario: Parent task shows total with subtasks

- **WHEN** пользователь просматривает родительскую задачу
- **THEN** суммарное время включает время всех подзадач

### Requirement: Pause creates partial segment

Система ДОЛЖНА фиксировать отрезок времени при паузе таймера.

#### Scenario: Pause work interval saves segment

- **WHEN** пользователь ставит на паузу рабочий интервал после 10 минут работы
- **THEN** система создаёт time_segment с длительностью 600 секунд

#### Scenario: Resume continues on same task

- **WHEN** пользователь возобновляет работу после паузы
- **THEN** при следующем завершении создаётся новый time_segment для продолжения работы

### Requirement: Time precision in seconds

Система ДОЛЖНА хранить время с точностью до секунды.

#### Scenario: Store exact start timestamp

- **WHEN** создаётся отрезок времени
- **THEN** start_time сохраняется с точностью до секунды (timestamp)

#### Scenario: Store duration in seconds

- **WHEN** завершается рабочий интервал
- **THEN** duration_seconds хранит точное количество секунд работы
