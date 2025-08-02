export interface UusConfig {
  debug?: boolean;
  prefix?: string;
}

export interface GlobalConfig extends UusConfig {
  plugins?: UusPlugin[];
}

export interface UusPlugin {
  name: string;
  install: (uus: Uus) => void;
}

export interface Uus {
  mount(element: HTMLElement | string): void;
  unmount(): void;
  use(plugin: UusPlugin): void;
}

export type Effect = () => void | (() => void);
export type Computed<T> = () => T;

export interface ReactiveState {
  [key: string]: any;
}

export interface DirectiveBinding {
  value: any;
  oldValue?: any;
  arg?: string;
  modifiers?: Record<string, boolean>;
  expression?: string;
}

export interface Directive {
  name: string;
  init?: (el: HTMLElement, binding: DirectiveBinding, uus: UusInstance) => void;
  bind?: (el: HTMLElement, binding: DirectiveBinding, uus: UusInstance) => void;
  update?: (el: HTMLElement, binding: DirectiveBinding, uus: UusInstance) => void;
  unbind?: (el: HTMLElement, binding: DirectiveBinding, uus: UusInstance) => void;
}

export interface UusInstance {
  state: ReactiveState;
  effects: Set<Effect>;
  cleanups: WeakMap<object, Set<() => void>>;
  directives: Map<string, Directive>;
  rootElement: HTMLElement | null;
  config: UusConfig;
}