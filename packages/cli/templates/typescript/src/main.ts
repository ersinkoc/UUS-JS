import { Uus, reactive } from '@uusjs/core';
import './style.css';

// Define types
interface Todo {
  id: number;
  text: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface AppState {
  title: string;
  todos: Todo[];
  newTodoText: string;
  filter: 'all' | 'active' | 'completed';
  
  // Computed
  filteredTodos: Todo[];
  activeCount: number;
  completedCount: number;
  
  // Methods
  addTodo(): void;
  toggleTodo(id: number): void;
  removeTodo(id: number): void;
  clearCompleted(): void;
  setFilter(filter: AppState['filter']): void;
}

// App template
const template = `
  <div class="app" uus-state>
    <header>
      <h1 uus-text="title"></h1>
      <p>Built with TypeScript for type safety</p>
    </header>
    
    <main>
      <div class="todo-input">
        <form @submit.prevent="addTodo">
          <input 
            type="text" 
            uus-model="newTodoText" 
            placeholder="What needs to be done?"
            class="new-todo"
          >
          <button type="submit" :disabled="!newTodoText.trim()">
            Add Todo
          </button>
        </form>
      </div>
      
      <div class="filters">
        <button 
          @click="setFilter('all')"
          :class="{ active: filter === 'all' }"
        >
          All (<span uus-text="todos.length"></span>)
        </button>
        <button 
          @click="setFilter('active')"
          :class="{ active: filter === 'active' }"
        >
          Active (<span uus-text="activeCount"></span>)
        </button>
        <button 
          @click="setFilter('completed')"
          :class="{ active: filter === 'completed' }"
        >
          Completed (<span uus-text="completedCount"></span>)
        </button>
      </div>
      
      <ul class="todo-list" uus-show="filteredTodos.length > 0">
        <li 
          uus-for="todo in filteredTodos" 
          :key="todo.id"
          :class="{ done: todo.done }"
        >
          <div class="todo-content">
            <input 
              type="checkbox" 
              :checked="todo.done"
              @change="toggleTodo(todo.id)"
            >
            <span class="todo-text" uus-text="todo.text"></span>
            <span 
              class="priority"
              :class="'priority-' + todo.priority"
              uus-text="todo.priority"
            ></span>
          </div>
          <button 
            class="remove-btn"
            @click="removeTodo(todo.id)"
          >
            ×
          </button>
        </li>
      </ul>
      
      <div uus-show="filteredTodos.length === 0" class="empty-state">
        <p uus-show="filter === 'all'">No todos yet. Add one above!</p>
        <p uus-show="filter === 'active'">No active todos.</p>
        <p uus-show="filter === 'completed'">No completed todos.</p>
      </div>
      
      <div class="actions" uus-show="completedCount > 0">
        <button @click="clearCompleted" class="clear-btn">
          Clear completed
        </button>
      </div>
    </main>
  </div>
`;

// Create reactive state
const state = reactive<AppState>({
  title: 'TypeScript Todo App',
  todos: [],
  newTodoText: '',
  filter: 'all',
  
  // Computed properties
  get filteredTodos() {
    switch (this.filter) {
      case 'active':
        return this.todos.filter(t => !t.done);
      case 'completed':
        return this.todos.filter(t => t.done);
      default:
        return this.todos;
    }
  },
  
  get activeCount() {
    return this.todos.filter(t => !t.done).length;
  },
  
  get completedCount() {
    return this.todos.filter(t => t.done).length;
  },
  
  // Methods
  addTodo() {
    const text = this.newTodoText.trim();
    if (text) {
      this.todos.push({
        id: Date.now(),
        text,
        done: false,
        priority: 'medium'
      });
      this.newTodoText = '';
    }
  },
  
  toggleTodo(id: number) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.done = !todo.done;
    }
  },
  
  removeTodo(id: number) {
    this.todos = this.todos.filter(t => t.id !== id);
  },
  
  clearCompleted() {
    this.todos = this.todos.filter(t => !t.done);
  },
  
  setFilter(filter: AppState['filter']) {
    this.filter = filter;
  }
});

// Create and mount app
const app = new Uus({ state });
document.getElementById('app')!.innerHTML = template;
app.mount('#app');

// Add some example todos
state.todos = [
  { id: 1, text: 'Learn TypeScript', done: true, priority: 'high' },
  { id: 2, text: 'Build with Uus.js', done: false, priority: 'medium' },
  { id: 3, text: 'Deploy to production', done: false, priority: 'low' }
];