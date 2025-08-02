# UUS.js

> A fresh reactive HTML framework for building modern web applications

[![npm version](https://img.shields.io/npm/v/@uusjs/core.svg)](https://www.npmjs.com/package/@uusjs/core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@uusjs/core)](https://bundlephobia.com/package/@uusjs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

UUS.js (Estonian for "new") is a lightweight, reactive HTML framework that brings modern interactivity to web applications through declarative attributes. No virtual DOM, no complex build steps - just simple, powerful reactivity.

## Features

- 🎯 **< 3KB Core** - Extremely lightweight with zero dependencies
- ⚡ **Reactive by Default** - Automatic UI updates with proxy-based reactivity
- 🏗️ **No Build Required** - Works directly in the browser via CDN
- 🎨 **Declarative** - Express behavior directly in HTML with intuitive directives
- 🔌 **Extensible** - Modular plugin system for additional functionality
- 📦 **Tree-Shakeable** - Import only what you need
- 🎭 **TypeScript Ready** - Full TypeScript support out of the box
- 🚀 **Fast** - Direct DOM manipulation with intelligent batching

## Quick Start

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
npm install @uusjs/core
```

```javascript
import { Uus } from '@uusjs/core';

const app = new Uus();
app.mount('#app');
```

## Core Concepts

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
  <button uus-on:click.once="showWelcome"></button>
</form>
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
  <li uus-for="task in tasks">
    <span uus-text="task.name"></span>
    <button uus-on:click="removeTask(task.id)">Remove</button>
  </li>
</ul>
```

## Official Packages

| Package                                | Description                | Size  | Status    |
| -------------------------------------- | -------------------------- | ----- | --------- |
| [@uusjs/core](./packages/core)         | Core reactive engine       | < 3KB | ✅ Stable |
| [@uusjs/router](./packages/router)     | SPA routing with guards    | < 2KB | ✅ Stable |
| [@uusjs/animate](./packages/animate)   | Animations & transitions   | < 4KB | ✅ Stable |
| [@uusjs/forms](./packages/forms)       | Form handling & validation | < 3KB | ✅ Stable |
| [@uusjs/i18n](./packages/i18n)         | Internationalization       | < 2KB | ✅ Stable |
| [@uusjs/realtime](./packages/realtime) | WebSocket & SSE            | < 2KB | ✅ Stable |

## Live Examples

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

### 🌍 [i18n Demo](./examples/i18n-demo)

Comprehensive internationalization example with multiple languages.

- English, Turkish, Arabic, and Spanish support
- RTL/LTR text direction switching
- Complex pluralization rules
- Locale-aware number and date formatting

### 💬 [Realtime Chat](./examples/realtime-chat)

Live chat application with WebSocket communication.

- Real-time messaging
- Online user list
- Typing indicators
- Auto-reconnection

### Example: Simple App Setup

```javascript
import { Uus } from '@uusjs/core';

const app = new Uus();
app.mount('#app');
```

## Why UUS.js?

- **Simple**: No complex concepts - if you know HTML and JavaScript, you know UUS.js
- **Lightweight**: Core under 3KB means faster load times
- **Flexible**: Use as little or as much as you need
- **Modern**: Built with ES modules and modern web standards
- **No Lock-in**: Enhance existing HTML without rewriting everything

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers with ES2020 support

## Examples & Tutorials

Get started with our comprehensive examples:

- 📊 **Dashboard**: Analytics dashboard with charts ([examples/dashboard](./examples/dashboard))
- 🛍️ **E-commerce**: Full online store ([examples/ecommerce](./examples/ecommerce))
- 🌍 **i18n**: Multi-language support ([examples/i18n-demo](./examples/i18n-demo))
- 💬 **Chat**: Real-time WebSocket chat ([examples/realtime-chat](./examples/realtime-chat))
- 📝 **Todo**: Simple task management ([examples/todo-app](./examples/todo-app))

Each example includes detailed README files with implementation guides and customization options.

## Development

This is a monorepo managed with pnpm and Turborepo.

```bash
# Install dependencies
pnpm install

# Development mode
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
│   └── realtime/      # WebSocket & SSE
└── examples/          # Example applications
    ├── dashboard/     # Analytics dashboard
    ├── ecommerce/     # Online store
    ├── i18n-demo/     # Multi-language demo
    ├── realtime-chat/ # WebSocket chat
    └── todo-app/      # Simple todo list
```

## Getting Help

- 📚 Check the example applications in `/examples/`
- 💡 Review individual package README files
- 🐛 Report issues on GitHub
- 🤝 Contribute improvements and features

## Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details.

### Contributors

Thanks to all our contributors!

## License

MIT © UUS.js Team

---

<p align="center">
  Made with ❤️ by the UUS.js Team
</p>
