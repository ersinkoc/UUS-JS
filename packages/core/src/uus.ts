import type {
  UusConfig,
  UusPlugin,
  UusInstance,
  Directive,
  GlobalConfig,
} from './types';
import { createReactive } from './reactive';
import { walkElement, createBinding } from './parser';
import { observeDOM } from './lifecycle';
import { 
  stateDirective, 
  textDirective, 
  htmlDirective,
  showDirective,
  ifDirective,
  forDirective,
  modelDirective,
  bindDirective,
  classDirective,
  styleDirective,
  onDirective,
  componentDirective
} from './directives';

export class Uus implements UusInstance {
  static version = '0.0.1';
  private static globalConfig: GlobalConfig = {};

  state: UusInstance['state'];
  effects: UusInstance['effects'];
  cleanups: UusInstance['cleanups'];
  directives: UusInstance['directives'];
  rootElement: UusInstance['rootElement'];
  config: UusInstance['config'];

  constructor(config?: UusConfig) {
    this.state = createReactive({});
    this.effects = new Set();
    this.cleanups = new WeakMap();
    this.directives = new Map();
    this.rootElement = null;
    this.config = {
      debug: false,
      prefix: 'uus-',
      ...Uus.globalConfig,
      ...config,
    };

    // Register core directives
    this.registerDirective(stateDirective);
    this.registerDirective(textDirective);
    this.registerDirective(htmlDirective);
    this.registerDirective(showDirective);
    this.registerDirective(ifDirective);
    this.registerDirective(forDirective);
    this.registerDirective(modelDirective);
    this.registerDirective(bindDirective);
    this.registerDirective(classDirective);
    this.registerDirective(styleDirective);
    this.registerDirective(onDirective);
    this.registerDirective(componentDirective);

    // Apply global plugins
    if (Uus.globalConfig.plugins) {
      Uus.globalConfig.plugins.forEach((plugin) => this.use(plugin));
    }
  }

  static config(options: GlobalConfig): void {
    Uus.globalConfig = { ...Uus.globalConfig, ...options };
  }

  mount(element: HTMLElement | string): void {
    const el = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;

    if (!el) {
      throw new Error(`Element not found: ${element}`);
    }

    if (!(el instanceof HTMLElement)) {
      throw new Error('Mount target must be an HTML element');
    }

    this.rootElement = el;
    this.compile(el);
    
    // Start observing DOM changes
    observeDOM(el, this);
  }

  unmount(): void {
    if (!this.rootElement) return;

    // Stop observing DOM
    const observer = (this as any).__domObserver;
    if (observer) {
      observer.disconnect();
    }

    // Clean up all effects and event listeners
    // WeakMap doesn't have entries(), so we need a different approach
    // Store references separately if needed for cleanup

    this.effects.forEach((cleanup) => cleanup());
    this.effects.clear();
    this.state = createReactive({});
    this.rootElement = null;
  }

  use(plugin: UusPlugin): void {
    if (this.config.debug) {
      console.log(`Installing plugin: ${plugin.name}`);
    }
    plugin.install(this);
  }

  registerDirective(directive: Directive): void {
    this.directives.set(directive.name, directive);
  }

  private compile(root: HTMLElement): void {
    // First pass: collect all state directives
    const stateElements: Array<{ el: HTMLElement; parsed: any }> = [];
    
    walkElement(root, (el, parsed) => {
      if (parsed.name === 'state') {
        stateElements.push({ el, parsed });
      }
    });

    // Initialize states from top to bottom
    stateElements.forEach(({ el, parsed }) => {
      const directive = this.directives.get('state');
      if (directive?.init) {
        const binding = createBinding(parsed);
        directive.init(el, binding, this);
      }
    });

    // Second pass: bind all other directives
    walkElement(root, (el, parsed) => {
      const directive = this.directives.get(parsed.name);
      if (!directive || parsed.name === 'state') return;

      const binding = createBinding(parsed);
      
      if (directive.init) {
        directive.init(el, binding, this);
      }
      
      if (directive.bind) {
        directive.bind(el, binding, this);
      }
    });
  }
}