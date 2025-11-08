import type { Directive, UusInstance } from '@uusjs/core';
import type {
  AnimationOptions,
  AnimationController,
  ScrollAnimationOptions,
  StaggerOptions,
  SpringOptions,
} from './types';
import { presets } from './presets';
import { getEasing } from './easings';
import { createSpringAnimation } from './spring';

// Animate directive
export const animateDirective: Directive = {
  name: 'animate',
  bind(el, binding, uus) {
    const animationName = binding.expression || 'fadeIn';
    const preset = presets[animationName];

    if (!preset) {
      console.warn(`Animation preset '${animationName}' not found`);
      return;
    }

    // Get animation options from other directives
    const duration = getAttributeValue(
      el,
      'uus-duration',
      preset.options.duration
    );
    const delay = getAttributeValue(el, 'uus-delay', preset.options.delay);
    const easing = el.getAttribute('uus-easing') || preset.options.easing;
    const trigger = el.getAttribute('uus-trigger') || 'immediate';

    const animationOptions: KeyframeAnimationOptions = {
      duration,
      delay,
      easing: typeof easing === 'string' ? easing : 'linear',
      fill: preset.options.fill || 'both',
    };

    const runAnimation = () => {
      const animation = el.animate(preset.keyframes, animationOptions);
      return animation;
    };

    // Handle different triggers
    let eventCleanup: (() => void) | null = null;

    if (trigger === 'immediate') {
      runAnimation();
    } else if (trigger === 'visible') {
      setupScrollAnimation(el, runAnimation, binding, uus);
    } else if (trigger === 'hover') {
      el.addEventListener('mouseenter', runAnimation);
      eventCleanup = () => el.removeEventListener('mouseenter', runAnimation);
    } else if (trigger === 'click') {
      el.addEventListener('click', runAnimation);
      eventCleanup = () => el.removeEventListener('click', runAnimation);
    }

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(() => {
      // Cancel any running animations
      el.getAnimations().forEach((animation) => animation.cancel());
      // Remove event listener if it exists
      if (eventCleanup) eventCleanup();
    });
    uus.cleanups.set(el, cleanups);
  },
};

// Duration directive
export const durationDirective: Directive = {
  name: 'duration',
  bind(el, binding) {
    el.setAttribute('data-uus-duration', binding.expression || '300');
  },
};

// Delay directive
export const delayDirective: Directive = {
  name: 'delay',
  bind(el, binding) {
    el.setAttribute('data-uus-delay', binding.expression || '0');
  },
};

// Easing directive
export const easingDirective: Directive = {
  name: 'easing',
  bind(el, binding) {
    el.setAttribute('data-uus-easing', binding.expression || 'ease-out');
  },
};

// Trigger directive
export const triggerDirective: Directive = {
  name: 'trigger',
  bind(el, binding) {
    el.setAttribute('data-uus-trigger', binding.expression || 'immediate');
  },
};

// Stagger directive for animating children
export const staggerDirective: Directive = {
  name: 'stagger',
  bind(el, binding, uus) {
    const delay = parseInt(binding.expression || '50');
    const direction = el.getAttribute('uus-stagger-dir') || 'normal';

    const children = Array.from(el.children) as HTMLElement[];
    if (direction === 'reverse') {
      children.reverse();
    } else if (direction === 'center') {
      // Sort from center outward
      const center = Math.floor(children.length / 2);
      children.sort((a, b) => {
        const aIndex = Array.from(el.children).indexOf(a);
        const bIndex = Array.from(el.children).indexOf(b);
        return Math.abs(aIndex - center) - Math.abs(bIndex - center);
      });
    } else if (direction === 'random') {
      // Shuffle array
      for (let i = children.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [children[i], children[j]] = [children[j], children[i]];
      }
    }

    children.forEach((child, index) => {
      const existingDelay = getAttributeValue(child, 'uus-delay', 0);
      child.setAttribute(
        'data-uus-delay',
        String(existingDelay + delay * index)
      );
    });
  },
};

// Spring animation directive
export const springDirective: Directive = {
  name: 'spring',
  bind(el, binding, uus) {
    const expression = binding.expression || '';
    const [property, targetExpr] = expression.split(':').map((s) => s.trim());

    if (!property || !targetExpr) {
      console.error('Spring directive requires format: "property:targetValue"');
      return;
    }

    const options: SpringOptions = {
      stiffness: getAttributeValue(el, 'uus-stiffness', 180),
      damping: getAttributeValue(el, 'uus-damping', 12),
      mass: getAttributeValue(el, 'uus-mass', 1),
    };

    let cancel: (() => void) | null = null;

    const effect = (uus as any).effect(() => {
      // Evaluate target value
      const evaluator = (uus as any).createSafeEvaluator(uus.state);
      const targetValue = evaluator(targetExpr);

      if (typeof targetValue !== 'number') return;

      // Get current value
      const computedStyle = window.getComputedStyle(el);
      const currentValue =
        parseFloat(computedStyle.getPropertyValue(property)) || 0;

      // Cancel previous animation
      if (cancel) cancel();

      // Start spring animation
      cancel = createSpringAnimation(
        currentValue,
        targetValue,
        options,
        (value) => {
          el.style.setProperty(property, value + 'px');
        }
      );
    });

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(() => {
      if (cancel) cancel();
      effect();
    });
    uus.cleanups.set(el, cleanups);
  },
};

// Helper functions
function getAttributeValue(
  el: HTMLElement,
  attr: string,
  defaultValue: any
): any {
  const value = el.getAttribute(attr) || el.getAttribute(`data-${attr}`);
  if (!value) return defaultValue;

  const num = parseFloat(value);
  return isNaN(num) ? value : num;
}

function setupScrollAnimation(
  el: HTMLElement,
  animate: () => Animation,
  binding: any,
  uus: UusInstance
): void {
  const threshold = getAttributeValue(el, 'uus-threshold', 0.5);
  const once = el.hasAttribute('uus-once');

  let hasAnimated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && (!once || !hasAnimated)) {
          animate();
          hasAnimated = true;
        }
      });
    },
    { threshold }
  );

  observer.observe(el);

  // Store cleanup
  const cleanups = uus.cleanups.get(el) || new Set();
  cleanups.add(() => observer.disconnect());
  uus.cleanups.set(el, cleanups);
}
