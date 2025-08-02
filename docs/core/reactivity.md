# Reactivity System

The heart of Uus.js is its powerful reactivity system. Understanding how it works will help you build more efficient applications.

## How Reactivity Works

Uus.js uses a **Proxy-based reactivity system** that automatically tracks dependencies and updates the DOM when data changes.

```javascript
// When you write this:
const state = reactive({ count: 0 });

// Uus.js wraps it in a Proxy that:
// 1. Tracks when properties are accessed (get)
// 2. Notifies when properties are changed (set)
// 3. Updates any dependent computations or effects
```

## Reactive State

### Basic Reactive Objects

```javascript
const app = new Uus();

// Define reactive state
app.state = reactive({
  user: {
    name: 'John',
    age: 30
  },
  todos: [],
  settings: {
    theme: 'dark',
    notifications: true
  }
});

// Changes are automatically tracked
app.state.user.name = 'Jane'; // DOM updates automatically
app.state.todos.push({ text: 'New todo' }); // Arrays are reactive too
```

### Refs - Reactive Primitives

For primitive values, use `ref`:

```javascript
import { ref } from '@uusjs/core';

const count = ref(0);
const message = ref('Hello');
const isVisible = ref(true);

// Access/modify with .value
console.log(count.value); // 0
count.value++; // Triggers updates
```

**In templates, refs are automatically unwrapped:**

```html
<div uus-state="{ count: ref(0) }">
  <!-- No .value needed in templates -->
  <span uus-text="count"></span>
  <button @click="count++">Increment</button>
</div>
```

### Reactive Arrays

Arrays have reactive methods:

```javascript
const items = reactive([1, 2, 3]);

// These trigger updates:
items.push(4);
items.pop();
items.shift();
items.unshift(0);
items.splice(1, 1);
items.sort();
items.reverse();

// Assignment also works:
items[0] = 10; // Reactive!
items.length = 0; // Clear array
```

### Reactive Limitations

Some operations need special handling:

```javascript
const state = reactive({
  obj: {}
});

// ❌ Won't be reactive:
state.obj.newProp = 'value';

// ✅ Do this instead:
state.obj = { ...state.obj, newProp: 'value' };
// Or use Object.assign:
Object.assign(state.obj, { newProp: 'value' });
```

## Computed Values

Computed values automatically recalculate when dependencies change:

```javascript
const state = reactive({
  price: 100,
  quantity: 2,
  tax: 0.08
});

// Simple computed
const total = computed(() => {
  return state.price * state.quantity;
});

// Computed with multiple dependencies
const finalPrice = computed(() => {
  const subtotal = state.price * state.quantity;
  return subtotal + (subtotal * state.tax);
});

console.log(total.value); // 200
state.quantity = 3;
console.log(total.value); // 300 (automatically updated)
```

**Computed values are:**
- **Lazy**: Only calculated when accessed
- **Cached**: Recomputed only when dependencies change
- **Read-only**: Cannot be directly assigned

### Computed in Templates

```html
<div uus-state="{ 
  items: [
    { name: 'Apple', price: 1.5, qty: 2 },
    { name: 'Banana', price: 0.8, qty: 5 }
  ],
  total: computed(() => 
    items.reduce((sum, item) => sum + item.price * item.qty, 0)
  )
}">
  <div uus-for="item in items">
    <span uus-text="item.name"></span>: 
    $<span uus-text="item.price * item.qty"></span>
  </div>
  <hr>
  Total: $<span uus-text="total"></span>
</div>
```

## Effects

Effects run side effects when reactive data changes:

```javascript
import { effect } from '@uusjs/core';

const state = reactive({ count: 0 });

// Runs immediately and whenever dependencies change
const stop = effect(() => {
  console.log('Count is:', state.count);
  document.title = `Count: ${state.count}`;
});

state.count++; // Logs: "Count is: 1", updates title

// Stop the effect
stop();
```

### Effect Cleanup

Return a cleanup function from effects:

```javascript
effect(() => {
  const timer = setInterval(() => {
    state.time = new Date().toLocaleTimeString();
  }, 1000);
  
  // Cleanup function
  return () => {
    clearInterval(timer);
  };
});
```

## Watch

Watch specific sources for changes:

```javascript
import { watch } from '@uusjs/core';

const state = reactive({ 
  query: '',
  results: []
});

// Watch a single source
watch(
  () => state.query,
  async (newQuery, oldQuery) => {
    if (newQuery) {
      state.results = await searchAPI(newQuery);
    }
  }
);

// Watch with options
watch(
  () => state.user.id,
  (newId) => {
    loadUserData(newId);
  },
  {
    immediate: true, // Run immediately
    deep: true // Deep watch objects
  }
);

// Watch multiple sources
watch(
  [() => state.page, () => state.filters],
  ([page, filters]) => {
    loadData(page, filters);
  }
);
```

## Reactive Utilities

### isRef / isReactive

Check if a value is reactive:

```javascript
import { isRef, isReactive } from '@uusjs/core';

const count = ref(0);
const state = reactive({ name: 'John' });

console.log(isRef(count)); // true
console.log(isReactive(state)); // true
console.log(isReactive(count)); // false
```

### unref

Get the value whether it's a ref or not:

```javascript
import { unref } from '@uusjs/core';

const count = ref(10);
const plain = 20;

console.log(unref(count)); // 10
console.log(unref(plain)); // 20
```

### toRaw

Get the original object from a reactive proxy:

```javascript
import { toRaw } from '@uusjs/core';

const state = reactive({ data: [] });
const original = toRaw(state);

console.log(original === state); // false
console.log(isReactive(original)); // false
```

### markRaw

Prevent an object from being made reactive:

```javascript
import { markRaw } from '@uusjs/core';

const socket = markRaw(new WebSocket('ws://...'));
const state = reactive({
  socket // Won't be made reactive
});
```

## Reactivity in Components

### Component State Pattern

```javascript
// Encapsulate component logic
function createCounter() {
  const state = reactive({
    count: 0,
    history: []
  });
  
  const increment = () => {
    state.count++;
    state.history.push({
      value: state.count,
      time: Date.now()
    });
  };
  
  const decrement = () => {
    state.count--;
  };
  
  const reset = () => {
    state.count = 0;
    state.history = [];
  };
  
  return {
    state,
    increment,
    decrement,
    reset
  };
}

// Use in template
const counter = createCounter();
app.state = counter.state;
app.methods = { 
  increment: counter.increment,
  decrement: counter.decrement,
  reset: counter.reset
};
```

### Shared State

Create stores for shared state:

```javascript
// store.js
export const userStore = reactive({
  user: null,
  isLoggedIn: computed(() => userStore.user !== null),
  
  login(userData) {
    this.user = userData;
  },
  
  logout() {
    this.user = null;
  }
});

// Use in multiple components
import { userStore } from './store';

app.state = {
  ...userStore,
  localData: {}
};
```

## Performance Optimization

### Batch Updates

Uus.js automatically batches DOM updates:

```javascript
// Multiple state changes
state.count++;
state.message = 'Updated';
state.items.push('new');

// Only triggers one DOM update cycle
```

### Lazy Evaluation

Computed values are lazy:

```javascript
const expensive = computed(() => {
  console.log('Computing...');
  return heavyCalculation(state.data);
});

// Not computed until accessed
if (someCondition) {
  console.log(expensive.value); // Computed here
}
```

### Avoiding Unnecessary Reactivity

```javascript
// For large datasets that don't need reactivity
const staticData = markRaw(largeDateSet);

// For third-party objects
const chart = markRaw(new Chart(...));
```

## Best Practices

### 1. Keep State Flat When Possible

```javascript
// ✅ Good - flat structure
const state = reactive({
  userId: 1,
  userName: 'John',
  userEmail: 'john@example.com'
});

// ❌ Avoid deep nesting when not needed
const state = reactive({
  user: {
    profile: {
      personal: {
        name: 'John'
      }
    }
  }
});
```

### 2. Use Computed for Derived State

```javascript
// ❌ Don't manually sync
state.fullName = state.firstName + ' ' + state.lastName;

// ✅ Use computed
const fullName = computed(() => 
  state.firstName + ' ' + state.lastName
);
```

### 3. Avoid Side Effects in Computed

```javascript
// ❌ Bad - side effects
const total = computed(() => {
  localStorage.setItem('total', sum); // Side effect!
  return sum;
});

// ✅ Good - pure computation
const total = computed(() => sum);

// Use effect for side effects
effect(() => {
  localStorage.setItem('total', total.value);
});
```

### 4. Clean Up Effects

```javascript
// Always clean up timers, listeners, etc.
effect(() => {
  const handler = () => console.log('clicked');
  window.addEventListener('click', handler);
  
  return () => {
    window.removeEventListener('click', handler);
  };
});
```

## Debugging Reactivity

### Debug Helper

```javascript
// Log all state changes
effect(() => {
  console.log('State changed:', JSON.stringify(state, null, 2));
});

// Track specific property access
Object.defineProperty(state, 'debugCount', {
  get() {
    console.trace('Accessing count');
    return state.count;
  }
});
```

### DevTools Integration

```javascript
// Expose state for debugging
if (process.env.NODE_ENV === 'development') {
  window.__UUS_STATE__ = state;
  window.__UUS_APP__ = app;
}
```

## Common Patterns

### Toggle State

```javascript
const state = reactive({
  isOpen: false,
  toggle() {
    this.isOpen = !this.isOpen;
  }
});
```

### Loading State

```javascript
const state = reactive({
  loading: false,
  error: null,
  data: null,
  
  async fetchData() {
    this.loading = true;
    this.error = null;
    
    try {
      this.data = await api.getData();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
});
```

### Form State

```javascript
const formState = reactive({
  values: {
    name: '',
    email: ''
  },
  errors: {},
  touched: {},
  
  validate() {
    this.errors = {};
    if (!this.values.name) {
      this.errors.name = 'Name is required';
    }
    if (!this.values.email.includes('@')) {
      this.errors.email = 'Invalid email';
    }
    return Object.keys(this.errors).length === 0;
  }
});
```

## Next Steps

- Learn about [Directives](./directives.md) that leverage reactivity
- Explore [State Management](./state-management.md) patterns
- See [Performance Guide](../guides/performance.md) for optimization tips