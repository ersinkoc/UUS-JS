import { Uus } from './uus';

export { Uus };
export type {
  UusConfig,
  GlobalConfig,
  UusPlugin,
  Directive,
  DirectiveBinding,
  ReactiveState,
  Effect,
  Computed,
} from './types';
export { createReactive, effect, computed } from './reactive';

// Auto-initialize if in browser with script tag
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (window as any).Uus = Uus;
}