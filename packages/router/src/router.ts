import type { UusPlugin } from '@uusjs/core';
import type {
  Route,
  RouteMatch,
  RouterOptions,
  RouteGuard,
  Router as RouterInterface,
} from './types';
import { RouteMatcher } from './matcher';
import { History, HashHistory, HTML5History } from './history';

export class Router implements RouterInterface {
  private matcher: RouteMatcher;
  private history: History;
  private guards: RouteGuard[] = [];
  private afterHooks: ((to: RouteMatch, from: RouteMatch | null) => void)[] =
    [];
  public currentRoute: RouteMatch | null = null;
  private scrollBehavior?: RouterOptions['scrollBehavior'];

  constructor(options: RouterOptions) {
    this.matcher = new RouteMatcher(options.routes);
    this.history =
      options.mode === 'history'
        ? new HTML5History(options.base)
        : new HashHistory();
    this.scrollBehavior = options.scrollBehavior;

    // Initialize current route
    this.currentRoute = this.resolve(this.history.current);

    // Listen for history changes
    this.history.listen((path) => {
      this.navigate(path);
    });
  }

  push(path: string): void {
    this.history.push(path);
  }

  replace(path: string): void {
    this.history.replace(path);
  }

  go(n: number): void {
    this.history.go(n);
  }

  back(): void {
    this.go(-1);
  }

  forward(): void {
    this.go(1);
  }

  beforeEach(guard: RouteGuard): void {
    this.guards.push(guard);
  }

  afterEach(hook: (to: RouteMatch, from: RouteMatch | null) => void): void {
    this.afterHooks.push(hook);
  }

  resolve(path: string): RouteMatch | null {
    return this.matcher.match(path);
  }

  private navigate(path: string): void {
    const to = this.resolve(path);
    if (!to) {
      console.warn(`No route found for path: ${path}`);
      return;
    }

    const from = this.currentRoute;

    // Run navigation guards
    this.runGuards(to, from, (shouldContinue) => {
      if (shouldContinue === false) {
        // Navigation cancelled
        if (from) {
          this.history.replace(from.path);
        }
        return;
      }

      if (typeof shouldContinue === 'string') {
        // Redirect
        this.push(shouldContinue);
        return;
      }

      // Update current route
      this.currentRoute = to;

      // Run after hooks
      this.afterHooks.forEach((hook) => hook(to, from));

      // Handle scroll behavior
      if (this.scrollBehavior) {
        const position = this.scrollBehavior(to, from);
        if (position) {
          window.scrollTo(position.x, position.y);
        }
      }
    });
  }

  private runGuards(
    to: RouteMatch,
    from: RouteMatch | null,
    callback: (result?: string | false) => void
  ): void {
    const guards = [...this.guards];
    if (to.route.beforeEnter) {
      guards.push(to.route.beforeEnter);
    }

    let i = 0;
    const next = (result?: string | false) => {
      if (result === false || typeof result === 'string') {
        callback(result);
        return;
      }

      if (i >= guards.length) {
        callback();
        return;
      }

      const guard = guards[i++];
      if (guard) {
        guard(to, from, next);
      }
    };

    next();
  }

  install(uus: any): void {
    // Make router available in state
    uus.state.$router = this;

    // Register router directives
    uus.registerDirective(linkDirective);
    uus.registerDirective(routeDirective);
    uus.registerDirective(routerDirective);
  }
}

// Router directives
const routerDirective = {
  name: 'router',
  init(el: HTMLElement, binding: any, uus: any) {
    const router = uus.state.$router as Router;
    if (!router) {
      console.error('Router not installed');
      return;
    }

    // Mark as router outlet
    el.setAttribute('data-router-outlet', 'true');

    // Initial render
    renderRoute(el, router.currentRoute, uus);

    // Listen for route changes
    router.afterEach((to) => {
      renderRoute(el, to, uus);
    });
  },
};

const routeDirective = {
  name: 'route',
  init(el: HTMLElement, binding: any, uus: any) {
    const router = uus.state.$router as Router;
    if (!router) return;

    const path = binding.expression;
    el.style.display = 'none';
    el.setAttribute('data-route-path', path);
  },
};

const linkDirective = {
  name: 'link',
  bind(el: HTMLElement, binding: any, uus: any) {
    const router = uus.state.$router as Router;
    if (!router) return;

    const path = binding.expression?.replace(/['"]/g, '') || '';

    // Add click handler
    const handleClick = (e: Event) => {
      e.preventDefault();
      router.push(path);
    };

    el.addEventListener('click', handleClick);

    // Update active class
    const updateActive = () => {
      const isActive = router.currentRoute?.path === path;
      el.classList.toggle('router-link-active', isActive);
    };

    updateActive();
    router.afterEach(updateActive);

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(() => {
      el.removeEventListener('click', handleClick);
    });
    uus.cleanups.set(el, cleanups);
  },
};

function renderRoute(
  outlet: HTMLElement,
  route: RouteMatch | null,
  uus: any
): void {
  if (!route) {
    outlet.innerHTML = '';
    return;
  }

  // Find matching route element
  const routeElements = outlet.querySelectorAll('[data-route-path]');
  routeElements.forEach((el) => {
    const routePath = el.getAttribute('data-route-path');
    let shouldShow = false;

    if (routePath === route.path) {
      // Exact match
      shouldShow = true;
    } else if (routePath && routePath.includes(':')) {
      // Pattern match for parameterized routes
      const pattern = '^' + routePath.replace(/:\w+/g, '[^/]+') + '$';
      shouldShow = new RegExp(pattern).test(route.path);
    }

    (el as HTMLElement).style.display = shouldShow ? '' : 'none';

    // Update route params in state using reactive property assignment
    if (shouldShow && route.params) {
      // Instead of Object.assign which bypasses reactivity, assign each param individually
      for (const [key, value] of Object.entries(route.params)) {
        uus.state[key] = value;
      }
    }
  });
}

// Create router plugin
export function createRouter(options: RouterOptions): UusPlugin {
  const router = new Router(options);

  return {
    name: 'uus-router',
    install(uus: any) {
      router.install(uus);
    },
  };
}
