import express from 'express';
import { renderToString, createSSRApp } from '@uusjs/ssr';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use('/assets', express.static(join(__dirname, 'public')));

// Create the Uus app factory
const createApp = createSSRApp((context) => ({
  state: {
    title: 'SSR Demo',
    todos: [],
    newTodo: '',

    async loadTodos() {
      // In real app, fetch from database
      this.todos = context?.data?.todos || [
        { id: 1, text: 'Learn Uus.js', done: true },
        { id: 2, text: 'Build SSR app', done: false },
        { id: 3, text: 'Deploy to production', done: false },
      ];
    },

    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo.trim(),
          done: false,
        });
        this.newTodo = '';
      }
    },

    toggleTodo(id) {
      const todo = this.todos.find((t) => t.id === id);
      if (todo) {
        todo.done = !todo.done;
      }
    },

    removeTodo(id) {
      this.todos = this.todos.filter((t) => t.id !== id);
    },
  },

  setup(app) {
    // Load initial data
    app.state.loadTodos();
  },
}));

// HTML template
const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uus.js SSR Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .app {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 2rem;
    }
    .todo-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    input[type="text"] {
      flex: 1;
      padding: 0.5rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    button {
      padding: 0.5rem 1rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: #2980b9;
    }
    .todo-list {
      list-style: none;
      padding: 0;
    }
    .todo-item {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
    }
    .todo-item.done {
      opacity: 0.6;
    }
    .todo-item.done .todo-text {
      text-decoration: line-through;
    }
    .todo-checkbox {
      margin-right: 1rem;
    }
    .todo-text {
      flex: 1;
    }
    .todo-remove {
      background: #e74c3c;
      padding: 0.25rem 0.5rem;
      font-size: 12px;
    }
    .todo-remove:hover {
      background: #c0392b;
    }
    .loading {
      text-align: center;
      color: #666;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <div id="app" class="app" uus-state>
    <h1 uus-text="title"></h1>
    
    <form class="todo-form" @submit.prevent="addTodo">
      <input 
        type="text" 
        uus-model="newTodo"
        placeholder="What needs to be done?"
      >
      <button type="submit">Add</button>
    </form>
    
    <ul class="todo-list" uus-show="todos.length > 0">
      <li 
        uus-for="todo in todos"
        :key="todo.id"
        class="todo-item"
        :class="{ done: todo.done }"
      >
        <input 
          type="checkbox"
          class="todo-checkbox"
          :checked="todo.done"
          @change="toggleTodo(todo.id)"
        >
        <span class="todo-text" uus-text="todo.text"></span>
        <button 
          class="todo-remove"
          @click="removeTodo(todo.id)"
        >
          Remove
        </button>
      </li>
    </ul>
    
    <p uus-show="todos.length === 0" style="text-align: center; color: #999;">
      No todos yet. Add one above!
    </p>
    
    <p style="margin-top: 2rem; text-align: center; color: #666;">
      <span uus-text="todos.filter(t => !t.done).length"></span> active,
      <span uus-text="todos.filter(t => t.done).length"></span> completed
    </p>
  </div>
  
  <script src="https://unpkg.com/@uusjs/core"></script>
  <script src="https://unpkg.com/@uusjs/ssr"></script>
  <script>
    // Client-side hydration
    const { createSSRApp, hydrate } = UusSSR;
    const app = createSSRApp()();
    hydrate(app, '#app');
  </script>
</body>
</html>
`;

// Routes
app.get('/', async (req, res) => {
  try {
    // Create context
    const context = {
      url: req.url,
      title: 'Uus.js SSR Todo App',
      data: {
        // You can pass initial data here
        todos: [
          { id: 1, text: 'Server-rendered todo', done: false },
          { id: 2, text: 'Hydrated on client', done: true },
        ],
      },
    };

    // Render to string
    const html = await renderToString(createApp, {
      context,
      template,
    });

    // Send response
    res.status(context.statusCode || 200);
    res.set(context.headers || {});
    res.send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API routes
app.get('/api/todos', (req, res) => {
  res.json([
    { id: 1, text: 'API todo 1', done: false },
    { id: 2, text: 'API todo 2', done: true },
  ]);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 SSR server running at http://localhost:${port}`);
});

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});
