# Installation

Uus.js offers multiple installation methods to suit your project needs. Choose the one that works best for you.

## CDN (Easiest)

The quickest way to get started - no build tools required:

```html
<!-- Core (required) -->
<script src="https://unpkg.com/@uusjs/core@latest"></script>

<!-- Optional packages -->
<script src="https://unpkg.com/@uusjs/router@latest"></script>
<script src="https://unpkg.com/@uusjs/animate@latest"></script>
<script src="https://unpkg.com/@uusjs/forms@latest"></script>

<!-- Initialize -->
<script>
  const app = new Uus();
  app.mount(); // Mounts to document.body by default
</script>
```

### Alternative CDNs

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@uusjs/core@latest"></script>

<!-- cdnjs (when available) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/uusjs/0.0.1/uus.min.js"></script>

<!-- Skypack -->
<script type="module">
  import { Uus } from 'https://cdn.skypack.dev/@uusjs/core';
</script>
```

### Version Pinning

For production, always pin to a specific version:

```html
<!-- Specific version -->
<script src="https://unpkg.com/@uusjs/core@0.0.1"></script>

<!-- Minor version range -->
<script src="https://unpkg.com/@uusjs/core@^0.0.1"></script>
```

## NPM/Yarn/PNPM

For modern JavaScript projects:

```bash
# npm
npm install @uusjs/core

# yarn
yarn add @uusjs/core

# pnpm
pnpm add @uusjs/core
```

### Installing Additional Packages

```bash
# All official packages
npm install @uusjs/core @uusjs/router @uusjs/animate @uusjs/forms

# Or individually as needed
npm install @uusjs/router
npm install @uusjs/animate
npm install @uusjs/forms
```

### ES Modules

```javascript
import { Uus, reactive, ref, computed } from '@uusjs/core';
import { createRouter } from '@uusjs/router';
import { createAnimate } from '@uusjs/animate';
import { createForm } from '@uusjs/forms';

// Create app
const app = new Uus();

// Add plugins
app.use(createRouter({
  routes: [
    { path: '/', component: 'home' },
    { path: '/about', component: 'about' }
  ]
}));

app.use(createAnimate());

// Mount
app.mount('#app');
```

### CommonJS

```javascript
const { Uus, reactive } = require('@uusjs/core');
const { createRouter } = require('@uusjs/router');
```

## Build Tool Integration

### Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Uus.js works out of the box with Vite
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

```javascript
// src/main.js
import { Uus } from '@uusjs/core';

const app = new Uus();
app.state = reactive({
  message: 'Hello from Vite!'
});
app.mount('#app');
```

### Webpack

```javascript
// webpack.config.js
module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
```

### Parcel

Zero config - just works:

```bash
parcel index.html
```

### Rollup

```javascript
// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife'
  },
  plugins: [nodeResolve()]
};
```

## TypeScript

Uus.js includes TypeScript definitions out of the box:

```typescript
import { Uus, Ref, Reactive, computed } from '@uusjs/core';

interface AppState {
  count: number;
  message: string;
}

const app = new Uus();

// Type-safe state
app.state = reactive<AppState>({
  count: 0,
  message: 'Hello TypeScript!'
});

// Type-safe refs
const count: Ref<number> = ref(0);
const doubled = computed(() => count.value * 2);
```

### TSConfig

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true
  }
}
```

## Framework Integration

### With Existing Apps

Uus.js can be added to existing applications:

```html
<!-- In your existing app -->
<div id="uus-widget" uus-state="{ count: 0 }">
  <button uus-on:click="count++">
    Count: <span uus-text="count">0</span>
  </button>
</div>

<script>
  // Mount only to specific element
  new Uus().mount('#uus-widget');
</script>
```

### Multiple Instances

```javascript
// Multiple independent Uus instances
const app1 = new Uus();
app1.mount('#widget1');

const app2 = new Uus();
app2.mount('#widget2');
```

### With jQuery

```javascript
$(document).ready(function() {
  // Initialize Uus after jQuery
  const app = new Uus();
  app.mount();
  
  // They can work together
  $('#jquery-button').click(() => {
    app.state.message = 'Clicked from jQuery!';
  });
});
```

## Production Builds

### Minified Versions

```html
<!-- Minified for production -->
<script src="https://unpkg.com/@uusjs/core@latest/dist/uus.min.js"></script>
```

### Bundle Optimization

```javascript
// Only import what you need
import { reactive, ref, computed } from '@uusjs/core';

// Tree-shaking will remove unused code
```

### Environment Variables

```javascript
if (process.env.NODE_ENV === 'production') {
  // Production optimizations
}
```

## Browser Support & Polyfills

### Modern Browsers (Default)
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

### Legacy Support

For older browsers, include polyfills:

```html
<!-- Polyfills for older browsers -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Proxy,WeakMap,Promise"></script>

<!-- Then Uus.js -->
<script src="https://unpkg.com/@uusjs/core@latest"></script>
```

## Download for Offline Use

Download the files for offline development:

```bash
# Download with curl
curl -O https://unpkg.com/@uusjs/core@latest/dist/uus.min.js
curl -O https://unpkg.com/@uusjs/router@latest/dist/router.min.js
curl -O https://unpkg.com/@uusjs/animate@latest/dist/animate.min.js
curl -O https://unpkg.com/@uusjs/forms@latest/dist/forms.min.js

# Or with wget
wget https://unpkg.com/@uusjs/core@latest/dist/uus.min.js
```

## Development Setup

For contributing to Uus.js:

```bash
# Clone the repository
git clone https://github.com/uus-js/uus.git
cd uus

# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build
```

## Next Steps

Now that you have Uus.js installed:

1. Follow the [Quick Start](./quick-start.md) guide
2. Learn about [Reactivity](./core/reactivity.md)
3. Explore [Directives](./core/directives.md)
4. Build your first app with the [Tutorial](./tutorial.md)

## Troubleshooting

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Install types
npm install --save-dev @types/node
```

### Build Errors
```javascript
// Ensure correct import
import { Uus } from '@uusjs/core'; // ✅
import Uus from '@uusjs/core'; // ❌
```

Need help? Join our [Discord](https://discord.gg/uusjs) community!