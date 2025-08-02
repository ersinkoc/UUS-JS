import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router, createRouter } from '../src/router';
import type { Route, RouterOptions, RouteGuard } from '../src/types';

// Mock the history module
vi.mock('../src/history', () => {
  class MockHistory {
    current = '/';
    listeners = new Set<(path: string) => void>();
    
    push(path: string) {
      this.current = path;
      this.listeners.forEach(listener => listener(path));
    }
    
    replace(path: string) {
      this.current = path;
      this.listeners.forEach(listener => listener(path));
    }
    
    go(n: number) {
      // Mock implementation
    }
    
    listen(callback: (path: string) => void) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
  }
  
  return {
    HashHistory: MockHistory,
    HTML5History: MockHistory
  };
});

describe('Router', () => {
  let router: Router;
  let routes: Route[];
  let options: RouterOptions;

  beforeEach(() => {
    routes = [
      { path: '/', component: 'Home' },
      { path: '/about', component: 'About' },
      { path: '/user/:id', component: 'User' },
      { 
        path: '/admin', 
        component: 'Admin',
        beforeEnter: vi.fn((to, from, next) => next())
      },
      { path: '/login', component: 'Login' },
      { path: '/protected', component: 'Protected' }
    ];
    
    options = {
      mode: 'hash',
      routes
    };
    
    router = new Router(options);
  });

  describe('Constructor', () => {
    it('should initialize with hash mode by default', () => {
      const router = new Router({ routes });
      expect(router.currentRoute).toBeTruthy();
      expect(router.currentRoute?.path).toBe('/');
    });

    it('should initialize with history mode when specified', () => {
      const router = new Router({ mode: 'history', routes });
      expect(router.currentRoute).toBeTruthy();
    });

    it('should initialize with base path', () => {
      const router = new Router({ mode: 'history', base: '/app', routes });
      expect(router).toBeTruthy();
    });

    it('should resolve initial route', () => {
      expect(router.currentRoute?.route.component).toBe('Home');
    });

    it('should accept scrollBehavior option', () => {
      const scrollBehavior = vi.fn();
      const router = new Router({ routes, scrollBehavior });
      expect(router).toBeTruthy();
    });
  });

  describe('Navigation methods', () => {
    it('should push new route', () => {
      router.push('/about');
      expect(router.currentRoute?.path).toBe('/about');
      expect(router.currentRoute?.route.component).toBe('About');
    });

    it('should replace current route', () => {
      router.replace('/about');
      expect(router.currentRoute?.path).toBe('/about');
    });

    it('should go back', () => {
      const goSpy = vi.fn();
      // Mock the history.go method on the router's history instance
      (router as any).history.go = goSpy;
      router.back();
      expect(goSpy).toHaveBeenCalledWith(-1);
    });

    it('should go forward', () => {
      const goSpy = vi.fn();
      // Mock the history.go method on the router's history instance
      (router as any).history.go = goSpy;
      router.forward();
      expect(goSpy).toHaveBeenCalledWith(1);
    });

    it('should go to specific position', () => {
      const goSpy = vi.fn();
      // Mock the history.go method on the router's history instance
      (router as any).history.go = goSpy;
      router.go(3);
      expect(goSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('Route resolution', () => {
    it('should resolve static routes', () => {
      const match = router.resolve('/about');
      expect(match).toBeTruthy();
      expect(match?.route.component).toBe('About');
    });

    it('should resolve parameterized routes', () => {
      const match = router.resolve('/user/123');
      expect(match).toBeTruthy();
      expect(match?.route.component).toBe('User');
      expect(match?.params).toEqual({ id: '123' });
    });

    it('should return null for non-existent routes', () => {
      const match = router.resolve('/non-existent');
      expect(match).toBeNull();
    });

    it('should warn when navigating to non-existent route', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      router.push('/non-existent');
      
      expect(warnSpy).toHaveBeenCalledWith('No route found for path: /non-existent');
      expect(router.currentRoute?.path).toBe('/'); // Should stay on current route
      
      warnSpy.mockRestore();
    });
  });

  describe('Navigation guards', () => {
    it('should run global beforeEach guards', () => {
      const guard = vi.fn((to, from, next) => next());
      router.beforeEach(guard);
      
      router.push('/about');
      
      expect(guard).toHaveBeenCalled();
      expect(guard).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/about' }),
        expect.objectContaining({ path: '/' }),
        expect.any(Function)
      );
    });

    it('should run multiple guards in order', () => {
      const order: number[] = [];
      const guard1 = vi.fn((to, from, next) => {
        order.push(1);
        next();
      });
      const guard2 = vi.fn((to, from, next) => {
        order.push(2);
        next();
      });
      
      router.beforeEach(guard1);
      router.beforeEach(guard2);
      
      router.push('/about');
      
      expect(order).toEqual([1, 2]);
    });

    it('should cancel navigation when guard calls next(false)', () => {
      const guard = vi.fn((to, from, next) => next(false));
      router.beforeEach(guard);
      
      // We need to prevent the infinite loop by mocking the history.replace
      const replaceSpy = vi.fn();
      (router as any).history.replace = replaceSpy;
      
      router.push('/about');
      
      expect(router.currentRoute?.path).toBe('/'); // Should stay on current route
      expect(replaceSpy).toHaveBeenCalledWith('/');
    });

    it('should redirect when guard calls next with path', () => {
      const guard = vi.fn((to, from, next) => {
        if (to.path === '/protected') {
          next('/login');
        } else {
          next();
        }
      });
      router.beforeEach(guard);
      
      router.push('/protected');
      
      expect(router.currentRoute?.path).toBe('/login');
    });

    it('should run route-specific beforeEnter guard', () => {
      const adminRoute = routes.find(r => r.path === '/admin');
      router.push('/admin');
      
      expect(adminRoute?.beforeEnter).toHaveBeenCalled();
    });

    it('should run route guard after global guards', () => {
      const order: string[] = [];
      const globalGuard = vi.fn((to, from, next) => {
        order.push('global');
        next();
      });
      
      const routeGuard = vi.fn((to, from, next) => {
        order.push('route');
        next();
      });
      
      routes.push({
        path: '/special',
        component: 'Special',
        beforeEnter: routeGuard
      });
      
      router = new Router({ routes });
      router.beforeEach(globalGuard);
      
      router.push('/special');
      
      expect(order).toEqual(['global', 'route']);
    });
  });

  describe('After hooks', () => {
    it('should run afterEach hooks', () => {
      const hook = vi.fn();
      router.afterEach(hook);
      
      router.push('/about');
      
      expect(hook).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/about' }),
        expect.objectContaining({ path: '/' })
      );
    });

    it('should run multiple after hooks', () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      
      router.afterEach(hook1);
      router.afterEach(hook2);
      
      router.push('/about');
      
      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
    });

    it('should not run after hooks when navigation is cancelled', () => {
      const guard = vi.fn((to, from, next) => next(false));
      const hook = vi.fn();
      
      // Prevent infinite loop by mocking history.replace
      const replaceSpy = vi.fn();
      (router as any).history.replace = replaceSpy;
      
      router.beforeEach(guard);
      router.afterEach(hook);
      
      router.push('/about');
      
      expect(hook).not.toHaveBeenCalled();
    });
  });

  describe('Scroll behavior', () => {
    it('should handle scroll behavior', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const scrollBehavior = vi.fn(() => ({ x: 0, y: 100 }));
      
      router = new Router({ routes, scrollBehavior });
      router.push('/about');
      
      expect(scrollBehavior).toHaveBeenCalled();
      expect(scrollToSpy).toHaveBeenCalledWith(0, 100);
      
      scrollToSpy.mockRestore();
    });

    it('should not scroll when scrollBehavior returns void', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const scrollBehavior = vi.fn(() => {});
      
      router = new Router({ routes, scrollBehavior });
      router.push('/about');
      
      expect(scrollBehavior).toHaveBeenCalled();
      expect(scrollToSpy).not.toHaveBeenCalled();
      
      scrollToSpy.mockRestore();
    });
  });

  describe('Plugin installation', () => {
    it('should install router on uus instance', () => {
      const uus = {
        state: {},
        registerDirective: vi.fn()
      };
      
      router.install(uus);
      
      expect(uus.state.$router).toBe(router);
      expect(uus.registerDirective).toHaveBeenCalledTimes(3); // router, route, link
    });

    it('should create router plugin', () => {
      const plugin = createRouter(options);
      
      expect(plugin.name).toBe('uus-router');
      expect(typeof plugin.install).toBe('function');
    });
  });
});

describe('Router directives', () => {
  let mockUus: any;
  let router: Router;

  beforeEach(() => {
    router = new Router({
      routes: [
        { path: '/', component: 'Home' },
        { path: '/about', component: 'About' },
        { path: '/user/:id', component: 'User' }
      ]
    });
    
    mockUus = {
      state: { $router: router },
      cleanups: new Map(),
      registerDirective: vi.fn()
    };
  });

  describe('link directive', () => {
    it('should handle click events', () => {
      const element = document.createElement('a');
      const binding = { expression: '"/about"', value: '/about' };
      
      // Get the link directive from router installation
      router.install(mockUus);
      const linkDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'link'
      )[0];
      
      linkDirective.bind(element, binding, mockUus);
      
      // Simulate click
      const event = new MouseEvent('click', { cancelable: true });
      element.dispatchEvent(event);
      
      expect(event.defaultPrevented).toBe(true);
      expect(router.currentRoute?.path).toBe('/about');
    });

    it('should add active class for current route', () => {
      const element = document.createElement('a');
      const binding = { expression: '"/"', value: '/' };
      
      router.install(mockUus);
      const linkDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'link'
      )[0];
      
      linkDirective.bind(element, binding, mockUus);
      
      expect(element.classList.contains('router-link-active')).toBe(true);
    });

    it('should update active class on route change', () => {
      const element = document.createElement('a');
      const binding = { expression: '"/about"', value: '/about' };
      
      router.install(mockUus);
      const linkDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'link'
      )[0];
      
      linkDirective.bind(element, binding, mockUus);
      
      expect(element.classList.contains('router-link-active')).toBe(false);
      
      router.push('/about');
      
      expect(element.classList.contains('router-link-active')).toBe(true);
    });

    it('should store cleanup function', () => {
      const element = document.createElement('a');
      const binding = { expression: '"/about"', value: '/about' };
      
      router.install(mockUus);
      const linkDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'link'
      )[0];
      
      linkDirective.bind(element, binding, mockUus);
      
      expect(mockUus.cleanups.has(element)).toBe(true);
      expect(mockUus.cleanups.get(element).size).toBeGreaterThan(0);
    });
    
    it('should handle link directive without router', () => {
      const element = document.createElement('a');
      const binding = { expression: '"/about"', value: '/about' };
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      
      router.install(mockUus);
      const linkDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'link'
      )[0];
      
      // Remove router from state
      mockUus.state.$router = null;
      
      linkDirective.bind(element, binding, mockUus);
      
      // Should not add event listener when router is not installed
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
    
    it('should handle link directive without expression', () => {
      const element = document.createElement('a');
      const binding = {}; // No expression
      
      router.install(mockUus);
      const linkDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'link'
      )[0];
      
      linkDirective.bind(element, binding, mockUus);
      
      // Simulate click
      const event = new MouseEvent('click', { cancelable: true });
      element.dispatchEvent(event);
      
      expect(event.defaultPrevented).toBe(true);
      // Should push empty string path
      expect(router.currentRoute?.path).toBe('/');
    });
  });

  describe('router directive', () => {
    it('should mark element as router outlet', () => {
      const element = document.createElement('div');
      const binding = {};
      
      router.install(mockUus);
      const routerDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'router'
      )[0];
      
      routerDirective.init(element, binding, mockUus);
      
      expect(element.getAttribute('data-router-outlet')).toBe('true');
    });

    it('should render initial route', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div data-route-path="/" style="display: none">Home</div>
        <div data-route-path="/about" style="display: none">About</div>
      `;
      const binding = {};
      
      router.install(mockUus);
      const routerDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'router'
      )[0];
      
      routerDirective.init(element, binding, mockUus);
      
      const homeEl = element.querySelector('[data-route-path="/"]') as HTMLElement;
      const aboutEl = element.querySelector('[data-route-path="/about"]') as HTMLElement;
      
      expect(homeEl.style.display).toBe('');
      expect(aboutEl.style.display).toBe('none');
    });

    it('should update on route change', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div data-route-path="/" style="display: none">Home</div>
        <div data-route-path="/about" style="display: none">About</div>
      `;
      const binding = {};
      
      // Capture the afterEach callbacks before initializing the directive
      const beforeLength = (router as any).afterHooks.length;
      
      router.install(mockUus);
      const routerDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'router'
      )[0];
      
      routerDirective.init(element, binding, mockUus);
      
      // The initial route is '/', so home should be visible
      const homeElBefore = element.querySelector('[data-route-path="/"]') as HTMLElement;
      const aboutElBefore = element.querySelector('[data-route-path="/about"]') as HTMLElement;
      expect(homeElBefore.style.display).toBe('');
      expect(aboutElBefore.style.display).toBe('none');
      
      // Get the callback that was registered by the routerDirective
      const afterEachCallbacks = (router as any).afterHooks;
      const newCallback = afterEachCallbacks[beforeLength]; // The callback added by the directive
      
      // Call the callback with a new route to trigger the update
      const aboutRoute: RouteMatch = { 
        path: '/about', 
        params: {}, 
        query: {}, 
        hash: '', 
        route: { path: '/about', component: 'About' } 
      };
      newCallback(aboutRoute);
      
      const homeEl = element.querySelector('[data-route-path="/"]') as HTMLElement;
      const aboutEl = element.querySelector('[data-route-path="/about"]') as HTMLElement;
      
      expect(homeEl.style.display).toBe('none');
      expect(aboutEl.style.display).toBe('');
    });

    it('should handle parameterized routes', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div data-route-path="/user/:id" style="display: none">User</div>
      `;
      const binding = {};
      
      router.install(mockUus);
      const routerDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'router'
      )[0];
      
      routerDirective.init(element, binding, mockUus);
      
      router.push('/user/123');
      
      const userEl = element.querySelector('[data-route-path="/user/:id"]') as HTMLElement;
      expect(userEl.style.display).toBe('');
      expect(mockUus.state.id).toBe('123');
    });

    it('should handle router not installed error', () => {
      const element = document.createElement('div');
      const binding = {};
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      router.install(mockUus);
      const routerDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'router'
      )[0];
      
      // Remove the router from state after getting the directive
      mockUus.state.$router = null;
      
      routerDirective.init(element, binding, mockUus);
      
      expect(errorSpy).toHaveBeenCalledWith('Router not installed');
      
      errorSpy.mockRestore();
    });
  });

  describe('route directive', () => {
    it('should hide element initially', () => {
      const element = document.createElement('div');
      const binding = { expression: '/', value: '/' };
      
      router.install(mockUus);
      const routeDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'route'
      )[0];
      
      routeDirective.init(element, binding, mockUus);
      
      expect(element.style.display).toBe('none');
      expect(element.getAttribute('data-route-path')).toBe('/');
    });
    
    it('should handle route directive without router', () => {
      const element = document.createElement('div');
      const binding = { expression: '/', value: '/' };
      const oldDisplay = element.style.display;
      
      router.install(mockUus);
      const routeDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'route'
      )[0];
      
      // Remove router from state
      mockUus.state.$router = null;
      
      routeDirective.init(element, binding, mockUus);
      
      // Element should not be modified
      expect(element.style.display).toBe(oldDisplay);
      expect(element.getAttribute('data-route-path')).toBeNull();
    });
  });
  
  describe('link directive cleanup', () => {
    it('should call cleanup function to remove event listener', () => {
      const element = document.createElement('a');
      const binding = { expression: '"/about"', value: '/about' };
      
      router.install(mockUus);
      const linkDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'link'
      )[0];
      
      linkDirective.bind(element, binding, mockUus);
      
      // Get the cleanup function
      const cleanups = mockUus.cleanups.get(element);
      expect(cleanups).toBeDefined();
      expect(cleanups.size).toBe(1);
      
      // Spy on removeEventListener
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');
      
      // Call the cleanup function
      const cleanupFn = Array.from(cleanups)[0];
      cleanupFn();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
  
  describe('renderRoute edge cases', () => {
    it('should handle null route', () => {
      const element = document.createElement('div');
      element.innerHTML = '<div data-route-path="/">Home</div>';
      const binding = {};
      
      router.install(mockUus);
      const routerDirective = mockUus.registerDirective.mock.calls.find(
        call => call[0].name === 'router'
      )[0];
      
      routerDirective.init(element, binding, mockUus);
      
      // Get the callback that was registered by the routerDirective
      const beforeLength = (router as any).afterHooks.length - 1;
      const callback = (router as any).afterHooks[beforeLength];
      
      // Call with null route
      const originalHTML = element.innerHTML;
      callback(null);
      
      // Should clear innerHTML when route is null
      expect(element.innerHTML).toBe('');
    });
  });
  
  describe('createRouter plugin', () => {
    it('should call install method when plugin is installed', () => {
      const routes = [{ path: '/', component: 'Home' }];
      const plugin = createRouter({ routes });
      const mockUus2 = {
        state: {},
        registerDirective: vi.fn()
      };
      
      plugin.install(mockUus2);
      
      expect(mockUus2.state.$router).toBeDefined();
      expect(mockUus2.registerDirective).toHaveBeenCalledTimes(3);
    });
  });
});