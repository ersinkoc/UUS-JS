import type { Directive, ContentDirectiveBinding } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import { asDirectiveName, asExpressionString } from '../type-guards';

// Basic XSS protection - in production, consider using DOMPurify
function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  const text = div.innerHTML;

  // Allow basic tags but escape scripts
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

export const htmlDirective: Directive<ContentDirectiveBinding> = {
  name: asDirectiveName('html'),
  bind(el, binding, uus) {
    const evaluator = createSafeEvaluator(uus.state);

    const cleanup = effect(() => {
      try {
        const value = evaluator(binding.expression ? asExpressionString(binding.expression) : asExpressionString(''));
        const sanitized = sanitizeHTML(String(value ?? ''));
        el.innerHTML = sanitized;
      } catch (error) {
        console.error('Error updating HTML:', error);
        el.innerHTML = '';
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
