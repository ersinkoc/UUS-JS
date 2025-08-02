# Quick Start

Get up and running with Uus.js in 5 minutes! This guide will walk you through creating your first interactive application.

## 1. Hello World

Create an HTML file and add:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My First Uus.js App</title>
  </head>
  <body>
    <!-- Your app -->
    <div id="app" uus-state="{ message: 'Hello Uus.js!' }">
      <h1 uus-text="message"></h1>
      <input uus-model="message" placeholder="Change the message" />
    </div>

    <!-- Include Uus.js -->
    <script src="https://unpkg.com/@uusjs/core"></script>
    <script>
      // Initialize Uus.js
      new Uus().mount('#app');
    </script>
  </body>
</html>
```

Open this file in your browser - you now have a reactive app! Try typing in the input field.

## 2. Interactive Counter

Let's build something more interactive:

```html
<div id="app" uus-state="{ count: 0 }">
  <h2>Counter: <span uus-text="count">0</span></h2>

  <button uus-on:click="count++">Increment</button>
  <button uus-on:click="count--">Decrement</button>
  <button uus-on:click="count = 0">Reset</button>

  <p uus-show="count > 10">🎉 You've reached 10!</p>
  <p uus-show="count < 0">📉 Going negative!</p>
</div>
```

## 3. Todo List

A classic todo app in under 50 lines:

```html
<div
  id="app"
  uus-state="{ 
  todos: [],
  newTodo: '',
  filter: 'all'
}"
>
  <h1>Todo List</h1>

  <!-- Add todo form -->
  <form
    uus-on:submit.prevent="
    if (newTodo.trim()) {
      todos.push({
        id: Date.now(),
        text: newTodo,
        done: false
      });
      newTodo = '';
    }
  "
  >
    <input
      uus-model="newTodo"
      placeholder="What needs to be done?"
      uus-on:keyup.escape="newTodo = ''"
    />
    <button type="submit">Add</button>
  </form>

  <!-- Filter buttons -->
  <div>
    <button uus-on:click="filter = 'all'">All</button>
    <button uus-on:click="filter = 'active'">Active</button>
    <button uus-on:click="filter = 'completed'">Completed</button>
  </div>

  <!-- Todo list -->
  <ul>
    <li
      uus-for="todo in todos.filter(t => 
      filter === 'all' || 
      (filter === 'active' && !t.done) || 
      (filter === 'completed' && t.done)
    )"
    >
      <input type="checkbox" uus-model="todo.done" />
      <span
        uus-text="todo.text"
        uus-style="{ textDecoration: todo.done ? 'line-through' : 'none' }"
      ></span>
      <button uus-on:click="todos = todos.filter(t => t.id !== todo.id)">
        Delete
      </button>
    </li>
  </ul>

  <!-- Stats -->
  <p><span uus-text="todos.filter(t => !t.done).length"></span> items left</p>
</div>
```

## 4. Adding Animations

Make it smooth with the animate package:

```html
<!-- Include animation package -->
<script src="https://unpkg.com/@uusjs/animate"></script>

<div id="app" uus-state="{ show: false }">
  <button uus-on:click="show = !show">Toggle</button>

  <div uus-show="show" uus-animate="fadeIn" uus-animate-out="fadeOut">
    <h2>Animated Content!</h2>
    <p>This fades in and out smoothly.</p>
  </div>
</div>

<script>
  const app = new Uus();
  app.use(createAnimate()); // Add animation support
  app.mount('#app');
</script>
```

## 5. Working with APIs

Fetch data and display it:

```html
<div
  id="app"
  uus-state="{ 
  users: [],
  loading: false,
  error: null
}"
>
  <button
    uus-on:click="
    loading = true;
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(r => r.json())
      .then(data => {
        users = data;
        loading = false;
      })
      .catch(err => {
        error = err.message;
        loading = false;
      });
  "
  >
    Load Users
  </button>

  <div uus-show="loading">Loading...</div>
  <div uus-show="error" uus-text="error"></div>

  <ul uus-show="users.length > 0">
    <li uus-for="user in users" uus-text="user.name"></li>
  </ul>
</div>
```

## 6. Component Pattern

Organize code with a component-like pattern:

```html
<div id="app"></div>

<script>
  const app = new Uus();

  // Define component state and methods
  app.state = reactive({
    todos: [],
    newTodo: '',

    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo,
          done: false,
        });
        this.newTodo = '';
      }
    },

    removeTodo(id) {
      this.todos = this.todos.filter((t) => t.id !== id);
    },

    toggleTodo(id) {
      const todo = this.todos.find((t) => t.id === id);
      if (todo) todo.done = !todo.done;
    },
  });

  // Mount to element
  app.mount('#app');

  // Add template
  document.getElementById('app').innerHTML = `
  <h1>Todo App</h1>
  <form uus-on:submit.prevent="addTodo">
    <input uus-model="newTodo" placeholder="Add todo">
    <button>Add</button>
  </form>
  <ul>
    <li uus-for="todo in todos">
      <input 
        type="checkbox" 
        uus-bind:checked="todo.done"
        uus-on:change="toggleTodo(todo.id)"
      >
      <span uus-text="todo.text"></span>
      <button uus-on:click="removeTodo(todo.id)">×</button>
    </li>
  </ul>
`;
</script>
```

## Next Steps

Congratulations! You've learned the basics of Uus.js. Here's what to explore next:

1. **[Reactivity](./core/reactivity.md)** - Deep dive into the reactive system
2. **[Directives](./core/directives.md)** - Master all available directives
3. **[Router](./api/router.md)** - Build single-page applications
4. **[Forms](./api/forms.md)** - Handle complex forms with validation
5. **[Tutorial](./tutorial.md)** - Build a complete application

## Tips for Success

- 🎯 **Start Small** - Begin with simple interactions
- 📚 **Use DevTools** - Inspect state with `app.state` in console
- 🔍 **Read Errors** - Uus.js provides helpful error messages
- 💬 **Join Community** - Get help in [Discord](https://discord.gg/uusjs)
- ⭐ **Star on GitHub** - Support the project!

## Common Patterns

### Computed Values

```javascript
uus-state="{
  price: 100,
  tax: 0.08,
  total: computed(() => price + (price * tax))
}"
```

### Method Calls

```javascript
uus-state="{
  items: [],
  addItem(name) {
    this.items.push({ id: Date.now(), name });
  }
}"
```

### Lifecycle Hooks

```javascript
uus-component="
  onMount() {
    console.log('Component mounted!');
  },
  onUnmount() {
    console.log('Component unmounted!');
  }
"
```

Happy coding with Uus.js! 🚀
