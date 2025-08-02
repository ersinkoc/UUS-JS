import type { Effect, ReactiveState } from './types';

let activeEffect: Effect | null = null;
const targetMap = new WeakMap<object, Map<string | symbol, Set<Effect>>>();
const effectDepsMap = new WeakMap<Effect, Set<Set<Effect>>>();

export function track(target: object, key: string | symbol): void {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }

  deps.add(activeEffect);

  // Track this dependency set for the current effect
  let effectDeps = effectDepsMap.get(activeEffect);
  if (!effectDeps) {
    effectDeps = new Set();
    effectDepsMap.set(activeEffect, effectDeps);
  }
  effectDeps.add(deps);
}

export function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);
  if (!deps) return;

  const effectsToRun = new Set(deps);
  effectsToRun.forEach((effect) => {
    if (effect !== activeEffect) {
      effect();
    }
  });
}

export function effect(fn: Effect): () => void {
  let cleanup: (() => void) | void;
  let stopped = false;

  const effectFn = () => {
    if (stopped) return;
    
    // Clean up previous run
    if (cleanup && typeof cleanup === 'function') {
      cleanup();
    }
    
    // Clear previous dependencies
    const effectDeps = effectDepsMap.get(effectFn);
    if (effectDeps) {
      effectDeps.forEach(dep => dep.delete(effectFn));
      effectDeps.clear();
    }
    
    activeEffect = effectFn;
    cleanup = fn();
    activeEffect = null;
  };

  // Run effect immediately
  effectFn();

  // Return stop function
  return () => {
    stopped = true;
    if (cleanup && typeof cleanup === 'function') {
      cleanup();
    }
    
    // Remove from all dependency sets
    const effectDeps = effectDepsMap.get(effectFn);
    if (effectDeps) {
      effectDeps.forEach(dep => dep.delete(effectFn));
      effectDeps.clear();
    }
    effectDepsMap.delete(effectFn);
  };
}

const reactiveMap = new WeakMap<object, any>();

export function createReactive<T extends object>(target: T): T {
  // Check if already reactive
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }

  // Check if marked raw
  if ((target as any).__markRaw) {
    return target;
  }

  const handler: ProxyHandler<T> = {
    get(target, key, receiver) {
      if (key === '__isReactive') return true;
      if (key === '__raw') return target;
      
      track(target, key);
      const value = Reflect.get(target, key, receiver);
      
      // Handle array methods that modify the array
      if (Array.isArray(target) && typeof value === 'function') {
        const arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
        if (arrayMethods.includes(key as string)) {
          return function (...args: any[]) {
            const result = (value as Function).apply(target, args);
            // Trigger updates for length and indices
            trigger(target, 'length');
            trigger(target, Symbol.for('iterate'));
            return result;
          };
        }
      }
      
      if (value !== null && typeof value === 'object' && !(value as any).__markRaw) {
        return createReactive(value);
      }
      return value;
    },
    set(target, key, value, receiver) {
      const hadKey = Reflect.has(target, key);
      const oldValue = Reflect.get(target, key, receiver);
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, key);
        // Trigger iterate when new property is added
        if (!hadKey) {
          trigger(target, Symbol.for('iterate'));
        }
        // Also trigger length changes for arrays
        if (Array.isArray(target) && key !== 'length') {
          trigger(target, 'length');
        }
      }
      return result;
    },
    deleteProperty(target, key) {
      const hadKey = Reflect.has(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (hadKey) {
        trigger(target, key);
        trigger(target, Symbol.for('iterate'));
        if (Array.isArray(target)) {
          trigger(target, 'length');
        }
      }
      return result;
    },
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      track(target, Symbol.for('iterate'));
      return Reflect.ownKeys(target);
    }
  };

  const proxy = new Proxy(target, handler);
  reactiveMap.set(target, proxy);
  return proxy;
}


const updateQueue = new Set<() => void>();
let isFlushPending = false;

export function queueUpdate(update: () => void): void {
  updateQueue.add(update);
  if (!isFlushPending) {
    isFlushPending = true;
    Promise.resolve().then(flushUpdates);
  }
}

function flushUpdates(): void {
  isFlushPending = false;
  const updates = [...updateQueue];
  updateQueue.clear();
  updates.forEach((update) => update());
}

export function watch<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T | undefined) => void,
  options?: { immediate?: boolean }
): () => void {
  let oldValue: T | undefined;
  let isFirstRun = true;

  const cleanup = effect(() => {
    const newValue = source();
    if (isFirstRun) {
      isFirstRun = false;
      if (options?.immediate) {
        callback(newValue, oldValue);
      }
    } else if (newValue !== oldValue) {
      callback(newValue, oldValue);
    }
    oldValue = newValue;
  });

  return cleanup;
}

export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref;
}

export function isReactive(value: any): boolean {
  return value && value.__isReactive === true;
}

export function toRaw<T>(observed: T): T {
  return (observed as any)?.__raw || observed;
}

export function markRaw<T extends object>(value: T): T {
  Object.defineProperty(value, '__markRaw', {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false
  });
  return value;
}

// Ref interface and implementation
export interface Ref<T> {
  value: T;
  __isRef: true;
}

export function ref<T>(value: T): Ref<T> {
  // For nested refs, we need to maintain reactivity chain
  if (isRef(value)) {
    // Create a ref that tracks the inner ref
    const refObj = {
      get value() {
        track(refObj, 'value');
        return value.value as T;
      },
      set value(newValue: T) {
        value.value = newValue;
        trigger(refObj, 'value');
      },
      __isRef: true as const
    };

    // Set up tracking for the inner ref
    effect(() => {
      value.value; // Access to track
      trigger(refObj, 'value'); // Trigger outer ref when inner changes
    });

    return refObj as Ref<T>;
  }
  
  const refObj = {
    value,
    __isRef: true as const
  };

  return new Proxy(refObj, {
    get(target, key) {
      if (key === 'value') {
        track(target, 'value');
        return target.value;
      }
      return (target as any)[key];
    },
    set(target, key, newValue) {
      if (key === 'value') {
        const oldValue = target.value;
        target.value = newValue;
        if (oldValue !== newValue) {
          trigger(target, 'value');
        }
        return true;
      }
      (target as any)[key] = newValue;
      return true;
    }
  });
}

export function isRef<T>(value: any): value is Ref<T> {
  return value && value.__isRef === true;
}

// Main reactive function (alias for createReactive)
export function reactive<T extends object>(target: T): T {
  // If target is already reactive, return it directly
  if ((target as any).__isReactive) {
    return target;
  }
  return createReactive(target);
}

// Computed ref implementation
export interface ComputedRef<T> {
  readonly value: T;
  __isRef: true;
}

export function computed<T>(getter: () => T): ComputedRef<T> {
  let dirty = true;
  let cached: T;
  let computedEffect: (() => void) | null = null;

  const computedRef = {
    get value() {
      if (dirty) {
        // Execute getter for the first time or when dirty
        const prevActiveEffect = activeEffect;
        activeEffect = null; // Prevent tracking during computation setup
        
        if (computedEffect) {
          computedEffect(); // Stop previous effect
        }
        
        computedEffect = effect(() => {
          cached = getter();
          dirty = false;
        });
        
        activeEffect = prevActiveEffect;
      }
      track(computedRef, 'value');
      return cached;
    },
    __isRef: true as const
  };

  return computedRef;
}