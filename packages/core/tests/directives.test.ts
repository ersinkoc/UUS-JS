import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Uus } from '../src/uus';

describe('Directives', () => {
  let container: HTMLElement;
  let app: Uus;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    app = new Uus();
  });

  afterEach(() => {
    app.unmount();
    document.body.removeChild(container);
  });

  describe('uus-text', () => {
    it('should set text content', () => {
      container.innerHTML = `
        <div uus-state="{ message: 'Hello World' }">
          <span uus-text="message"></span>
        </div>
      `;

      app.mount(container);
      const span = container.querySelector('span');
      expect(span?.textContent).toBe('Hello World');
    });

    it('should handle expressions', () => {
      container.innerHTML = `
        <div uus-state="{ name: 'John', age: 30 }">
          <span uus-text="name + ' is ' + age + ' years old'"></span>
        </div>
      `;

      app.mount(container);
      const span = container.querySelector('span');
      expect(span?.textContent).toBe('John is 30 years old');
    });

    it('should handle null/undefined gracefully', () => {
      container.innerHTML = `
        <div uus-state="{ value: null }">
          <span uus-text="value"></span>
        </div>
      `;

      app.mount(container);
      const span = container.querySelector('span');
      expect(span?.textContent).toBe('');
    });
  });

  describe('uus-on', () => {
    it('should attach event listeners', () => {
      const handler = vi.fn();
      container.innerHTML = `
        <div uus-state="{ clicked: false }">
          <button id="btn" uus-on:click="clicked = true">Click</button>
        </div>
      `;

      app.mount(container);
      const button = container.querySelector('#btn') as HTMLButtonElement;

      expect(app.state.clicked).toBe(false);
      button.click();
      expect(app.state.clicked).toBe(true);
    });

    it('should handle prevent modifier', () => {
      container.innerHTML = `
        <div uus-state="{ submitted: false }">
          <form uus-on:submit.prevent="submitted = true">
            <button type="submit">Submit</button>
          </form>
        </div>
      `;

      app.mount(container);
      const form = container.querySelector('form') as HTMLFormElement;
      const event = new Event('submit', { cancelable: true });

      form.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(app.state.submitted).toBe(true);
    });

    it('should handle once modifier', () => {
      container.innerHTML = `
        <div uus-state="{ count: 0 }">
          <button id="btn" uus-on:click.once="count++">Click</button>
        </div>
      `;

      app.mount(container);
      const button = container.querySelector('#btn') as HTMLButtonElement;

      expect(app.state.count).toBe(0);
      button.click();
      expect(app.state.count).toBe(1);
      button.click(); // Should not increment again
      expect(app.state.count).toBe(1);
    });

    it('should provide $event in expressions', () => {
      container.innerHTML = `
        <div uus-state="{ value: '' }">
          <input uus-on:input="value = $event.target.value">
        </div>
      `;

      app.mount(container);
      const input = container.querySelector('input') as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      expect(app.state.value).toBe('test');
    });
  });

  describe('uus-state', () => {
    it('should initialize state', () => {
      container.innerHTML = `
        <div uus-state="{ count: 10, name: 'Test' }">
        </div>
      `;

      app.mount(container);
      expect(app.state.count).toBe(10);
      expect(app.state.name).toBe('Test');
    });

    it('should handle nested state', () => {
      container.innerHTML = `
        <div uus-state="{ parent: 'A' }">
          <div uus-state="{ child: 'B' }">
            <span id="parent" uus-text="parent"></span>
            <span id="child" uus-text="child"></span>
          </div>
        </div>
      `;

      app.mount(container);
      const parentSpan = container.querySelector('#parent');
      const childSpan = container.querySelector('#child');

      expect(parentSpan?.textContent).toBe('A');
      expect(childSpan?.textContent).toBe('B');
    });

    it('should throw error for non-object state', () => {
      container.innerHTML = `
        <div uus-state="'invalid'">
        </div>
      `;

      // Should log error but not throw
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      app.mount(container);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('uus-bind', () => {
    it('should bind attribute values', () => {
      container.innerHTML = `
        <div uus-state="{ id: 'test-id', disabled: false }">
          <input uus-bind:id="id" uus-bind:disabled="disabled" />
        </div>
      `;

      app.mount(container);
      const input = container.querySelector('input') as HTMLInputElement;

      expect(input.id).toBe('test-id');
      expect(input.hasAttribute('disabled')).toBe(false);
    });

    it('should update attributes reactively', () => {
      container.innerHTML = `
        <div uus-state="{ title: 'initial' }">
          <span id="target" uus-bind:title="title" uus-on:click="title = 'updated'"></span>
        </div>
      `;

      app.mount(container);
      const span = container.querySelector('#target') as HTMLSpanElement;

      expect(span.title).toBe('initial');

      span.click();
      expect(span.title).toBe('updated');
    });

    it('should handle class binding with object syntax', () => {
      container.innerHTML = `
        <div uus-state="{ active: true, disabled: false }">
          <div id="target" uus-bind:class="{ active: active, disabled: disabled }"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      expect(div.classList.contains('active')).toBe(true);
      expect(div.classList.contains('disabled')).toBe(false);
    });

    it('should handle class binding with string syntax', () => {
      container.innerHTML = `
        <div uus-state="{ className: 'my-class other-class' }">
          <div id="target" uus-bind:class="className"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      expect(div.className).toBe('my-class other-class');
    });

    it('should handle style binding with object syntax', () => {
      container.innerHTML = `
        <div uus-state="{ color: 'red', fontSize: '16px' }">
          <div id="target" uus-bind:style="{ color: color, fontSize: fontSize }"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      expect(div.style.color).toBe('red');
      expect(div.style.fontSize).toBe('16px');
    });

    it('should handle style binding with string syntax', () => {
      container.innerHTML = `
        <div uus-state="{ styles: 'color: blue; font-size: 18px;' }">
          <div id="target" uus-bind:style="styles"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      expect(div.getAttribute('style')).toBe('color: blue; font-size: 18px;');
    });

    it('should remove attributes for falsy values', () => {
      container.innerHTML = `
        <div uus-state="{ value: null }">
          <input id="target" uus-bind:placeholder="value" placeholder="initial" />
        </div>
      `;

      app.mount(container);
      const input = container.querySelector('#target') as HTMLInputElement;

      expect(input.hasAttribute('placeholder')).toBe(false);
    });

    it('should show error for missing attribute name', () => {
      container.innerHTML = `
        <div uus-state="{ value: 'test' }">
          <div uus-bind="value"></div>
        </div>
      `;

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      app.mount(container);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Attribute name required for uus-bind'
      );
      consoleSpy.mockRestore();
    });

    it('should handle binding errors gracefully', () => {
      container.innerHTML = `
        <div uus-state="{}">
          <div uus-bind:title="nonexistent.property"></div>
        </div>
      `;

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      app.mount(container);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('uus-html', () => {
    it('should set innerHTML content (sanitized)', () => {
      container.innerHTML = `
        <div uus-state="{ content: '<strong>Bold text</strong>' }">
          <div id="target" uus-html="content"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      // HTML is rendered normally
      expect(div.innerHTML).toBe('<strong>Bold text</strong>');
    });

    it('should update innerHTML reactively', () => {
      container.innerHTML = `
        <div uus-state="{ content: '<em>Initial</em>' }">
          <div id="target" uus-html="content"></div>
          <button id="update" uus-on:click="content = '<u>Updated</u>'">Update</button>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;
      const button = container.querySelector('#update') as HTMLButtonElement;

      expect(div.innerHTML).toBe('<em>Initial</em>');

      button.click();
      expect(div.innerHTML).toBe('<u>Updated</u>');
    });

    it('should handle null/undefined gracefully', () => {
      container.innerHTML = `
        <div uus-state="{ content: null }">
          <div id="target" uus-html="content"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      // null values are converted to empty string in sanitization
      expect(div.innerHTML).toBe('');
    });

    it('should filter out dangerous content', () => {
      container.innerHTML = `
        <div uus-state="{ content: '<script>alert(1)</script>Safe content' }">
          <div id="target" uus-html="content"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      // Script tags should be filtered out
      expect(div.innerHTML).not.toContain('<script>');
    });
  });

  describe('uus-show', () => {
    it('should show element when condition is true', () => {
      container.innerHTML = `
        <div uus-state="{ visible: true }">
          <span id="target" uus-show="visible">Visible</span>
        </div>
      `;

      app.mount(container);
      const span = container.querySelector('#target') as HTMLElement;

      expect(span.style.display).not.toBe('none');
    });

    it('should hide element when condition is false', () => {
      container.innerHTML = `
        <div uus-state="{ visible: false }">
          <span id="target" uus-show="visible">Hidden</span>
        </div>
      `;

      app.mount(container);
      const span = container.querySelector('#target') as HTMLElement;

      expect(span.style.display).toBe('none');
    });

    it('should preserve original display value', () => {
      container.innerHTML = `
        <div uus-state="{ visible: true }">
          <span id="target" style="display: inline-block;" uus-show="visible">Test</span>
        </div>
      `;

      app.mount(container);
      const span = container.querySelector('#target') as HTMLElement;

      expect(span.style.display).toBe('inline-block');
    });

    it('should handle evaluation errors gracefully', () => {
      container.innerHTML = `
        <div uus-state="{}">
          <span id="target" uus-show="nonexistent.property">Error test</span>
        </div>
      `;

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      app.mount(container);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('uus-class', () => {
    it('should add classes from object', () => {
      container.innerHTML = `
        <div uus-state="{ active: true, disabled: false }">
          <div id="target" uus-class="{ active: active, disabled: disabled }"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      expect(div.classList.contains('active')).toBe(true);
      expect(div.classList.contains('disabled')).toBe(false);
    });

    it('should add classes from string', () => {
      container.innerHTML = `
        <div uus-state="{ classes: 'foo bar' }">
          <div id="target" uus-class="classes"></div>
        </div>
      `;

      app.mount(container);
      const div = container.querySelector('#target') as HTMLDivElement;

      expect(div.className).toContain('foo');
      expect(div.className).toContain('bar');
    });

    it('should handle null/undefined gracefully', () => {
      container.innerHTML = `
        <div uus-state="{ classes: null }">
          <div id="target" uus-class="classes"></div>
        </div>
      `;

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      app.mount(container);
      // Should not throw, just handle gracefully
      consoleSpy.mockRestore();
    });
  });
});
