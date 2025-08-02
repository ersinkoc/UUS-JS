import type { Directive, UusInstance } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';

export const showDirective: Directive = {
  name: 'show',
  bind(el, binding, uus) {
    const evaluator = createSafeEvaluator(uus.state);
    const originalDisplay = el.style.display || '';
    
    const cleanup = effect(() => {
      try {
        const value = evaluator(binding.expression || 'true');
        el.style.display = value ? originalDisplay : 'none';
      } catch (error) {
        console.error('Error evaluating show condition:', error);
        el.style.display = originalDisplay;
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