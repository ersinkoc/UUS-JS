import { Uus, reactive } from '@uusjs/core';
import { SSRContext } from './types';

/**
 * Create an SSR-compatible Uus app
 */
export function createSSRApp(
  factory: (context?: SSRContext) => {
    state?: any;
    setup?: (app: Uus) => void;
    template?: string;
  }
): (context?: SSRContext) => Uus {
  return (context?: SSRContext) => {
    const { state, setup, template } = factory(context);

    const app = new Uus();

    // Set up reactive state
    if (state) {
      app.state = reactive(typeof state === 'function' ? state() : state);
    }

    // Run setup function
    if (setup) {
      setup(app);
    }

    // Store template if provided
    if (template) {
      (app as any).__template = template;
    }

    // Add SSR context
    if (context) {
      (app as any).__ssrContext = context;
    }

    // Track async operations
    (app as any).__pendingAsync = new Set();

    // Override async methods to track
    const trackAsync = (promise: Promise<any>) => {
      const pending = (app as any).__pendingAsync;
      pending.add(promise);

      promise.finally(() => {
        pending.delete(promise);
      });

      return promise;
    };

    // Wrap fetch for tracking
    if (typeof global !== 'undefined') {
      const originalFetch = global.fetch;
      global.fetch = function (...args: any[]) {
        return trackAsync(originalFetch.apply(this, args));
      };
    }

    return app;
  };
}

/**
 * Example SSR app factory
 */
export function createApp(context?: SSRContext) {
  return createSSRApp((ctx) => ({
    state: {
      // Initial state
      user: null,
      posts: [],
      loading: true,

      // Methods
      async fetchUser() {
        if (ctx?.data?.user) {
          this.user = ctx.data.user;
          return;
        }

        try {
          const response = await fetch('/api/user');
          this.user = await response.json();
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      },

      async fetchPosts() {
        if (ctx?.data?.posts) {
          this.posts = ctx.data.posts;
          this.loading = false;
          return;
        }

        try {
          const response = await fetch('/api/posts');
          this.posts = await response.json();
        } catch (error) {
          console.error('Failed to fetch posts:', error);
        } finally {
          this.loading = false;
        }
      },
    },

    setup(app) {
      // Fetch initial data
      app.state.fetchUser();
      app.state.fetchPosts();

      // Set page title
      if (ctx?.title) {
        if (typeof document !== 'undefined') {
          document.title = ctx.title;
        }
      }
    },
  }))(context);
}
