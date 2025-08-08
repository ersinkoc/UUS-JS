# UUS.js

> A fresh reactive HTML framework for building modern web applications

[![npm version](https://img.shields.io/npm/v/@uusjs/core.svg)](https://www.npmjs.com/package/@uusjs/core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@uusjs/core)](https://bundlephobia.com/package/@uusjs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./coverage)

UUS.js (Estonian for "new") is a lightweight, reactive HTML framework that brings modern interactivity to web applications through declarative attributes. No virtual DOM, no complex build steps - just simple, powerful reactivity with enterprise-grade security and performance.

## ✨ Features

- 🎯 **< 3KB Core** - Extremely lightweight with minimal dependencies
- ⚡ **Reactive by Default** - Automatic UI updates with proxy-based reactivity
- 🏗️ **No Build Required** - Works directly in the browser via CDN
- 🎨 **Declarative** - Express behavior directly in HTML with intuitive directives
- 🔌 **Extensible** - Modular plugin system for additional functionality
- 📦 **Tree-Shakeable** - Import only what you need
- 🎭 **TypeScript Ready** - Full TypeScript support out of the box
- 🚀 **Fast** - Direct DOM manipulation with intelligent batching
- 🔒 **Secure** - XSS protection, safe expression evaluation, sanitized inputs
- 🧪 **100% Test Coverage** - Comprehensive test suite for reliability

## 🚀 Quick Start

### CDN Usage (No Build Tools)

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/@uusjs/core"></script>
  </head>
  <body>
    <div id="app" uus-state="{ count: 0, message: 'Hello UUS!' }">
      <h1 uus-text="message"></h1>
      <p>Count: <span uus-text="count"></span></p>
      <button uus-on:click="count++">Increment</button>
      <button uus-on:click="count = 0" uus-show="count > 0">Reset</button>
    </div>

    <script>
      const app = new Uus();
      app.mount('#app');
    </script>
  </body>
</html>
```

### NPM Installation

```bash
# Create a new project
npx @uusjs/create my-app
cd my-app
npm start

# Or add to existing project
npm install @uusjs/core
```

```javascript
import { Uus } from '@uusjs/core';

const app = new Uus({
  debug: true,
  errorHandler: (error) => console.error(error)
});

app.mount('#app', {
  state: { count: 0 },
  onMounted: () => console.log('App ready!')
});
```

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference for all features
- **[Examples Guide](./EXAMPLES.md)** - 10+ working examples with full code
- **[Project Analysis](./PROJECT_ANALYSIS.md)** - Detailed project structure and architecture
- **[Refactoring Plan](./REFACTORING_PLAN.md)** - Implementation roadmap and improvements

## 🎯 Core Concepts

### 📊 Reactive State

```html
<div uus-state="{ user: { name: 'John', age: 30 } }">
  <p>Hello <span uus-text="user.name"></span></p>
  <input uus-model="user.name" placeholder="Edit name" />
</div>
```

### 🎯 Event Handling

```html
<!-- Basic events -->
<button uus-on:click="count++">Click</button>

<!-- With modifiers -->
<form uus-on:submit.prevent="handleSubmit">
  <input uus-on:keyup.enter="search" />
  <button uus-on:click.once="showWelcome">Welcome</button>
</form>

<!-- Shorthand syntax -->
<button @click="count++">Increment</button>
```

### 🔀 Conditional Rendering

```html
<!-- Toggle visibility -->
<div uus-show="isVisible">Toggleable content</div>

<!-- Conditional rendering -->
<div uus-if="user.isPremium">
  <h3>Premium Features</h3>
</div>
```

### 📃 List Rendering

```html
<ul>
  <li uus-for="(task, index) in tasks" :key="task.id">
    <span uus-text="index + 1 + '. ' + task.name"></span>
    <button @click="removeTask(task.id)">Remove</button>
  </li>
</ul>
```

## 📦 Official Packages

| Package                                | Description                | Size  | Status    |
| -------------------------------------- | -------------------------- | ----- | --------- |
| [@uusjs/core](./packages/core)         | Core reactive engine       | < 3KB | ✅ Stable |
| [@uusjs/router](./packages/router)     | SPA routing with guards    | < 2KB | ✅ Stable |
| [@uusjs/animate](./packages/animate)   | Animations & transitions   | < 4KB | ✅ Stable |
| [@uusjs/forms](./packages/forms)       | Form handling & validation | < 3KB | ✅ Stable |
| [@uusjs/i18n](./packages/i18n)         | Internationalization       | < 2KB | ✅ Stable |
| [@uusjs/realtime](./packages/realtime) | WebSocket & SSE            | < 2KB | ✅ Stable |
| [@uusjs/ssr](./packages/ssr)           | Server-side rendering      | < 3KB | ✅ Stable |
| [@uusjs/devtools](./packages/devtools) | Browser DevTools           | < 5KB | ✅ Stable |
| [@uusjs/create](./packages/create)     | Project scaffolding CLI    | -     | ✅ Stable |
| [@uusjs/test-utils](./packages/test-utils) | Testing utilities      | < 2KB | ✅ Stable |

## 🌟 Live Examples

Explore complete applications built with UUS.js:

### 📊 [Analytics Dashboard](./examples/dashboard)
Full-featured dashboard with real-time data, interactive charts, and responsive design.
- Live metrics and KPI tracking
- Custom chart rendering with Canvas API
- Multi-page navigation
- Mobile-responsive interface

### 🛍️ [E-commerce Store](./examples/ecommerce)
Complete online store with shopping cart, product filtering, and checkout flow.
- Product catalog with search and filters
- Shopping cart with persistent storage
- Multi-step checkout process
- Responsive design for all devices

### 💬 [Realtime Chat](./examples/realtime-chat)
Live chat application with WebSocket communication.
- Real-time messaging
- Online user list
- Typing indicators
- Auto-reconnection

### 🌍 [i18n Demo](./examples/i18n-demo)
Comprehensive internationalization example with multiple languages.
- English, Turkish, Arabic, and Spanish support
- RTL/LTR text direction switching
- Complex pluralization rules
- Locale-aware number and date formatting

### 📝 [Todo App](./examples/todo-app)
Classic todo application showcasing core features.
- Add, edit, delete tasks
- Filter by status
- Persistent storage
- Drag & drop reordering

## 🛡️ Security Features

UUS.js includes enterprise-grade security features out of the box:

- **XSS Protection**: All HTML content is sanitized using DOMPurify
- **Safe Expression Evaluation**: Custom AST-based evaluator instead of `eval()` or `Function()`
- **Input Sanitization**: Automatic sanitization of user inputs
- **URL Injection Prevention**: Protected against malicious URL injections
- **Content Security Policy**: Compatible with strict CSP rules

## ⚡ Performance Optimizations

- **Batch Updates**: DOM updates are automatically batched for optimal performance
- **Memory Management**: WeakMap-based tracking prevents memory leaks
- **Lazy Loading**: Components and routes can be lazy-loaded on demand
- **Virtual Scrolling**: Built-in support for rendering large lists efficiently
- **Tree Shaking**: Only include the features you use in your bundle

## 🧪 Testing

All packages include comprehensive test suites with 100% coverage:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run specific package tests
pnpm --filter @uusjs/core test
```

## 🔧 Development

This is a monorepo managed with pnpm and Turborepo.

```bash
# Install dependencies
pnpm install

# Development mode with hot reload
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Check bundle sizes
pnpm size
```

### Project Structure

```
uus/
├── packages/
│   ├── core/          # Core reactive framework
│   ├── router/        # SPA routing
│   ├── animate/       # Animation system
│   ├── forms/         # Form handling
│   ├── i18n/          # Internationalization
│   ├── realtime/      # WebSocket & SSE
│   ├── ssr/           # Server-side rendering
│   ├── devtools/      # Browser DevTools
│   ├── create/        # CLI tool
│   └── test-utils/    # Testing utilities
├── examples/          # Example applications
│   ├── dashboard/     # Analytics dashboard
│   ├── ecommerce/     # Online store
│   ├── i18n-demo/     # Multi-language demo
│   ├── realtime-chat/ # WebSocket chat
│   └── todo-app/      # Simple todo list
└── docs/              # Documentation
    ├── API_DOCUMENTATION.md
    ├── EXAMPLES.md
    ├── PROJECT_ANALYSIS.md
    └── REFACTORING_PLAN.md
```

## 🌍 Migration Guides

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
  <button @click="count++">{{ count }}</button>
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

## 🌐 Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers with ES2020 support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📖 Resources

- **Documentation**: [uusjs.dev/docs](https://uusjs.dev/docs)
- **GitHub**: [github.com/uusjs/uus](https://github.com/uusjs/uus)
- **Discord**: [discord.gg/uusjs](https://discord.gg/uusjs)
- **Twitter**: [@uusjs](https://twitter.com/uusjs)

## 📄 License

MIT © UUS.js Team

---

<p align="center">
  Made with ❤️ by the UUS.js Team
  <br>
  <strong>Zero dependencies. Infinite possibilities.</strong>
</p>