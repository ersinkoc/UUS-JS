# Uus.js Design Document

## Architecture Overview

┌─────────────────────────────────────────────────────────┐
│ Application Layer │
├─────────────────────────────────────────────────────────┤
│ Plugin System │
├──────────┬──────────┬──────────┬──────────┬───────────┤
│ Router │ Animate │ Forms │ i18n │ DevTools │
├──────────┴──────────┴──────────┴──────────┴───────────┤
│ Core Layer │
├──────────┬──────────┬──────────┬──────────┬───────────┤
│ Reactive │Directive │ Event │ Lifecycle│ Utils │
│ System │ System │ System │ Hooks │ │
├──────────┴──────────┴──────────┴──────────┴───────────┤
│ DOM Abstraction │
├─────────────────────────────────────────────────────────┤
│ Browser APIs │
└─────────────────────────────────────────────────────────┘

## Core Design Principles

### 1. Progressive Enhancement

- Enhance existing HTML without replacing it
- Work without JavaScript where possible
- Graceful degradation
- Server-side rendering friendly

### 2. Declarative Programming

- Behavior defined in HTML attributes
- Minimal JavaScript required
- Self-documenting code
- Predictable outcomes

### 3. Reactive by Default

- Automatic UI updates
- Efficient change detection
- Minimal re-renders
- Predictable data flow

### 4. Zero Configuration

- No build step required
- Convention over configuration
- Smart defaults
- Plug and play

### 5. Composability

- Small, focused directives
- Combinable behaviors
- Plugin architecture
- Extensible core

## Technical Design

### 1. Reactive System Design

```typescript
interface ReactiveSystem {
  // Core reactive API
  createReactive<T>(target: T): T;
  effect(fn: Function): EffectHandle;
  computed<T>(fn: () => T): ComputedRef<T>;
  watch(source: any, cb: Function): WatchHandle;
}

// Implementation using Proxy
class ReactiveCore {
  private deps = new WeakMap<object, Set<Effect>>();
  private effects = new Set<Effect>();

  track(target: object, key: string | symbol) {
    // Dependency tracking
  }

  trigger(target: object, key: string | symbol) {
    // Effect triggering
  }
}
2. Directive System Design
typescriptinterface Directive {
  name: string;
  prefix?: string;
  init?(element: Element, value: string, context: Context): void;
  update?(element: Element, value: any, oldValue: any): void;
  destroy?(element: Element): void;
}

// Example directive
const TextDirective: Directive = {
  name: 'text',
  update(element, value) {
    element.textContent = String(value);
  }
};
3. Event System Design
typescriptinterface EventSystem {
  on(element: Element, event: string, handler: Function): void;
  off(element: Element, event: string, handler: Function): void;
  emit(element: Element, event: string, data?: any): void;
  delegate(root: Element, selector: string, event: string, handler: Function): void;
}

// Event modifiers
interface EventModifiers {
  prevent?: boolean;
  stop?: boolean;
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
}
4. Parser Design
typescriptinterface Parser {
  parse(element: Element): ParsedNode;
  compile(template: string): CompiledTemplate;
  evaluate(expression: string, context: object): any;
}

interface ParsedNode {
  directives: Map<string, DirectiveBinding>;
  children: ParsedNode[];
  static: boolean;
}
5. Plugin Architecture
typescriptinterface Plugin {
  name: string;
  install(uus: UusInstance): void;
  directives?: Directive[];
  components?: Component[];
  config?: PluginConfig;
}

// Plugin API
class Uus {
  use(plugin: Plugin): this {
    plugin.install(this);
    return this;
  }
}
Component Design
1. State Management
html<!-- Local state -->
<div uus-state="{ count: 0 }">
  <button uus-on:click="count++">{{ count }}</button>
</div>

<!-- Global state -->
<div uus-store="app">
  <span uus-text="$store.user.name"></span>
</div>
2. Component Lifecycle
javascript{
  created() {},      // After state initialization
  mounted() {},      // After DOM mounting
  updated() {},      // After reactive update
  destroyed() {}     // Before removal
}
3. Communication Patterns
html<!-- Parent to Child (props) -->
<div uus-component="user-card" uus-props="{ user: currentUser }">

<!-- Child to Parent (events) -->
<button uus-emit="user-selected" uus-data="user">

<!-- Sibling communication (store) -->
<div uus-store="shared" uus-action="updateUser">
Animation Design
1. CSS-Based Animations
html<div uus-animate="fadeIn"
     uus-duration="300ms"
     uus-easing="ease-out">
2. JavaScript Animations
javascriptUus.animate({
  from: { opacity: 0, x: -20 },
  to: { opacity: 1, x: 0 },
  duration: 300,
  easing: 'spring'
});
3. Gesture Support
html<div uus-draggable="{ axis: 'x', bounds: 'parent' }"
     uus-on:drag="handleDrag">
Performance Design
1. Update Batching

Collect all state changes
Single DOM update cycle
RequestAnimationFrame scheduling
Priority-based updates

2. Lazy Evaluation

Compute on demand
Cache computed values
Invalidate intelligently
Avoid unnecessary work

3. Memory Management

Weak references for effects
Automatic cleanup
Circular reference prevention
Resource pooling

4. Code Splitting

Dynamic imports for plugins
Lazy loading directives
Tree-shaking support
Minimal core

Security Design
1. XSS Prevention
javascript// Safe HTML rendering
sanitizeHTML(html: string): string {
  // DOMPurify integration
}

// Expression sandboxing
evaluateExpression(expr: string, context: object): any {
  // Safe evaluation without eval()
}
2. Content Security Policy

No inline scripts
No eval usage
Nonce support
Strict mode

Testing Design
1. Unit Testing
javascriptimport { createReactive } from '@uusjs/core';
import { test, expect } from 'vitest';

test('reactive system', () => {
  const state = createReactive({ count: 0 });
  state.count++;
  expect(state.count).toBe(1);
});
2. Component Testing
javascriptimport { mount } from '@uusjs/test-utils';

test('component interaction', async () => {
  const wrapper = mount('<div uus-state="{ count: 0 }">...</div>');
  await wrapper.find('button').click();
  expect(wrapper.state.count).toBe(1);
});
3. E2E Testing
javascriptimport { test, expect } from '@playwright/test';

test('full app flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[uus-test="increment"]');
  await expect(page.locator('[uus-test="count"]')).toHaveText('1');
});
API Design Philosophy
1. Consistency

Predictable naming
Uniform patterns
Clear conventions
Logical grouping

2. Discoverability

IntelliSense support
Type definitions
JSDoc comments
Good defaults

3. Composability

Small building blocks
Combine freely
No hidden magic
Explicit behavior

4. Extensibility

Plugin hooks
Custom directives
Event system
Middleware support
```
