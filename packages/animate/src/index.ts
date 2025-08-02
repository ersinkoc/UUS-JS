import type { UusPlugin } from '@uusjs/core';
import {
  animateDirective,
  durationDirective,
  delayDirective,
  easingDirective,
  triggerDirective,
  staggerDirective,
  springDirective,
} from './animate';
import { flipDirective, layoutDirective } from './flip';
import { presets } from './presets';
import { easings, getEasing } from './easings';
import { Spring, createSpringAnimation } from './spring';

export * from './types';
export { presets, easings, getEasing, Spring, createSpringAnimation };

// Create animate plugin
export function createAnimate(): UusPlugin {
  return {
    name: 'uus-animate',
    install(uus: any) {
      // Register directives
      uus.registerDirective(animateDirective);
      uus.registerDirective(durationDirective);
      uus.registerDirective(delayDirective);
      uus.registerDirective(easingDirective);
      uus.registerDirective(triggerDirective);
      uus.registerDirective(staggerDirective);
      uus.registerDirective(springDirective);
      uus.registerDirective(flipDirective);
      uus.registerDirective(layoutDirective);

      // Add animation utilities to state
      uus.state.$animate = {
        presets,
        easings,
        spring: createSpringAnimation,
      };
    },
  };
}

// Convenience function to add custom presets
export function definePreset(
  name: string,
  keyframes: Keyframe[],
  options?: any
) {
  presets[name] = {
    name,
    keyframes,
    options: options || { duration: 300, easing: 'ease-out' },
  };
}

// Convenience function to add custom easings
export function defineEasing(name: string, fn: (t: number) => number) {
  easings[name] = fn;
}
