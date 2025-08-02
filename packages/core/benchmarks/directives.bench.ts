import { bench, describe } from 'vitest';
import { Uus } from '../src/uus';
import { createReactive } from '../src/reactive';

describe('Directives Performance Benchmarks', () => {
  bench('uus-text directive - simple text', () => {
    const app = new Uus();
    const element = document.createElement('div');
    element.setAttribute('uus-text', 'message');
    
    app.state = createReactive({ message: 'Hello World' });
    
    const directive = app.directives.get('text');
    if (directive?.bind) {
      directive.bind(element, { expression: 'message' }, app as any);
    }
    
    app.state.message = 'Updated';
  });

  bench('uus-for directive - small list', () => {
    const app = new Uus();
    const element = document.createElement('li');
    element.setAttribute('uus-for', 'item in items');
    element.textContent = '{{ item }}';
    
    const parent = document.createElement('ul');
    parent.appendChild(element);
    
    app.state = createReactive({ 
      items: Array(10).fill(0).map((_, i) => `Item ${i}`)
    });
    
    const directive = app.directives.get('for');
    if (directive?.bind) {
      directive.bind(element, { expression: 'item in items' }, app as any);
    }
  });

  bench('uus-for directive - large list', () => {
    const app = new Uus();
    const element = document.createElement('li');
    element.setAttribute('uus-for', 'item in items');
    element.textContent = '{{ item }}';
    
    const parent = document.createElement('ul');
    parent.appendChild(element);
    
    app.state = createReactive({ 
      items: Array(1000).fill(0).map((_, i) => `Item ${i}`)
    });
    
    const directive = app.directives.get('for');
    if (directive?.bind) {
      directive.bind(element, { expression: 'item in items' }, app as any);
    }
  });

  bench('uus-if directive - toggle visibility', () => {
    const app = new Uus();
    const element = document.createElement('div');
    element.setAttribute('uus-if', 'showElement');
    
    app.state = createReactive({ showElement: true });
    
    const directive = app.directives.get('if');
    if (directive?.bind) {
      directive.bind(element, { expression: 'showElement' }, app as any);
    }
    
    // Toggle multiple times
    for (let i = 0; i < 10; i++) {
      app.state.showElement = !app.state.showElement;
    }
  });

  bench('uus-model directive - input updates', () => {
    const app = new Uus();
    const input = document.createElement('input');
    input.setAttribute('uus-model', 'value');
    
    app.state = createReactive({ value: '' });
    
    const directive = app.directives.get('model');
    if (directive?.bind) {
      directive.bind(input, { expression: 'value' }, app as any);
    }
    
    // Simulate typing
    for (let i = 0; i < 20; i++) {
      input.value = `Text ${i}`;
      input.dispatchEvent(new Event('input'));
    }
  });

  bench('uus-on directive - event handling', () => {
    const app = new Uus();
    const button = document.createElement('button');
    button.setAttribute('uus-on:click', 'handleClick()');
    
    let clickCount = 0;
    app.state = createReactive({ 
      handleClick: () => { clickCount++; }
    });
    
    const directive = app.directives.get('on');
    if (directive?.bind) {
      directive.bind(button, { 
        expression: 'handleClick()',
        arg: 'click',
        modifiers: {}
      }, app as any);
    }
    
    // Simulate clicks
    for (let i = 0; i < 100; i++) {
      button.click();
    }
  });

  bench('uus-class directive - dynamic classes', () => {
    const app = new Uus();
    const element = document.createElement('div');
    element.setAttribute('uus-class', '{ active: isActive, disabled: isDisabled }');
    
    app.state = createReactive({ 
      isActive: false,
      isDisabled: false
    });
    
    const directive = app.directives.get('class');
    if (directive?.bind) {
      directive.bind(element, { 
        expression: '{ active: isActive, disabled: isDisabled }'
      }, app as any);
    }
    
    // Toggle classes
    for (let i = 0; i < 50; i++) {
      app.state.isActive = !app.state.isActive;
      app.state.isDisabled = !app.state.isDisabled;
    }
  });

  bench('nested directives performance', () => {
    const app = new Uus();
    
    const container = document.createElement('div');
    container.innerHTML = `
      <ul>
        <li uus-for="item in items" uus-class="{ selected: item.selected }">
          <span uus-text="item.name"></span>
          <button uus-on:click="toggleItem(item)" uus-show="!item.hidden">Toggle</button>
        </li>
      </ul>
    `;
    
    app.state = createReactive({
      items: Array(50).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        selected: false,
        hidden: false
      })),
      toggleItem(item: any) {
        item.selected = !item.selected;
      }
    });
    
    // Mount would process all directives
    app.mount(container);
    
    // Update items
    app.state.items.forEach(item => {
      item.selected = true;
    });
  });

  bench('directive cleanup performance', () => {
    const app = new Uus();
    const elements = Array(100).fill(0).map(() => {
      const el = document.createElement('div');
      el.setAttribute('uus-text', 'message');
      return el;
    });
    
    app.state = createReactive({ message: 'Hello' });
    
    // Bind all elements
    elements.forEach(el => {
      const directive = app.directives.get('text');
      if (directive?.bind) {
        directive.bind(el, { expression: 'message' }, app as any);
      }
    });
    
    // Cleanup all elements
    elements.forEach(el => {
      const directive = app.directives.get('text');
      if (directive?.unbind) {
        directive.unbind(el, { expression: 'message' }, app as any);
      }
    });
  });

  bench('expression evaluation performance', () => {
    const app = new Uus();
    const element = document.createElement('div');
    element.setAttribute('uus-text', 'user.profile.settings.theme.color');
    
    app.state = createReactive({
      user: {
        profile: {
          settings: {
            theme: {
              color: 'blue'
            }
          }
        }
      }
    });
    
    const directive = app.directives.get('text');
    if (directive?.bind) {
      directive.bind(element, { 
        expression: 'user.profile.settings.theme.color' 
      }, app as any);
    }
    
    // Update deep property
    for (let i = 0; i < 100; i++) {
      app.state.user.profile.settings.theme.color = `color${i}`;
    }
  });
});