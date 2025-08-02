# Migrating from Alpine.js to Uus.js

This guide helps you migrate from Alpine.js to Uus.js. While both frameworks share a similar philosophy of enhancing HTML with reactivity, Uus.js offers true reactivity and a more powerful feature set.

## Key Differences

| Feature    | Alpine.js            | Uus.js                 |
| ---------- | -------------------- | ---------------------- |
| Reactivity | Manual with `$watch` | Automatic with Proxies |
| Size       | ~15KB                | ~3KB core              |
| Syntax     | `x-` prefix          | `uus-` prefix          |
| State      | Component-scoped     | True reactive state    |
| Computed   | Magic properties     | Real computed values   |
| TypeScript | Limited              | Full support           |

## Syntax Comparison

### Basic State & Text

**Alpine.js:**

```html
<div x-data="{ message: 'Hello Alpine!' }">
  <p x-text="message"></p>
</div>
```

**Uus.js:**

```html
<div uus-state="{ message: 'Hello Uus!' }">
  <p uus-text="message"></p>
</div>
```

### Event Handling

**Alpine.js:**

```html
<button x-on:click="count++">Increment</button>

<!-- or shorthand -->
<button @click="count++">Increment</button>
```

**Uus.js:**

```html
<button uus-on:click="count++">Increment</button>

<!-- or shorthand -->
<button @click="count++">Increment</button>
```

### Two-way Binding

**Alpine.js:**

```html
<input x-model="name" />
<p>Hello <span x-text="name"></span></p>
```

**Uus.js:**

```html
<input uus-model="name" />
<p>Hello <span uus-text="name"></span></p>
```

### Conditional Rendering

**Alpine.js:**

```html
<!-- Toggle display -->
<div x-show="isVisible">Visible content</div>

<!-- Remove from DOM -->
<template x-if="isLoaded">
  <div>Loaded content</div>
</template>
```

**Uus.js:**

```html
<!-- Toggle display -->
<div uus-show="isVisible">Visible content</div>

<!-- Remove from DOM -->
<div uus-if="isLoaded">Loaded content</div>
```

### List Rendering

**Alpine.js:**

```html
<template x-for="item in items" :key="item.id">
  <li x-text="item.name"></li>
</template>
```

**Uus.js:**

```html
<li uus-for="item in items" :key="item.id" uus-text="item.name"></li>
```

### Class & Style Binding

**Alpine.js:**

```html
<div :class="{ 'active': isActive, 'error': hasError }">Content</div>

<div :style="{ color: textColor, fontSize: size + 'px' }">Styled</div>
```

**Uus.js:**

```html
<div uus-class="{ active: isActive, error: hasError }">Content</div>

<div uus-style="{ color: textColor, fontSize: size + 'px' }">Styled</div>
```

## Component Patterns

### Alpine.js Component

```html
<div x-data="dropdown()" x-init="init()">
  <button @click="toggle">
    <span x-text="selected.label"></span>
  </button>
  <ul x-show="open" @click.away="open = false">
    <template x-for="option in options">
      <li @click="select(option)" x-text="option.label"></li>
    </template>
  </ul>
</div>

<script>
  function dropdown() {
    return {
      open: false,
      selected: null,
      options: [],

      init() {
        this.options = [
          { value: 1, label: 'Option 1' },
          { value: 2, label: 'Option 2' },
        ];
        this.selected = this.options[0];
      },

      toggle() {
        this.open = !this.open;
      },

      select(option) {
        this.selected = option;
        this.open = false;
      },
    };
  }
</script>
```

### Uus.js Equivalent

```html
<div
  uus-state="{ 
  open: false,
  selected: options[0],
  options: [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' }
  ]
}"
>
  <button @click="open = !open">
    <span uus-text="selected.label"></span>
  </button>
  <ul uus-show="open" @click.away="open = false">
    <li
      uus-for="option in options"
      @click="selected = option; open = false"
      uus-text="option.label"
    ></li>
  </ul>
</div>
```

## Advanced Features

### Watching Data

**Alpine.js:**

```javascript
Alpine.data('component', () => ({
  search: '',

  init() {
    this.$watch('search', (value) => {
      console.log('Search changed:', value);
      this.performSearch(value);
    });
  },

  performSearch(query) {
    // Search logic
  },
}));
```

**Uus.js:**

```javascript
import { watch } from '@uusjs/core';

const state = reactive({
  search: ''
});

watch(() => state.search, (value) => {
  console.log('Search changed:', value);
  performSearch(value);
});

// Or in component
uus-component="{
  onMount() {
    this.$watch('search', (value) => {
      console.log('Search changed:', value);
      this.performSearch(value);
    });
  }
}"
```

### Computed Properties

**Alpine.js:**

```javascript
Alpine.data('cart', () => ({
  items: [],

  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  },

  get formattedTotal() {
    return `$${this.total.toFixed(2)}`;
  },
}));
```

**Uus.js:**

```javascript
uus-state="{
  items: [],
  total: computed(() => items.reduce((sum, item) => sum + item.price, 0)),
  formattedTotal: computed(() => '$' + total.toFixed(2))
}"
```

### Lifecycle Hooks

**Alpine.js:**

```javascript
Alpine.data('component', () => ({
  init() {
    console.log('Component initialized');

    // Cleanup
    window.addEventListener('resize', this.handleResize);

    this.$cleanup(() => {
      window.removeEventListener('resize', this.handleResize);
    });
  },

  handleResize() {
    // Handle resize
  },
}));
```

**Uus.js:**

```javascript
uus-component="{
  onMount() {
    console.log('Component mounted');

    window.addEventListener('resize', this.handleResize);
  },

  onUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },

  handleResize() {
    // Handle resize
  }
}"
```

## Migrating Stores

### Alpine.js Store

```javascript
Alpine.store('user', {
  name: '',
  email: '',

  login(credentials) {
    // Login logic
    this.name = credentials.name;
    this.email = credentials.email;
  },

  logout() {
    this.name = '';
    this.email = '';
  },
});

// Usage
Alpine.data('component', () => ({
  get user() {
    return Alpine.store('user');
  },
}));
```

### Uus.js Store

```javascript
// store.js
import { reactive, computed } from '@uusjs/core';

export const userStore = reactive({
  name: '',
  email: '',

  get isLoggedIn() {
    return !!this.name;
  },

  login(credentials) {
    this.name = credentials.name;
    this.email = credentials.email;
  },

  logout() {
    this.name = '';
    this.email = '';
  },
});

// Usage in component
import { userStore } from './store';

app.state = {
  user: userStore,
  // Local state
  loading: false,
};
```

## Magic Properties

### Alpine.js Magic

```html
<div x-data="{ items: ['a', 'b', 'c'] }">
  <template x-for="(item, index) in items">
    <div>
      <span x-text="$index"></span>:
      <span x-text="item"></span>
      <button @click="$dispatch('remove', item)">Remove</button>
    </div>
  </template>

  <button @click="$refs.input.focus()">Focus Input</button>
  <input x-ref="input" />
</div>
```

### Uus.js Equivalent

```html
<div uus-state="{ items: ['a', 'b', 'c'] }">
  <div uus-for="(item, index) in items">
    <span uus-text="index"></span>:
    <span uus-text="item"></span>
    <button @click="$emit('remove', item)">Remove</button>
  </div>

  <button @click="$refs.input.focus()">Focus Input</button>
  <input ref="input" />
</div>
```

## Plugins & Extensions

### Alpine.js Plugin

```javascript
Alpine.plugin(function (Alpine) {
  Alpine.directive('tooltip', (el, { expression }) => {
    // Tooltip implementation
  });

  Alpine.magic('now', () => {
    return new Date().toLocaleString();
  });
});
```

### Uus.js Plugin

```javascript
const tooltipPlugin = {
  install(app) {
    app.directive('tooltip', {
      mounted(el, binding) {
        // Tooltip implementation
      },
    });

    // Add global property
    app.state.$now = () => new Date().toLocaleString();
  },
};

app.use(tooltipPlugin);
```

## Migration Checklist

1. **Update HTML attributes**
   - [ ] Replace `x-data` with `uus-state`
   - [ ] Replace `x-show` with `uus-show`
   - [ ] Replace `x-if` with `uus-if`
   - [ ] Replace `x-for` with `uus-for`
   - [ ] Replace `x-model` with `uus-model`
   - [ ] Replace `x-text` with `uus-text`
   - [ ] Replace `x-html` with `uus-html`
   - [ ] Replace `x-on:` with `uus-on:` (or keep `@`)
   - [ ] Replace `x-bind:` with `uus-bind:` (or keep `:`)

2. **Update JavaScript**
   - [ ] Convert Alpine.data to reactive state
   - [ ] Replace magic properties with computed
   - [ ] Update lifecycle methods
   - [ ] Convert stores to reactive objects

3. **Update Build Process**
   - [ ] Remove Alpine.js script
   - [ ] Add Uus.js script
   - [ ] Update any bundler configs

4. **Test & Verify**
   - [ ] Test all interactions
   - [ ] Verify computed values update
   - [ ] Check event handlers work
   - [ ] Ensure animations/transitions work

## Common Gotchas

### 1. True Reactivity

Alpine.js requires manual dependency tracking:

```javascript
// Alpine - Need to use $watch
this.$watch('items', () => {
  this.updateTotal();
});
```

Uus.js is automatically reactive:

```javascript
// Uus - Automatic
const total = computed(() => items.reduce((sum, item) => sum + item.price, 0));
```

### 2. Template Differences

Alpine requires `<template>` for `x-if` and `x-for`:

```html
<!-- Alpine -->
<template x-if="show">
  <div>Content</div>
</template>
```

Uus.js works on any element:

```html
<!-- Uus -->
<div uus-if="show">Content</div>
```

### 3. Component Scope

Alpine components are isolated:

```javascript
// Alpine - Each component has own scope
Alpine.data('counter', () => ({
  count: 0,
}));
```

Uus.js shares state by default:

```javascript
// Uus - Shared state
const state = reactive({
  count: 0,
});
```

## Performance Benefits

After migrating to Uus.js:

- ⚡ **Smaller bundle** - 3KB vs 15KB
- 🚀 **Faster updates** - True reactivity
- 💾 **Less memory** - Efficient proxy system
- 🎯 **Better tree-shaking** - Modular architecture

## Getting Help

- Read the [Quick Start](../quick-start.md) guide
- Join our [Discord](https://discord.gg/uusjs)
- Check [Examples](../examples/) for patterns
- Report issues on [GitHub](https://github.com/uus-js/uus)

Welcome to Uus.js! 🎉
