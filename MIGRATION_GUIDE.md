# UUS.js Migration Guide

## Table of Contents
- [From Vue.js](#from-vuejs)
- [From React](#from-react)
- [From Alpine.js](#from-alpinejs)
- [From jQuery](#from-jquery)
- [From Vanilla JavaScript](#from-vanilla-javascript)

---

## From Vue.js

UUS.js shares many concepts with Vue.js, making migration straightforward.

### Instance Creation

**Vue.js:**
```javascript
const app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
});
```

**UUS.js:**
```javascript
const app = new Uus();
app.mount('#app', {
  state: {
    message: 'Hello UUS!'
  }
});
```

### Template Syntax

**Vue.js:**
```html
<div id="app">
  {{ message }}
  <input v-model="message">
  <button @click="count++">{{ count }}</button>
</div>
```

**UUS.js:**
```html
<div id="app" uus-state="{ message: 'Hello', count: 0 }">
  <span uus-text="message"></span>
  <input uus-model="message">
  <button @click="count++" uus-text="count"></button>
</div>
```

### Directives Mapping

| Vue.js | UUS.js | Notes |
|--------|--------|--------|
| `v-text` | `uus-text` | Text interpolation |
| `v-html` | `uus-html` | HTML content (sanitized) |
| `v-show` | `uus-show` | Toggle visibility |
| `v-if` | `uus-if` | Conditional rendering |
| `v-for` | `uus-for` | List rendering |
| `v-model` | `uus-model` | Two-way binding |
| `v-bind:attr` | `uus-bind:attr` or `:attr` | Attribute binding |
| `v-on:event` | `uus-on:event` or `@event` | Event handling |
| `:class` | `uus-class` | Dynamic classes |
| `:style` | `uus-style` | Dynamic styles |

### Components

**Vue.js:**
```javascript
Vue.component('my-component', {
  props: ['title'],
  template: '<h1>{{ title }}</h1>'
});
```

**UUS.js:**
```javascript
app.component('my-component', {
  props: ['title'],
  template: '<h1 uus-text="title"></h1>'
});
```

### Computed Properties

**Vue.js:**
```javascript
new Vue({
  data: { count: 0 },
  computed: {
    doubled() {
      return this.count * 2;
    }
  }
});
```

**UUS.js:**
```javascript
import { computed } from '@uusjs/core';

const state = {
  count: 0,
  doubled: computed(() => state.count * 2)
};
```

### Watchers

**Vue.js:**
```javascript
new Vue({
  watch: {
    count(newVal, oldVal) {
      console.log('Count changed:', oldVal, '->', newVal);
    }
  }
});
```

**UUS.js:**
```javascript
import { watch } from '@uusjs/core';

watch(
  () => state.count,
  (newVal, oldVal) => {
    console.log('Count changed:', oldVal, '->', newVal);
  }
);
```

### Lifecycle Hooks

**Vue.js:**
```javascript
new Vue({
  created() { },
  mounted() { },
  updated() { },
  destroyed() { }
});
```

**UUS.js:**
```javascript
app.mount('#app', {
  onBeforeMount() { },
  onMounted() { },
  onUpdated() { },
  onUnmounted() { }
});
```

---

## From React

### Component Structure

**React:**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**UUS.js:**
```html
<div uus-state="{ count: 0 }">
  <p>Count: <span uus-text="count"></span></p>
  <button @click="count++">Increment</button>
</div>
```

### State Management

**React (with hooks):**
```javascript
const [user, setUser] = useState({ name: '', email: '' });
const [loading, setLoading] = useState(false);

const updateUser = (name) => {
  setUser({ ...user, name });
};
```

**UUS.js:**
```javascript
const state = {
  user: { name: '', email: '' },
  loading: false,
  updateUser(name) {
    this.user.name = name;
  }
};
```

### Effects

**React:**
```javascript
useEffect(() => {
  fetchData();
  return () => cleanup();
}, [dependency]);
```

**UUS.js:**
```javascript
import { effect } from '@uusjs/core';

const cleanup = effect(() => {
  fetchData();
});

// Cleanup when done
cleanup();
```

### Context/Provider Pattern

**React:**
```jsx
const ThemeContext = React.createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}
```

**UUS.js:**
```javascript
// Global state
const globalState = createReactive({
  theme: 'dark'
});

// Use in any component
app.mount('#app', {
  state: globalState
});
```

### Conditional Rendering

**React:**
```jsx
{isVisible && <Component />}
{condition ? <ComponentA /> : <ComponentB />}
```

**UUS.js:**
```html
<div uus-if="isVisible">Component</div>
<div uus-show="condition">ComponentA</div>
<div uus-show="!condition">ComponentB</div>
```

### List Rendering

**React:**
```jsx
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

**UUS.js:**
```html
<li uus-for="item in items" :key="item.id">
  <span uus-text="item.name"></span>
</li>
```

### Form Handling

**React:**
```jsx
<input 
  value={value} 
  onChange={(e) => setValue(e.target.value)} 
/>
```

**UUS.js:**
```html
<input uus-model="value" />
```

---

## From Alpine.js

UUS.js syntax is very similar to Alpine.js, making migration simple.

### Basic Setup

**Alpine.js:**
```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">Content</div>
</div>
```

**UUS.js:**
```html
<div uus-state="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div uus-show="open">Content</div>
</div>
```

### Directives Comparison

| Alpine.js | UUS.js | Notes |
|-----------|--------|--------|
| `x-data` | `uus-state` | Component state |
| `x-text` | `uus-text` | Text content |
| `x-html` | `uus-html` | HTML content |
| `x-show` | `uus-show` | Toggle visibility |
| `x-if` | `uus-if` | Conditional rendering |
| `x-for` | `uus-for` | List rendering |
| `x-model` | `uus-model` | Two-way binding |
| `x-bind:attr` | `uus-bind:attr` | Attribute binding |
| `x-on:event` | `uus-on:event` | Event handling |
| `x-ref` | `ref` attribute | Element references |
| `x-init` | `onMounted` hook | Initialization |

### Methods

**Alpine.js:**
```html
<div x-data="{ 
  count: 0,
  increment() { this.count++ }
}">
  <button @click="increment">+</button>
</div>
```

**UUS.js (identical):**
```html
<div uus-state="{ 
  count: 0,
  increment() { this.count++ }
}">
  <button @click="increment">+</button>
</div>
```

---

## From jQuery

### DOM Manipulation

**jQuery:**
```javascript
$('#element').text('Hello');
$('#element').html('<strong>Bold</strong>');
$('#element').hide();
$('#element').show();
$('#element').toggle();
```

**UUS.js:**
```html
<span id="element" uus-text="message"></span>
<div uus-html="htmlContent"></div>
<div uus-show="isVisible">Content</div>
```

### Event Handling

**jQuery:**
```javascript
$('#button').click(function() {
  counter++;
  $('#counter').text(counter);
});
```

**UUS.js:**
```html
<div uus-state="{ counter: 0 }">
  <button @click="counter++">Click</button>
  <span uus-text="counter"></span>
</div>
```

### Ajax/Fetch

**jQuery:**
```javascript
$.ajax({
  url: '/api/data',
  success: function(data) {
    $('#result').html(data);
  }
});
```

**UUS.js:**
```javascript
const state = {
  async fetchData() {
    const response = await fetch('/api/data');
    this.result = await response.text();
  }
};
```

### Form Handling

**jQuery:**
```javascript
$('#form').submit(function(e) {
  e.preventDefault();
  const value = $('#input').val();
  // Process form
});
```

**UUS.js:**
```html
<form @submit.prevent="handleSubmit">
  <input uus-model="inputValue">
</form>
```

### Class Manipulation

**jQuery:**
```javascript
$('#element').addClass('active');
$('#element').removeClass('inactive');
$('#element').toggleClass('highlight');
```

**UUS.js:**
```html
<div uus-class="{ 
  active: isActive, 
  inactive: !isActive,
  highlight: isHighlighted 
}">
</div>
```

---

## From Vanilla JavaScript

### Before (Vanilla JS)

```javascript
// State management
let state = {
  count: 0,
  todos: []
};

// DOM references
const countEl = document.getElementById('count');
const todoList = document.getElementById('todo-list');
const addBtn = document.getElementById('add-btn');

// Update functions
function updateCount() {
  countEl.textContent = state.count;
}

function renderTodos() {
  todoList.innerHTML = '';
  state.todos.forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteTodo(todo.id);
    
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

// Event handlers
addBtn.addEventListener('click', () => {
  state.count++;
  updateCount();
});

// Initialize
updateCount();
renderTodos();
```

### After (UUS.js)

```html
<div uus-state="{ 
  count: 0, 
  todos: [],
  addTodo(text) {
    this.todos.push({ id: Date.now(), text });
  },
  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
  }
}">
  <p>Count: <span uus-text="count"></span></p>
  <button @click="count++">Increment</button>
  
  <ul>
    <li uus-for="todo in todos" :key="todo.id">
      <span uus-text="todo.text"></span>
      <button @click="deleteTodo(todo.id)">Delete</button>
    </li>
  </ul>
  
  <input uus-model="newTodo" @keyup.enter="addTodo(newTodo); newTodo = ''">
</div>

<script>
  new Uus().mount('#app');
</script>
```

---

## Migration Checklist

### Step 1: Install UUS.js
```bash
npm install @uusjs/core
# or via CDN
<script src="https://unpkg.com/@uusjs/core"></script>
```

### Step 2: Convert Templates
1. Replace framework-specific directives with UUS equivalents
2. Convert component templates to UUS syntax
3. Update event handlers to use `@event` syntax

### Step 3: Migrate State Management
1. Convert component state to UUS reactive state
2. Replace state management libraries with UUS reactivity
3. Update computed properties and watchers

### Step 4: Handle Routing (if applicable)
```bash
npm install @uusjs/router
```

### Step 5: Add Plugins as Needed
- Forms: `@uusjs/forms`
- Animations: `@uusjs/animate`
- i18n: `@uusjs/i18n`
- WebSocket: `@uusjs/realtime`

### Step 6: Testing
```bash
npm install @uusjs/test-utils --save-dev
```

---

## Common Patterns

### Global State Management

```javascript
// store.js
import { createReactive } from '@uusjs/core';

export const store = createReactive({
  user: null,
  cart: [],
  
  login(user) {
    this.user = user;
  },
  
  addToCart(item) {
    this.cart.push(item);
  }
});

// Use in components
app.mount('#app', {
  state: store
});
```

### API Integration

```javascript
const state = {
  data: [],
  loading: false,
  error: null,
  
  async fetchData() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await fetch('/api/data');
      this.data = await response.json();
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }
};
```

### Form Validation

```javascript
import Forms from '@uusjs/forms';

app.use(Forms);

const validator = app.forms.createValidator({
  rules: {
    email: { required: true, email: true },
    password: { required: true, minLength: 8 }
  }
});
```

---

## Performance Tips

1. **Use `uus-show` for frequent toggling** - More efficient than `uus-if`
2. **Add `:key` to list items** - Helps with efficient list updates
3. **Leverage computed values** - Avoid recalculating in templates
4. **Use batch updates** - Group multiple state changes
5. **Lazy load components** - Split code for better initial load

---

## Troubleshooting

### Common Issues

**Issue:** Directives not working
**Solution:** Ensure element is within mounted app scope

**Issue:** State not updating
**Solution:** Check that state is properly initialized with `uus-state`

**Issue:** Events not firing
**Solution:** Use `@event` or `uus-on:event` syntax

**Issue:** Performance issues with large lists
**Solution:** Use virtual scrolling or pagination

---

## Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Examples](./EXAMPLES.md)
- [GitHub](https://github.com/uusjs/uus)
- [Discord Community](https://discord.gg/uusjs)

---

## Need Help?

- Check the [examples](./examples) directory for working code
- Join our [Discord](https://discord.gg/uusjs) for community support
- Open an [issue](https://github.com/uusjs/uus/issues) on GitHub