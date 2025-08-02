import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HashHistory, HTML5History } from '../src/history';

describe('HashHistory', () => {
  let history: HashHistory;
  let originalLocation: Location;

  beforeEach(() => {
    // Save original location
    originalLocation = window.location;

    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      hash: '',
      href: 'http://localhost/',
      hostname: 'localhost',
      pathname: '/',
      replace: vi.fn(),
    };

    history = new HashHistory();
  });

  afterEach(() => {
    // Restore original location
    (window as any).location = originalLocation;
  });

  describe('current', () => {
    it('should return current hash path', () => {
      window.location.hash = '#/about';
      expect(history.current).toBe('/about');
    });

    it('should return "/" when hash is empty', () => {
      window.location.hash = '';
      expect(history.current).toBe('/');
    });

    it('should return path without hash symbol', () => {
      window.location.hash = '#/user/123';
      expect(history.current).toBe('/user/123');
    });
  });

  describe('push', () => {
    it('should update window.location.hash', () => {
      history.push('/products');
      expect(window.location.hash).toBe('/products');
    });
  });

  describe('replace', () => {
    it('should replace current hash without adding to history', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      history.replace('/new-path');

      expect(replaceStateSpy).toHaveBeenCalledWith(
        null,
        '',
        'http://localhost/#/new-path'
      );
    });

    it('should notify listeners on replace', () => {
      const listener = vi.fn();
      history.listen(listener);

      // Update the mock location hash so that history.current returns the expected value
      window.location.hash = '#/new-path';
      history.replace('/new-path');

      expect(listener).toHaveBeenCalledWith('/new-path');
    });
  });

  describe('go', () => {
    it('should call window.history.go', () => {
      const goSpy = vi.spyOn(window.history, 'go');

      history.go(-1);
      expect(goSpy).toHaveBeenCalledWith(-1);

      history.go(2);
      expect(goSpy).toHaveBeenCalledWith(2);
    });
  });

  describe('listen', () => {
    it('should add listener and return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = history.listen(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener on hashchange event', () => {
      const listener = vi.fn();
      history.listen(listener);

      window.location.hash = '#/test';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(listener).toHaveBeenCalledWith('/test');
    });

    it('should remove listener when unsubscribe is called', () => {
      const listener = vi.fn();
      const unsubscribe = history.listen(listener);

      unsubscribe();

      window.dispatchEvent(new HashChangeEvent('hashchange'));
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      history.listen(listener1);
      history.listen(listener2);

      // Update the mock location hash so that history.current returns the expected value
      window.location.hash = '#/test';
      history.replace('/test');

      expect(listener1).toHaveBeenCalledWith('/test');
      expect(listener2).toHaveBeenCalledWith('/test');
    });
  });
});

describe('HTML5History', () => {
  let history: HTML5History;
  let originalLocation: Location;

  beforeEach(() => {
    // Save original location
    originalLocation = window.location;

    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      pathname: '/',
      search: '',
      hash: '',
      href: 'http://localhost/',
      hostname: 'localhost',
    };

    history = new HTML5History();
  });

  afterEach(() => {
    // Restore original location
    (window as any).location = originalLocation;
  });

  describe('current', () => {
    it('should return current pathname', () => {
      window.location.pathname = '/about';
      expect(history.current).toBe('/about');
    });

    it('should handle base path', () => {
      history = new HTML5History('/app');
      window.location.pathname = '/app/about';
      expect(history.current).toBe('/about');
    });

    it('should return "/" when path matches base exactly', () => {
      history = new HTML5History('/app');
      window.location.pathname = '/app';
      expect(history.current).toBe('/');
    });

    it('should return full path when it does not start with base', () => {
      history = new HTML5History('/app');
      window.location.pathname = '/other/path';
      expect(history.current).toBe('/other/path');
    });
  });

  describe('push', () => {
    it('should call pushState with correct path', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      history.push('/products');

      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/products');
    });

    it('should include base path', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      history = new HTML5History('/app');

      history.push('/products');

      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/app/products');
    });

    it('should notify listeners after push', () => {
      const listener = vi.fn();
      history.listen(listener);

      // Update the mock location pathname so that history.current returns the expected value
      window.location.pathname = '/new-path';
      history.push('/new-path');

      expect(listener).toHaveBeenCalledWith('/new-path');
    });
  });

  describe('replace', () => {
    it('should call replaceState with correct path', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      history.replace('/products');

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/products');
    });

    it('should notify listeners after replace', () => {
      const listener = vi.fn();
      history.listen(listener);

      // Update the mock location pathname so that history.current returns the expected value
      window.location.pathname = '/new-path';
      history.replace('/new-path');

      expect(listener).toHaveBeenCalledWith('/new-path');
    });
  });

  describe('go', () => {
    it('should call window.history.go', () => {
      const goSpy = vi.spyOn(window.history, 'go');

      history.go(-1);
      expect(goSpy).toHaveBeenCalledWith(-1);

      history.go(2);
      expect(goSpy).toHaveBeenCalledWith(2);
    });
  });

  describe('listen', () => {
    it('should handle popstate event', () => {
      const listener = vi.fn();
      history.listen(listener);

      window.location.pathname = '/test';
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(listener).toHaveBeenCalledWith('/test');
    });

    it('should intercept link clicks', () => {
      const listener = vi.fn();
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      history.listen(listener);

      // Create a link element
      const link = document.createElement('a');
      link.href = 'http://localhost/test';
      link.hostname = 'localhost';
      link.pathname = '/test';
      link.search = '';
      link.hash = '';
      document.body.appendChild(link);

      // Simulate click
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: link, writable: false });

      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(pushStateSpy).toHaveBeenCalled();

      document.body.removeChild(link);
    });

    it('should not intercept external links', () => {
      const listener = vi.fn();
      history.listen(listener);

      // Create an external link
      const link = document.createElement('a');
      link.href = 'http://external.com/test';
      link.hostname = 'external.com';
      document.body.appendChild(link);

      // Simulate click
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: link, writable: false });

      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);

      document.body.removeChild(link);
    });

    it('should not intercept links with target="_blank"', () => {
      const listener = vi.fn();
      history.listen(listener);

      // Create a link with target="_blank"
      const link = document.createElement('a');
      link.href = 'http://localhost/test';
      link.hostname = 'localhost';
      link.target = '_blank';
      document.body.appendChild(link);

      // Simulate click
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: link, writable: false });

      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);

      document.body.removeChild(link);
    });

    it('should handle clicks on child elements of links', () => {
      const listener = vi.fn();
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      history.listen(listener);

      // Create a link with child element
      const link = document.createElement('a');
      link.href = 'http://localhost/test';
      link.hostname = 'localhost';
      link.pathname = '/test';
      link.search = '';
      link.hash = '';

      const span = document.createElement('span');
      link.appendChild(span);
      document.body.appendChild(link);

      // Simulate click on child element
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: span, writable: false });

      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(pushStateSpy).toHaveBeenCalled();

      document.body.removeChild(link);
    });

    it('should remove all event listeners on unsubscribe', () => {
      const listener = vi.fn();
      const listener2 = vi.fn();

      // Add a listener that should remain active
      history.listen(listener2);

      // Add and remove a listener
      const unsubscribe = history.listen(listener);
      unsubscribe();

      // Test popstate
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(listener).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      // Test click - the link should still be intercepted because listener2 is active
      const link = document.createElement('a');
      link.href = 'http://localhost/test';
      link.hostname = 'localhost';
      link.pathname = '/test';
      link.search = '';
      link.hash = '';
      link.target = '';
      document.body.appendChild(link);

      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: link, writable: false });

      document.dispatchEvent(event);

      // Event should be prevented because listener2 is still active
      expect(event.defaultPrevented).toBe(true);

      document.body.removeChild(link);
    });
  });
});
