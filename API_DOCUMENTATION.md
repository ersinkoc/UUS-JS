# UUS.js API Documentation

## Table of Contents
- [Core API](#core-api)
- [Directives](#directives)
- [Reactive System](#reactive-system)
- [Plugins](#plugins)
- [Advanced Features](#advanced-features)

---

## Core API

### `new Uus(config?)`

Creates a new UUS.js instance.

```typescript
interface UusConfig {
  debug?: boolean;           // Enable debug mode (default: false)
  directives?: Directive[];   // Custom directives
  plugins?: Plugin[];        // Plugins to install
  errorHandler?: (error: UusError) => void; // Custom error handler
}
```

**Example:**
```javascript
const app = new Uus({
  debug: true,
  errorHandler: (error) => {
    console.error('Custom handler:', error);
  }
});
```

### `mount(selector: string | HTMLElement, options?)`

Mounts the UUS instance to a DOM element.

```typescript
interface MountOptions {
  state?: ReactiveState;     // Initial state
  template?: string;          // HTML template
  onMounted?: () => void;     // Lifecycle hook
}
```

**Example:**
```javascript
// Mount to selector
app.mount('#app');

// Mount to element
const element = document.getElementById('app');
app.mount(element);

// Mount with options
app.mount('#app', {
  state: { count: 0 },
  onMounted: () => console.log('App mounted!')
});
```

### `unmount()`

Unmounts the UUS instance and cleans up resources.

```javascript
app.unmount();
```

### `use(plugin: Plugin)`

Installs a plugin.

```javascript
import Router from '@uusjs/router';
app.use(Router);
```

---

## Directives

### State Management

#### `uus-state`
Initializes reactive state for an element and its children.

```html
<div uus-state="{ count: 0, name: 'John' }">
  <!-- State is available here -->
</div>
```

**Advanced usage with methods:**
```html
<div uus-state="{ 
  count: 0,
  increment() { this.count++ },
  reset() { this.count = 0 }
}">
  <button uus-on:click="increment">+</button>
  <button uus-on:click="reset">Reset</button>
</div>
```

### Content Binding

#### `uus-text`
Binds text content to an expression.

```html
<span uus-text="message"></span>
<span uus-text="'Hello, ' + name"></span>
<span uus-text="count > 0 ? 'Positive' : 'Zero'"></span>
```

#### `uus-html`
Binds HTML content (with XSS protection via DOMPurify).

```html
<div uus-html="htmlContent"></div>
```

### Conditional Rendering

#### `uus-show`
Shows/hides element based on condition.

```html
<div uus-show="isVisible">Conditionally visible</div>
```

#### `uus-if`
Conditionally renders element.

```html
<div uus-if="userLoggedIn">
  Welcome back!
</div>
```

### List Rendering

#### `uus-for`
Renders lists with automatic keying.

```html
<ul>
  <li uus-for="item in items" uus-bind:key="item.id">
    {{ item.name }}
  </li>
</ul>
```

**With index:**
```html
<div uus-for="(item, index) in items">
  {{ index }}: {{ item }}
</div>
```

### Form Handling

#### `uus-model`
Two-way data binding for form inputs.

```html
<input uus-model="username" type="text">
<textarea uus-model="message"></textarea>
<select uus-model="selectedOption">
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</select>
```

**With modifiers:**
```html
<!-- Lazy update (on change instead of input) -->
<input uus-model.lazy="value">

<!-- Number conversion -->
<input uus-model.number="age" type="number">

<!-- Trim whitespace -->
<input uus-model.trim="username">
```

### Attribute & Style Binding

#### `uus-bind:*`
Binds attributes dynamically.

```html
<img uus-bind:src="imageUrl">
<a uus-bind:href="link">
<button uus-bind:disabled="isLoading">
<div uus-bind:id="dynamicId">
```

**Shorthand:**
```html
<img :src="imageUrl">
<button :disabled="isLoading">
```

#### `uus-class`
Manages CSS classes dynamically.

```html
<!-- Object syntax -->
<div uus-class="{ active: isActive, 'text-bold': isBold }"></div>

<!-- Array syntax -->
<div uus-class="[baseClass, isActive ? 'active' : '']"></div>

<!-- Mixed -->
<div class="static" uus-class="{ dynamic: condition }"></div>
```

#### `uus-style`
Manages inline styles dynamically.

```html
<!-- Object syntax -->
<div uus-style="{ color: textColor, fontSize: size + 'px' }"></div>

<!-- String syntax -->
<div uus-style="'color: ' + color + '; font-size: ' + size"></div>
```

### Event Handling

#### `uus-on:*`
Attaches event listeners.

```html
<button uus-on:click="handleClick">Click me</button>
<input uus-on:input="handleInput">
<form uus-on:submit="handleSubmit">
```

**With modifiers:**
```html
<!-- Prevent default -->
<form uus-on:submit.prevent="handleSubmit">

<!-- Stop propagation -->
<div uus-on:click.stop="handleClick">

<!-- Once -->
<button uus-on:click.once="handleOnce">

<!-- Key modifiers -->
<input uus-on:keyup.enter="submit">
<input uus-on:keydown.esc="cancel">

<!-- Chaining modifiers -->
<form uus-on:submit.prevent.stop="handleSubmit">
```

**Shorthand:**
```html
<button @click="handleClick">Click</button>
<input @input="handleInput">
```

**Inline expressions:**
```html
<button @click="count++">Increment</button>
<button @click="visible = !visible">Toggle</button>
```

### Component System

#### `uus-component`
Renders dynamic components.

```html
<div uus-component="componentName" uus-bind:props="componentProps"></div>
```

---

## Reactive System

### `createReactive(target)`

Creates a reactive proxy object.

```javascript
import { createReactive } from '@uusjs/core';

const state = createReactive({
  count: 0,
  items: []
});

// Changes are automatically tracked
state.count++; // Triggers updates
state.items.push('new item'); // Also triggers updates
```

### `effect(fn)`

Creates a reactive effect that re-runs when dependencies change.

```javascript
import { effect } from '@uusjs/core';

const cleanup = effect(() => {
  console.log('Count is:', state.count);
});

// Later, clean up the effect
cleanup();
```

### `computed(getter)`

Creates a computed value that updates automatically.

```javascript
import { computed } from '@uusjs/core';

const doubled = computed(() => state.count * 2);
console.log(doubled.value); // Reactive access
```

### `watch(source, callback, options?)`

Watches for changes in reactive data.

```javascript
import { watch } from '@uusjs/core';

// Watch a single value
const unwatch = watch(
  () => state.count,
  (newValue, oldValue) => {
    console.log('Count changed:', oldValue, '->', newValue);
  }
);

// Watch with options
watch(source, callback, {
  immediate: true,  // Run immediately
  deep: true,       // Deep watch objects
  flush: 'post'     // Timing: 'pre' | 'post' | 'sync'
});
```

### `ref(value)`

Creates a reactive reference.

```javascript
import { ref } from '@uusjs/core';

const count = ref(0);
console.log(count.value); // 0
count.value++; // Triggers updates
```

### `reactive(target)`

Makes an object deeply reactive.

```javascript
import { reactive } from '@uusjs/core';

const state = reactive({
  nested: {
    deep: {
      value: 'reactive'
    }
  }
});

state.nested.deep.value = 'updated'; // Triggers updates
```

---

## Plugins

### Router Plugin

```javascript
import Router from '@uusjs/router';

app.use(Router);

// Define routes
app.router.addRoute('/', HomePage);
app.router.addRoute('/about', AboutPage);
app.router.addRoute('/user/:id', UserPage);

// Navigate programmatically
app.router.push('/about');
app.router.replace('/');
app.router.back();

// Access route params
app.router.params; // { id: '123' }
app.router.query;  // { tab: 'profile' }
```

### Forms Plugin

```javascript
import Forms from '@uusjs/forms';

app.use(Forms);

// Create form validator
const validator = app.forms.createValidator({
  rules: {
    email: { required: true, email: true },
    password: { required: true, minLength: 8 }
  }
});

// Validate
const result = validator.validate(formData);
if (!result.valid) {
  console.log(result.errors);
}
```

### I18n Plugin

```javascript
import I18n from '@uusjs/i18n';

app.use(I18n);

// Configure languages
app.i18n.configure({
  defaultLocale: 'en',
  locales: {
    en: { greeting: 'Hello {name}!' },
    es: { greeting: '¡Hola {name}!' }
  }
});

// Use in templates
<span uus-text="$t('greeting', { name: userName })"></span>

// Change language
app.i18n.setLocale('es');
```

### Animation Plugin

```javascript
import Animate from '@uusjs/animate';

app.use(Animate);
```

**In templates:**
```html
<!-- Transition -->
<div uus-animate:enter="fadeIn" uus-animate:leave="fadeOut">
  Content
</div>

<!-- FLIP animation for lists -->
<ul uus-animate:flip>
  <li uus-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>

<!-- Spring physics -->
<div uus-animate:spring="{ stiffness: 200, damping: 20 }">
  Animated element
</div>
```

### Realtime Plugin

```javascript
import Realtime from '@uusjs/realtime';

app.use(Realtime);

// WebSocket connection
const ws = app.realtime.websocket({
  url: 'ws://localhost:3000',
  reconnect: true,
  heartbeat: { interval: 30000 }
});

ws.on('message', (data) => {
  console.log('Received:', data);
});

ws.send('chat', { message: 'Hello!' });

// Server-Sent Events
const sse = app.realtime.sse({
  url: '/api/events'
});

sse.on('update', (data) => {
  console.log('SSE update:', data);
});
```

---

## Advanced Features

### Batch Scheduler

Optimizes DOM updates by batching them.

```javascript
import { getGlobalBatchScheduler, scheduleBatch } from '@uusjs/core';

// Schedule updates in batch
scheduleBatch(() => {
  // DOM update 1
});

scheduleBatch(() => {
  // DOM update 2
});

// Updates are automatically batched and executed together
```

### Memory Management

```javascript
import { memoryManager } from '@uusjs/core';

// Track resources
const resourceId = memoryManager.resourceTracker.track(
  'component',
  element,
  cleanup
);

// Get memory stats
const stats = memoryManager.getStats();
console.log(stats);

// Manual cleanup
memoryManager.resourceTracker.untrack(resourceId);
```

### Error Handling

```javascript
import { globalErrorHandler, ErrorCategory } from '@uusjs/core';

// Set custom error handler
globalErrorHandler.setHandler((error) => {
  if (error.category === ErrorCategory.DIRECTIVE) {
    console.error('Directive error:', error);
  }
  // Send to error tracking service
  trackError(error);
});

// Handle errors safely
const result = globalErrorHandler.safe(
  () => riskyOperation(),
  ErrorCategory.EVALUATION,
  { context: 'custom' }
);
```

### Safe Expression Evaluator

The framework uses a safe AST-based expression evaluator instead of `eval()` or `Function()`.

```javascript
import { safeEvaluateExpression } from '@uusjs/core';

const state = { x: 10, y: 20 };
const result = safeEvaluateExpression('x + y', state); // 30

// Supports complex expressions
safeEvaluateExpression('x > 5 ? "high" : "low"', state); // "high"
```

### DevTools Integration

```javascript
// Enable DevTools in development
if (process.env.NODE_ENV !== 'production') {
  app.enableDevTools();
}

// DevTools will show:
// - Component tree
// - State changes
// - Performance metrics
// - Event tracking
```

### TypeScript Support

Full TypeScript support with type inference:

```typescript
import Uus from '@uusjs/core';

interface AppState {
  count: number;
  user: {
    name: string;
    email: string;
  };
}

const app = new Uus<AppState>();

app.mount('#app', {
  state: {
    count: 0,
    user: {
      name: 'John',
      email: 'john@example.com'
    }
  }
});

// Type-safe access
app.state.count; // number
app.state.user.name; // string
```

---

## Lifecycle Hooks

### Component Lifecycle

```javascript
const component = {
  state: { /* ... */ },
  
  onBeforeMount() {
    // Called before mounting
  },
  
  onMounted() {
    // Called after mounting
  },
  
  onBeforeUpdate() {
    // Called before updates
  },
  
  onUpdated() {
    // Called after updates
  },
  
  onBeforeUnmount() {
    // Called before unmounting
  },
  
  onUnmounted() {
    // Called after unmounting
  }
};
```

### Global Hooks

```javascript
// Register global hooks
app.onError((error) => {
  console.error('Global error:', error);
});

app.onWarn((warning) => {
  console.warn('Global warning:', warning);
});
```

---

## Performance Optimization

### Lazy Loading

```javascript
// Lazy load components
const LazyComponent = () => import('./components/Heavy.js');

app.component('heavy', LazyComponent);
```

### Memoization

```javascript
import { memo } from '@uusjs/core';

const expensiveComputation = memo((input) => {
  // Heavy computation
  return result;
});
```

### Virtual Scrolling

```html
<div uus-virtual-scroll="{ items: longList, itemHeight: 50 }">
  <div uus-for="item in visibleItems">
    {{ item }}
  </div>
</div>
```

---

## Best Practices

1. **State Management**
   - Keep state minimal and flat
   - Use computed values for derived state
   - Avoid deep nesting

2. **Performance**
   - Use `uus-show` for frequent toggling
   - Use `uus-if` for conditional rendering
   - Leverage batch updates
   - Add `:key` for lists

3. **Security**
   - Always use `uus-text` for user content
   - Use `uus-html` only for trusted content
   - Validate all inputs

4. **Memory**
   - Clean up effects and watchers
   - Unsubscribe from events
   - Use weak references where appropriate

5. **Testing**
   - Use `@uusjs/test-utils` for component testing
   - Mock external dependencies
   - Test edge cases

---

## Migration Guide

### From Vue.js

```javascript
// Vue.js
new Vue({
  el: '#app',
  data: { count: 0 }
});

// UUS.js
new Uus().mount('#app', {
  state: { count: 0 }
});
```

### From React

```javascript
// React
function Component() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// UUS.js
<div uus-state="{ count: 0 }">
  <button uus-on:click="count++">{{ count }}</button>
</div>
```

### From Alpine.js

```javascript
// Alpine.js
<div x-data="{ count: 0 }">
  <button @click="count++">{{ count }}</button>
</div>

// UUS.js (almost identical!)
<div uus-state="{ count: 0 }">
  <button @click="count++">{{ count }}</button>
</div>
```

---

## API Reference Quick Links

- [Core API](#core-api)
- [Directives](#directives)
- [Reactive System](#reactive-system)
- [Plugins](#plugins)
- [Advanced Features](#advanced-features)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Performance](#performance-optimization)
- [Best Practices](#best-practices)

---

## Support

- GitHub: [github.com/uusjs/uus](https://github.com/uusjs/uus)
- Documentation: [uusjs.dev/docs](https://uusjs.dev/docs)
- Discord: [discord.gg/uusjs](https://discord.gg/uusjs)
- Twitter: [@uusjs](https://twitter.com/uusjs)