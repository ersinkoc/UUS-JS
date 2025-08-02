# Introduction to Uus.js

Uus.js (pronounced "ooze") is a fresh, lightweight reactive HTML framework designed for the modern web. It combines the simplicity of Alpine.js with the power of reactive state management, delivering a delightful developer experience in a tiny package.

## Why Uus.js?

### The Problem

Modern web frameworks have become increasingly complex. While they offer powerful features, they often come with:

- Large bundle sizes (50KB+ for basic functionality)
- Steep learning curves
- Complex build processes
- Verbose syntax
- Performance overhead

### The Solution

Uus.js takes a different approach:

```html
<!-- This is all you need -->
<div uus-state="{ count: 0 }">
  <button uus-on:click="count++">
    Clicked <span uus-text="count">0</span> times
  </button>
</div>

<script src="https://unpkg.com/@uusjs/core"></script>
<script>
  new Uus().mount();
</script>
```

## Key Features

### 🎯 Tiny Core

- **< 3KB gzipped** core package
- No dependencies
- Modular architecture - use only what you need

### ⚡ Truly Reactive

- Proxy-based reactivity system
- Automatic dependency tracking
- Efficient DOM updates
- Computed values and effects

### 🎨 Declarative HTML

- Express behavior directly in HTML
- Familiar directive syntax
- No JSX or templates required
- Progressive enhancement friendly

### 📦 Batteries Included

- **Router**: Client-side routing
- **Animate**: Smooth animations and transitions
- **Forms**: Form validation and handling
- **More packages coming soon!**

### 🚀 Zero Config

- No build step required
- Works via CDN
- TypeScript support out of the box
- Modern browser support

## Core Concepts

### 1. Reactive State

```html
<div uus-state="{ message: 'Hello World' }">
  <h1 uus-text="message"></h1>
</div>
```

### 2. Event Handling

```html
<button uus-on:click="handleClick">Click me</button>
<input uus-on:keyup.enter="submit" />
```

### 3. Conditional Rendering

```html
<div uus-show="isVisible">Visible when true</div>
<div uus-if="isLoaded">Removed from DOM when false</div>
```

### 4. List Rendering

```html
<ul>
  <li uus-for="item in items" uus-text="item.name"></li>
</ul>
```

### 5. Two-way Binding

```html
<input uus-model="username" />
<p>Hello, <span uus-text="username"></span>!</p>
```

## Comparison with Other Frameworks

### vs Alpine.js

- **Uus.js**: True reactivity with automatic tracking
- **Alpine.js**: Manual reactivity with x-data

### vs htmx

- **Uus.js**: Client-side reactivity and state management
- **htmx**: Server-side HTML fragments

### vs Vue/React

- **Uus.js**: HTML-first, no build step required
- **Vue/React**: Component-based, requires tooling

## When to Use Uus.js

Uus.js is perfect for:

- 🌐 **Enhancing existing websites** - Add interactivity without rewrites
- 📱 **Building SPAs** - Full router and state management support
- 🎯 **Prototyping** - Get ideas working quickly
- 📚 **Learning** - Understand reactive programming concepts
- ⚡ **Performance-critical apps** - Minimal overhead

## When Not to Use Uus.js

Consider alternatives for:

- 📱 **React Native apps** - Use React Native
- 🎮 **Complex games** - Use specialized game frameworks
- 📊 **Heavy data visualization** - Consider D3.js directly
- 🏢 **Large enterprise apps** - May need more ecosystem support

## Browser Support

Uus.js supports all modern browsers:

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

For older browsers, use the polyfill bundle.

## Philosophy

Uus.js believes in:

1. **Simplicity First** - Easy things should be easy
2. **Progressive Enhancement** - Start simple, add as needed
3. **Performance Matters** - Every byte counts
4. **Developer Joy** - Building should be fun
5. **Web Standards** - Embrace the platform

## What's Next?

Ready to dive in? Check out:

- [Quick Start](./quick-start.md) - Get running in 5 minutes
- [Installation](./installation.md) - Installation options
- [Tutorial](./tutorial.md) - Build your first app
- [Core Concepts](./core/reactivity.md) - Deep dive into reactivity

Join our community:

- [Discord](https://discord.gg/uusjs) - Chat with us
- [GitHub](https://github.com/uus-js/uus) - Star the project
- [Twitter](https://twitter.com/uusjs) - Follow for updates

Welcome to Uus.js! Let's build something amazing together. 🚀
