import type { Directive, UusInstance } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';

export const modelDirective: Directive = {
  name: 'model',
  bind(el, binding, uus) {
    if (!(el instanceof HTMLInputElement || 
          el instanceof HTMLTextAreaElement || 
          el instanceof HTMLSelectElement)) {
      console.error('uus-model can only be used on input, textarea, or select elements');
      return;
    }

    const evaluator = createSafeEvaluator(uus.state);
    
    // Update element value when state changes
    const cleanup = effect(() => {
      try {
        const value = evaluator(binding.expression || '');
        if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
          el.checked = !!value;
        } else {
          el.value = String(value ?? '');
        }
      } catch (error) {
        console.error('Error updating model value:', error);
      }
    });

    // Update state when element value changes
    const updateState = () => {
      try {
        let value: any;
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
          value = el.checked;
        } else if (el instanceof HTMLInputElement && el.type === 'number') {
          value = el.valueAsNumber;
        } else {
          value = el.value;
        }

        // Parse the expression to get the property path
        const propPath = binding.expression?.trim();
        if (!propPath) return;

        // Simple property assignment (doesn't handle nested paths yet)
        const parts = propPath.split('.');
        let target: any = uus.state;
        
        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i];
          if (!key) return;
          target = target[key];
          if (!target) return;
        }
        
        const lastKey = parts[parts.length - 1];
        if (lastKey) {
          target[lastKey] = value;
        }
      } catch (error) {
        console.error('Error updating state from model:', error);
      }
    };

    // Listen for input events
    const eventType = el instanceof HTMLSelectElement ? 'change' : 'input';
    el.addEventListener(eventType, updateState);
    el.addEventListener('change', updateState);

    // Store cleanup functions
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(cleanup);
    cleanups.add(() => {
      el.removeEventListener(eventType, updateState);
      el.removeEventListener('change', updateState);
    });
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