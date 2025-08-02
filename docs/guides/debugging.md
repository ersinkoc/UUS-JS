# Debugging Guide

Learn how to effectively debug Uus.js applications using built-in tools and browser DevTools.

## DevTools Integration

### Enable DevTools

```javascript
import { Uus, initDevTools } from '@uusjs/core';

const app = new Uus({ debug: true });

// Initialize DevTools
const devtools = initDevTools(app, {
  logStateChanges: true,
  logDirectives: true,
  logLifecycle: true,
  performanceMetrics: true,
  breakOnError: true,
});

app.mount('#app');
```

### Console Access

Once DevTools are enabled, you can access your app from the console:

```javascript
// Access app instance
__UUS_APP__.state;

// Access DevTools
__UUS_DEVTOOLS__.logState();
__UUS_DEVTOOLS__.getHistory();
__UUS_DEVTOOLS__.visualizeTree();
```

## State Debugging

### Log Current State

```javascript
// In console
__UUS_DEVTOOLS__.logState();

// Or programmatically
devtools.logState();
```

Output:

```
📊 Current State
┌─────────┬────────────┬─────────┐
│ (index) │    key     │  value  │
├─────────┼────────────┼─────────┤
│    0    │  'count'   │    5    │
│    1    │  'user'    │ {Object}│
│    2    │  'todos'   │ [Array] │
└─────────┴────────────┴─────────┘
```

### Track State Changes

With `logStateChanges` enabled, all state mutations are logged:

```
🔄 State Change [10:32:45 AM]
Property: count
Old: 5
New: 6
Stack trace
  at Proxy.increment (app.js:42)
  at HTMLButtonElement.handler (uus.js:1234)
```

### State History & Time Travel

```javascript
// View state history
const history = __UUS_DEVTOOLS__.getHistory();

// Time travel to previous state
__UUS_DEVTOOLS__.timeTravel(0); // Go to first snapshot
__UUS_DEVTOOLS__.timeTravel(10); // Go to 10th snapshot
```

## Element Inspection

### Inspect Element Directives

```javascript
// Select element and inspect
const element = document.querySelector('.my-component');
__UUS_DEVTOOLS__.inspectElement(element);
```

Output:

```
🔍 Element Inspector
Element: <div class="my-component">
Directives:
  uus-state: { count: 0 }
  uus-show: count > 0
  @click: increment
```

### Find Elements by State

```javascript
// Find all elements using a specific state property
__UUS_DEVTOOLS__.findByState('todos');
__UUS_DEVTOOLS__.findByState('user', { id: 123 });
```

### Visualize Component Tree

```javascript
__UUS_DEVTOOLS__.visualizeTree();
```

Output:

```
🌳 Component Tree
div [uus-state]
  header
    h1 [uus-text]
    nav
      a [uus-link @click]
      a [uus-link @click]
  main [uus-router]
    section [uus-route]
      ul
        li [uus-for uus-animate]
```

## Performance Debugging

### Performance Profiling

```javascript
// Start profiling
__UUS_DEVTOOLS__.startProfiling('render');

// Do some operations
app.state.todos = generateLargeTodoList();

// End profiling
__UUS_DEVTOOLS__.endProfiling('render');
// Output: ⏱️ render: 45.23ms
```

### Automatic Performance Metrics

With `performanceMetrics` enabled:

```
⚡ uus-mount: 12.45ms
⚡ uus-update-todos: 5.67ms
⚡ uus-animation-slideIn: 300.12ms
```

### Memory Profiling

Use Chrome DevTools Memory Profiler:

1. Open DevTools → Memory tab
2. Take heap snapshot before operations
3. Perform operations
4. Take another snapshot
5. Compare snapshots

Look for:

- Detached DOM nodes
- Growing object counts
- Memory leaks in effects

## Directive Debugging

### Debug Directive Execution

```javascript
// Add debug logs to custom directives
app.directive('debug', {
  mounted(el, binding) {
    console.log('Directive mounted:', {
      element: el,
      value: binding.value,
      modifiers: binding.modifiers,
    });
  },
  updated(el, binding) {
    console.log('Directive updated:', {
      oldValue: binding.oldValue,
      newValue: binding.value,
    });
  },
});
```

Use in template:

```html
<div uus-debug="someValue">Debug me</div>
```

### Trace Directive Lifecycle

```javascript
// Enable directive logging
const app = new Uus({
  debug: true,
  logDirectives: true,
});
```

## Reactive System Debugging

### Track Dependencies

```javascript
import { effect } from '@uusjs/core';

// Debug what triggers an effect
effect(() => {
  console.trace('Effect triggered');
  console.log('Current count:', app.state.count);
});
```

### Debug Computed Values

```javascript
const debugComputed = computed(() => {
  console.log('Computing total...');
  const result = state.items.reduce((sum, item) => {
    console.log('Processing item:', item);
    return sum + item.price;
  }, 0);
  console.log('Total computed:', result);
  return result;
});
```

### Watch with Debugging

```javascript
watch(
  () => state.query,
  (newVal, oldVal) => {
    console.group('Query changed');
    console.log('Old:', oldVal);
    console.log('New:', newVal);
    console.trace('Change source');
    console.groupEnd();

    performSearch(newVal);
  }
);
```

## Error Debugging

### Break on Errors

With `breakOnError` enabled, debugger pauses on errors:

```javascript
// This will pause in debugger
app.state.undefinedProperty.nested; // TypeError
```

### Error Boundaries in Directives

```javascript
app.directive('safe', {
  mounted(el, binding) {
    try {
      // Risky operation
      const result = evaluate(binding.value);
      el.textContent = result;
    } catch (error) {
      console.error('Directive error:', error);
      el.textContent = 'Error occurred';
      el.style.color = 'red';

      // Report to error tracking
      if (window.errorReporter) {
        window.errorReporter.log(error);
      }
    }
  },
});
```

### Global Error Handler

```javascript
window.addEventListener('error', (event) => {
  if (event.error && event.error.isUusError) {
    console.group('🚨 Uus.js Error');
    console.error('Message:', event.error.message);
    console.error('Component:', event.error.component);
    console.error('Expression:', event.error.expression);
    console.groupEnd();
  }
});
```

## Browser DevTools Tips

### Chrome DevTools

1. **Elements Panel**
   - Right-click → "Break on" → "Subtree modifications"
   - Watch DOM changes in real-time
   - Use $0 to reference selected element

2. **Console Panel**

   ```javascript
   // Quick element query
   $$('[uus-state]'); // All elements with state

   // Monitor function calls
   monitor(app.state.addTodo);

   // Debug specific property
   Object.defineProperty(app.state, 'count', {
     set(value) {
       debugger; // Pause when count changes
       this._count = value;
     },
     get() {
       return this._count;
     },
   });
   ```

3. **Sources Panel**
   - Set conditional breakpoints
   - Use logpoints instead of console.log
   - Enable "Pause on exceptions"

4. **Performance Panel**
   - Record performance profile
   - Look for long tasks
   - Analyze render performance

### Vue DevTools Compatibility

While Uus.js doesn't have dedicated DevTools yet, you can use some Vue DevTools features:

```javascript
// Make state compatible
window.__VUE__ = {
  apps: [
    {
      _instance: {
        proxy: app.state,
      },
    },
  ],
};
```

## Common Debugging Scenarios

### 1. State Not Updating

```javascript
// Debug: Check if property is reactive
console.log(isReactive(app.state.myObject)); // Should be true

// Debug: Check if property exists
console.log('myProp' in app.state); // Should be true

// Debug: Force update
app.state.myArray = [...app.state.myArray];
```

### 2. Directive Not Working

```javascript
// Check if directive is registered
console.log(app.directives.has('my-directive'));

// Check element attributes
console.log(element.getAttribute('uus-my-directive'));

// Manual directive test
const directive = app.directives.get('my-directive');
directive.mounted(element, { value: 'test' });
```

### 3. Performance Issues

```javascript
// Measure render time
console.time('render');
app.state.largeList = generateItems(10000);
console.timeEnd('render');

// Check for unnecessary updates
let updateCount = 0;
watch(
  () => state.value,
  () => {
    updateCount++;
    console.log(`Updated ${updateCount} times`);
  }
);
```

### 4. Memory Leaks

```javascript
// Track effect cleanup
const effects = new Set();

function trackEffect(fn) {
  const stop = effect(() => {
    console.log('Effect running');
    fn();
  });

  effects.add(stop);
  return () => {
    effects.delete(stop);
    stop();
    console.log('Effect cleaned up');
  };
}

// Check for cleanup
console.log('Active effects:', effects.size);
```

## Debug Utilities

### Create Debug Build

```javascript
// vite.config.js
export default {
  define: {
    __DEV__: true,
    __DEBUG_STATE__: true,
    __DEBUG_DIRECTIVES__: true,
  },
};
```

### Debug Component

```javascript
function createDebugComponent(name, component) {
  return {
    ...component,
    onMount() {
      console.log(`[${name}] Mounted`);
      component.onMount?.();
    },
    onUpdate() {
      console.log(`[${name}] Updated`);
      component.onUpdate?.();
    },
    onUnmount() {
      console.log(`[${name}] Unmounted`);
      component.onUnmount?.();
    },
  };
}
```

### State Validator

```javascript
function validateState(state, schema) {
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in state)) {
      console.warn(`Missing required state property: ${key}`);
    } else if (typeof state[key] !== type) {
      console.warn(
        `Invalid type for ${key}: expected ${type}, got ${typeof state[key]}`
      );
    }
  }
}

// Usage
validateState(app.state, {
  count: 'number',
  user: 'object',
  todos: 'object', // arrays are objects
});
```

## Production Debugging

### Debug Mode Toggle

```javascript
// Enable debug mode via URL
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === 'true';

if (debugMode) {
  initDevTools(app);
  window.__DEBUG__ = true;
}
```

### Remote Debugging

```javascript
// Send errors to logging service
window.addEventListener('error', async (event) => {
  if (window.__PRODUCTION__) {
    await fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        message: event.error.message,
        stack: event.error.stack,
        state: sanitizeState(app.state),
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    });
  }
});
```

## Best Practices

1. **Use Descriptive State Names**

   ```javascript
   // Good
   state.isUserLoggedIn;
   state.todoItems;

   // Bad
   state.flag;
   state.data;
   ```

2. **Add Debug Comments**

   ```html
   <!-- Debug: This shows when user has no todos -->
   <div uus-show="todos.length === 0">No todos yet</div>
   ```

3. **Create Debug Helpers**

   ```javascript
   window.uusDebug = {
     state: () => __UUS_DEVTOOLS__.logState(),
     history: () => __UUS_DEVTOOLS__.getHistory(),
     reset: () => (app.state = reactive(initialState)),
   };
   ```

4. **Use Assertions**
   ```javascript
   function addTodo(text) {
     console.assert(text && text.trim(), 'Todo text cannot be empty');
     console.assert(typeof text === 'string', 'Todo text must be a string');

     state.todos.push({
       id: Date.now(),
       text: text.trim(),
     });
   }
   ```

## Next Steps

- Set up [Testing](../testing.md) for automated debugging
- Learn [Performance Optimization](./performance.md)
- Explore [Error Handling](./error-handling.md) patterns
