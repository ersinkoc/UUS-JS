# @uusjs/router

Official router for Uus.js applications.

## Installation

```bash
npm install @uusjs/router
```

## Usage

```javascript
import { Uus } from '@uusjs/core';
import { createRouter } from '@uusjs/router';

const router = createRouter({
  mode: 'hash', // or 'history'
  routes: [
    { path: '/', component: 'home' },
    { path: '/about', component: 'about' },
    { path: '/user/:id', component: 'user' },
  ],
});

const app = new Uus();
app.use(router);
app.mount('#app');
```

### HTML Usage

```html
<div id="app">
  <!-- Router outlet -->
  <div uus-router>
    <!-- Define routes -->
    <div uus-route="/">
      <h1>Home Page</h1>
    </div>

    <div uus-route="/about">
      <h1>About Page</h1>
    </div>

    <div uus-route="/user/:id" uus-params="userId">
      <h1>User <span uus-text="userId"></span></h1>
    </div>
  </div>

  <!-- Navigation links -->
  <nav>
    <a uus-link="/">Home</a>
    <a uus-link="/about">About</a>
    <a uus-link="/user/123">User 123</a>
  </nav>
</div>
```

## Features

- Hash and History mode support
- Dynamic route matching
- Route parameters
- Navigation guards
- Scroll behavior control
- Nested routes
- Active link styling

## API Reference

### Router Options

```typescript
interface RouterOptions {
  mode?: 'hash' | 'history';
  base?: string;
  routes: Route[];
  scrollBehavior?: ScrollBehavior;
}
```

### Route Configuration

```typescript
interface Route {
  path: string;
  component?: any;
  redirect?: string;
  meta?: Record<string, any>;
  beforeEnter?: RouteGuard;
  children?: Route[];
}
```

### Navigation Guards

```typescript
router.beforeEach((to, from, next) => {
  // Check authentication
  if (to.meta?.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});
```

### Programmatic Navigation

```javascript
// Push a new entry
router.push('/about');

// Replace current entry
router.replace('/about');

// Go back/forward
router.back();
router.forward();
router.go(-2);
```

## License

MIT
