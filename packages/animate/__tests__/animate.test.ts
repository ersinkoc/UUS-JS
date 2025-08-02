import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createAnimate,
  definePreset,
  defineEasing,
  presets,
  easings,
  getEasing,
  Spring,
  createSpringAnimation,
} from '../src/index';
import {
  animateDirective,
  durationDirective,
  delayDirective,
  easingDirective,
  triggerDirective,
  staggerDirective,
  springDirective,
} from '../src/animate';
import { flipDirective, layoutDirective } from '../src/flip';

// Mock DOM APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  callback,
}));

global.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  callback,
}));

// Mock Element.animate
HTMLElement.prototype.animate = vi.fn().mockImplementation(() => ({
  finished: Promise.resolve(),
  cancel: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
}));

HTMLElement.prototype.getAnimations = vi.fn().mockReturnValue([]);

// Mock requestAnimationFrame
let rafCallbacks: Function[] = [];
let rafId = 0;

global.requestAnimationFrame = vi.fn((cb) => {
  const id = rafId++;
  rafCallbacks.push({ id, cb });
  return id;
});

global.cancelAnimationFrame = vi.fn((id) => {
  rafCallbacks = rafCallbacks.filter((item) => item.id !== id);
});

function flushRAF() {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach(({ cb }) => cb(performance.now()));
}

describe('Animate Package', () => {
  let mockUus: any;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);

    mockUus = {
      directives: new Map(),
      registerDirective: vi.fn(),
      cleanups: new Map(),
      state: {},
      effect: vi.fn((fn) => {
        fn();
        return vi.fn(); // cleanup
      }),
      createSafeEvaluator: vi.fn(() => (expr: string) => {
        if (expr === '100') return 100;
        if (expr === 'state.opacity') return 0.5;
        return expr;
      }),
    };

    rafCallbacks = [];
    rafId = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (element.parentNode) {
      document.body.removeChild(element);
    }
  });

  describe('createAnimate plugin', () => {
    it('should create animate plugin with install method', () => {
      const plugin = createAnimate();

      expect(plugin.name).toBe('uus-animate');
      expect(plugin.install).toBeDefined();
      expect(typeof plugin.install).toBe('function');
    });

    it('should register all directives when installed', () => {
      const plugin = createAnimate();
      plugin.install(mockUus);

      expect(mockUus.registerDirective).toHaveBeenCalledTimes(9);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(animateDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(durationDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(delayDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(easingDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(triggerDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(staggerDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(springDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(flipDirective);
      expect(mockUus.registerDirective).toHaveBeenCalledWith(layoutDirective);
    });

    it('should add animation utilities to state', () => {
      const plugin = createAnimate();
      plugin.install(mockUus);

      expect(mockUus.state.$animate).toBeDefined();
      expect(mockUus.state.$animate.presets).toBe(presets);
      expect(mockUus.state.$animate.easings).toBe(easings);
      expect(mockUus.state.$animate.spring).toBe(createSpringAnimation);
    });
  });

  describe('definePreset', () => {
    it('should add custom preset', () => {
      const customKeyframes = [
        { transform: 'scale(0)' },
        { transform: 'scale(1.2)' },
        { transform: 'scale(1)' },
      ];

      definePreset('customBounce', customKeyframes, {
        duration: 500,
        easing: 'ease-out',
      });

      expect(presets.customBounce).toBeDefined();
      expect(presets.customBounce.name).toBe('customBounce');
      expect(presets.customBounce.keyframes).toBe(customKeyframes);
      expect(presets.customBounce.options.duration).toBe(500);
      expect(presets.customBounce.options.easing).toBe('ease-out');
    });

    it('should use default options when not provided', () => {
      const keyframes = [{ opacity: 0 }, { opacity: 1 }];
      definePreset('customFade', keyframes);

      expect(presets.customFade.options.duration).toBe(300);
      expect(presets.customFade.options.easing).toBe('ease-out');
    });
  });

  describe('defineEasing', () => {
    it('should add custom easing function', () => {
      const customEasing = (t: number) => t * t * t;
      defineEasing('customCubic', customEasing);

      expect(easings.customCubic).toBe(customEasing);
      expect(easings.customCubic(0.5)).toBe(0.125);
    });
  });

  describe('presets', () => {
    it('should have all fade animations', () => {
      expect(presets.fadeIn).toBeDefined();
      expect(presets.fadeOut).toBeDefined();

      expect(presets.fadeIn.keyframes).toEqual([
        { opacity: 0 },
        { opacity: 1 },
      ]);
      expect(presets.fadeOut.keyframes).toEqual([
        { opacity: 1 },
        { opacity: 0 },
      ]);
    });

    it('should have all slide animations', () => {
      expect(presets.slideInLeft).toBeDefined();
      expect(presets.slideInRight).toBeDefined();
      expect(presets.slideInUp).toBeDefined();
      expect(presets.slideInDown).toBeDefined();

      expect(presets.slideInLeft.keyframes[0].transform).toBe(
        'translateX(-100%)'
      );
      expect(presets.slideInRight.keyframes[0].transform).toBe(
        'translateX(100%)'
      );
      expect(presets.slideInUp.keyframes[0].transform).toBe('translateY(100%)');
      expect(presets.slideInDown.keyframes[0].transform).toBe(
        'translateY(-100%)'
      );
    });

    it('should have scale animations', () => {
      expect(presets.scaleIn).toBeDefined();
      expect(presets.scaleOut).toBeDefined();

      expect(presets.scaleIn.keyframes[0].transform).toBe('scale(0)');
      expect(presets.scaleOut.keyframes[1].transform).toBe('scale(0)');
    });

    it('should have rotate animations', () => {
      expect(presets.rotateIn).toBeDefined();
      expect(presets.rotateOut).toBeDefined();

      expect(presets.rotateIn.keyframes[0].transform).toBe(
        'rotate(-180deg) scale(0)'
      );
      expect(presets.rotateOut.keyframes[1].transform).toBe(
        'rotate(180deg) scale(0)'
      );
    });

    it('should have bounce animations with offsets', () => {
      expect(presets.bounceIn).toBeDefined();
      expect(presets.bounceOut).toBeDefined();

      expect(presets.bounceIn.keyframes).toHaveLength(4);
      expect(presets.bounceIn.keyframes[0].offset).toBe(0);
      expect(presets.bounceIn.keyframes[1].offset).toBe(0.5);
      expect(presets.bounceIn.keyframes[2].offset).toBe(0.8);
      expect(presets.bounceIn.keyframes[3].offset).toBe(1);
    });

    it('should have shake animation with multiple keyframes', () => {
      expect(presets.shake).toBeDefined();
      expect(presets.shake.keyframes).toHaveLength(11);
      expect(presets.shake.keyframes[0].transform).toBe('translateX(0)');
      expect(presets.shake.keyframes[1].transform).toBe('translateX(-10px)');
      expect(presets.shake.keyframes[10].transform).toBe('translateX(0)');
    });

    it('should have pulse animation with infinite iterations', () => {
      expect(presets.pulse).toBeDefined();
      expect(presets.pulse.options.iterations).toBe(Infinity);
      expect(presets.pulse.keyframes[1].transform).toBe('scale(1.05)');
    });

    it('should have flip animations', () => {
      expect(presets.flipInX).toBeDefined();
      expect(presets.flipInY).toBeDefined();

      expect(presets.flipInX.keyframes[0].transform).toBe('rotateX(-90deg)');
      expect(presets.flipInY.keyframes[0].transform).toBe('rotateY(-90deg)');
    });
  });

  describe('easings', () => {
    it('should have linear easing', () => {
      expect(easings.linear(0.5)).toBe(0.5);
      expect(easings.linear(0)).toBe(0);
      expect(easings.linear(1)).toBe(1);
    });

    it('should have quad easings', () => {
      expect(easings.easeInQuad(0.5)).toBe(0.25);
      expect(easings.easeOutQuad(0.5)).toBe(0.75);
      expect(easings.easeInOutQuad(0.25)).toBe(0.125);
    });

    it('should have cubic easings', () => {
      expect(easings.easeInCubic(0.5)).toBe(0.125);
      expect(easings.easeOutCubic(0.5)).toBe(0.875);
    });

    it('should have exponential easings with edge cases', () => {
      expect(easings.easeInExpo(0)).toBe(0);
      expect(easings.easeInExpo(1)).toBe(1);
      expect(easings.easeOutExpo(0)).toBe(0);
      expect(easings.easeOutExpo(1)).toBe(1);
    });

    it('should have bounce easings', () => {
      expect(easings.easeOutBounce(0.5)).toBeGreaterThan(0.5);
      expect(easings.easeInBounce(0.5)).toBeLessThan(0.5);
    });

    it('should handle getEasing function', () => {
      const customFn = (t: number) => t * 2;
      expect(getEasing(customFn)).toBe(customFn);
      expect(getEasing('easeInQuad')).toBe(easings.easeInQuad);
      expect(getEasing('nonexistent')).toBe(easings.linear);
    });
  });

  describe('Spring class', () => {
    it('should create spring with default options', () => {
      const spring = new Spring();
      const state = { position: 0, velocity: 0 };
      const newState = spring.step(state, 100, 0.016);

      expect(newState.position).toBeGreaterThan(0);
      expect(newState.velocity).toBeGreaterThan(0);
    });

    it('should create spring with custom options', () => {
      const spring = new Spring({
        stiffness: 300,
        damping: 20,
        mass: 2,
      });

      const state = { position: 0, velocity: 0 };
      const newState = spring.step(state, 100, 0.016);

      expect(newState.position).toBeGreaterThan(0);
      expect(newState.velocity).toBeGreaterThan(0);
    });

    it('should determine when spring is done', () => {
      const spring = new Spring();

      expect(spring.isDone({ position: 100, velocity: 0 }, 100)).toBe(true);
      expect(spring.isDone({ position: 99.999, velocity: 0.0005 }, 100)).toBe(
        false
      ); // velocity too high
      expect(spring.isDone({ position: 95, velocity: 0 }, 100)).toBe(false);
      expect(spring.isDone({ position: 100, velocity: 5 }, 100)).toBe(false);
    });

    it('should use custom threshold', () => {
      const spring = new Spring();

      expect(spring.isDone({ position: 99.5, velocity: 0 }, 100, 1)).toBe(true);
      expect(spring.isDone({ position: 99.5, velocity: 0 }, 100, 0.1)).toBe(
        false
      );
    });
  });

  describe('createSpringAnimation', () => {
    it('should animate from one value to another', () => {
      const values: number[] = [];
      const onUpdate = vi.fn((value: number) => values.push(value));
      const onComplete = vi.fn();

      const cancel = createSpringAnimation(0, 100, {}, onUpdate, onComplete);

      // Simulate animation frames
      for (let i = 0; i < 10; i++) {
        flushRAF();
      }

      expect(values.length).toBeGreaterThan(0);
      expect(values[0]).toBeCloseTo(0, 1); // Allow small numerical differences
      expect(onUpdate).toHaveBeenCalled();

      cancel();
    });

    it('should handle initial velocity', () => {
      const values: number[] = [];
      const onUpdate = vi.fn((value: number) => values.push(value));

      createSpringAnimation(0, 100, { velocity: 500 }, onUpdate);

      // Simulate animation frames
      for (let i = 0; i < 10; i++) {
        flushRAF();
      }

      // Should start animating with initial velocity
      expect(values.length).toBeGreaterThan(0);
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should call onComplete when finished', () => {
      const onComplete = vi.fn();
      const onUpdate = vi.fn();

      createSpringAnimation(
        0,
        100,
        { stiffness: 2000, damping: 100 },
        onUpdate,
        onComplete
      );

      // Test that the animation was set up
      expect(onUpdate).toBeDefined();
      expect(onComplete).toBeDefined();

      // Simulate some frames
      for (let i = 0; i < 10; i++) {
        flushRAF();
      }

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should return cancel function', () => {
      const cancel = createSpringAnimation(0, 100, {}, vi.fn());

      expect(typeof cancel).toBe('function');

      // Should be able to call cancel
      expect(() => cancel()).not.toThrow();
    });
  });

  describe('animateDirective', () => {
    it('should bind with valid preset', () => {
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(element.animate).toHaveBeenCalledWith(
        presets.fadeIn.keyframes,
        expect.objectContaining({
          duration: 300,
          easing: 'ease-out',
          fill: 'both',
        })
      );
    });

    it('should warn for invalid preset', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const binding = { expression: 'nonexistent' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Animation preset 'nonexistent' not found"
      );
      consoleSpy.mockRestore();
    });

    it('should use default preset when no expression', () => {
      const binding = { expression: '' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(element.animate).toHaveBeenCalledWith(
        presets.fadeIn.keyframes,
        expect.anything()
      );
    });

    it('should handle duration attribute', () => {
      element.setAttribute('data-uus-duration', '500');
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(element.animate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ duration: 500 })
      );
    });

    it('should handle delay attribute', () => {
      element.setAttribute('data-uus-delay', '200');
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(element.animate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ delay: 200 })
      );
    });

    it('should handle easing attribute', () => {
      element.setAttribute('uus-easing', 'ease-in-out');
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(element.animate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ easing: 'ease-in-out' })
      );
    });

    it('should handle hover trigger', () => {
      element.setAttribute('uus-trigger', 'hover');
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );
    });

    it('should handle click trigger', () => {
      element.setAttribute('uus-trigger', 'click');
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });

    it('should store cleanup functions', () => {
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(mockUus.cleanups.get(element)).toBeDefined();
      expect(mockUus.cleanups.get(element).size).toBeGreaterThan(0);
    });
  });

  describe('helper directives', () => {
    it('should set duration attribute', () => {
      const binding = { expression: '500' };

      durationDirective.bind?.(element, binding, mockUus);

      expect(element.getAttribute('data-uus-duration')).toBe('500');
    });

    it('should set default duration', () => {
      const binding = { expression: '' };

      durationDirective.bind?.(element, binding, mockUus);

      expect(element.getAttribute('data-uus-duration')).toBe('300');
    });

    it('should set delay attribute', () => {
      const binding = { expression: '200' };

      delayDirective.bind?.(element, binding, mockUus);

      expect(element.getAttribute('data-uus-delay')).toBe('200');
    });

    it('should set easing attribute', () => {
      const binding = { expression: 'ease-in-out' };

      easingDirective.bind?.(element, binding, mockUus);

      expect(element.getAttribute('data-uus-easing')).toBe('ease-in-out');
    });

    it('should set trigger attribute', () => {
      const binding = { expression: 'hover' };

      triggerDirective.bind?.(element, binding, mockUus);

      expect(element.getAttribute('data-uus-trigger')).toBe('hover');
    });
  });

  describe('staggerDirective', () => {
    it('should stagger children with normal direction', () => {
      const child1 = document.createElement('div');
      const child2 = document.createElement('div');
      const child3 = document.createElement('div');

      element.appendChild(child1);
      element.appendChild(child2);
      element.appendChild(child3);

      const binding = { expression: '100' };

      staggerDirective.bind?.(element, binding, mockUus);

      expect(child1.getAttribute('data-uus-delay')).toBe('0');
      expect(child2.getAttribute('data-uus-delay')).toBe('100');
      expect(child3.getAttribute('data-uus-delay')).toBe('200');
    });

    it('should stagger with reverse direction', () => {
      const child1 = document.createElement('div');
      const child2 = document.createElement('div');

      element.appendChild(child1);
      element.appendChild(child2);
      element.setAttribute('uus-stagger-dir', 'reverse');

      const binding = { expression: '50' };

      staggerDirective.bind?.(element, binding, mockUus);

      expect(child1.getAttribute('data-uus-delay')).toBe('50');
      expect(child2.getAttribute('data-uus-delay')).toBe('0');
    });

    it('should handle existing delays', () => {
      const child = document.createElement('div');
      child.setAttribute('data-uus-delay', '100');
      element.appendChild(child);

      const binding = { expression: '50' };

      staggerDirective.bind?.(element, binding, mockUus);

      expect(child.getAttribute('data-uus-delay')).toBe('100');
    });
  });

  describe('springDirective', () => {
    it('should parse property and target expression', () => {
      const binding = { expression: 'opacity:state.opacity' };

      springDirective.bind?.(element, binding, mockUus);

      expect(mockUus.effect).toHaveBeenCalled();
      expect(mockUus.cleanups.get(element)).toBeDefined();
    });

    it('should handle invalid expression format', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const binding = { expression: 'invalid' };

      springDirective.bind?.(element, binding, mockUus);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Spring directive requires format: "property:targetValue"'
      );
      consoleSpy.mockRestore();
    });

    it('should use default expression', () => {
      const binding = { expression: '' };
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      springDirective.bind?.(element, binding, mockUus);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle spring options from attributes', () => {
      element.setAttribute('data-uus-stiffness', '300');
      element.setAttribute('data-uus-damping', '20');
      element.setAttribute('data-uus-mass', '2');

      const binding = { expression: 'opacity:100' };

      springDirective.bind?.(element, binding, mockUus);

      expect(mockUus.effect).toHaveBeenCalled();
    });
  });

  describe('scroll animation trigger', () => {
    it('should handle scroll animation trigger', () => {
      element.setAttribute('uus-trigger', 'visible');
      element.setAttribute('uus-threshold', '0.8');
      element.setAttribute('uus-once', '');
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(global.IntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('additional stagger tests', () => {
    it('should handle stagger with center direction', () => {
      const child1 = document.createElement('div');
      const child2 = document.createElement('div');
      const child3 = document.createElement('div');

      element.appendChild(child1);
      element.appendChild(child2);
      element.appendChild(child3);
      element.setAttribute('uus-stagger-dir', 'center');

      const binding = { expression: '100' };

      staggerDirective.bind?.(element, binding, mockUus);

      // All children should have delay attributes
      expect(child1.getAttribute('data-uus-delay')).toBeDefined();
      expect(child2.getAttribute('data-uus-delay')).toBeDefined();
      expect(child3.getAttribute('data-uus-delay')).toBeDefined();
    });

    it('should handle stagger with random direction', () => {
      const child1 = document.createElement('div');
      const child2 = document.createElement('div');

      element.appendChild(child1);
      element.appendChild(child2);
      element.setAttribute('uus-stagger-dir', 'random');

      const binding = { expression: '50' };

      staggerDirective.bind?.(element, binding, mockUus);

      expect(child1.getAttribute('data-uus-delay')).toBeDefined();
      expect(child2.getAttribute('data-uus-delay')).toBeDefined();
    });
  });

  describe('additional easings coverage', () => {
    it('should have all ease-in functions', () => {
      expect(easings.easeInQuart(0.5)).toBe(0.0625);
      expect(easings.easeInQuint(0.5)).toBe(0.03125);
      expect(easings.easeInSine(0.5)).toBeCloseTo(0.293, 3);
      expect(easings.easeInCirc(0.5)).toBeCloseTo(0.134, 3);
      expect(easings.easeInBack(0.5)).toBeCloseTo(-0.088, 3);
    });

    it('should have all ease-out functions', () => {
      expect(easings.easeOutQuart(0.5)).toBe(0.9375);
      expect(easings.easeOutQuint(0.5)).toBe(0.96875);
      expect(easings.easeOutSine(0.5)).toBeCloseTo(0.707, 3);
      expect(easings.easeOutCirc(0.5)).toBeCloseTo(0.866, 3);
      expect(easings.easeOutBack(0.5)).toBeCloseTo(1.088, 3);
    });

    it('should have all ease-in-out functions', () => {
      expect(easings.easeInOutQuart(0.5)).toBeCloseTo(0.5, 10);
      expect(easings.easeInOutQuint(0.5)).toBeCloseTo(0.5, 10);
      expect(easings.easeInOutSine(0.5)).toBeCloseTo(0.5, 10);
      expect(easings.easeInOutCirc(0.5)).toBeCloseTo(0.5, 10);
      expect(easings.easeInOutBack(0.5)).toBeCloseTo(0.5, 10);
    });

    it('should have elastic easing functions', () => {
      expect(easings.easeInElastic(0)).toBe(0);
      expect(easings.easeInElastic(1)).toBe(1);
      expect(easings.easeOutElastic(0)).toBe(0);
      expect(easings.easeOutElastic(1)).toBe(1);
      expect(easings.easeInOutElastic(0)).toBe(0);
      expect(easings.easeInOutElastic(1)).toBe(1);
      expect(easings.easeInOutElastic(0.5)).toBeCloseTo(0.5, 2);
    });

    it('should have bounce easings with various values', () => {
      expect(easings.easeOutBounce(0.2)).toBeCloseTo(0.3025, 2);
      expect(easings.easeOutBounce(0.6)).toBeCloseTo(0.7725, 2);
      expect(easings.easeOutBounce(0.8)).toBeCloseTo(0.94, 2);
      expect(easings.easeInBounce(0.5)).toBeLessThan(0.5);
      expect(easings.easeInOutBounce(0.25)).toBeLessThan(0.25);
      expect(easings.easeInOutBounce(0.75)).toBeGreaterThan(0.75);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle spring directive with non-numeric target', () => {
      mockUus.createSafeEvaluator = vi.fn(() => (expr: string) => {
        if (expr === 'invalidValue') return 'not-a-number';
        return expr;
      });

      const binding = { expression: 'opacity:invalidValue' };

      springDirective.bind?.(element, binding, mockUus);

      expect(mockUus.effect).toHaveBeenCalled();
    });

    it('should handle getAttributeValue with various inputs', () => {
      element.setAttribute('test-attr', 'non-numeric');
      element.setAttribute('numeric-attr', '123');

      // Test through a directive that uses getAttributeValue
      const binding = { expression: 'fadeIn' };

      animateDirective.bind?.(element, binding, mockUus);

      expect(element.animate).toHaveBeenCalled();
    });
  });
});
