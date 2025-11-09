import type { Directive, BindDirectiveBinding } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import {
  asDirectiveName,
  asExpressionString,
  isBindDirectiveBinding,
} from '../type-guards';

// Blacklist of dangerous event handler attributes to prevent XSS attacks
const DANGEROUS_ATTRIBUTES = new Set([
  'onclick', 'onerror', 'onload', 'onmouseover',
  'onfocus', 'onblur', 'onchange', 'onsubmit',
  'onmouseenter', 'onmouseleave', 'onkeydown',
  'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup',
  'ondblclick', 'oncontextmenu', 'oninput', 'oninvalid',
  'onreset', 'onselect', 'onabort', 'oncanplay',
  'oncanplaythrough', 'oncuechange', 'ondurationchange',
  'onemptied', 'onended', 'onloadeddata', 'onloadedmetadata',
  'onloadstart', 'onpause', 'onplay', 'onplaying',
  'onprogress', 'onratechange', 'onseeked', 'onseeking',
  'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange',
  'onwaiting', 'onwheel', 'oncopy', 'oncut', 'onpaste',
  'onanimationstart', 'onanimationend', 'onanimationiteration',
  'ontransitionend', 'ontransitionstart', 'ontransitioncancel',
  'ontransitionrun', 'ondrag', 'ondragend', 'ondragenter',
  'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
  'onscroll', 'onresize', 'onfocusin', 'onfocusout',
]);

export const bindDirective: Directive<BindDirectiveBinding> = {
  name: asDirectiveName('bind'),
  bind(el, binding, uus) {
    if (!binding.arg) {
      console.error('Attribute name required for uus-bind');
      return;
    }

    if (!isBindDirectiveBinding(binding)) {
      console.error('Invalid binding for bind directive');
      return;
    }

    const attrName = binding.arg;
    const evaluator = createSafeEvaluator(uus.state);

    const cleanup = effect(() => {
      try {
        const value = evaluator(
          binding.expression
            ? asExpressionString(binding.expression)
            : asExpressionString('')
        );

        // Special handling for certain attributes
        if (attrName === 'class') {
          if (typeof value === 'object' && value !== null) {
            // Object syntax: { 'class-name': condition }
            Object.entries(value).forEach(([className, condition]) => {
              if (condition) {
                el.classList.add(className);
              } else {
                el.classList.remove(className);
              }
            });
          } else {
            // String syntax
            el.className = String(value ?? '');
          }
        } else if (attrName === 'style') {
          if (typeof value === 'object' && value !== null) {
            // Object syntax: { color: 'red', fontSize: '14px' }
            Object.entries(value).forEach(([prop, val]) => {
              (el.style as unknown as Record<string, string>)[prop] = String(
                val ?? ''
              );
            });
          } else {
            // String syntax
            el.setAttribute('style', String(value ?? ''));
          }
        } else if (value === false || value === null || value === undefined) {
          // Remove attribute for falsy values
          el.removeAttribute(attrName);
        } else {
          // Validate attribute name to prevent XSS attacks via event handler attributes
          if (DANGEROUS_ATTRIBUTES.has(attrName.toLowerCase())) {
            console.error(`Dangerous attribute binding blocked: ${attrName}`);
            return;
          }

          // Set attribute value
          el.setAttribute(attrName, String(value));
        }
      } catch (error) {
        console.error(`Error binding attribute ${attrName}:`, error);
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
