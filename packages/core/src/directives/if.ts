import type { Directive, UusInstance } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';

export const ifDirective: Directive = {
  name: 'if',
  bind(el, binding, uus) {
    const evaluator = createSafeEvaluator(uus.state);
    const comment = document.createComment('uus-if');
    let parent = el.parentNode;
    
    if (!parent) {
      console.error('Element must have a parent for uus-if');
      return;
    }

    // Track if this is first run
    let isFirstRun = true;
    let isShown = true; // Element starts in DOM
    
    const cleanup = effect(() => {
      try {
        const shouldShow = evaluator(binding.expression || 'true');
        
        // Skip the first run to keep element in place initially
        if (isFirstRun) {
          isFirstRun = false;
          // Only update isShown if condition is false
          if (!shouldShow) {
            isShown = true; // Keep tracking that element is shown even though condition is false
          }
          return;
        }
        
        if (shouldShow && !isShown) {
          // Show element - ensure we have the correct parent
          if (comment.parentNode) {
            parent = comment.parentNode;
            parent.replaceChild(el, comment);
            isShown = true;
          }
        } else if (!shouldShow && isShown) {
          // Hide element - ensure element is in DOM
          if (el.parentNode) {
            parent = el.parentNode;
            parent.replaceChild(comment, el);
            isShown = false;
          }
        }
      } catch (error) {
        console.error('Error evaluating if condition:', error);
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