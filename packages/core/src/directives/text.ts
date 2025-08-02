import type { Directive, UusInstance } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';

export const textDirective: Directive = {
  name: 'text',
  bind(el, binding, uus) {
    const evaluator = createSafeEvaluator(uus.state);
    
    const cleanup = effect(() => {
      try {
        const value = evaluator(binding.expression || '');
        el.textContent = String(value ?? '');
      } catch (error) {
        console.error('Error updating text:', error);
        el.textContent = '';
      }
    });

    // Store cleanup function
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(cleanup);
    uus.cleanups.set(el, cleanups);
  },
  unbind(el, _, uus) {
    const cleanups = uus.cleanups.get(el);
    if (cleanups) {
      cleanups.forEach((cleanup) => cleanup());
      uus.cleanups.delete(el);
    }
  },
};