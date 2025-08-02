# UUS.js API Reference

## Table of Contents

- [Core API](#core-api)
  - [Uus Class](#uus-class)
  - [Reactive System](#reactive-system)
  - [Directives](#directives)
  - [Error Handling](#error-handling)
  - [Memory Management](#memory-management)
- [Type Definitions](#type-definitions)
- [Advanced Usage](#advanced-usage)

## Core API

### Uus Class

The main class for creating UUS.js applications.

```typescript
import { Uus } from '@uusjs/core';

const app = new Uus(config?: UusConfig);
```

#### Constructor Options

```typescript
interface UusConfig {
  debug?: boolean;           // Enable debug mode (default: false)
  plugins?: UusPlugin[];     // Array of plugins to register
  directives?: Map<string, Directive>; // Custom directives
  onError?: (error: UusError) => void; // Global error handler
}
```

#### Instance Methods

##### `mount(element: string | Element): void`

Mount the application to a DOM element.

```javascript
// Mount by selector
app.mount('#app');

// Mount by element
app.mount(document.getElementById('app'));
```

##### `unmount(): void`

Unmount the application and clean up resources.

```javascript
app.unmount();
```

##### `destroy(): void`

Destroy the application instance completely.

```javascript
app.destroy();
```

##### `registerPlugin(plugin: UusPlugin): void`

Register a plugin with the application.

```javascript
app.registerPlugin({
  name: 'myPlugin',
  install(app) {
    // Plugin logic
  }
});
```

##### `registerDirective(name: string, directive: Directive): void`

Register a custom directive.

```javascript
app.registerDirective('focus', {
  bind(el, binding) {
    el.focus();
  }
});
```

##### `registerCleanup(fn: () => void): () => void`

Register a cleanup function that runs when the app is destroyed.

```javascript
const unregister = app.registerCleanup(() => {
  console.log('Cleaning up...');
});

// Later, to unregister:
unregister();
```

##### `getMemoryStats(): MemoryStats`

Get memory usage statistics.

```javascript
const stats = app.getMemoryStats();
console.log(stats);
```

##### `cleanupDeadReferences(): number`

Clean up dead references and return the count of cleaned items.

```javascript
const cleaned = app.cleanupDeadReferences();
console.log(`Cleaned ${cleaned} dead references`);
```

### Reactive System

#### `createReactive<T>(data: T): T`

Create a reactive proxy object.

```javascript
import { createReactive } from '@uusjs/core';

const state = createReactive({
  count: 0,
  user: {
    name: 'John'
  }
});

// Changes are reactive
state.count++; // Triggers updates
```

#### `effect(fn: () => void): () => void`

Create a reactive effect that runs when dependencies change.

```javascript
import { effect } from '@uusjs/core';

const cleanup = effect(() => {
  console.log('Count:', state.count);
});

// Later, to stop the effect:
cleanup();
```

#### `computed<T>(fn: () => T): ComputedRef<T>`

Create a computed value that updates when dependencies change.

```javascript
import { computed } from '@uusjs/core';

const doubled = computed(() => state.count * 2);
console.log(doubled.value); // Reactive value
```

#### `batchUpdates(fn: () => void): void`

Batch multiple updates together for performance.

```javascript
import { batchUpdates } from '@uusjs/core';

batchUpdates(() => {
  state.count++;
  state.user.name = 'Jane';
  // Updates are batched and applied together
});
```

#### `deepReactive<T>(data: T, visited?: WeakSet<object>, maxDepth?: number): T`

Create a deeply reactive object with depth control.

```javascript
import { deepReactive } from '@uusjs/core';

const state = deepReactive({
  nested: {
    deeply: {
      value: 42
    }
  }
}, new WeakSet(), 5); // Max depth of 5
```

#### `shallowReactive<T>(data: T): T`

Create a shallow reactive object (only top-level properties are reactive).

```javascript
import { shallowReactive } from '@uusjs/core';

const state = shallowReactive({
  count: 0,
  nested: { value: 1 } // nested.value is not reactive
});
```

#### `readonly<T>(target: T): T`

Create a readonly reactive proxy.

```javascript
import { readonly } from '@uusjs/core';

const state = createReactive({ count: 0 });
const readonlyState = readonly(state);

readonlyState.count++; // Error: Cannot modify readonly property
```

### Directives

#### Built-in Directives

##### `uus-state`

Initialize component state.

```html
<div uus-state="{ count: 0, name: 'John' }">
  <!-- State is available within this element -->
</div>
```

##### `uus-text`

Set element text content.

```html
<span uus-text="message"></span>
<span uus-text="'Hello, ' + name"></span>
```

##### `uus-html`

Set element HTML content.

```html
<div uus-html="htmlContent"></div>
```

##### `uus-show`

Toggle element visibility.

```html
<div uus-show="isVisible">
  This is conditionally visible
</div>
```

##### `uus-if`

Conditionally render element.

```html
<div uus-if="showElement">
  This is conditionally rendered
</div>
```

##### `uus-for`

Render lists.

```html
<!-- Basic iteration -->
<li uus-for="item in items" uus-text="item"></li>

<!-- With index -->
<li uus-for="(item, index) in items">
  {{ index }}: {{ item }}
</li>
```

##### `uus-model`

Two-way data binding.

```html
<input uus-model="username">
<textarea uus-model="message"></textarea>
<select uus-model="selectedOption">
  <option value="1">Option 1</option>
</select>
```

##### `uus-on`

Event handling.

```html
<!-- Basic event -->
<button uus-on:click="handleClick()">Click me</button>

<!-- With modifiers -->
<form uus-on:submit.prevent="handleSubmit()">
  <input uus-on:keyup.enter="submitForm()">
</form>

<!-- Event delegation -->
<ul uus-on:click.delegate="handleItemClick($event)">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

##### `uus-bind` / `:`

Bind attributes dynamically.

```html
<!-- Long form -->
<img uus-bind:src="imageUrl">
<a uus-bind:href="linkUrl">

<!-- Shorthand -->
<img :src="imageUrl">
<button :disabled="isDisabled">
```

##### `uus-class`

Dynamic class binding.

```html
<!-- Object syntax -->
<div uus-class="{ active: isActive, 'text-danger': hasError }"></div>

<!-- Array syntax -->
<div uus-class="[baseClass, isActive ? 'active' : '']"></div>

<!-- String syntax -->
<div uus-class="dynamicClass"></div>
```

##### `uus-style`

Dynamic style binding.

```html
<!-- Object syntax -->
<div uus-style="{ color: textColor, fontSize: size + 'px' }"></div>

<!-- String syntax -->
<div uus-style="styleString"></div>
```

#### Custom Directives

Create custom directives:

```javascript
const focusDirective = {
  name: 'focus',
  
  // Called when directive is first bound
  bind(el, binding, uus) {
    if (binding.value) {
      el.focus();
    }
  },
  
  // Called when value updates
  update(el, binding, uus) {
    if (binding.value) {
      el.focus();
    }
  },
  
  // Called when element is unbound
  unbind(el, binding, uus) {
    // Cleanup logic
  }
};

app.registerDirective('focus', focusDirective);
```

Usage:

```html
<input uus-focus="shouldFocus">
```

### Error Handling

#### Error Classes

```javascript
import {
  UusError,
  DirectiveError,
  EvaluationError,
  ReactiveError,
  ParsingError,
  MountingError,
  ValidationError
} from '@uusjs/core';
```

#### Global Error Handler

```javascript
import { globalErrorHandler } from '@uusjs/core';

// Set custom error handler
globalErrorHandler.setErrorHandler((error, context) => {
  console.error('Error:', error);
  console.log('Context:', context);
  
  // Send to error reporting service
  errorReporter.log(error, context);
});

// Handle errors safely
globalErrorHandler.safe(
  () => {
    // Risky operation
  },
  ErrorCategory.EVALUATION,
  { component: 'MyComponent' },
  'default value' // Fallback value
);
```

#### Error Categories

```javascript
import { ErrorCategory } from '@uusjs/core';

// Available categories:
ErrorCategory.INITIALIZATION
ErrorCategory.PARSING
ErrorCategory.DIRECTIVE
ErrorCategory.EVALUATION
ErrorCategory.REACTIVE
ErrorCategory.MOUNTING
ErrorCategory.LIFECYCLE
ErrorCategory.PLUGIN
ErrorCategory.MEMORY
ErrorCategory.VALIDATION
```

#### Error Severity

```javascript
import { ErrorSeverity } from '@uusjs/core';

// Available severities:
ErrorSeverity.LOW
ErrorSeverity.MEDIUM
ErrorSeverity.HIGH
ErrorSeverity.CRITICAL
```

### Memory Management

#### Memory Manager

```javascript
import { memoryManager } from '@uusjs/core';

// Get memory statistics
const stats = memoryManager.getMemoryStats();
console.log(stats);

// Track a resource
const resourceId = memoryManager.track(
  'component',
  element,
  () => {
    // Cleanup function
  },
  { metadata: 'value' }
);

// Untrack a resource
memoryManager.untrack(resourceId);

// Clean up dead references
const cleaned = memoryManager.cleanupDeadReferences();
```

#### Resource Tracker

```javascript
import { ResourceTracker } from '@uusjs/core';

const tracker = new ResourceTracker();

// Track a resource
const id = tracker.track('timer', setInterval(() => {}, 1000), () => {
  clearInterval(timerId);
});

// Get resource by ID
const resource = tracker.get(id);

// Untrack when done
tracker.untrack(id);
```

#### Cleanup Registry

```javascript
import { CleanupRegistry } from '@uusjs/core';

const registry = new CleanupRegistry();

// Register cleanup functions
registry.register('component1', () => {
  console.log('Cleaning component1');
});

// Register timers
const timerId = setInterval(() => {}, 1000);
registry.registerTimer(timerId);

// Register observers
const observer = new MutationObserver(() => {});
registry.registerObserver(observer);

// Clean up all
registry.cleanup();
```

#### Leak Detection

```javascript
import { leakDetector, initLeakDetection } from '@uusjs/core';

// Initialize leak detection (auto-starts in development)
initLeakDetection(true);

// Perform manual health check
const report = leakDetector.performHealthCheck();
console.log(report);

// Listen for reports
const unsubscribe = leakDetector.onReport((report) => {
  if (report.overall === 'critical') {
    console.error('Critical memory leaks detected!', report);
  }
});

// Run memory pressure test
import { runMemoryPressureTest } from '@uusjs/core';

const testReport = await runMemoryPressureTest(5000); // 5 second test
```

## Type Definitions

### Core Types

```typescript
interface UusInstance {
  state: ReactiveState;
  directives: Map<string, Directive>;
  cleanups: Map<Element, Set<() => void>>;
  rootElement?: Element;
  plugins: Map<string, UusPlugin>;
  errorHandler: ErrorHandler;
}

interface ReactiveState {
  [key: string]: any;
}

interface Directive<T = any> {
  name: DirectiveName;
  init?: (el: Element, binding: T, uus: UusInstance) => void;
  bind?: (el: Element, binding: T, uus: UusInstance) => void;
  update?: (el: Element, binding: T, uus: UusInstance) => void;
  unbind?: (el: Element, binding: T, uus: UusInstance) => void;
}

interface DirectiveBinding {
  value?: any;
  expression?: string;
  arg?: string;
  modifiers?: Record<string, boolean>;
}

interface UusPlugin {
  name: string;
  install: (app: Uus) => void;
}
```

### Branded Types

UUS.js uses branded types for additional type safety:

```typescript
type DirectiveName = string & { __brand: 'DirectiveName' };
type ElementSelector = string & { __brand: 'ElementSelector' };
type ExpressionString = string & { __brand: 'ExpressionString' };
type PluginName = string & { __brand: 'PluginName' };
type ResourceId = string & { __brand: 'ResourceId' };
type EventName = string & { __brand: 'EventName' };
```

## Advanced Usage

### Creating a Plugin

```javascript
const myPlugin = {
  name: 'myPlugin',
  install(app) {
    // Add global property
    app.globalProperty = 'value';
    
    // Register directive
    app.registerDirective('my-directive', {
      bind(el, binding) {
        // Directive logic
      }
    });
    
    // Add to prototype
    app.constructor.prototype.myMethod = function() {
      // Method logic
    };
  }
};

// Use the plugin
app.registerPlugin(myPlugin);
```

### Memory-Optimized Components

```javascript
import { registerComponentWithTracking } from '@uusjs/core';

const cleanup = registerComponentWithTracking(
  element,
  {
    created() {
      console.log('Component created');
    },
    mounted() {
      // Add event listeners with cleanup
      const handler = () => console.log('clicked');
      element.addEventListener('click', handler);
      
      this.addCleanup(() => {
        element.removeEventListener('click', handler);
      });
    },
    updated() {
      console.log('Component updated');
    },
    destroyed() {
      console.log('Component destroyed');
    }
  }
);
```

### Performance Optimization

```javascript
import { batchUpdates } from '@uusjs/core';

// Batch multiple state updates
batchUpdates(() => {
  state.items.push(...newItems);
  state.total = state.items.length;
  state.lastUpdated = Date.now();
});

// Use computed for derived values
const stats = computed(() => ({
  total: state.items.length,
  completed: state.items.filter(i => i.done).length,
  percentage: (completed / total) * 100
}));
```

### DevTools Integration

```javascript
import { initDevTools } from '@uusjs/core';

// Initialize DevTools in development
if (process.env.NODE_ENV === 'development') {
  const devtools = initDevTools(app, {
    logStateChanges: true,
    logDirectives: true,
    logLifecycle: true,
    performanceMetrics: true,
    breakOnError: true
  });
  
  // Use DevTools API
  devtools.logState();
  devtools.inspectElement(element);
  devtools.timeTravel(0); // Go to first state
}
```