import { Uus } from '@uusjs/core';
import { createRouter } from '@uusjs/router';
import { createForm, validators } from '@uusjs/forms';
import './style.css';

// API client
const api = {
  async get(url) {
    const response = await fetch(`/api${url}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
  
  async post(url, data) {
    const response = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
  
  async put(url, data) {
    const response = await fetch(`/api${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
  
  async delete(url) {
    const response = await fetch(`/api${url}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Network response was not ok');
  }
};

// Create router
const router = createRouter({
  routes: [
    { 
      path: '/', 
      component: 'home',
      name: 'home'
    },
    { 
      path: '/todos', 
      component: 'todos',
      name: 'todos'
    },
    { 
      path: '/profile', 
      component: 'profile',
      name: 'profile'
    }
  ]
});

// App template
const template = `
  <div class="app" uus-state>
    <nav class="navbar">
      <h1>Full Stack App</h1>
      <ul class="nav-links">
        <li>
          <a 
            href="/" 
            uus-route 
            :class="{ active: $route.path === '/' }"
          >
            Home
          </a>
        </li>
        <li>
          <a 
            href="/todos" 
            uus-route 
            :class="{ active: $route.path === '/todos' }"
          >
            Todos
          </a>
        </li>
        <li>
          <a 
            href="/profile" 
            uus-route 
            :class="{ active: $route.path === '/profile' }"
          >
            Profile
          </a>
        </li>
      </ul>
    </nav>
    
    <main>
      <!-- Home Page -->
      <div uus-component="home" class="page">
        <h2>Welcome to Uus.js Full Stack!</h2>
        <p>This is a full-stack application with:</p>
        <ul>
          <li>Express.js API backend</li>
          <li>Uus.js reactive frontend</li>
          <li>Client-side routing</li>
          <li>Form validation</li>
          <li>Real-time updates</li>
        </ul>
        <a href="/todos" uus-route class="btn">
          View Todos →
        </a>
      </div>
      
      <!-- Todos Page -->
      <div uus-component="todos" class="page">
        <h2>Todo List</h2>
        
        <div class="todo-form">
          <form @submit.prevent="addTodo">
            <input 
              type="text" 
              uus-model="newTodoText"
              placeholder="What needs to be done?"
              :class="{ error: todoForm.errors.text }"
            >
            <button type="submit" :disabled="!todoForm.valid || loading">
              Add Todo
            </button>
          </form>
          <p class="error" uus-show="todoForm.errors.text" uus-text="todoForm.errors.text"></p>
        </div>
        
        <div class="loading" uus-show="loading">Loading todos...</div>
        
        <ul class="todo-list" uus-show="!loading && todos.length > 0">
          <li 
            uus-for="todo in todos" 
            :key="todo.id"
            :class="{ done: todo.done }"
          >
            <input 
              type="checkbox"
              :checked="todo.done"
              @change="toggleTodo(todo)"
            >
            <span uus-text="todo.text"></span>
            <button 
              class="delete-btn"
              @click="deleteTodo(todo)"
            >
              ×
            </button>
          </li>
        </ul>
        
        <p uus-show="!loading && todos.length === 0" class="empty">
          No todos yet. Add one above!
        </p>
      </div>
      
      <!-- Profile Page -->
      <div uus-component="profile" class="page">
        <h2>User Profile</h2>
        <div class="profile-card" uus-show="user">
          <h3 uus-text="user.name"></h3>
          <p>Email: <span uus-text="user.email"></span></p>
        </div>
      </div>
    </main>
  </div>
`;

// Create app
const app = new Uus({
  state: {
    todos: [],
    loading: false,
    newTodoText: '',
    user: null,
    
    // Todo form
    todoForm: createForm({
      text: ''
    }, {
      text: [
        validators.required('Todo text is required'),
        validators.minLength(3, 'Todo must be at least 3 characters')
      ]
    }),
    
    // Methods
    async loadTodos() {
      this.loading = true;
      try {
        this.todos = await api.get('/todos');
      } catch (error) {
        console.error('Failed to load todos:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadUser() {
      try {
        this.user = await api.get('/user');
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    },
    
    async addTodo() {
      this.todoForm.setValue('text', this.newTodoText);
      await this.todoForm.validate();
      
      if (!this.todoForm.valid) return;
      
      try {
        const newTodo = await api.post('/todos', { text: this.newTodoText });
        this.todos.push(newTodo);
        this.newTodoText = '';
        this.todoForm.reset();
      } catch (error) {
        console.error('Failed to add todo:', error);
      }
    },
    
    async toggleTodo(todo) {
      try {
        await api.put(`/todos/${todo.id}`, { done: !todo.done });
        todo.done = !todo.done;
      } catch (error) {
        console.error('Failed to toggle todo:', error);
      }
    },
    
    async deleteTodo(todo) {
      try {
        await api.delete(`/todos/${todo.id}`);
        const index = this.todos.indexOf(todo);
        if (index > -1) {
          this.todos.splice(index, 1);
        }
      } catch (error) {
        console.error('Failed to delete todo:', error);
      }
    }
  }
});

// Set up router
app.use(router);

// Load initial data
router.beforeEach((to, from, next) => {
  if (to.name === 'todos' && app.state.todos.length === 0) {
    app.state.loadTodos();
  }
  if (to.name === 'profile' && !app.state.user) {
    app.state.loadUser();
  }
  next();
});

// Mount app
document.getElementById('app').innerHTML = template;
app.mount('#app');