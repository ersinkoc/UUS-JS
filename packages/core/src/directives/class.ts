import type { Directive, UusInstance } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';

export const classDirective: Directive = {
  name: 'class',
  bind(el, binding, uus) {
    const evaluator = createSafeEvaluator(uus.state);
    const originalClasses = el.className;
    
    const cleanup = effect(() => {
      try {
        const value = evaluator(binding.expression || '{}');
        
        // Reset to original classes
        el.className = originalClasses;
        
        if (typeof value === 'string') {
          // String syntax: just add the classes
          el.classList.add(...value.split(' ').filter(Boolean));
        } else if (typeof value === 'object' && value !== null) {
          // Object syntax: { 'class-name': condition }
          Object.entries(value).forEach(([className, condition]) => {
            if (condition) {
              el.classList.add(className);
            } else {
              el.classList.remove(className);
            }
          });
        } else if (Array.isArray(value)) {
          // Array syntax: ['class1', 'class2']
          el.classList.add(...value.filter(Boolean));
        }
      } catch (error) {
        console.error('Error updating classes:', error);
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