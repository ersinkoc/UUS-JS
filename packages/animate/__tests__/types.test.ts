import { describe, it, expect } from 'vitest';
import type {
  AnimationOptions,
  EasingFunction,
  AnimationPreset,
  SpringOptions,
  AnimationController,
  ScrollAnimationOptions,
  StaggerOptions,
  FlipOptions,
} from '../src/types';

describe('Animation Types', () => {
  describe('AnimationOptions', () => {
    it('should have optional properties', () => {
      const options: AnimationOptions = {};
      expect(options).toBeDefined();

      const fullOptions: AnimationOptions = {
        duration: 300,
        delay: 100,
        easing: 'ease-out',
        fill: 'both',
        iterations: 2,
        direction: 'alternate',
      };
      expect(fullOptions.duration).toBe(300);
      expect(fullOptions.delay).toBe(100);
      expect(fullOptions.easing).toBe('ease-out');
    });

    it('should accept easing as function', () => {
      const easingFn: EasingFunction = (t: number) => t * t;
      const options: AnimationOptions = {
        easing: easingFn,
      };
      expect(typeof options.easing).toBe('function');
    });

    it('should have correct fill mode values', () => {
      const fills: AnimationOptions['fill'][] = [
        'none',
        'forwards',
        'backwards',
        'both',
      ];
      fills.forEach((fill) => {
        const options: AnimationOptions = { fill };
        expect(options.fill).toBe(fill);
      });
    });

    it('should have correct direction values', () => {
      const directions: AnimationOptions['direction'][] = [
        'normal',
        'reverse',
        'alternate',
        'alternate-reverse',
      ];
      directions.forEach((direction) => {
        const options: AnimationOptions = { direction };
        expect(options.direction).toBe(direction);
      });
    });
  });

  describe('EasingFunction', () => {
    it('should accept time parameter and return number', () => {
      const easing: EasingFunction = (t: number) => t * t;
      expect(easing(0.5)).toBe(0.25);
      expect(easing(0)).toBe(0);
      expect(easing(1)).toBe(1);
    });

    it('should handle edge cases', () => {
      const easing: EasingFunction = (t: number) => {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        return t;
      };

      expect(easing(-0.5)).toBe(0);
      expect(easing(1.5)).toBe(1);
      expect(easing(0.5)).toBe(0.5);
    });
  });

  describe('AnimationPreset', () => {
    it('should have required properties', () => {
      const preset: AnimationPreset = {
        name: 'fadeIn',
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        options: {
          duration: 300,
          easing: 'ease-out',
        },
      };

      expect(preset.name).toBe('fadeIn');
      expect(preset.keyframes).toHaveLength(2);
      expect(preset.options.duration).toBe(300);
    });

    it('should accept complex keyframes', () => {
      const preset: AnimationPreset = {
        name: 'bounce',
        keyframes: [
          { transform: 'scale(0)', opacity: 0, offset: 0 },
          { transform: 'scale(1.2)', opacity: 1, offset: 0.5 },
          { transform: 'scale(1)', opacity: 1, offset: 1 },
        ],
        options: {
          duration: 600,
          easing: 'ease-out',
        },
      };

      expect(preset.keyframes).toHaveLength(3);
      expect(preset.keyframes[1]).toHaveProperty('offset', 0.5);
    });
  });

  describe('SpringOptions', () => {
    it('should have optional properties', () => {
      const options: SpringOptions = {};
      expect(options).toBeDefined();

      const fullOptions: SpringOptions = {
        stiffness: 180,
        damping: 12,
        mass: 1,
        velocity: 0,
      };

      expect(fullOptions.stiffness).toBe(180);
      expect(fullOptions.damping).toBe(12);
      expect(fullOptions.mass).toBe(1);
      expect(fullOptions.velocity).toBe(0);
    });

    it('should accept numeric values', () => {
      const options: SpringOptions = {
        stiffness: 300,
        damping: 20,
        mass: 2,
        velocity: 100,
      };

      expect(typeof options.stiffness).toBe('number');
      expect(typeof options.damping).toBe('number');
      expect(typeof options.mass).toBe('number');
      expect(typeof options.velocity).toBe('number');
    });
  });

  describe('AnimationController', () => {
    it('should have required methods', () => {
      const controller: AnimationController = {
        play: () => {},
        pause: () => {},
        reverse: () => {},
        finish: () => {},
        cancel: () => {},
      };

      expect(typeof controller.play).toBe('function');
      expect(typeof controller.pause).toBe('function');
      expect(typeof controller.reverse).toBe('function');
      expect(typeof controller.finish).toBe('function');
      expect(typeof controller.cancel).toBe('function');
    });

    it('should have optional callback properties', () => {
      const controller: AnimationController = {
        play: () => {},
        pause: () => {},
        reverse: () => {},
        finish: () => {},
        cancel: () => {},
        onfinish: () => console.log('finished'),
        oncancel: () => console.log('cancelled'),
      };

      expect(typeof controller.onfinish).toBe('function');
      expect(typeof controller.oncancel).toBe('function');
    });
  });

  describe('ScrollAnimationOptions', () => {
    it('should extend AnimationOptions', () => {
      const options: ScrollAnimationOptions = {
        duration: 300,
        threshold: 0.5,
        rootMargin: '10px',
        once: true,
      };

      expect(options.duration).toBe(300);
      expect(options.threshold).toBe(0.5);
      expect(options.rootMargin).toBe('10px');
      expect(options.once).toBe(true);
    });

    it('should have optional scroll-specific properties', () => {
      const options: ScrollAnimationOptions = {};
      expect(options).toBeDefined();
    });
  });

  describe('StaggerOptions', () => {
    it('should have optional properties', () => {
      const options: StaggerOptions = {};
      expect(options).toBeDefined();

      const fullOptions: StaggerOptions = {
        delay: 100,
        direction: 'reverse',
        easing: 'ease-out',
      };

      expect(fullOptions.delay).toBe(100);
      expect(fullOptions.direction).toBe('reverse');
      expect(fullOptions.easing).toBe('ease-out');
    });

    it('should accept easing as function', () => {
      const easingFn: EasingFunction = (t: number) => t * t;
      const options: StaggerOptions = {
        easing: easingFn,
      };
      expect(typeof options.easing).toBe('function');
    });

    it('should have correct direction values', () => {
      const directions: StaggerOptions['direction'][] = [
        'normal',
        'reverse',
        'center',
        'random',
      ];
      directions.forEach((direction) => {
        const options: StaggerOptions = { direction };
        expect(options.direction).toBe(direction);
      });
    });
  });

  describe('FlipOptions', () => {
    it('should have optional properties', () => {
      const options: FlipOptions = {};
      expect(options).toBeDefined();

      const fullOptions: FlipOptions = {
        duration: 300,
        easing: 'ease-out',
        scale: true,
        opacity: false,
      };

      expect(fullOptions.duration).toBe(300);
      expect(fullOptions.easing).toBe('ease-out');
      expect(fullOptions.scale).toBe(true);
      expect(fullOptions.opacity).toBe(false);
    });

    it('should accept easing as function', () => {
      const easingFn: EasingFunction = (t: number) => t * t;
      const options: FlipOptions = {
        easing: easingFn,
      };
      expect(typeof options.easing).toBe('function');
    });

    it('should accept boolean flags', () => {
      const options: FlipOptions = {
        scale: true,
        opacity: true,
      };

      expect(typeof options.scale).toBe('boolean');
      expect(typeof options.opacity).toBe('boolean');
    });
  });

  describe('Type compatibility', () => {
    it('should allow AnimationOptions in SpringOptions context', () => {
      const animationOptions: AnimationOptions = {
        duration: 300,
        easing: 'ease-out',
      };

      // This should be valid TypeScript
      const springOptions: SpringOptions = {
        stiffness: 180,
      };

      expect(animationOptions.duration).toBe(300);
      expect(springOptions.stiffness).toBe(180);
    });

    it('should allow EasingFunction in various contexts', () => {
      const easing: EasingFunction = (t: number) => t * t;

      const animationOptions: AnimationOptions = { easing };
      const staggerOptions: StaggerOptions = { easing };
      const flipOptions: FlipOptions = { easing };

      expect(animationOptions.easing).toBe(easing);
      expect(staggerOptions.easing).toBe(easing);
      expect(flipOptions.easing).toBe(easing);
    });

    it('should support method chaining patterns', () => {
      interface ChainableController extends AnimationController {
        then<T>(fn: () => T): T;
      }

      const controller: ChainableController = {
        play: () => {},
        pause: () => {},
        reverse: () => {},
        finish: () => {},
        cancel: () => {},
        then: <T>(fn: () => T) => fn(),
      };

      const result = controller.then(() => 'completed');
      expect(result).toBe('completed');
    });
  });
});
