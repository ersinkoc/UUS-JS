import type { Directive, UusInstance } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';

export const styleDirective: Directive = {
  name: 'style',
  bind(el, binding, uus) {
    const evaluator = createSafeEvaluator(uus.state);
    const originalStyle = el.getAttribute('style') || '';
    
    const cleanup = effect(() => {
      try {
        const value = evaluator(binding.expression || '{}');
        
        // Reset to original style
        el.setAttribute('style', originalStyle);
        
        if (typeof value === 'string') {
          // String syntax: merge with existing style
          const currentStyle = el.getAttribute('style') || '';
          el.setAttribute('style', currentStyle + '; ' + value);
        } else if (typeof value === 'object' && value !== null) {
          // Object syntax: { color: 'red', fontSize: '14px' }
          Object.entries(value).forEach(([prop, val]) => {
            if (val === null || val === undefined || val === '') {
              // Remove the style property
              (el.style as any)[prop] = '';
            } else {
              // Convert camelCase to kebab-case for CSS properties
              const cssProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
              el.style.setProperty(cssProp, String(val));
            }
          });
        }
      } catch (error) {
        console.error('Error updating styles:', error);
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