# Todo App Example

A classic todo application showcasing Uus.js reactivity, directives, and state management.

## Live Demo

[View in Playground](../playground/?example=todo-list)

## Features

- ✅ Add, complete, and delete todos
- 🎯 Filter by status (all, active, completed)
- 💾 Local storage persistence
- 🎨 Smooth animations
- ⌨️ Keyboard shortcuts

## Complete Code

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Todo App - Uus.js</title>
    <script src="https://unpkg.com/@uusjs/core@latest"></script>
    <script src="https://unpkg.com/@uusjs/animate@latest"></script>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f5f5f5;
        margin: 0;
        padding: 20px;
      }

      .app {
        max-width: 550px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        text-align: center;
      }

      .header h1 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 300;
      }

      .header .stats {
        margin-top: 0.5rem;
        opacity: 0.9;
      }

      .content {
        padding: 2rem;
      }

      .add-todo {
        display: flex;
        margin-bottom: 2rem;
      }

      .add-todo input {
        flex: 1;
        padding: 0.75rem 1rem;
        font-size: 16px;
        border: 2px solid #e0e0e0;
        border-radius: 4px 0 0 4px;
        outline: none;
      }

      .add-todo input:focus {
        border-color: #667eea;
      }

      .add-todo button {
        padding: 0.75rem 1.5rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }

      .add-todo button:hover:not(:disabled) {
        background: #5a67d8;
      }

      .add-todo button:disabled {
        background: #e0e0e0;
        cursor: not-allowed;
      }

      .filters {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .filter-btn {
        padding: 0.5rem 1rem;
        background: #f0f0f0;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
      }

      .filter-btn:hover {
        background: #e0e0e0;
      }

      .filter-btn.active {
        background: #667eea;
        color: white;
      }

      .todo-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .todo-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.2s;
      }

      .todo-item:hover {
        background: #f9f9f9;
      }

      .todo-item.completed {
        opacity: 0.6;
      }

      .todo-checkbox {
        width: 20px;
        height: 20px;
        margin-right: 1rem;
        cursor: pointer;
      }

      .todo-text {
        flex: 1;
        font-size: 16px;
        transition: all 0.2s;
      }

      .todo-item.completed .todo-text {
        text-decoration: line-through;
        color: #999;
      }

      .todo-actions {
        display: flex;
        gap: 0.5rem;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .todo-item:hover .todo-actions {
        opacity: 1;
      }

      .btn-edit,
      .btn-delete {
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .btn-edit {
        background: #4299e1;
        color: white;
      }

      .btn-edit:hover {
        background: #3182ce;
      }

      .btn-delete {
        background: #f56565;
        color: white;
      }

      .btn-delete:hover {
        background: #e53e3e;
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
        color: #999;
      }

      .empty-state-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: #f9f9f9;
        border-top: 1px solid #e0e0e0;
        font-size: 14px;
        color: #666;
      }

      .clear-completed {
        background: none;
        border: none;
        color: #f56565;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .clear-completed:hover {
        background: #fff5f5;
      }

      /* Edit mode */
      .todo-item.editing .todo-text {
        display: none;
      }

      .todo-edit {
        flex: 1;
        padding: 0.5rem;
        font-size: 16px;
        border: 2px solid #667eea;
        border-radius: 4px;
        outline: none;
      }
    </style>
  </head>
  <body>
    <div
      id="app"
      uus-state="{ 
    todos: [],
    newTodo: '',
    filter: 'all',
    editingId: null,
    editText: ''
  }"
      uus-component="{
    onMount() {
      // Load todos from localStorage
      const saved = localStorage.getItem('uus-todos');
      if (saved) {
        this.todos = JSON.parse(saved);
      }
      
      // Watch for changes and save
      this.$watch('todos', () => {
        localStorage.setItem('uus-todos', JSON.stringify(this.todos));
      }, { deep: true });
    }
  }"
    >
      <div class="app" uus-animate="fadeIn">
        <div class="header">
          <h1>✓ My Todos</h1>
          <div class="stats">
            <span uus-text="todos.filter(t => !t.completed).length"></span>
            active,
            <span uus-text="todos.filter(t => t.completed).length"></span>
            completed
          </div>
        </div>

        <div class="content">
          <!-- Add Todo Form -->
          <form
            class="add-todo"
            @submit.prevent="
          if (newTodo.trim()) {
            todos.push({
              id: Date.now(),
              text: newTodo.trim(),
              completed: false,
              createdAt: new Date().toISOString()
            });
            newTodo = '';
          }
        "
          >
            <input
              uus-model="newTodo"
              placeholder="What needs to be done?"
              @keyup.escape="newTodo = ''"
            />
            <button type="submit" :disabled="!newTodo.trim()">Add</button>
          </form>

          <!-- Filters -->
          <div class="filters">
            <button
              class="filter-btn"
              :class="{ active: filter === 'all' }"
              @click="filter = 'all'"
            >
              All
            </button>
            <button
              class="filter-btn"
              :class="{ active: filter === 'active' }"
              @click="filter = 'active'"
            >
              Active
            </button>
            <button
              class="filter-btn"
              :class="{ active: filter === 'completed' }"
              @click="filter = 'completed'"
            >
              Completed
            </button>
          </div>

          <!-- Todo List -->
          <ul class="todo-list" uus-show="todos.length > 0">
            <li
              uus-for="todo in todos.filter(t => 
              filter === 'all' || 
              (filter === 'active' && !t.completed) || 
              (filter === 'completed' && t.completed)
            )"
              :key="todo.id"
              class="todo-item"
              :class="{ 
              completed: todo.completed,
              editing: editingId === todo.id
            }"
              uus-animate="slideIn"
              uus-stagger="30"
            >
              <input
                type="checkbox"
                class="todo-checkbox"
                uus-model="todo.completed"
                uus-show="editingId !== todo.id"
              />

              <span
                class="todo-text"
                uus-text="todo.text"
                @dblclick="
                editingId = todo.id;
                editText = todo.text;
              "
              ></span>

              <input
                uus-show="editingId === todo.id"
                uus-model="editText"
                class="todo-edit"
                @keyup.enter="
                todo.text = editText.trim() || todo.text;
                editingId = null;
              "
                @keyup.escape="editingId = null"
                @blur="
                todo.text = editText.trim() || todo.text;
                editingId = null;
              "
              />

              <div class="todo-actions">
                <button
                  class="btn-edit"
                  @click="
                  editingId = todo.id;
                  editText = todo.text;
                "
                  uus-show="editingId !== todo.id"
                >
                  Edit
                </button>
                <button
                  class="btn-delete"
                  @click="todos = todos.filter(t => t.id !== todo.id)"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>

          <!-- Empty State -->
          <div
            class="empty-state"
            uus-show="todos.filter(t => 
            filter === 'all' || 
            (filter === 'active' && !t.completed) || 
            (filter === 'completed' && t.completed)
          ).length === 0"
          >
            <div class="empty-state-icon">
              <span uus-text="filter === 'completed' ? '✓' : '📝'"></span>
            </div>
            <p
              uus-text="
            filter === 'completed' 
              ? 'No completed todos yet' 
              : filter === 'active' 
                ? 'No active todos' 
                : 'No todos yet. Add one above!'
          "
            ></p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer" uus-show="todos.length > 0">
          <span>
            <strong uus-text="todos.filter(t => !t.completed).length"></strong>
            <span
              uus-text="todos.filter(t => !t.completed).length === 1 ? 'item' : 'items'"
            ></span>
            left
          </span>
          <button
            class="clear-completed"
            uus-show="todos.some(t => t.completed)"
            @click="todos = todos.filter(t => !t.completed)"
          >
            Clear completed
          </button>
        </div>
      </div>
    </div>

    <script>
      const app = new Uus();
      app.use(createAnimate());
      app.mount('#app');
    </script>
  </body>
</html>
```

## Key Concepts Demonstrated

### 1. Reactive State

```javascript
uus-state="{
  todos: [],
  newTodo: '',
  filter: 'all',
  editingId: null,
  editText: ''
}"
```

All state is reactive - changes automatically update the UI.

### 2. Two-way Data Binding

```html
<input uus-model="newTodo" />
<input type="checkbox" uus-model="todo.completed" />
```

`uus-model` creates two-way binding between inputs and state.

### 3. Event Handling

```html
@submit.prevent="..."
<!-- Prevent default form submission -->
@keyup.escape="..."
<!-- Escape key handler -->
@dblclick="..."
<!-- Double-click to edit -->
```

Rich event handling with modifiers.

### 4. Conditional Rendering

```html
uus-show="todos.length > 0" uus-if="editingId === todo.id"
```

Show/hide elements based on state.

### 5. List Rendering

```html
uus-for="todo in filteredTodos" :key="todo.id"
```

Efficiently render lists with unique keys.

### 6. Computed Filtering

```javascript
todos.filter(
  (t) =>
    filter === 'all' ||
    (filter === 'active' && !t.completed) ||
    (filter === 'completed' && t.completed)
);
```

Filter todos based on current filter state.

### 7. Local Storage

```javascript
onMount() {
  const saved = localStorage.getItem('uus-todos');
  if (saved) {
    this.todos = JSON.parse(saved);
  }

  this.$watch('todos', () => {
    localStorage.setItem('uus-todos', JSON.stringify(this.todos));
  }, { deep: true });
}
```

Persist todos across sessions.

### 8. Animations

```html
uus-animate="slideIn" uus-stagger="30"
```

Smooth animations with staggered timing.

## Enhancements

### Add Due Dates

```javascript
todos.push({
  id: Date.now(),
  text: newTodo.trim(),
  completed: false,
  dueDate: selectedDate,
  createdAt: new Date().toISOString(),
});
```

### Add Categories

```javascript
uus-state="{
  todos: [],
  categories: ['Work', 'Personal', 'Shopping'],
  selectedCategory: 'all'
}"
```

### Add Search

```javascript
const searchResults = computed(() =>
  todos.filter((todo) =>
    todo.text.toLowerCase().includes(searchQuery.toLowerCase())
  )
);
```

### Add Drag & Drop

```javascript
uus-component="{
  onMount() {
    // Initialize sortable
    new Sortable(this.$el.querySelector('.todo-list'), {
      animation: 150,
      onEnd: (evt) => {
        const item = this.todos.splice(evt.oldIndex, 1)[0];
        this.todos.splice(evt.newIndex, 0, item);
      }
    });
  }
}"
```

## Performance Tips

1. **Use `:key` for lists** - Helps Uus.js track items efficiently
2. **Debounce search/filter** - Avoid excessive updates
3. **Lazy load large lists** - Virtual scrolling for many items
4. **Batch operations** - Update multiple todos in one operation

## Try It Yourself

1. [Open in Playground](../playground/?example=todo-list)
2. Add new features like priorities or tags
3. Implement keyboard navigation
4. Add todo statistics and charts

## Next Steps

- Learn about [Forms](./forms.md) for more complex inputs
- Explore [Animations](./animations.md) for richer interactions
- See [Router](./router.md) for multi-page todo apps
