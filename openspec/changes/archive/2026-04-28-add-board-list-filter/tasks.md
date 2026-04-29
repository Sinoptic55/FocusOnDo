## 1. TasksView — состояние и загрузка данных

- [x] 1.1 Добавить `filterListId: number | null` в интерфейс `TasksViewState` и начальное значение `null` в конструктор
- [x] 1.2 Добавить `lists: TaskList[]` в `TasksViewState` и загрузку `api.getLists()` в `onMount()` наравне с проектами и клиентами
- [x] 1.3 Импортировать тип `TaskList` из `../models`

## 2. TasksView — рендер фильтра

- [x] 2.1 Добавить `<select id="filter-list">` в шаблон тулбара (`tasks-filters`) между фильтром по клиенту и кнопкой «Что делать дальше?», с опцией «Все списки» и опциями из `this.state.lists`
- [x] 2.2 Добавить обработчик `change` на `#filter-list`, обновляющий `filterListId` в state

## 3. TasksView — передача фильтра в дочерние виды

- [x] 3.1 Добавить `list_id: this.state.filterListId || undefined` в объект `filters` внутри `renderSubView()`

## 4. Дочерние виды — обновление типов

- [x] 4.1 Добавить `list_id?: number` в `DateBoardViewProps.filters`
- [x] 4.2 Добавить `list_id?: number` в `StatusBoardViewProps.filters`
