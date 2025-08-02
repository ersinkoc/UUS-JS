import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Uus } from '../src/uus';

describe('Uus', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should create an instance with default config', () => {
      const app = new Uus();
      expect(app).toBeInstanceOf(Uus);
      expect(app.config.debug).toBe(false);
      expect(app.config.prefix).toBe('uus-');
    });

    it('should accept custom config', () => {
      const app = new Uus({ debug: true, prefix: 'v-' });
      expect(app.config.debug).toBe(true);
      expect(app.config.prefix).toBe('v-');
    });
  });

  describe('mount', () => {
    it('should mount to element by selector', () => {
      const app = new Uus();
      app.mount('#test-app');
      expect(app.rootElement).toBe(container);
    });

    it('should mount to element directly', () => {
      const app = new Uus();
      app.mount(container);
      expect(app.rootElement).toBe(container);
    });

    it('should throw error for invalid selector', () => {
      const app = new Uus();
      expect(() => app.mount('#non-existent')).toThrow('Element not found');
    });
  });

  describe('directives', () => {
    it('should process uus-state directive', () => {
      container.innerHTML = `
        <div uus-state='{ message: "Hello" }'>
          <span uus-text="message"></span>
        </div>
      `;

      const app = new Uus();
      app.mount(container);

      const span = container.querySelector('span');
      expect(span?.textContent).toBe('Hello');
    });

    it('should handle reactive updates', () => {
      container.innerHTML = `
        <div uus-state="{ count: 0 }">
          <span id="display" uus-text="count"></span>
          <button id="btn" uus-on:click="count++">Inc</button>
        </div>
      `;

      const app = new Uus();
      app.mount(container);

      const display = container.querySelector('#display');
      const button = container.querySelector('#btn') as HTMLButtonElement;

      expect(display?.textContent).toBe('0');

      button.click();
      expect(display?.textContent).toBe('1');

      button.click();
      expect(display?.textContent).toBe('2');
    });

    it('should handle computed expressions', () => {
      container.innerHTML = `
        <div uus-state="{ count: 5 }">
          <span uus-text="count * 2"></span>
        </div>
      `;

      const app = new Uus();
      app.mount(container);

      const span = container.querySelector('span');
      expect(span?.textContent).toBe('10');
    });
  });

  describe('unmount', () => {
    it('should clean up when unmounting', () => {
      container.innerHTML = `
        <div uus-state="{ count: 0 }">
          <span id="display" uus-text="count"></span>
          <button id="btn" uus-on:click="count++">Inc</button>
        </div>
      `;

      const app = new Uus();
      app.mount(container);

      const button = container.querySelector('#btn') as HTMLButtonElement;
      button.click();

      const display = container.querySelector('#display');
      expect(display?.textContent).toBe('1');

      app.unmount();
      expect(app.rootElement).toBeNull();

      // Click should not update after unmount
      button.click();
      expect(display?.textContent).toBe('1');
    });
  });

  describe('plugins', () => {
    it('should install plugins', () => {
      const plugin = {
        name: 'test-plugin',
        install: vi.fn(),
      };

      const app = new Uus();
      app.use(plugin);

      expect(plugin.install).toHaveBeenCalledWith(app);
    });
  });

  describe('static methods', () => {
    it('should have version', () => {
      expect(Uus.version).toBe('0.0.1');
    });

    it('should set global config', () => {
      const plugin = {
        name: 'global-plugin',
        install: vi.fn(),
      };

      Uus.config({
        debug: true,
        plugins: [plugin],
      });

      const app = new Uus();
      expect(app.config.debug).toBe(true);
      expect(plugin.install).toHaveBeenCalledWith(app);
    });
  });
});
