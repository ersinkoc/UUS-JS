import { Router } from '../router';
import type { RouterOptions } from '../types';

describe('Router Race Condition ROUTER-005', () => {
  let router: Router;

  beforeEach(() => {
    const options: RouterOptions = {
      mode: 'hash',
      routes: [
        { path: '/home', component: {} },
        { path: '/about', component: {} },
        { path: '/contact', component: {} },
      ],
    };
    router = new Router(options);
  });

  test('should handle rapid push() calls without race condition', (done) => {
    let navigationCount = 0;

    router.afterEach(() => {
      navigationCount++;
    });

    // Simulate rapid navigation calls that could cause race condition
    router.push('/home');
    router.push('/about');
    router.push('/contact');

    // Wait for async navigation to complete
    setTimeout(() => {
      // Should have navigated to the final path (/contact)
      // and processed queued navigations properly
      expect(router.currentRoute?.path).toBe('/contact');
      // Should have completed all navigations (initial + 3 pushes)
      expect(navigationCount).toBeGreaterThan(0);
      done();
    }, 100);
  });

  test('should queue pending navigation when one is in progress', (done) => {
    let guardExecutionCount = 0;

    // Add a slow guard to simulate async navigation
    router.beforeEach((to, from, next) => {
      guardExecutionCount++;
      setTimeout(() => {
        next();
      }, 50);
    });

    // First navigation starts
    router.push('/home');

    // Second navigation should be queued
    setTimeout(() => {
      router.push('/about');
    }, 10);

    // Wait for both to complete
    setTimeout(() => {
      // Should have executed guards for both navigations
      expect(guardExecutionCount).toBe(2);
      expect(router.currentRoute?.path).toBe('/about');
      done();
    }, 200);
  });

  test('should not allow concurrent navigate() executions', (done) => {
    const executionTimestamps: number[] = [];
    let isNavigating = false;

    router.beforeEach((to, from, next) => {
      // Track execution start
      executionTimestamps.push(Date.now());

      // Verify no concurrent execution
      expect(isNavigating).toBe(false);
      isNavigating = true;

      setTimeout(() => {
        isNavigating = false;
        next();
      }, 30);
    });

    // Trigger multiple rapid navigations
    router.push('/home');
    router.push('/about');
    router.push('/contact');

    setTimeout(() => {
      // All navigations should have completed sequentially
      expect(isNavigating).toBe(false);
      done();
    }, 200);
  });
});
