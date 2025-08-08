import type { Directive, ContentDirectiveBinding } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import { asDirectiveName, asExpressionString } from '../type-guards';
import DOMPurify from 'dompurify';

// Enhanced XSS protection using DOMPurify
function sanitizeHTML(html: string): string {
  // Configure DOMPurify for safe HTML sanitization
  const config = {
    ALLOWED_TAGS: [
      'a',
      'abbr',
      'b',
      'blockquote',
      'br',
      'code',
      'dd',
      'div',
      'dl',
      'dt',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'i',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      'small',
      'span',
      'strong',
      'sub',
      'sup',
      'table',
      'tbody',
      'td',
      'tfoot',
      'th',
      'thead',
      'tr',
      'u',
      'ul',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  };

  return DOMPurify.sanitize(html, config);
}

export const htmlDirective: Directive<ContentDirectiveBinding> = {
  name: asDirectiveName('html'),
  bind(el, binding, uus) {
    const evaluator = createSafeEvaluator(uus.state);

    const cleanup = effect(() => {
      try {
        const value = evaluator(
          binding.expression
            ? asExpressionString(binding.expression)
            : asExpressionString('')
        );
        // Sanitize HTML content to prevent XSS attacks
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
