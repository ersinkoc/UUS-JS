# Core API Reference

The core package (`@uusjs/core`) provides the fundamental building blocks of Uus.js.

## Uus Class

The main application class.

### Constructor

```typescript
new Uus(options?: UusOptions)
```

**Options:**
```typescript
interface UusOptions {
  debug?: boolean;          // Enable debug mode
  strict?: boolean;         // Enable strict mode
  devtools?: boolean;       // Enable devtools integration
}
```

### Methods

#### mount()

Mounts the application to a DOM element.

```typescript
mount(selector?: string | Element): Uus
```

**Parameters:**
- `selector` - CSS selector or DOM element (defaults to `document.body`)

**Returns:** The Uus instance for chaining

**Example:**
```javascript
const app = new Uus();
app.mount('#app');

// Or with element
app.mount(document.getElementById('app'));

// Or mount to body
app.mount();
```

#### unmount()

Unmounts the application and cleans up.

```typescript
unmount(): void
```

**Example:**
```javascript
app.unmount(); // Cleanup all listeners and effects
```

#### use()

Adds a plugin to the application.

```typescript
use(plugin: Plugin, options?: any): Uus
```

**Example:**
```javascript
app.use(createRouter({ routes }));
app.use(createAnimate());
```

#### directive()

Registers a custom directive.

```typescript
directive(name: string, definition: DirectiveDefinition): Uus
```

**Example:**
```javascript
app.directive('tooltip', {
  mounted(el, binding) {
    // Initialize tooltip
  },
  updated(el, binding) {
    // Update tooltip
  },
  unmounted(el) {
    // Cleanup tooltip
  }
});
```

### Properties

#### state

The reactive application state.

```typescript
state: Record<string, any>
```

**Example:**
```javascript
app.state = reactive({
  count: 0,
  user: null
});

// Access
console.log(app.state.count);

// Modify
app.state.count++;
```

## Reactivity API

### reactive()

Creates a reactive object.

```typescript
function reactive<T extends object>(target: T): T
```

**Parameters:**
- `target` - The object to make reactive

**Returns:** A reactive proxy of the object

**Example:**
```javascript
const state = reactive({
  count: 0,
  nested: {
    value: 'hello'
  }
});

state.count++; // Triggers updates
state.nested.value = 'world'; // Deep reactivity
```

### ref()

Creates a reactive reference to a value.

```typescript
function ref<T>(value: T): Ref<T>

interface Ref<T> {
  value: T;
}
```

**Parameters:**
- `value` - The initial value

**Returns:** A ref object

**Example:**
```javascript
const count = ref(0);
console.log(count.value); // 0

count.value++; // Triggers updates

// In templates, refs are unwrapped
// <span uus-text="count"></span> <!-- No .value needed -->
```

### computed()

Creates a computed value that automatically updates.

```typescript
function computed<T>(getter: () => T): ComputedRef<T>

interface ComputedRef<T> extends Ref<T> {
  readonly value: T;
}
```

**Parameters:**
- `getter` - Function that computes the value

**Returns:** A read-only computed ref

**Example:**
```javascript
const count = ref(0);
const double = computed(() => count.value * 2);

console.log(double.value); // 0
count.value = 5;
console.log(double.value); // 10
```

### effect()

Runs a side effect when dependencies change.

```typescript
function effect(fn: () => void | (() => void)): () => void
```

**Parameters:**
- `fn` - Effect function (can return cleanup function)

**Returns:** Stop function

**Example:**
```javascript
const state = reactive({ count: 0 });

const stop = effect(() => {
  console.log('Count:', state.count);
  
  // Optional cleanup
  return () => {
    console.log('Cleaning up');
  };
});

state.count++; // Logs: "Count: 1"
stop(); // Stop the effect
```

### watch()

Watches sources and runs callback on changes.

```typescript
function watch<T>(
  source: WatchSource<T> | WatchSource<T>[],
  callback: WatchCallback<T>,
  options?: WatchOptions
): StopHandle

type WatchSource<T> = (() => T) | Ref<T> | Reactive<T>

interface WatchOptions {
  immediate?: boolean;  // Run immediately
  deep?: boolean;      // Deep watch objects
  flush?: 'pre' | 'post' | 'sync';
}
```

**Example:**
```javascript
const state = reactive({ query: '' });

// Watch single source
watch(
  () => state.query,
  (newQuery, oldQuery) => {
    console.log(`Query changed: ${oldQuery} -> ${newQuery}`);
  }
);

// Watch multiple sources
watch(
  [() => state.page, () => state.filters],
  ([page, filters], [oldPage, oldFilters]) => {
    fetchData(page, filters);
  }
);

// Immediate execution
watch(
  () => state.userId,
  (userId) => loadUser(userId),
  { immediate: true }
);
```

## Utility Functions

### isRef()

Checks if a value is a ref.

```typescript
function isRef<T>(value: any): value is Ref<T>
```

**Example:**
```javascript
const count = ref(0);
console.log(isRef(count)); // true
console.log(isRef(0)); // false
```

### isReactive()

Checks if a value is reactive.

```typescript
function isReactive(value: any): boolean
```

**Example:**
```javascript
const state = reactive({ count: 0 });
console.log(isReactive(state)); // true
console.log(isReactive({})); // false
```

### unref()

Unwraps a ref or returns the value.

```typescript
function unref<T>(value: T | Ref<T>): T
```

**Example:**
```javascript
const count = ref(10);
console.log(unref(count)); // 10
console.log(unref(20)); // 20
```

### toRaw()

Returns the raw object from a reactive proxy.

```typescript
function toRaw<T>(proxy: T): T
```

**Example:**
```javascript
const state = reactive({ data: [] });
const raw = toRaw(state);
console.log(raw === state); // false
console.log(isReactive(raw)); // false
```

### markRaw()

Marks an object to skip reactivity.

```typescript
function markRaw<T extends object>(value: T): T
```

**Example:**
```javascript
const socket = markRaw(new WebSocket('ws://localhost'));
const state = reactive({
  socket // Won't be made reactive
});
```

## Directives API

### Built-in Directives

All built-in directives are automatically registered:

- `uus-state` - Initialize reactive state
- `uus-text` - Set text content
- `uus-html` - Set HTML content
- `uus-show` - Toggle visibility
- `uus-if` - Conditional rendering
- `uus-for` - List rendering
- `uus-model` - Two-way binding
- `uus-bind` / `:` - Bind attributes
- `uus-on` / `@` - Event listeners
- `uus-class` - Dynamic classes
- `uus-style` - Dynamic styles
- `uus-component` - Lifecycle hooks

### Custom Directive Definition

```typescript
interface DirectiveDefinition {
  // Called before element is inserted
  created?(
    el: Element,
    binding: DirectiveBinding,
    vnode: VNode
  ): void;
  
  // Called when element is inserted
  mounted?(
    el: Element,
    binding: DirectiveBinding,
    vnode: VNode
  ): void;
  
  // Called before element is updated
  beforeUpdate?(
    el: Element,
    binding: DirectiveBinding,
    vnode: VNode,
    prevVnode: VNode
  ): void;
  
  // Called after element is updated
  updated?(
    el: Element,
    binding: DirectiveBinding,
    vnode: VNode,
    prevVnode: VNode
  ): void;
  
  // Called before element is unmounted
  beforeUnmount?(
    el: Element,
    binding: DirectiveBinding,
    vnode: VNode
  ): void;
  
  // Called when element is unmounted
  unmounted?(
    el: Element,
    binding: DirectiveBinding,
    vnode: VNode
  ): void;
}

interface DirectiveBinding {
  value: any;        // The directive value
  oldValue: any;     // Previous value
  arg?: string;      // Directive argument
  modifiers: Record<string, boolean>; // Modifiers
}
```

**Example:**
```javascript
app.directive('color', {
  mounted(el, binding) {
    el.style.color = binding.value;
  },
  updated(el, binding) {
    el.style.color = binding.value;
  }
});

// Usage: <div uus-color="red">Text</div>
// Or: <div uus-color="primaryColor">Text</div>
```

## Parser & Evaluator

### Parser

The expression parser is used internally but can be accessed:

```javascript
import { Parser } from '@uusjs/core';

const parser = new Parser();
const ast = parser.parse('count + 1');
```

### Evaluator

Safely evaluates expressions:

```javascript
import { Evaluator } from '@uusjs/core';

const evaluator = new Evaluator();
const context = { count: 5 };
const result = evaluator.evaluate(ast, context); // 6
```

## TypeScript Support

### Types

```typescript
import type {
  Ref,
  ComputedRef,
  Reactive,
  UnwrapRef,
  WatchCallback,
  WatchOptions,
  DirectiveBinding,
  Plugin
} from '@uusjs/core';

// Component state type
interface AppState {
  count: number;
  user: User | null;
  todos: Todo[];
}

// Typed reactive
const state: Reactive<AppState> = reactive({
  count: 0,
  user: null,
  todos: []
});

// Typed ref
const count: Ref<number> = ref(0);

// Typed computed
const double: ComputedRef<number> = computed(() => count.value * 2);
```

### Generic Components

```typescript
function createComponent<T>(initialData: T) {
  const state = reactive(initialData);
  
  return {
    state,
    // Methods...
  };
}

const counter = createComponent({
  count: 0,
  step: 1
});
```

## Error Handling

### Debug Mode

Enable debug mode for detailed logs:

```javascript
const app = new Uus({ debug: true });
```

### Error Boundaries

Catch errors in directives:

```javascript
app.directive('safe', {
  mounted(el, binding) {
    try {
      // Risky operation
    } catch (error) {
      console.error('Directive error:', error);
      el.textContent = 'Error occurred';
    }
  }
});
```

## Performance

### Batching

Updates are automatically batched:

```javascript
// Multiple changes
state.a = 1;
state.b = 2;
state.c = 3;
// Single DOM update
```

### Lazy Evaluation

Computed values are lazy and cached:

```javascript
const expensive = computed(() => {
  console.log('Computing...');
  return heavyCalculation(state.data);
});

// Not computed until accessed
if (condition) {
  console.log(expensive.value); // Computed here
}
```

## Browser Compatibility

### Modern Browsers
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

### Polyfills

For older browsers:

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=Proxy,WeakMap"></script>
```

## Best Practices

1. **Keep computed values pure** - No side effects
2. **Clean up effects** - Return cleanup functions
3. **Use markRaw** - For large non-reactive data
4. **Avoid deep nesting** - Keep state structure flat
5. **Use TypeScript** - For better developer experience

## Next Steps

- Explore [Router API](./router.md) for navigation
- Learn [Animate API](./animate.md) for animations
- Master [Forms API](./forms.md) for form handling