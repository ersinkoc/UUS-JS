import { describe, it, expect } from 'vitest';
import {
  parseDirective,
  walkElement,
  createBinding,
  removeDirectiveAttribute,
  getElementState,
} from '../src/parser';

describe('Parser', () => {
  describe('parseDirective', () => {
    it('should parse simple directive', () => {
      const attr = { name: 'uus-text', value: 'message' } as Attr;
      const result = parseDirective(attr);

      expect(result).toEqual({
        name: 'text',
        value: 'message',
        arg: undefined,
        modifiers: {},
      });
    });

    it('should parse directive with modifiers', () => {
      const attr = {
        name: 'uus-text.trim.uppercase',
        value: 'message',
      } as Attr;
      const result = parseDirective(attr);

      expect(result).toEqual({
        name: 'text',
        value: 'message',
        arg: undefined,
        modifiers: { trim: true, uppercase: true },
      });
    });

    it('should parse event directive', () => {
      const attr = { name: 'uus-on:click', value: 'handleClick()' } as Attr;
      const result = parseDirective(attr);

      expect(result).toEqual({
        name: 'on',
        value: 'handleClick()',
        arg: 'click',
        modifiers: {},
      });
    });

    it('should parse event directive with modifiers', () => {
      const attr = {
        name: 'uus-on:click.prevent.stop',
        value: 'handleClick()',
      } as Attr;
      const result = parseDirective(attr);

      expect(result).toEqual({
        name: 'on',
        value: 'handleClick()',
        arg: 'click',
        modifiers: { prevent: true, stop: true },
      });
    });

    it('should parse bind directive', () => {
      const attr = { name: 'uus-bind:disabled', value: 'isDisabled' } as Attr;
      const result = parseDirective(attr);

      expect(result).toEqual({
        name: 'bind',
        value: 'isDisabled',
        arg: 'disabled',
        modifiers: {},
      });
    });

    it('should return null for non-uus attributes', () => {
      const attr = { name: 'class', value: 'my-class' } as Attr;
      const result = parseDirective(attr);

      expect(result).toBeNull();
    });

    it('should throw error for empty directive name', () => {
      const attr = { name: 'uus-', value: 'test' } as Attr;
      
      expect(() => parseDirective(attr, { throwOnError: true })).toThrow('Directive name cannot be empty');
    });

    it('should handle directive with dots but no modifiers', () => {
      const attr = { name: 'uus-test.', value: 'value' } as Attr;
      const result = parseDirective(attr);

      expect(result).toEqual({
        name: 'test',
        value: 'value',
        arg: undefined,
        modifiers: { '': true },
      });
    });
  });

  describe('createBinding', () => {
    it('should create binding from parsed directive', () => {
      const parsed = {
        name: 'text',
        value: 'message',
        arg: undefined,
        modifiers: { trim: true },
      };

      const binding = createBinding(parsed);

      expect(binding).toEqual({
        value: 'message',
        expression: 'message',
        arg: undefined,
        modifiers: { trim: true },
      });
    });

    it('should handle directive with argument', () => {
      const parsed = {
        name: 'bind',
        value: 'isDisabled',
        arg: 'disabled',
        modifiers: {},
      };

      const binding = createBinding(parsed);

      expect(binding).toEqual({
        value: 'isDisabled',
        expression: 'isDisabled',
        arg: 'disabled',
        modifiers: {},
      });
    });
  });

  describe('walkElement', () => {
    it('should walk element and find directives', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div uus-text="message" uus-on:click="handleClick()">
          <span uus-bind:disabled="isDisabled"></span>
        </div>
      `;

      const directives: Array<{ element: HTMLElement; directive: any }> = [];

      walkElement(element, (el, directive) => {
        directives.push({ element: el, directive });
      });

      expect(directives.length).toBeGreaterThan(0);
      expect(directives.some((d) => d.directive.name === 'text')).toBe(true);
      expect(directives.some((d) => d.directive.name === 'on')).toBe(true);
      expect(directives.some((d) => d.directive.name === 'bind')).toBe(true);
    });

    it('should handle elements with no directives', () => {
      const element = document.createElement('div');
      element.innerHTML = '<div class="normal">No directives</div>';

      const directives: any[] = [];

      walkElement(element, (el, directive) => {
        directives.push(directive);
      });

      expect(directives.length).toBe(0);
    });

    it('should walk nested elements', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div uus-state="{ count: 0 }">
          <div>
            <span uus-text="count"></span>
            <div>
              <button uus-on:click="count++">Click</button>
            </div>
          </div>
        </div>
      `;

      const directives: any[] = [];

      walkElement(element, (el, directive) => {
        directives.push(directive);
      });

      expect(directives.length).toBe(3); // state, text, on
      expect(directives.map((d) => d.name)).toContain('state');
      expect(directives.map((d) => d.name)).toContain('text');
      expect(directives.map((d) => d.name)).toContain('on');
    });
  });

  describe('walkElement with skipChildren', () => {
    it('should skip children when encountering for directive', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div uus-for="item in items">
          <span uus-text="item"></span>
          <button uus-on:click="handleClick()">Click</button>
        </div>
      `;

      const directives: any[] = [];

      walkElement(element, (el, directive) => {
        directives.push(directive);
      });

      // Should only find the 'for' directive, not the children
      expect(directives.length).toBe(1);
      expect(directives[0].name).toBe('for');
    });

    it('should skip children when encountering if directive', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div uus-if="showContent">
          <span uus-text="content"></span>
          <button uus-on:click="toggle()">Toggle</button>
        </div>
      `;

      const directives: any[] = [];

      walkElement(element, (el, directive) => {
        directives.push(directive);
      });

      // Should only find the 'if' directive, not the children
      expect(directives.length).toBe(1);
      expect(directives[0].name).toBe('if');
    });

    it('should process siblings of structural directives', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div uus-if="condition1">
          <span uus-text="text1"></span>
        </div>
        <div uus-text="text2"></div>
        <div uus-for="item in items">
          <span uus-text="item"></span>
        </div>
        <button uus-on:click="action()">Click</button>
      `;

      const directives: any[] = [];

      walkElement(element, (el, directive) => {
        directives.push(directive);
      });

      // Should find 'if', 'text', 'for', and 'on' but not children of structural directives
      expect(directives.length).toBe(4);
      expect(directives.map((d) => d.name)).toEqual([
        'if',
        'text',
        'for',
        'on',
      ]);
    });

    it('should respect skipChildren option', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div uus-text="parent">
          <span uus-text="child1"></span>
          <button uus-on:click="action()">Click</button>
        </div>
      `;

      const directives: any[] = [];

      walkElement(
        element,
        (el, directive) => {
          directives.push(directive);
        },
        { skipChildren: true }
      );

      // Should only process the root element's directives
      expect(directives.length).toBe(0); // No directives on root element
    });

    it('should find directives on root element when skipChildren is true', () => {
      const element = document.createElement('div');
      element.setAttribute('uus-text', 'root');
      element.innerHTML = `
        <span uus-text="child"></span>
      `;

      const directives: any[] = [];

      walkElement(
        element,
        (el, directive) => {
          directives.push(directive);
        },
        { skipChildren: true }
      );

      // Should only find directive on root element
      expect(directives.length).toBe(1);
      expect(directives[0].name).toBe('text');
    });
  });

  describe('getElementState', () => {
    it('should find state on element', () => {
      const element = document.createElement('div');
      const state = { count: 10 };
      (element as any).__uusState = state;

      const result = getElementState(element);

      expect(result).toBe(state);
    });

    it('should find state on parent element', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      parent.appendChild(child);

      const state = { count: 20 };
      (parent as any).__uusState = state;

      const result = getElementState(child);

      expect(result).toBe(state);
    });

    it('should find state on ancestor element', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const child = document.createElement('span');
      grandparent.appendChild(parent);
      parent.appendChild(child);

      const state = { count: 30 };
      (grandparent as any).__uusState = state;

      const result = getElementState(child);

      expect(result).toBe(state);
    });

    it('should return null when no state found', () => {
      const element = document.createElement('div');

      const result = getElementState(element);

      expect(result).toBeNull();
    });

    it('should return null for detached element', () => {
      const element = document.createElement('div');
      // Element is not attached to any parent

      const result = getElementState(element);

      expect(result).toBeNull();
    });
  });

  describe('removeDirectiveAttribute', () => {
    it('should remove directive attribute from element', () => {
      const element = document.createElement('div');
      element.setAttribute('uus-text', 'message');
      element.setAttribute('uus-on:click', 'handleClick()');
      element.setAttribute('class', 'my-class');

      expect(element.hasAttribute('uus-text')).toBe(true);

      removeDirectiveAttribute(element, 'text');

      expect(element.hasAttribute('uus-text')).toBe(false);
      expect(element.hasAttribute('uus-on:click')).toBe(true);
      expect(element.hasAttribute('class')).toBe(true);
    });

    it('should handle non-existent directive', () => {
      const element = document.createElement('div');
      element.setAttribute('class', 'my-class');

      // Should not throw
      removeDirectiveAttribute(element, 'nonexistent');

      expect(element.hasAttribute('class')).toBe(true);
    });

    it('should remove directive with modifiers', () => {
      const element = document.createElement('div');
      element.setAttribute('uus-text.trim.uppercase', 'message');

      removeDirectiveAttribute(element, 'text');

      expect(element.hasAttribute('uus-text.trim.uppercase')).toBe(false);
    });

    it('should remove event directive', () => {
      const element = document.createElement('div');
      element.setAttribute('uus-on:click.prevent', 'handleClick()');

      removeDirectiveAttribute(element, 'on');

      expect(element.hasAttribute('uus-on:click.prevent')).toBe(false);
    });

    it('should remove bind directive', () => {
      const element = document.createElement('div');
      element.setAttribute('uus-bind:disabled', 'isDisabled');

      removeDirectiveAttribute(element, 'bind');

      expect(element.hasAttribute('uus-bind:disabled')).toBe(false);
    });
  });
});
