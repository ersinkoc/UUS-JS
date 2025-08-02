import { describe, it, expect, vi } from 'vitest';
import {
  createReactive,
  reactive,
  ref,
  computed,
  effect,
  watch,
  isRef,
  isReactive,
  unref,
  toRaw,
  markRaw,
} from '../src/reactive';

describe('Reactive System', () => {
  describe('createReactive', () => {
    it('should create a reactive proxy', () => {
      const state = createReactive({ count: 0 });
      expect(state.count).toBe(0);
    });

    it('should track dependencies', () => {
      const state = createReactive({ count: 0 });
      const fn = vi.fn();

      effect(() => {
        fn(state.count);
      });

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(0);

      state.count = 5;
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith(5);
    });

    it('should handle nested objects', () => {
      const state = createReactive({
        user: {
          name: 'John',
          settings: { theme: 'dark' },
        },
      });
      const fn = vi.fn();

      effect(() => {
        fn(state.user.settings.theme);
      });

      expect(fn).toHaveBeenCalledWith('dark');

      state.user.settings.theme = 'light';
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('light');
    });

    it('should handle array mutations', () => {
      const state = createReactive({ items: ['a', 'b'] });
      const fn = vi.fn();

      effect(() => {
        fn(state.items.length);
      });

      expect(fn).toHaveBeenCalledWith(2);

      state.items.push('c');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith(3);
    });
  });

  describe('effect', () => {
    it('should run immediately', () => {
      const fn = vi.fn();
      effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return cleanup function', () => {
      const state = createReactive({ count: 0 });
      const fn = vi.fn();

      const cleanup = effect(() => {
        fn(state.count);
      });

      expect(fn).toHaveBeenCalledTimes(1);

      cleanup();
      state.count = 1;

      // Should not be called after cleanup
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle effect cleanup', () => {
      const cleanupFn = vi.fn();
      const state = createReactive({ count: 0 });

      effect(() => {
        state.count; // Access to track
        return cleanupFn;
      });

      expect(cleanupFn).not.toHaveBeenCalled();

      state.count = 1;
      expect(cleanupFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('computed', () => {
    it('should compute derived values', () => {
      const state = createReactive({ price: 100, tax: 0.1 });
      const total = computed(() => state.price + state.price * state.tax);

      expect(total.value).toBe(110);

      state.price = 200;
      expect(total.value).toBe(220);

      state.tax = 0.2;
      expect(total.value).toBe(240);
    });

    it('should cache computed values', () => {
      const state = createReactive({ count: 0 });
      const fn = vi.fn(() => state.count * 2);
      const double = computed(fn);

      // First access
      expect(double.value).toBe(0);
      expect(fn).toHaveBeenCalledTimes(1);

      // Second access (should use cache)
      expect(double.value).toBe(0);
      expect(fn).toHaveBeenCalledTimes(1);

      // After state change
      state.count = 5;
      expect(double.value).toBe(10);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('watch', () => {
    it('should watch ref changes', () => {
      const count = ref(0);
      const cb = vi.fn();

      watch(() => count.value, cb);

      expect(cb).not.toHaveBeenCalled();

      count.value++;
      expect(cb).toHaveBeenCalledWith(1, 0);
    });

    it('should support immediate option', () => {
      const count = ref(0);
      const cb = vi.fn();

      watch(() => count.value, cb, { immediate: true });

      expect(cb).toHaveBeenCalledWith(0, undefined);
    });

    it('should return stop function', () => {
      const count = ref(0);
      const cb = vi.fn();

      const stop = watch(() => count.value, cb);

      count.value++;
      expect(cb).toHaveBeenCalledTimes(1);

      stop();
      count.value++;
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('utility functions', () => {
    it('should unref values', () => {
      const ref1 = ref(1);
      const val = 2;

      expect(unref(ref1)).toBe(1);
      expect(unref(val)).toBe(2);
    });

    it('should get raw values', () => {
      const obj = { count: 0 };
      const reactiveObj = reactive(obj);

      expect(toRaw(reactiveObj)).toBe(obj);
      expect(toRaw(obj)).toBe(obj);
    });

    it('should mark values as raw', () => {
      const obj = markRaw({ count: 0 });
      const reactiveObj = reactive({ obj });

      expect(isReactive(reactiveObj.obj)).toBe(false);

      let dummy;
      effect(() => {
        dummy = reactiveObj.obj.count;
      });

      expect(dummy).toBe(0);
      reactiveObj.obj.count = 1;
      expect(dummy).toBe(0); // Should not update
    });

    it('should detect reactive objects', () => {
      const obj = { count: 0 };
      const reactiveObj = reactive(obj);

      expect(isReactive(obj)).toBe(false);
      expect(isReactive(reactiveObj)).toBe(true);
    });

    it('should handle nested ref tracking', () => {
      const innerRef = ref(1);
      const outerRef = ref(innerRef);

      expect(outerRef.value).toBe(1);
      innerRef.value = 2;
      expect(outerRef.value).toBe(2);
    });

    it('should handle array index access and modifications', () => {
      const arr = reactive([1, 2, 3]);
      let sum;
      let lengthValue;

      effect(() => {
        sum = arr.reduce((a, b) => a + b, 0);
        lengthValue = arr.length;
      });

      expect(sum).toBe(6);
      expect(lengthValue).toBe(3);

      arr[0] = 10;
      expect(sum).toBe(15);

      arr.push(4);
      expect(lengthValue).toBe(4);
      expect(sum).toBe(19);
    });

    it('should handle delete property', () => {
      const obj = reactive({ a: 1, b: 2 });
      let keys;

      effect(() => {
        keys = Object.keys(obj);
      });

      expect(keys).toEqual(['a', 'b']);

      delete obj.b;
      expect(keys).toEqual(['a']);
    });

    it('should handle has property checks', () => {
      const obj = reactive({ a: 1 });
      let hasA;

      effect(() => {
        hasA = 'a' in obj;
      });

      expect(hasA).toBe(true);

      delete obj.a;
      expect(hasA).toBe(false);
    });

    it('should handle ownKeys enumeration', () => {
      const obj = reactive({ a: 1, b: 2 });
      let keys;

      effect(() => {
        keys = Object.keys(obj);
      });

      expect(keys).toEqual(['a', 'b']);

      obj.c = 3;
      expect(keys).toEqual(['a', 'b', 'c']);
    });

    it('should return existing reactive proxy', () => {
      const obj = { count: 0 };
      const reactive1 = reactive(obj);
      const reactive2 = reactive(obj);

      expect(reactive1).toBe(reactive2);
    });

    it('should not make already reactive objects reactive again', () => {
      const obj = { count: 0 };
      const reactiveObj = reactive(obj);
      const doubleReactive = reactive(reactiveObj);

      expect(reactiveObj).toBe(doubleReactive);
    });

    it('should handle __raw property access', () => {
      const obj = { count: 0 };
      const reactiveObj = reactive(obj);

      expect((reactiveObj as any).__raw).toBe(obj);
    });

    it('should handle __isReactive property access', () => {
      const reactiveObj = reactive({ count: 0 });

      expect((reactiveObj as any).__isReactive).toBe(true);
    });
  });
});
