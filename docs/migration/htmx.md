# Migrating from htmx to Uus.js

While htmx and Uus.js serve different purposes, this guide helps you understand when to use each and how to migrate interactive features from htmx to Uus.js.

## Philosophy Differences

| Aspect   | htmx                                     | Uus.js                  |
| -------- | ---------------------------------------- | ----------------------- |
| Approach | Server-driven, HTML over the wire        | Client-side reactivity  |
| State    | Server manages state                     | Client manages state    |
| Use Case | Multi-page apps, progressive enhancement | SPAs, rich interactions |
| Size     | ~14KB                                    | ~3KB core               |
| Learning | HTML attributes                          | HTML + minimal JS       |

## When to Use Each

### Use htmx when:

- Server renders all HTML
- SEO is critical
- Minimal client-side state
- Team prefers server-side logic

### Use Uus.js when:

- Rich client interactions needed
- Complex state management
- Real-time features
- Offline capability required

### Use Both when:

- htmx for page navigation
- Uus.js for interactive components
- Gradual migration strategy

## Common Pattern Migrations

### 1. Dynamic Content Updates

**htmx:**

```html
<button hx-get="/api/quote" hx-target="#quote" hx-swap="innerHTML">
  Get Quote
</button>
<div id="quote">Quote will appear here</div>
```

**Uus.js:**

```html
<div uus-state="{ quote: '', loading: false }">
  <button
    @click="
    loading = true;
    fetch('/api/quote')
      .then(r => r.json())
      .then(data => {
        quote = data.quote;
        loading = false;
      })
  "
  >
    Get Quote
  </button>
  <div uus-show="loading">Loading...</div>
  <div uus-text="quote"></div>
</div>
```

### 2. Form Submission

**htmx:**

```html
<form hx-post="/api/contact" hx-target="#result" hx-indicator="#spinner">
  <input name="email" type="email" required />
  <input name="message" required />
  <button type="submit">Send</button>
  <span id="spinner" class="htmx-indicator">Sending...</span>
</form>
<div id="result"></div>
```

**Uus.js:**

```html
<div
  uus-state="{ 
  form: { email: '', message: '' },
  loading: false,
  result: null,
  error: null
}"
>
  <form
    @submit.prevent="
    loading = true;
    error = null;
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    .then(r => r.json())
    .then(data => {
      result = data;
      loading = false;
      form = { email: '', message: '' };
    })
    .catch(err => {
      error = err.message;
      loading = false;
    })
  "
  >
    <input uus-model="form.email" type="email" required />
    <input uus-model="form.message" required />
    <button type="submit" :disabled="loading">Send</button>
    <span uus-show="loading">Sending...</span>
  </form>

  <div uus-show="result" uus-text="result.message"></div>
  <div uus-show="error" class="error" uus-text="error"></div>
</div>
```

### 3. Infinite Scroll

**htmx:**

```html
<div hx-get="/api/posts?page=1" hx-trigger="revealed" hx-swap="afterend">
  Loading more posts...
</div>
```

**Uus.js:**

```html
<div
  uus-state="{ 
  posts: [],
  page: 1,
  loading: false,
  hasMore: true
}"
  uus-component="{
  onMount() {
    this.loadPosts();
    
    // Intersection observer for infinite scroll
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loading && this.hasMore) {
        this.loadPosts();
      }
    });
    
    observer.observe(this.$refs.loader);
  },
  
  async loadPosts() {
    this.loading = true;
    const response = await fetch(`/api/posts?page=${this.page}`);
    const data = await response.json();
    
    this.posts.push(...data.posts);
    this.hasMore = data.hasMore;
    this.page++;
    this.loading = false;
  }
}"
>
  <div uus-for="post in posts" class="post">
    <h3 uus-text="post.title"></h3>
    <p uus-text="post.content"></p>
  </div>

  <div ref="loader" uus-show="hasMore">
    <span uus-show="loading">Loading more posts...</span>
  </div>
</div>
```

### 4. Live Search

**htmx:**

```html
<input
  type="search"
  name="search"
  hx-get="/api/search"
  hx-trigger="keyup changed delay:500ms"
  hx-target="#results"
/>

<div id="results"></div>
```

**Uus.js:**

```html
<div
  uus-state="{ 
  query: '',
  results: [],
  loading: false,
  debounceTimer: null
}"
>
  <input
    type="search"
    uus-model="query"
    @input="
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (query) {
          loading = true;
          fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(r => r.json())
            .then(data => {
              results = data;
              loading = false;
            });
        } else {
          results = [];
        }
      }, 500)
    "
  />

  <div uus-show="loading">Searching...</div>

  <div uus-show="results.length > 0">
    <div uus-for="result in results" class="result">
      <h4 uus-text="result.title"></h4>
      <p uus-text="result.description"></p>
    </div>
  </div>
</div>
```

### 5. Polling Updates

**htmx:**

```html
<div hx-get="/api/notifications" hx-trigger="every 5s">
  <!-- Notifications appear here -->
</div>
```

**Uus.js:**

```html
<div
  uus-state="{ 
  notifications: [],
  unreadCount: 0
}"
  uus-component="{
  onMount() {
    this.loadNotifications();
    
    // Poll every 5 seconds
    this.interval = setInterval(() => {
      this.loadNotifications();
    }, 5000);
  },
  
  onUnmount() {
    clearInterval(this.interval);
  },
  
  async loadNotifications() {
    const response = await fetch('/api/notifications');
    const data = await response.json();
    this.notifications = data.notifications;
    this.unreadCount = data.unreadCount;
  }
}"
>
  <div class="notification-badge" uus-show="unreadCount > 0">
    <span uus-text="unreadCount"></span>
  </div>

  <div uus-for="notification in notifications" class="notification">
    <span uus-text="notification.message"></span>
  </div>
</div>
```

## Advanced Patterns

### Hybrid Approach

Use htmx for navigation, Uus.js for components:

```html
<!-- htmx handles page navigation -->
<nav>
  <a href="/home" hx-get="/home" hx-target="#main" hx-push-url="true">Home</a>
  <a href="/about" hx-get="/about" hx-target="#main" hx-push-url="true"
    >About</a
  >
</nav>

<main id="main">
  <!-- Uus.js components within pages -->
  <div id="interactive-widget" uus-state="{ count: 0 }">
    <button @click="count++">Count: <span uus-text="count"></span></button>
  </div>
</main>

<script>
  // Initialize Uus.js after htmx swaps
  document.body.addEventListener('htmx:afterSwap', (event) => {
    const widgets = event.detail.target.querySelectorAll('[uus-state]');
    widgets.forEach((widget) => {
      new Uus().mount(widget);
    });
  });
</script>
```

### Progressive Enhancement

Start with htmx, enhance with Uus.js:

```html
<!-- Works without JS via htmx -->
<form hx-post="/api/todo" hx-target="#todos" hx-swap="beforeend">
  <input name="text" required />
  <button>Add Todo</button>
</form>

<ul id="todos">
  <!-- Server-rendered todos -->
</ul>

<script>
  // Enhance with client-side features if JS available
  if (window.Uus) {
    const app = new Uus();
    app.state = reactive({
      todos: Array.from(document.querySelectorAll('#todos li')).map((li) => ({
        id: li.dataset.id,
        text: li.textContent,
        done: li.classList.contains('done'),
      })),
    });

    // Take over form handling
    document.querySelector('form').setAttribute(
      'uus-on:submit.prevent',
      `
      todos.push({
        id: Date.now(),
        text: $event.target.text.value,
        done: false
      });
      $event.target.reset();
    `
    );

    app.mount();
  }
</script>
```

## API Compatibility Layer

Create a bridge between htmx-style responses and Uus.js:

```javascript
// htmx-compat.js
export function htmxFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'HX-Request': 'true',
    },
  }).then((response) => {
    // Handle htmx-style responses
    if (response.headers.get('HX-Redirect')) {
      window.location.href = response.headers.get('HX-Redirect');
      return;
    }

    if (response.headers.get('HX-Refresh')) {
      window.location.reload();
      return;
    }

    return response;
  });
}

// Use in Uus.js component
const state = reactive({
  async loadContent() {
    const response = await htmxFetch('/api/content');
    const html = await response.text();
    // Process HTML response
  },
});
```

## Migration Strategy

### 1. Gradual Migration

Keep htmx for primary navigation, migrate interactive components:

```html
<!-- Keep htmx for main navigation -->
<div hx-boost="true">
  <nav>
    <a href="/dashboard">Dashboard</a>
    <a href="/settings">Settings</a>
  </nav>
</div>

<!-- Migrate interactive components to Uus.js -->
<div id="user-menu" uus-state="{ open: false, user: null }">
  <!-- Interactive menu with Uus.js -->
</div>
```

### 2. Component Islands

Use Uus.js for specific interactive islands:

```javascript
// Initialize Uus.js components after page load
document.addEventListener('DOMContentLoaded', () => {
  // Find all Uus.js islands
  document.querySelectorAll('[data-uus-island]').forEach((island) => {
    const app = new Uus();

    // Load initial data from data attributes
    const initialData = island.dataset.uusData
      ? JSON.parse(island.dataset.uusData)
      : {};

    app.state = reactive(initialData);
    app.mount(island);
  });
});
```

### 3. Full Migration

For complete migration to SPA:

```javascript
import { createRouter } from '@uusjs/router';
import { createAnimate } from '@uusjs/animate';

// Replace htmx navigation with router
const router = createRouter({
  routes: [
    { path: '/', component: 'home' },
    { path: '/about', component: 'about' },
    { path: '/contact', component: 'contact' },
  ],
});

const app = new Uus();
app.use(router);
app.use(createAnimate());

// Global state management
app.state = reactive({
  user: null,
  notifications: [],

  async loadUser() {
    const response = await fetch('/api/user');
    this.user = await response.json();
  },
});

app.mount();
```

## Performance Considerations

### htmx Advantages:

- No JS parsing/execution for basic features
- Server-side rendering for SEO
- Smaller initial payload
- Works without JavaScript

### Uus.js Advantages:

- No network requests for UI updates
- Instant interactions
- Offline capability
- Rich animations and transitions

## Best Practices

1. **Choose the Right Tool**
   - htmx: Server-rendered pages, simple interactions
   - Uus.js: Complex state, rich interactions
   - Both: Hybrid approach for best of both worlds

2. **API Design**
   - Keep REST endpoints for htmx compatibility
   - Add JSON responses for Uus.js
   - Use content negotiation

3. **Progressive Enhancement**
   - Start with htmx for baseline functionality
   - Enhance with Uus.js for richer experience
   - Ensure graceful degradation

4. **SEO Considerations**
   - Use htmx for content pages
   - Use Uus.js for app-like features
   - Consider SSR for Uus.js if needed

## Conclusion

htmx and Uus.js serve different needs:

- htmx excels at server-driven interactions
- Uus.js excels at client-side reactivity

Choose based on your requirements, or use both together for a powerful combination!

## Resources

- [htmx Documentation](https://htmx.org)
- [Uus.js Quick Start](../quick-start.md)
- [Examples](../examples/)
- [Community Discord](https://discord.gg/uusjs)
