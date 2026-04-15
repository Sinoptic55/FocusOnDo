## ADDED Requirements

### Requirement: Open time segments editor from task form

Система ДОЛЖНА предоставлять кнопку для открытия редактора сегментов времени прямо из формы задачи. Кнопка располагается рядом с заголовком секции "Основное".

#### Scenario: Button visible in task form
- **WHEN** пользователь открывает форму редактирования задачи
- **THEN** система отображает кнопку-иконку рядом с заголовком "Основное"

#### Scenario: Open time segments dialog
- **WHEN** пользователь нажимает на кнопку-иконку рядом с "Основное"
- **THEN** система открывает диалог с таблицей всех сегментов времени данной задачи

### Requirement: Display all time segment fields

Система ДОЛЖНА отображать все поля таблицы time_segments в таблице диалога: id, start_time, duration_seconds, actual_time_seconds, billed_time_seconds, energy_level, task_progressed, stuck.

#### Scenario: Show all columns in table
- **WHEN** диалог редактора сегментов открыт
- **THEN** таблица содержит колонки: Начало, Длительность, Факт, Выставлено, Энергия, Прогресс, Застревание, Действия

#### Scenario: Display task_progressed and stuck as icons
- **WHEN** сегмент имеет task_progressed=true или stuck=true
- **THEN** система отображает соответствующие иконки (✓ для прогресса, ⚠ для застревания)

### Requirement: Add new time segment from editor dialog

Система ДОЛЖНА позволять добавлять новый сегмент времени через кнопку в диалоге редактора.

#### Scenario: Open manual entry form
- **WHEN** пользователь нажимает кнопку "+ Добавить" в диалоге
- **THEN** система открывает форму ввода нового сегмента с полями: start_time, duration_seconds, actual_time_seconds, billed_time_seconds, energy_level, task_progressed, stuck

#### Scenario: Create new time segment
- **WHEN** пользователь заполняет форму и нажимает "Сохранить"
- **THEN** система создаёт новый сегмент времени и обновляет таблицу

### Requirement: Edit existing time segment inline

Система ДОЛЖНА позволять редактировать существующий сегмент времени inline в таблице.

#### Scenario: Enter edit mode
- **WHEN** пользователь нажимает кнопку редактирования на строке сегмента
- **THEN** строка переходит в режим редактирования с полями ввода для duration_seconds, actual_time_seconds, billed_time_seconds, energy_level, task_progressed, stuck

#### Scenario: Save edited segment
- **WHEN** пользователь изменяет поля и нажимает "Сохранить"
- **THEN** система обновляет сегмент и перерисовывает таблицу

#### Scenario: Cancel editing
- **WHEN** пользователь нажимает "Отмена" в режиме редактирования
- **THEN** система возвращает строку в режим просмотра без сохранения изменений

### Requirement: Delete time segment from editor dialog

Система ДОЛЖНА позволять удалять сегмент времени с подтверждением.

#### Scenario: Delete with confirmation
- **WHEN** пользователь нажимает кнопку удаления на строке сегмента
- **THEN** система запрашивает подтверждение и при согласии удаляет сегмент

#### Scenario: Table updates after deletion
- **WHEN** сегмент удалён
- **THEN** таблица перерисовывается без удалённой записи и пересчитывается суммарное время

### Requirement: Dialog design consistency

Диалог редактора сегментов ДОЛЖЕН соответствовать дизайну остального приложения.

#### Scenario: Use existing CSS classes
- **WHEN** диалог отображается
- **THEN** используются те же CSS-классы: data-table, form-control, btn-icon, dialog-header, dialog-body, dialog-footer

#### Scenario: Scrollable table for many segments
- **WHEN** в задаче много сегментов времени
- **THEN** таблица прокручивается внутри диалога с фиксированным заголовком
