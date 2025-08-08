# UUS.js Examples & Tutorials

## Quick Start Examples

### 1. Hello World
The simplest UUS.js application:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@uusjs/core"></script>
</head>
<body>
  <div id="app">
    <div uus-state="{ message: 'Hello, UUS.js!' }">
      <h1 uus-text="message"></h1>
    </div>
  </div>
  
  <script>
    new Uus().mount('#app');
  </script>
</body>
</html>
```

### 2. Counter App
Interactive counter with increment/decrement:

```html
<div id="app">
  <div uus-state="{ count: 0 }">
    <h2>Counter: {{ count }}</h2>
    <button @click="count--" :disabled="count <= 0">-</button>
    <button @click="count++">+</button>
    <button @click="count = 0">Reset</button>
    
    <p uus-show="count > 10">🎉 You reached {{ count }}!</p>
    <p uus-if="count === 0">Start counting!</p>
  </div>
</div>
```

### 3. Todo List
Complete todo application with CRUD operations:

```html
<div id="app">
  <div uus-state="{ 
    todos: [],
    newTodo: '',
    filter: 'all',
    
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo,
          done: false
        });
        this.newTodo = '';
      }
    },
    
    removeTodo(todo) {
      const index = this.todos.indexOf(todo);
      if (index > -1) this.todos.splice(index, 1);
    },
    
    toggleTodo(todo) {
      todo.done = !todo.done;
    },
    
    get filteredTodos() {
      if (this.filter === 'active') return this.todos.filter(t => !t.done);
      if (this.filter === 'completed') return this.todos.filter(t => t.done);
      return this.todos;
    },
    
    get remaining() {
      return this.todos.filter(t => !t.done).length;
    }
  }">
    <h1>📝 Todo List</h1>
    
    <!-- Add Todo -->
    <div class="add-todo">
      <input 
        uus-model="newTodo"
        @keyup.enter="addTodo"
        placeholder="What needs to be done?"
      >
      <button @click="addTodo">Add</button>
    </div>
    
    <!-- Filter Tabs -->
    <div class="filters">
      <button 
        @click="filter = 'all'" 
        :class="{ active: filter === 'all' }">
        All ({{ todos.length }})
      </button>
      <button 
        @click="filter = 'active'" 
        :class="{ active: filter === 'active' }">
        Active ({{ remaining }})
      </button>
      <button 
        @click="filter = 'completed'" 
        :class="{ active: filter === 'completed' }">
        Completed ({{ todos.length - remaining }})
      </button>
    </div>
    
    <!-- Todo List -->
    <ul class="todo-list">
      <li 
        uus-for="todo in filteredTodos"
        :key="todo.id"
        :class="{ done: todo.done }"
      >
        <input 
          type="checkbox"
          :checked="todo.done"
          @change="toggleTodo(todo)"
        >
        <span uus-text="todo.text"></span>
        <button @click="removeTodo(todo)">❌</button>
      </li>
    </ul>
    
    <!-- Empty State -->
    <p uus-show="todos.length === 0" class="empty">
      No todos yet. Add one above! 
    </p>
    
    <!-- Summary -->
    <div uus-show="todos.length > 0" class="summary">
      <span>{{ remaining }} item(s) left</span>
      <button 
        @click="todos = todos.filter(t => !t.done)"
        uus-show="todos.some(t => t.done)"
      >
        Clear completed
      </button>
    </div>
  </div>
</div>

<style>
  .todo-list { list-style: none; padding: 0; }
  .todo-list li { padding: 10px; border-bottom: 1px solid #eee; }
  .todo-list li.done { opacity: 0.5; text-decoration: line-through; }
  .filters button.active { background: #007bff; color: white; }
</style>
```

### 4. Form Validation
Form with real-time validation:

```html
<div id="app">
  <div uus-state="{ 
    form: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    errors: {},
    
    validate() {
      this.errors = {};
      
      if (!this.form.username) {
        this.errors.username = 'Username is required';
      } else if (this.form.username.length < 3) {
        this.errors.username = 'Username must be at least 3 characters';
      }
      
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!this.form.email) {
        this.errors.email = 'Email is required';
      } else if (!emailRegex.test(this.form.email)) {
        this.errors.email = 'Invalid email format';
      }
      
      if (!this.form.password) {
        this.errors.password = 'Password is required';
      } else if (this.form.password.length < 8) {
        this.errors.password = 'Password must be at least 8 characters';
      }
      
      if (this.form.password !== this.form.confirmPassword) {
        this.errors.confirmPassword = 'Passwords do not match';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    submit() {
      if (this.validate()) {
        alert('Form submitted successfully!');
        // Reset form
        this.form = { username: '', email: '', password: '', confirmPassword: '' };
      }
    }
  }">
    <h2>Registration Form</h2>
    
    <form @submit.prevent="submit">
      <!-- Username -->
      <div class="form-group">
        <label>Username</label>
        <input 
          uus-model="form.username"
          @blur="validate"
          :class="{ error: errors.username }"
        >
        <span uus-show="errors.username" class="error-msg">
          {{ errors.username }}
        </span>
      </div>
      
      <!-- Email -->
      <div class="form-group">
        <label>Email</label>
        <input 
          type="email"
          uus-model="form.email"
          @blur="validate"
          :class="{ error: errors.email }"
        >
        <span uus-show="errors.email" class="error-msg">
          {{ errors.email }}
        </span>
      </div>
      
      <!-- Password -->
      <div class="form-group">
        <label>Password</label>
        <input 
          type="password"
          uus-model="form.password"
          @blur="validate"
          :class="{ error: errors.password }"
        >
        <span uus-show="errors.password" class="error-msg">
          {{ errors.password }}
        </span>
      </div>
      
      <!-- Confirm Password -->
      <div class="form-group">
        <label>Confirm Password</label>
        <input 
          type="password"
          uus-model="form.confirmPassword"
          @blur="validate"
          :class="{ error: errors.confirmPassword }"
        >
        <span uus-show="errors.confirmPassword" class="error-msg">
          {{ errors.confirmPassword }}
        </span>
      </div>
      
      <button type="submit">Register</button>
    </form>
  </div>
</div>

<style>
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; }
  .form-group input { width: 100%; padding: 8px; }
  .form-group input.error { border-color: red; }
  .error-msg { color: red; font-size: 12px; }
</style>
```

### 5. Dynamic Components
Loading components dynamically:

```html
<div id="app">
  <div uus-state="{ 
    currentView: 'home',
    views: {
      home: '<h2>Welcome Home</h2><p>This is the home page.</p>',
      about: '<h2>About Us</h2><p>Learn more about our company.</p>',
      contact: '<h2>Contact</h2><p>Get in touch with us.</p>'
    }
  }">
    <!-- Navigation -->
    <nav>
      <button 
        uus-for="(content, name) in views"
        :key="name"
        @click="currentView = name"
        :class="{ active: currentView === name }"
      >
        {{ name }}
      </button>
    </nav>
    
    <!-- Dynamic Content -->
    <div class="content" uus-html="views[currentView]"></div>
  </div>
</div>

<style>
  nav button.active { background: #333; color: white; }
  .content { padding: 20px; border: 1px solid #ddd; margin-top: 10px; }
</style>
```

### 6. API Integration
Fetching data from an API:

```html
<div id="app">
  <div uus-state="{ 
    users: [],
    loading: false,
    error: null,
    
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        this.users = await response.json();
      } catch (err) {
        this.error = 'Failed to load users';
      } finally {
        this.loading = false;
      }
    }
  }">
    <h2>User List</h2>
    
    <button @click="fetchUsers" :disabled="loading">
      {{ loading ? 'Loading...' : 'Load Users' }}
    </button>
    
    <div uus-show="loading" class="spinner">⏳ Loading...</div>
    
    <div uus-show="error" class="error">
      ❌ {{ error }}
    </div>
    
    <ul uus-show="users.length > 0">
      <li uus-for="user in users" :key="user.id">
        <strong>{{ user.name }}</strong>
        <br>
        📧 {{ user.email }}
        <br>
        🏢 {{ user.company.name }}
      </li>
    </ul>
  </div>
</div>
```

### 7. Real-time Search
Live search with debouncing:

```html
<div id="app">
  <div uus-state="{ 
    searchTerm: '',
    results: [],
    searching: false,
    debounceTimer: null,
    
    items: [
      'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry',
      'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon',
      'Mango', 'Nectarine', 'Orange', 'Papaya', 'Quince'
    ],
    
    search() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.searching = true;
        // Simulate API call
        setTimeout(() => {
          if (this.searchTerm) {
            this.results = this.items.filter(item => 
              item.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
          } else {
            this.results = [];
          }
          this.searching = false;
        }, 300);
      }, 500);
    }
  }">
    <h2>🔍 Live Search</h2>
    
    <input 
      uus-model="searchTerm"
      @input="search"
      placeholder="Search fruits..."
    >
    
    <div uus-show="searching">Searching...</div>
    
    <ul uus-show="results.length > 0">
      <li uus-for="result in results">{{ result }}</li>
    </ul>
    
    <p uus-show="searchTerm && !searching && results.length === 0">
      No results found for "{{ searchTerm }}"
    </p>
  </div>
</div>
```

### 8. Animations
Using the animation plugin:

```html
<div id="app">
  <div uus-state="{ 
    items: [1, 2, 3, 4, 5],
    show: true,
    
    addItem() {
      this.items.push(this.items.length + 1);
    },
    
    removeItem(index) {
      this.items.splice(index, 1);
    },
    
    shuffle() {
      this.items.sort(() => Math.random() - 0.5);
    }
  }">
    <h2>Animations Demo</h2>
    
    <!-- Fade In/Out -->
    <button @click="show = !show">Toggle Fade</button>
    <div 
      uus-show="show"
      uus-animate:enter="fadeIn"
      uus-animate:leave="fadeOut"
      style="background: #f0f0f0; padding: 20px; margin: 10px 0;"
    >
      This content fades in and out
    </div>
    
    <!-- List Animations -->
    <h3>List Animations (FLIP)</h3>
    <button @click="addItem">Add Item</button>
    <button @click="shuffle">Shuffle</button>
    
    <ul uus-animate:flip>
      <li 
        uus-for="(item, index) in items"
        :key="item"
        style="padding: 10px; margin: 5px; background: #e0e0e0;"
      >
        Item {{ item }}
        <button @click="removeItem(index)">Remove</button>
      </li>
    </ul>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(10px); }
  }
  
  [uus-animate\\:enter="fadeIn"] {
    animation: fadeIn 0.3s ease-out;
  }
  
  [uus-animate\\:leave="fadeOut"] {
    animation: fadeOut 0.3s ease-out;
  }
</style>
```

### 9. Multi-language Support (i18n)
Internationalization example:

```html
<div id="app">
  <div uus-state="{ 
    currentLang: 'en',
    userName: 'John',
    
    translations: {
      en: {
        greeting: 'Hello',
        welcome: 'Welcome to our app',
        changeLanguage: 'Change Language',
        items: 'You have {count} item(s)'
      },
      es: {
        greeting: 'Hola',
        welcome: 'Bienvenido a nuestra aplicación',
        changeLanguage: 'Cambiar idioma',
        items: 'Tienes {count} artículo(s)'
      },
      fr: {
        greeting: 'Bonjour',
        welcome: 'Bienvenue dans notre application',
        changeLanguage: 'Changer de langue',
        items: 'Vous avez {count} article(s)'
      }
    },
    
    t(key, params = {}) {
      let text = this.translations[this.currentLang][key] || key;
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
      return text;
    }
  }">
    <h2>{{ t('greeting') }}, {{ userName }}!</h2>
    <p>{{ t('welcome') }}</p>
    
    <label>{{ t('changeLanguage') }}:</label>
    <select uus-model="currentLang">
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
    
    <p>{{ t('items', { count: 5 }) }}</p>
  </div>
</div>
```

### 10. Shopping Cart
E-commerce cart functionality:

```html
<div id="app">
  <div uus-state="{ 
    products: [
      { id: 1, name: 'Laptop', price: 999, image: '💻' },
      { id: 2, name: 'Phone', price: 699, image: '📱' },
      { id: 3, name: 'Headphones', price: 199, image: '🎧' },
      { id: 4, name: 'Keyboard', price: 99, image: '⌨️' },
      { id: 5, name: 'Mouse', price: 49, image: '🖱️' }
    ],
    
    cart: [],
    
    addToCart(product) {
      const existing = this.cart.find(item => item.id === product.id);
      if (existing) {
        existing.quantity++;
      } else {
        this.cart.push({ ...product, quantity: 1 });
      }
    },
    
    removeFromCart(item) {
      const index = this.cart.indexOf(item);
      if (index > -1) this.cart.splice(index, 1);
    },
    
    updateQuantity(item, delta) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.removeFromCart(item);
      }
    },
    
    get total() {
      return this.cart.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
    },
    
    get itemCount() {
      return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }
  }">
    <h1>🛒 Shopping Cart Demo</h1>
    
    <!-- Products Grid -->
    <div class="products">
      <h2>Products</h2>
      <div class="product-grid">
        <div 
          uus-for="product in products"
          :key="product.id"
          class="product-card"
        >
          <div class="product-image">{{ product.image }}</div>
          <h3>{{ product.name }}</h3>
          <p class="price">${{ product.price }}</p>
          <button @click="addToCart(product)">Add to Cart</button>
        </div>
      </div>
    </div>
    
    <!-- Shopping Cart -->
    <div class="cart">
      <h2>Cart ({{ itemCount }} items)</h2>
      
      <div uus-show="cart.length === 0" class="empty-cart">
        Your cart is empty
      </div>
      
      <div uus-show="cart.length > 0">
        <div 
          uus-for="item in cart"
          :key="item.id"
          class="cart-item"
        >
          <span>{{ item.image }} {{ item.name }}</span>
          <div class="quantity-controls">
            <button @click="updateQuantity(item, -1)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="updateQuantity(item, 1)">+</button>
          </div>
          <span>${{ item.price * item.quantity }}</span>
          <button @click="removeFromCart(item)">🗑️</button>
        </div>
        
        <div class="cart-total">
          <strong>Total: ${{ total.toFixed(2) }}</strong>
        </div>
        
        <button class="checkout-btn">Checkout</button>
      </div>
    </div>
  </div>
</div>

<style>
  .products, .cart { 
    display: inline-block; 
    vertical-align: top; 
    width: 48%; 
    margin: 1%; 
  }
  
  .product-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); 
    gap: 15px; 
  }
  
  .product-card { 
    border: 1px solid #ddd; 
    padding: 15px; 
    text-align: center; 
  }
  
  .product-image { 
    font-size: 48px; 
    margin-bottom: 10px; 
  }
  
  .cart-item { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 10px; 
    border-bottom: 1px solid #eee; 
  }
  
  .quantity-controls { 
    display: flex; 
    gap: 10px; 
    align-items: center; 
  }
  
  .cart-total { 
    padding: 15px; 
    text-align: right; 
    font-size: 18px; 
    border-top: 2px solid #333; 
  }
  
  .checkout-btn { 
    width: 100%; 
    padding: 15px; 
    background: #28a745; 
    color: white; 
    font-size: 18px; 
  }
</style>
```

## Advanced Examples

### Router Integration
Single Page Application with routing:

```javascript
// app.js
import Uus from '@uusjs/core';
import Router from '@uusjs/router';

const app = new Uus();
app.use(Router);

// Define pages
const HomePage = {
  template: `
    <div>
      <h1>Home Page</h1>
      <p>Welcome to our SPA!</p>
    </div>
  `
};

const AboutPage = {
  template: `
    <div>
      <h1>About Us</h1>
      <p>Learn more about our company.</p>
    </div>
  `
};

const UserPage = {
  template: `
    <div uus-state="{ user: null, loading: true }">
      <div uus-show="loading">Loading user...</div>
      <div uus-show="!loading && user">
        <h1>{{ user.name }}</h1>
        <p>Email: {{ user.email }}</p>
      </div>
    </div>
  `,
  async onMounted() {
    const userId = this.$route.params.id;
    const response = await fetch(`/api/users/${userId}`);
    this.user = await response.json();
    this.loading = false;
  }
};

// Setup routes
app.router.addRoute('/', HomePage);
app.router.addRoute('/about', AboutPage);
app.router.addRoute('/user/:id', UserPage);

// Navigation guards
app.router.beforeEach((to, from, next) => {
  console.log(`Navigating from ${from.path} to ${to.path}`);
  next();
});

app.mount('#app');
app.router.start();
```

### WebSocket Real-time Updates
Live collaboration with WebSockets:

```javascript
import Uus from '@uusjs/core';
import Realtime from '@uusjs/realtime';

const app = new Uus();
app.use(Realtime);

app.mount('#app', {
  state: {
    messages: [],
    users: [],
    currentUser: null,
    messageText: '',
    
    sendMessage() {
      if (this.messageText.trim()) {
        app.realtime.ws.send('message', {
          text: this.messageText,
          user: this.currentUser,
          timestamp: Date.now()
        });
        this.messageText = '';
      }
    }
  }
});

// Setup WebSocket connection
const ws = app.realtime.websocket({
  url: 'ws://localhost:3000',
  reconnect: true
});

ws.on('connect', () => {
  console.log('Connected to server');
});

ws.on('message', (data) => {
  app.state.messages.push(data);
});

ws.on('userJoined', (user) => {
  app.state.users.push(user);
});

ws.on('userLeft', (userId) => {
  app.state.users = app.state.users.filter(u => u.id !== userId);
});
```

### Server-Side Rendering (SSR)
SSR setup with Express:

```javascript
// server.js
import express from 'express';
import { renderToString } from '@uusjs/ssr';
import { createApp } from './app';

const server = express();

server.get('*', async (req, res) => {
  const { app, state } = createApp();
  
  // Fetch initial data
  await app.fetchInitialData(req.url);
  
  // Render to HTML
  const html = await renderToString(app);
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>UUS SSR App</title>
      </head>
      <body>
        <div id="app">${html}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(state)}
        </script>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});

server.listen(3000);
```

## Testing Examples

### Component Testing
Using test utilities:

```javascript
import { render, fireEvent, waitFor } from '@uusjs/test-utils';
import { expect } from 'vitest';

describe('Counter Component', () => {
  it('should increment count on button click', async () => {
    const { getByText, container } = render(`
      <div uus-state="{ count: 0 }">
        <span class="count">{{ count }}</span>
        <button @click="count++">Increment</button>
      </div>
    `);
    
    const button = getByText('Increment');
    const countEl = container.querySelector('.count');
    
    expect(countEl.textContent).toBe('0');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(countEl.textContent).toBe('1');
    });
  });
});
```

## Performance Examples

### Virtual Scrolling
Handle large lists efficiently:

```html
<div id="app">
  <div uus-state="{ 
    allItems: Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      text: `Item ${i}`,
      value: Math.random()
    })),
    
    visibleStart: 0,
    visibleEnd: 20,
    itemHeight: 50,
    containerHeight: 500,
    
    get visibleItems() {
      return this.allItems.slice(this.visibleStart, this.visibleEnd);
    },
    
    onScroll(event) {
      const scrollTop = event.target.scrollTop;
      this.visibleStart = Math.floor(scrollTop / this.itemHeight);
      this.visibleEnd = this.visibleStart + Math.ceil(this.containerHeight / this.itemHeight);
    }
  }">
    <h2>Virtual Scrolling (10,000 items)</h2>
    
    <div 
      class="scroll-container"
      @scroll="onScroll"
      :style="{ height: containerHeight + 'px', overflow: 'auto' }"
    >
      <div :style="{ height: allItems.length * itemHeight + 'px', position: 'relative' }">
        <div 
          uus-for="item in visibleItems"
          :key="item.id"
          :style="{ 
            position: 'absolute',
            top: (allItems.indexOf(item) * itemHeight) + 'px',
            height: itemHeight + 'px',
            width: '100%'
          }"
        >
          {{ item.text }} - Value: {{ item.value.toFixed(2) }}
        </div>
      </div>
    </div>
  </div>
</div>
```

## Complete Application Example

### Task Management System
Full-featured task manager:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Task Manager - UUS.js</title>
  <script src="https://unpkg.com/@uusjs/core"></script>
  <script src="https://unpkg.com/@uusjs/router"></script>
  <script src="https://unpkg.com/@uusjs/animate"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    
    /* Layout */
    .header { background: white; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .main { display: grid; grid-template-columns: 250px 1fr; gap: 20px; }
    .sidebar { background: white; padding: 20px; height: fit-content; }
    .content { background: white; padding: 20px; min-height: 500px; }
    
    /* Components */
    .task-card { 
      background: #f9f9f9; 
      padding: 15px; 
      margin-bottom: 10px; 
      border-left: 4px solid #007bff;
      transition: all 0.3s;
    }
    .task-card:hover { transform: translateX(5px); }
    .task-card.completed { opacity: 0.6; border-color: #28a745; }
    .task-card.high-priority { border-color: #dc3545; }
    
    .tag { 
      display: inline-block; 
      padding: 2px 8px; 
      background: #e0e0e0; 
      border-radius: 12px; 
      font-size: 12px; 
      margin-right: 5px; 
    }
    
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
      gap: 15px; 
      margin-bottom: 20px; 
    }
    
    .stat-card { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 20px; 
      border-radius: 8px; 
      text-align: center; 
    }
    
    .stat-card h3 { font-size: 32px; margin-bottom: 5px; }
    .stat-card p { font-size: 14px; opacity: 0.9; }
  </style>
</head>
<body>
  <div id="app">
    <div uus-state="{ 
      tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
      newTask: { title: '', description: '', priority: 'medium', tags: [], dueDate: '' },
      filter: 'all',
      searchQuery: '',
      selectedTask: null,
      showAddModal: false,
      
      // Computed
      get filteredTasks() {
        let result = this.tasks;
        
        // Apply filter
        if (this.filter === 'active') {
          result = result.filter(t => !t.completed);
        } else if (this.filter === 'completed') {
          result = result.filter(t => t.completed);
        } else if (this.filter === 'today') {
          const today = new Date().toDateString();
          result = result.filter(t => new Date(t.dueDate).toDateString() === today);
        }
        
        // Apply search
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          result = result.filter(t => 
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }
        
        // Sort by priority and date
        return result.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          if (a.priority !== b.priority) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      },
      
      get stats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const overdue = this.tasks.filter(t => 
          !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
        ).length;
        
        return { total, completed, active, overdue };
      },
      
      // Methods
      addTask() {
        if (!this.newTask.title) return;
        
        const task = {
          id: Date.now(),
          ...this.newTask,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.resetNewTask();
        this.showAddModal = false;
      },
      
      toggleTask(task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        this.saveTasks();
      },
      
      deleteTask(task) {
        const index = this.tasks.indexOf(task);
        if (index > -1 && confirm('Delete this task?')) {
          this.tasks.splice(index, 1);
          this.saveTasks();
        }
      },
      
      saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
      },
      
      resetNewTask() {
        this.newTask = { 
          title: '', 
          description: '', 
          priority: 'medium', 
          tags: [], 
          dueDate: '' 
        };
      },
      
      addTag(tag) {
        if (tag && !this.newTask.tags.includes(tag)) {
          this.newTask.tags.push(tag);
        }
      },
      
      removeTag(index) {
        this.newTask.tags.splice(index, 1);
      },
      
      formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
      },
      
      isOverdue(task) {
        return !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
      }
    }">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📋 Task Manager</h1>
          <p>Organize your work efficiently</p>
        </div>
        
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <h3>{{ stats.total }}</h3>
            <p>Total Tasks</p>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <h3>{{ stats.active }}</h3>
            <p>Active</p>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <h3>{{ stats.completed }}</h3>
            <p>Completed</p>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <h3>{{ stats.overdue }}</h3>
            <p>Overdue</p>
          </div>
        </div>
        
        <div class="main">
          <!-- Sidebar -->
          <div class="sidebar">
            <button 
              @click="showAddModal = true"
              style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; margin-bottom: 20px;"
            >
              ➕ Add Task
            </button>
            
            <h3>Filters</h3>
            <div style="margin: 10px 0;">
              <label style="display: block; padding: 5px; cursor: pointer;">
                <input type="radio" uus-model="filter" value="all"> All Tasks
              </label>
              <label style="display: block; padding: 5px; cursor: pointer;">
                <input type="radio" uus-model="filter" value="active"> Active
              </label>
              <label style="display: block; padding: 5px; cursor: pointer;">
                <input type="radio" uus-model="filter" value="completed"> Completed
              </label>
              <label style="display: block; padding: 5px; cursor: pointer;">
                <input type="radio" uus-model="filter" value="today"> Due Today
              </label>
            </div>
            
            <h3 style="margin-top: 20px;">Search</h3>
            <input 
              uus-model="searchQuery"
              placeholder="Search tasks..."
              style="width: 100%; padding: 8px; margin-top: 10px;"
            >
          </div>
          
          <!-- Content -->
          <div class="content">
            <h2>Tasks ({{ filteredTasks.length }})</h2>
            
            <div uus-show="filteredTasks.length === 0" style="text-align: center; padding: 40px; color: #999;">
              No tasks found. Create your first task!
            </div>
            
            <div uus-for="task in filteredTasks" :key="task.id">
              <div 
                class="task-card"
                :class="{ 
                  completed: task.completed,
                  'high-priority': task.priority === 'high' && !task.completed
                }"
              >
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <input 
                      type="checkbox"
                      :checked="task.completed"
                      @change="toggleTask(task)"
                      style="margin-right: 10px;"
                    >
                    <strong :style="{ textDecoration: task.completed ? 'line-through' : 'none' }">
                      {{ task.title }}
                    </strong>
                    
                    <div style="margin: 5px 0 5px 25px; color: #666; font-size: 14px;">
                      {{ task.description }}
                    </div>
                    
                    <div style="margin-left: 25px;">
                      <span uus-for="tag in task.tags" :key="tag" class="tag">
                        {{ tag }}
                      </span>
                    </div>
                    
                    <div style="margin-left: 25px; margin-top: 5px; font-size: 12px; color: #999;">
                      <span uus-show="task.dueDate">
                        📅 {{ formatDate(task.dueDate) }}
                        <span uus-show="isOverdue(task)" style="color: red;">
                          (Overdue!)
                        </span>
                      </span>
                      <span style="margin-left: 10px;">
                        Priority: {{ task.priority }}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    @click="deleteTask(task)"
                    style="background: none; border: none; color: #dc3545; cursor: pointer;"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add Task Modal -->
        <div 
          uus-show="showAddModal"
          style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"
        >
          <div style="background: white; padding: 30px; border-radius: 8px; width: 500px; max-width: 90%;">
            <h2>Add New Task</h2>
            
            <div style="margin: 15px 0;">
              <label style="display: block; margin-bottom: 5px;">Title *</label>
              <input 
                uus-model="newTask.title"
                style="width: 100%; padding: 8px;"
                placeholder="Enter task title..."
              >
            </div>
            
            <div style="margin: 15px 0;">
              <label style="display: block; margin-bottom: 5px;">Description</label>
              <textarea 
                uus-model="newTask.description"
                style="width: 100%; padding: 8px; height: 80px;"
                placeholder="Enter task description..."
              ></textarea>
            </div>
            
            <div style="margin: 15px 0;">
              <label style="display: block; margin-bottom: 5px;">Priority</label>
              <select uus-model="newTask.priority" style="width: 100%; padding: 8px;">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div style="margin: 15px 0;">
              <label style="display: block; margin-bottom: 5px;">Due Date</label>
              <input 
                type="date"
                uus-model="newTask.dueDate"
                style="width: 100%; padding: 8px;"
              >
            </div>
            
            <div style="margin: 15px 0;">
              <label style="display: block; margin-bottom: 5px;">Tags</label>
              <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <span uus-for="(tag, index) in newTask.tags" :key="tag" class="tag">
                  {{ tag }}
                  <span @click="removeTag(index)" style="cursor: pointer;">✕</span>
                </span>
              </div>
              <input 
                @keyup.enter="addTag($event.target.value); $event.target.value = ''"
                placeholder="Type and press Enter to add tag..."
                style="width: 100%; padding: 8px;"
              >
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button 
                @click="showAddModal = false; resetNewTask()"
                style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px;"
              >
                Cancel
              </button>
              <button 
                @click="addTask"
                :disabled="!newTask.title"
                style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    const app = new Uus();
    app.mount('#app');
  </script>
</body>
</html>
```

## Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [GitHub Repository](https://github.com/uusjs/uus)
- [Live Demos](https://uusjs.dev/demos)
- [Video Tutorials](https://youtube.com/@uusjs)
- [Community Forum](https://forum.uusjs.dev)