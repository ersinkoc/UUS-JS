# Router API Reference

The router package (`@uusjs/router`) provides client-side routing for single-page applications.

## Installation

```bash
npm install @uusjs/router
```

## Basic Usage

```javascript
import { createRouter } from '@uusjs/router';

const router = createRouter({
  mode: 'history', // or 'hash'
  routes: [
    { path: '/', component: 'home' },
    { path: '/about', component: 'about' },
    { path: '/user/:id', component: 'user' }
  ]
});

app.use(router);
```

## createRouter()

Creates a router instance.

```typescript
function createRouter(options: RouterOptions): Router

interface RouterOptions {
  mode?: 'history' | 'hash';           // Routing mode (default: 'history')
  base?: string;                       // Base URL path
  routes: RouteConfig[];               // Route definitions
  scrollBehavior?: ScrollBehavior;     // Scroll behavior function
}
```

## Route Configuration

### Basic Routes

```typescript
interface RouteConfig {
  path: string;           // Route path
  component: string;      // Component identifier
  name?: string;          // Named route
  redirect?: string;      // Redirect target
  beforeEnter?: NavigationGuard; // Route-specific guard
  meta?: Record<string, any>;    // Route metadata
  children?: RouteConfig[];      // Nested routes
}
```

**Examples:**

```javascript
const routes = [
  // Basic route
  { 
    path: '/', 
    component: 'home' 
  },
  
  // Named route
  { 
    path: '/about', 
    component: 'about',
    name: 'about-page'
  },
  
  // Route with params
  { 
    path: '/user/:id', 
    component: 'user' 
  },
  
  // Optional params
  { 
    path: '/post/:id?', 
    component: 'post' 
  },
  
  // Wildcard
  { 
    path: '/docs/*', 
    component: 'docs' 
  },
  
  // Redirect
  { 
    path: '/home', 
    redirect: '/' 
  },
  
  // Route with guard
  {
    path: '/admin',
    component: 'admin',
    beforeEnter: (to, from, next) => {
      if (isAuthenticated()) {
        next();
      } else {
        next('/login');
      }
    }
  },
  
  // Route with meta
  {
    path: '/settings',
    component: 'settings',
    meta: { 
      requiresAuth: true,
      title: 'Settings'
    }
  },
  
  // 404 route (must be last)
  { 
    path: '*', 
    component: 'not-found' 
  }
];
```

### Nested Routes

```javascript
const routes = [
  {
    path: '/user/:id',
    component: 'user',
    children: [
      {
        path: '',           // /user/:id
        component: 'user-profile'
      },
      {
        path: 'posts',      // /user/:id/posts
        component: 'user-posts'
      },
      {
        path: 'settings',   // /user/:id/settings
        component: 'user-settings'
      }
    ]
  }
];
```

## Router Instance

### Properties

#### currentRoute

The current route object.

```typescript
currentRoute: Ref<Route>

interface Route {
  path: string;         // Current path
  params: Record<string, string>;  // Route params
  query: Record<string, string>;   // Query params
  hash: string;         // URL hash
  fullPath: string;     // Full URL path
  matched: RouteConfig[];  // Matched route configs
  name?: string;        // Route name
  meta: Record<string, any>; // Combined meta fields
}
```

**Example:**
```javascript
// Access current route
console.log(router.currentRoute.value.path);
console.log(router.currentRoute.value.params.id);

// Reactive in templates
// <span uus-text="$route.path"></span>
```

### Methods

#### push()

Navigate to a new route.

```typescript
push(location: RouteLocation): Promise<void>

type RouteLocation = string | {
  path?: string;
  name?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  hash?: string;
}
```

**Examples:**
```javascript
// Navigate by path
router.push('/about');

// With query
router.push('/search?q=vue');

// Object syntax
router.push({
  path: '/user',
  query: { id: '123' }
});

// Named route
router.push({
  name: 'user',
  params: { id: '123' }
});

// With hash
router.push({
  path: '/docs',
  hash: '#installation'
});
```

#### replace()

Replace current route without adding history entry.

```typescript
replace(location: RouteLocation): Promise<void>
```

**Example:**
```javascript
// Replace current route
router.replace('/login');

// Useful for redirects after form submission
router.replace({
  name: 'dashboard',
  query: { welcome: 'true' }
});
```

#### go()

Navigate through history.

```typescript
go(delta: number): void
```

**Examples:**
```javascript
router.go(1);   // Forward one entry
router.go(-1);  // Back one entry
router.go(-3);  // Back three entries
```

#### back()

Go back one entry.

```typescript
back(): void
```

**Example:**
```javascript
router.back(); // Same as go(-1)
```

#### forward()

Go forward one entry.

```typescript
forward(): void
```

**Example:**
```javascript
router.forward(); // Same as go(1)
```

#### beforeEach()

Register global before navigation guard.

```typescript
beforeEach(guard: NavigationGuard): () => void

type NavigationGuard = (
  to: Route,
  from: Route,
  next: NavigationGuardNext
) => void

type NavigationGuardNext = (
  to?: RouteLocation | false | ((vm: any) => void)
) => void
```

**Examples:**
```javascript
// Authentication guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

// Progress bar
router.beforeEach((to, from, next) => {
  NProgress.start();
  next();
});

// Remove guard
const removeGuard = router.beforeEach(guard);
removeGuard(); // Unregister
```

#### afterEach()

Register global after navigation hook.

```typescript
afterEach(hook: (to: Route, from: Route) => void): () => void
```

**Examples:**
```javascript
// Complete progress bar
router.afterEach((to, from) => {
  NProgress.done();
});

// Update page title
router.afterEach((to) => {
  document.title = to.meta.title || 'My App';
});

// Analytics
router.afterEach((to) => {
  gtag('config', 'GA_ID', {
    page_path: to.fullPath
  });
});
```

#### isActive()

Check if a route is active.

```typescript
isActive(path: string, exact?: boolean): boolean
```

**Examples:**
```javascript
router.isActive('/about');        // true if on /about or /about/team
router.isActive('/about', true);  // true only if exactly on /about

// Use in templates for active links
// <a :class="{ active: $router.isActive('/about') }">About</a>
```

## Router Directives

### uus-router

Container for routed components.

```html
<div uus-router>
  <!-- Route component renders here -->
</div>

<!-- With transition -->
<div uus-router uus-animate="fadeIn">
  <!-- Animated route transitions -->
</div>
```

### uus-route

Defines route component templates.

```html
<!-- Define route components -->
<template uus-route="home">
  <div>
    <h1>Home Page</h1>
    <p>Welcome to our site!</p>
  </div>
</template>

<template uus-route="about">
  <div>
    <h1>About Us</h1>
    <p>Learn more about our company.</p>
  </div>
</template>

<template uus-route="user">
  <div>
    <h1>User Profile</h1>
    <p>User ID: <span uus-text="$route.params.id"></span></p>
  </div>
</template>
```

### uus-link

Router-aware link component.

```html
<!-- Basic link -->
<a uus-link="/about">About</a>

<!-- With active class -->
<a uus-link="/about" active-class="active">About</a>

<!-- Exact active matching -->
<a uus-link="/about" exact>About</a>

<!-- Replace instead of push -->
<a uus-link="/login" replace>Login</a>

<!-- With params binding -->
<a uus-link="'/user/' + userId">Profile</a>

<!-- Object syntax -->
<a uus-link="{ path: '/search', query: { q: searchQuery } }">
  Search
</a>
```

## Navigation Guards

### Global Guards

```javascript
// Before each route
router.beforeEach((to, from, next) => {
  console.log(`Navigating from ${from.path} to ${to.path}`);
  
  // Continue navigation
  next();
  
  // Cancel navigation
  next(false);
  
  // Redirect
  next('/login');
  
  // Pass error
  next(new Error('Not authorized'));
});

// After each route
router.afterEach((to, from) => {
  // Send analytics
  // Update UI state
  // Scroll to top
});
```

### Per-Route Guards

```javascript
const routes = [
  {
    path: '/admin',
    component: 'admin',
    beforeEnter: (to, from, next) => {
      // Check admin permissions
      if (hasAdminRole()) {
        next();
      } else {
        next('/403');
      }
    }
  }
];
```

### Guard Execution Order

1. `beforeEach` (global)
2. `beforeEnter` (route config)
3. Component `beforeRouteEnter`
4. Component `beforeRouteUpdate` (reused components)
5. `afterEach` (global)

## Scroll Behavior

Control scroll position on navigation:

```javascript
const router = createRouter({
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Saved position (browser back/forward)
    if (savedPosition) {
      return savedPosition;
    }
    
    // Hash anchors
    if (to.hash) {
      return { selector: to.hash };
    }
    
    // Scroll to top
    return { x: 0, y: 0 };
  }
});
```

**Advanced scroll behavior:**

```javascript
scrollBehavior(to, from, savedPosition) {
  // Smooth scrolling
  if (to.hash) {
    return {
      selector: to.hash,
      behavior: 'smooth'
    };
  }
  
  // Delayed scrolling
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ x: 0, y: 0 });
    }, 500);
  });
}
```

## Route Matching

### Dynamic Segments

```javascript
// Route: /user/:id
// Matches: /user/123
// params: { id: '123' }

// Route: /user/:id/post/:postId
// Matches: /user/123/post/456
// params: { id: '123', postId: '456' }
```

### Optional Parameters

```javascript
// Route: /post/:id?
// Matches: /post, /post/123
// params: {} or { id: '123' }
```

### Wildcards

```javascript
// Route: /docs/*
// Matches: /docs/guide/introduction
// params: { '*': 'guide/introduction' }
```

### Regex Constraints

```javascript
// Only match numbers
{ path: '/user/:id(\\d+)' }

// Multiple segments
{ path: '/files/*(.*)' }
```

## Programmatic Navigation

### In Components

```javascript
// Access router in state/methods
const state = reactive({
  navigateToUser(id) {
    router.push(`/user/${id}`);
  },
  
  goBack() {
    router.back();
  }
});
```

### Route Helpers

```javascript
// Current route reactive reference
const route = router.currentRoute;

// Watch route changes
watch(route, (newRoute, oldRoute) => {
  console.log('Route changed:', newRoute.path);
});

// Computed based on route
const isUserPage = computed(() => 
  route.value.path.startsWith('/user')
);
```

## Hash Mode vs History Mode

### History Mode (Default)

```javascript
const router = createRouter({
  mode: 'history',
  routes
});

// URLs: /about, /user/123
```

**Server configuration needed:**
```nginx
# Nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Hash Mode

```javascript
const router = createRouter({
  mode: 'hash',
  routes
});

// URLs: /#/about, /#/user/123
```

No server configuration needed.

## TypeScript Support

```typescript
import { Router, Route, RouteConfig } from '@uusjs/router';

// Typed route params
interface UserRouteParams {
  id: string;
}

// Access typed params
const route = router.currentRoute.value as Route & {
  params: UserRouteParams
};

console.log(route.params.id); // Type-safe

// Typed meta fields
interface RouteMeta {
  requiresAuth?: boolean;
  title?: string;
  roles?: string[];
}

const routes: RouteConfig[] = [
  {
    path: '/admin',
    component: 'admin',
    meta: {
      requiresAuth: true,
      roles: ['admin']
    } as RouteMeta
  }
];
```

## Advanced Patterns

### Lazy Loading

```javascript
const routes = [
  {
    path: '/about',
    component: 'about',
    beforeEnter: async (to, from, next) => {
      // Lazy load component
      await import('./components/about.js');
      next();
    }
  }
];
```

### Route Transitions

```html
<div uus-router uus-animate="slide">
  <!-- Routes transition with slide animation -->
</div>

<!-- Different transitions per route -->
<div 
  uus-router 
  :uus-animate="$route.meta.transition || 'fade'"
>
</div>
```

### Breadcrumbs

```javascript
const breadcrumbs = computed(() => {
  return router.currentRoute.value.matched.map(route => ({
    text: route.meta.title || route.name,
    path: route.path
  }));
});
```

### Route Loading State

```javascript
const state = reactive({
  loading: false
});

router.beforeEach((to, from, next) => {
  state.loading = true;
  next();
});

router.afterEach(() => {
  state.loading = false;
});
```

## Best Practices

1. **Use named routes** for maintainability
2. **Implement proper guards** for protected routes
3. **Handle 404s** with a catch-all route
4. **Use route meta** for page titles and auth
5. **Implement scroll behavior** for better UX
6. **Lazy load** large route components
7. **Type your routes** with TypeScript

## Next Steps

- Learn about [Animate API](./animate.md) for route transitions
- Explore [Forms API](./forms.md) for form handling
- See [SPA Guide](../guides/spa.md) for building SPAs