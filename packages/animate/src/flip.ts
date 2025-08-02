import type { Directive, UusInstance } from '@uusjs/core';
import type { FlipOptions } from './types';

interface FlipState {
  rect: DOMRect;
  opacity: string;
}

const flipStates = new WeakMap<HTMLElement, FlipState>();

export const flipDirective: Directive = {
  name: 'flip',
  init(el, binding, uus) {
    if (binding.expression !== 'true') return;

    const options: FlipOptions = {
      duration: parseInt(el.getAttribute('uus-flip-duration') || '300'),
      easing: el.getAttribute('uus-flip-easing') || 'ease-out',
      scale: el.hasAttribute('uus-flip-scale'),
      opacity: el.hasAttribute('uus-flip-opacity')
    };

    // Observe DOM changes
    const observer = new MutationObserver(() => {
      performFlip(el, options);
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Store initial state
    saveFlipState(el);

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(() => observer.disconnect());
    uus.cleanups.set(el, cleanups);
  }
};

function saveFlipState(el: HTMLElement): void {
  const rect = el.getBoundingClientRect();
  const opacity = window.getComputedStyle(el).opacity;
  
  flipStates.set(el, { rect, opacity });
}

function performFlip(el: HTMLElement, options: FlipOptions): void {
  const firstState = flipStates.get(el);
  if (!firstState) {
    saveFlipState(el);
    return;
  }

  // Last state
  const lastRect = el.getBoundingClientRect();
  const lastOpacity = window.getComputedStyle(el).opacity;

  // Calculate deltas
  const deltaX = firstState.rect.left - lastRect.left;
  const deltaY = firstState.rect.top - lastRect.top;
  const deltaW = firstState.rect.width / lastRect.width;
  const deltaH = firstState.rect.height / lastRect.height;

  // No change, skip animation
  if (deltaX === 0 && deltaY === 0 && deltaW === 1 && deltaH === 1) {
    return;
  }

  // Build transform
  let transform = `translate(${deltaX}px, ${deltaY}px)`;
  if (options.scale) {
    transform += ` scale(${deltaW}, ${deltaH})`;
  }

  // Invert
  el.style.transform = transform;
  el.style.transformOrigin = 'top left';
  
  if (options.opacity && firstState.opacity !== lastOpacity) {
    el.style.opacity = firstState.opacity;
  }

  // Force reflow
  el.offsetHeight;

  // Play
  el.style.transition = `transform ${options.duration}ms ${options.easing}`;
  if (options.opacity) {
    el.style.transition += `, opacity ${options.duration}ms ${options.easing}`;
  }
  
  el.style.transform = '';
  if (options.opacity) {
    el.style.opacity = lastOpacity;
  }

  // Cleanup after animation
  setTimeout(() => {
    el.style.transition = '';
    el.style.transformOrigin = '';
    saveFlipState(el);
  }, options.duration);
}

// Layout directive for FLIP animations
export const layoutDirective: Directive = {
  name: 'layout',
  bind(el, binding, uus) {
    const layoutType = binding.expression || 'flex';
    
    // Apply layout styles
    if (layoutType === 'grid') {
      el.style.display = 'grid';
      el.style.gridTemplateColumns = el.getAttribute('uus-cols') || 'repeat(auto-fill, minmax(200px, 1fr))';
      el.style.gap = el.getAttribute('uus-gap') || '1rem';
    } else if (layoutType === 'flex') {
      el.style.display = 'flex';
      el.style.flexWrap = el.getAttribute('uus-wrap') || 'wrap';
      el.style.gap = el.getAttribute('uus-gap') || '1rem';
    }

    // Enable FLIP if specified
    if (el.hasAttribute('uus-flip')) {
      flipDirective.init?.(el, { expression: 'true', value: true, modifiers: {} }, uus);
    }
  }
};