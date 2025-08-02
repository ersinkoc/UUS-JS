import { describe, it, expect, beforeEach } from 'vitest';
import { RouteMatcher } from '../src/matcher';
import type { Route } from '../src/types';

describe('RouteMatcher', () => {
  let matcher: RouteMatcher;
  let routes: Route[];

  beforeEach(() => {
    routes = [
      { path: '/', component: 'Home' },
      { path: '/about', component: 'About' },
      { path: '/user/:id', component: 'User' },
      { path: '/user/:id/profile', component: 'UserProfile' },
      { path: '/posts/:category/:id', component: 'Post' },
      { path: '/search/*', component: 'Search' },
      { path: '/admin', component: 'Admin', meta: { requiresAuth: true } },
      {
        path: '/products',
        component: 'Products',
        children: [
          { path: '/list', component: 'ProductList' },
          { path: '/:id', component: 'ProductDetail' },
          { path: '/:id/reviews', component: 'ProductReviews' }
        ]
      }
    ];
    matcher = new RouteMatcher(routes);
  });

  describe('Basic route matching', () => {
    it('should match exact paths', () => {
      const match = matcher.match('/');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/');
      expect(match?.route.component).toBe('Home');
    });

    it('should match static routes', () => {
      const match = matcher.match('/about');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/about');
      expect(match?.route.component).toBe('About');
    });

    it('should return null for non-existent routes', () => {
      const match = matcher.match('/non-existent');
      expect(match).toBeNull();
    });
  });

  describe('Parameter matching', () => {
    it('should match routes with single parameter', () => {
      const match = matcher.match('/user/123');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/user/123');
      expect(match?.params).toEqual({ id: '123' });
      expect(match?.route.component).toBe('User');
    });

    it('should match routes with multiple parameters', () => {
      const match = matcher.match('/posts/technology/456');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/posts/technology/456');
      expect(match?.params).toEqual({ category: 'technology', id: '456' });
      expect(match?.route.component).toBe('Post');
    });

    it('should match nested parameter routes', () => {
      const match = matcher.match('/user/789/profile');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/user/789/profile');
      expect(match?.params).toEqual({ id: '789' });
      expect(match?.route.component).toBe('UserProfile');
    });
  });

  describe('Wildcard matching', () => {
    it('should match wildcard routes', () => {
      const match = matcher.match('/search/some/deep/path');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/search/some/deep/path');
      expect(match?.route.component).toBe('Search');
    });

    it('should match empty wildcard', () => {
      const match = matcher.match('/search/');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/search/');
      expect(match?.route.component).toBe('Search');
    });
  });

  describe('Query parameters', () => {
    it('should parse query parameters', () => {
      const match = matcher.match('/about?page=2&sort=name');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/about');
      expect(match?.query).toEqual({ page: '2', sort: 'name' });
    });

    it('should handle empty query', () => {
      const match = matcher.match('/about?');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/about');
      expect(match?.query).toEqual({});
    });

    it('should handle routes with no query', () => {
      const match = matcher.match('/about');
      expect(match).toBeTruthy();
      expect(match?.query).toEqual({});
    });
  });

  describe('Hash handling', () => {
    it('should parse hash from path', () => {
      const match = matcher.match('/about#section1');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/about');
      expect(match?.hash).toBe('#section1');
    });

    it('should handle query and hash together', () => {
      const match = matcher.match('/about?page=2#section1');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/about');
      expect(match?.query).toEqual({ page: '2' });
      expect(match?.hash).toBe('#section1');
    });

    it('should handle hash before query (non-standard)', () => {
      const match = matcher.match('/about#section1?page=2');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/about');
      expect(match?.query).toEqual({});
      expect(match?.hash).toBe('#section1?page=2');
    });
  });

  describe('Nested routes', () => {
    it('should match parent route with children', () => {
      const match = matcher.match('/products');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/products');
      expect(match?.route.component).toBe('Products');
    });

    it('should match child routes', () => {
      const match = matcher.match('/products/list');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/products/list');
      expect(match?.route.component).toBe('ProductList');
    });

    it('should match child routes with parameters', () => {
      const match = matcher.match('/products/123');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/products/123');
      expect(match?.params).toEqual({ id: '123' });
      expect(match?.route.component).toBe('ProductDetail');
    });

    it('should match nested child routes with parameters', () => {
      const match = matcher.match('/products/456/reviews');
      expect(match).toBeTruthy();
      expect(match?.path).toBe('/products/456/reviews');
      expect(match?.params).toEqual({ id: '456' });
      expect(match?.route.component).toBe('ProductReviews');
    });
  });

  describe('Route metadata', () => {
    it('should preserve route metadata', () => {
      const match = matcher.match('/admin');
      expect(match).toBeTruthy();
      expect(match?.route.meta).toEqual({ requiresAuth: true });
    });
  });

  describe('Edge cases', () => {
    it('should handle trailing slashes', () => {
      const match = matcher.match('/about/');
      expect(match).toBeNull(); // Exact matching doesn't allow trailing slashes
    });

    it('should handle special characters in parameters', () => {
      const match = matcher.match('/user/john@example.com');
      expect(match).toBeTruthy();
      expect(match?.params).toEqual({ id: 'john@example.com' });
    });

    it('should handle encoded URLs', () => {
      const match = matcher.match('/user/john%40example.com');
      expect(match).toBeTruthy();
      expect(match?.params).toEqual({ id: 'john%40example.com' });
    });

    it('should handle multiple slashes', () => {
      const match = matcher.match('//about');
      expect(match).toBeNull();
    });

    it('should handle empty path', () => {
      const match = matcher.match('');
      expect(match).toBeNull();
    });
  });
});