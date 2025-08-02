Build Uus.js - A Modern Reactive HTML Framework

I want you to create a production-ready JavaScript framework called "Uus.js" (Estonian for "new"). This should be a lightweight, reactive HTML framework similar to htmx but focused on state management, animations, and real-time features.

## Project Organization

- **GitHub Organization**: https://github.com/uus-js
- **Main Repository**: https://github.com/uus-js/uus (monorepo)
- **NPM Organization**: @uusjs
- **Website**: uusjs.dev

## Core Requirements

### 1. Monorepo Structure

Create a monorepo at `github.com/uus-js/uus` with:
uus/
├── packages/
│ ├── core/ (@uusjs/core)
│ ├── router/ (@uusjs/router)
│ ├── animate/ (@uusjs/animate)
│ ├── forms/ (@uusjs/forms)
│ ├── i18n/ (@uusjs/i18n)
│ ├── cli/ (@uusjs/cli)
│ ├── create/ (@uusjs/create)
│ ├── devtools/ (@uusjs/devtools)
│ └── test-utils/ (@uusjs/test-utils)
├── apps/
│ ├── docs/ (docs.uusjs.dev)
│ ├── playground/ (play.uusjs.dev)
│ └── examples/
├── scripts/
├── .github/
│ ├── workflows/
│ ├── CONTRIBUTING.md
│ ├── CODE_OF_CONDUCT.md
│ └── FUNDING.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
└── README.md

Use pnpm workspaces and Turborepo for monorepo management.

### 2. Core Package (@uusjs/core)

Target: **< 3KB gzipped**

#### 2.1 Core Engine

```typescript
// packages/core/src/index.ts
export class Uus {
  constructor(config?: UusConfig);
  mount(element: HTMLElement | string): void;
  unmount(): void;
  use(plugin: UusPlugin): void;
  static version: string;
  static config(options: GlobalConfig): void;
}
2.2 Reactive System
html<!-- State management -->
<div uus-state="{ count: 0, user: null }">
  <span uus-text="count"></span>
  <button uus-click="count++">Increment</button>
</div>

<!-- Computed properties -->
<div uus-state="{ price: 100, tax: 0.18 }">
  <span uus-text="price + (price * tax)"></span>
</div>
Implement with:

Proxy-based reactivity
Efficient dependency tracking
Batched updates
Memory leak prevention

2.3 Directives System
Core directives to implement:
uus-state       → Initialize reactive state
uus-text        → Set text content
uus-html        → Set HTML content (with XSS protection)
uus-show        → Toggle display
uus-if          → Conditional rendering
uus-for         → List rendering
uus-model       → Two-way binding
uus-bind:[attr] → Attribute binding
uus-on:[event]  → Event handling
uus-class       → Dynamic classes
uus-style       → Dynamic styles
2.4 Event System
html<!-- Basic events -->
<button uus-on:click="handleClick">Click</button>

<!-- Modifiers -->
<form uus-on:submit.prevent="handleSubmit">
<button uus-on:click.once="showAlert">
<input uus-on:keyup.enter="submit">

<!-- Custom events -->
<div uus-on:custom-event="handleCustom"
     uus-emit="custom-event">
3. Router Package (@uusjs/router)
html<!-- Route definition -->
<div uus-router>
  <a uus-link="/home">Home</a>
  <a uus-link="/about">About</a>

  <div uus-route="/">Home Page</div>
  <div uus-route="/about">About Page</div>
  <div uus-route="/user/:id" uus-params="userId">
    User: <span uus-text="userId"></span>
  </div>
</div>
Features:

Hash and History mode
Route parameters
Nested routes
Route guards
Lazy loading
Transitions

4. Animate Package (@uusjs/animate)
html<!-- Built-in animations -->
<div uus-animate="fadeIn"
     uus-duration="300ms"
     uus-delay="100ms"
     uus-easing="spring">

<!-- Scroll triggered -->
<div uus-animate="slideUp"
     uus-trigger="visible"
     uus-threshold="0.5">

<!-- Stagger children -->
<ul uus-stagger="50ms">
  <li uus-animate="fadeIn">Item 1</li>
  <li uus-animate="fadeIn">Item 2</li>
</ul>

<!-- FLIP animations -->
<div uus-layout="grid"
     uus-flip="true">
Include:

20+ built-in animations
Custom animation API
Spring physics
Gesture support
Performance optimized

5. Forms Package (@uusjs/forms)
html<form uus-form="contactForm"
      uus-on:submit="handleSubmit">

  <input uus-field="email"
         uus-validate="required|email"
         uus-on:blur="validateField">
  <span uus-error="email"></span>

  <select uus-field="country"
          uus-validate="required">
    <option uus-for="c in countries"
            uus-value="c.code"
            uus-text="c.name">
  </select>

  <button uus-submit
          uus-disabled="!contactForm.valid">
    Submit
  </button>
</form>
6. CLI Package (@uusjs/cli)
bash# Global installation
npm install -g @uusjs/cli

# Commands
uus --version
uus init [project-name]
uus dev
uus build
uus preview
uus add [package]
uus test
uus lint
7. Create Package (@uusjs/create)
bash# Create new project
npm create @uusjs my-app
# or
pnpm create @uusjs my-app
# or
yarn create @uusjs my-app

# With template
npm create @uusjs my-app --template blog
Templates to include:

default (basic)
blog
dashboard
e-commerce
chat-app
portfolio

8. Package.json Configuration
@uusjs/core/package.json:
json{
  "name": "@uusjs/core",
  "version": "0.0.1",
  "description": "A fresh reactive HTML framework",
  "keywords": ["uus", "uusjs", "reactive", "html", "framework", "frontend"],
  "homepage": "https://uusjs.dev",
  "bugs": {
    "url": "https://github.com/uus-js/uus/issues",
    "email": "bugs@uusjs.dev"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/uus-js/uus.git",
    "directory": "packages/core"
  },
  "license": "MIT",
  "author": "Uus.js Team",
  "sideEffects": false,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "browser": "./dist/uus.esm.js"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "unpkg": "./dist/uus.min.js",
  "jsdelivr": "./dist/uus.min.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "dev": "vite",
    "build": "vite build && tsc",
    "test": "vitest",
    "lint": "eslint src",
    "size": "size-limit"
  },
  "size-limit": [
    {
      "path": "./dist/uus.min.js",
      "limit": "3 KB"
    }
  ],
  "devDependencies": {
    "@size-limit/preset-small-lib": "^11.0.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "size-limit": "^11.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
9. Build Configuration
vite.config.ts:
typescriptimport { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Uus',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        const formatMap = {
          es: 'index.js',
          cjs: 'index.cjs',
          umd: 'uus.min.js'
        };
        return formatMap[format];
      }
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
10. Testing Strategy
Use Vitest for all testing:

Unit tests for core functionality
Integration tests with happy-dom
E2E tests with Playwright
Performance benchmarks
Bundle size tests

Example test:
typescript// packages/core/tests/reactive.test.ts
import { describe, it, expect } from 'vitest';
import { createReactive } from '../src/reactive';

describe('Reactive System', () => {
  it('should track dependencies', () => {
    const state = createReactive({ count: 0 });
    let computedValue = 0;

    effect(() => {
      computedValue = state.count * 2;
    });

    expect(computedValue).toBe(0);
    state.count = 5;
    expect(computedValue).toBe(10);
  });
});
11. Documentation Site
Create a VitePress site at apps/docs:

Getting Started
Core Concepts
API Reference
Examples
Plugins
Migration Guide
Blog

12. DevTools Extension
Browser extension features:

Component tree
State inspector
Event logger
Performance profiler
Network monitor

13. TypeScript Support
Full TypeScript support with:

Strict mode
Type definitions for all directives
JSDoc comments
Template literal types for events

14. Performance Requirements

Initial parse: < 10ms
First render: < 16ms
Runtime overhead: < 5%
Memory footprint: < 1MB
60fps animations

15. GitHub Actions
Setup CI/CD:
yamlname: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      - run: pnpm size
16. Release Process

Automated with changesets
Semantic versioning
Automated changelog
NPM publishing
GitHub releases
CDN deployment

17. Example Usage
html<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@uusjs/core"></script>
</head>
<body>
  <div id="app" uus-state="{ count: 0, message: 'Hello Uus!' }">
    <h1 uus-text="message"></h1>
    <p>Count: <span uus-text="count"></span></p>
    <button uus-on:click="count++">Increment</button>
    <button uus-on:click="count = 0" uus-show="count > 0">Reset</button>

    <ul>
      <li uus-for="i in 3" uus-text="`Item ${i}`"></li>
    </ul>
  </div>

  <script>
    const app = new Uus();
    app.mount('#app');
  </script>
</body>
</html>
Start by creating the monorepo structure and implementing the core reactive system. Make sure everything is production-ready, well-tested, and follows modern JavaScript best practices.
Begin with:

Initialize monorepo with pnpm
Setup build tools
Implement core reactive system
Add basic directives
Create minimal working example
```
