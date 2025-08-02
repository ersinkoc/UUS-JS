import { describe, it, expect } from 'vitest';
import { createRouter, Router } from '../src/index';
import type {
  Route,
  RouteMatch,
  RouterOptions,
  RouteGuard,
  ScrollBehavior,
} from '../src/index';

describe('index exports', () => {
  it('should export createRouter function', () => {
    expect(typeof createRouter).toBe('function');
  });

  it('should export Router class', () => {
    expect(typeof Router).toBe('function');
  });

  it('should create router instance', () => {
    const routes: Route[] = [{ path: '/', component: 'Home' }];
    const plugin = createRouter({ routes });
    expect(plugin.name).toBe('uus-router');
  });

  it('should create Router instance', () => {
    const routes: Route[] = [{ path: '/', component: 'Home' }];
    const router = new Router({ routes });
    expect(router).toBeInstanceOf(Router);
  });
});
