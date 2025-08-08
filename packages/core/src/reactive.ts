import type {
  Effect,
  Ref,
  ComputedRef,
  ReactiveState,
  ReactiveMarkers,
  WatchCallback,
  WatchOptions,
  Result,
} from './types';
import {
  ReactiveError,
  ValidationError,
  ErrorCategory,
  globalErrorHandler,
  validate,
  createSafeFunction,
} from './errors';
import { memoryManager } from './memory';
import { getGlobalBatchScheduler, scheduleBatch } from './batch-scheduler';

let activeEffect: Effect | null = null;
const targetMap = new WeakMap<object, Map<string | symbol, Set<Effect>>>();
const effectDepsMap = new WeakMap<Effect, Set<Set<Effect>>>();
const effectCleanupMap = new WeakMap<Effect, Set<() => void>>();
const proxyTargetMap = new WeakMap<object, object>(); // Maps proxy to target
const targetProxyMap = new WeakMap<object, object>(); // Maps target to proxy

// Resource tracking for reactive objects
const reactiveResourceMap = new WeakMap<object, string>();

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

  // Use batch scheduler for DOM updates
  const scheduler = getGlobalBatchScheduler({ useRAF: true });

  effectsToRun.forEach((effect) => {
    if (effect !== activeEffect) {
      // Schedule the effect to run in the next batch
      scheduleBatch(() => effect());
    }
  });
}

export function effect(fn: Effect): () => void {
  try {
    // Validate effect function
    validate('fn', fn, {
      required: true,
      type: 'function',
    });
  } catch (error) {
    globalErrorHandler.handle(error as ValidationError);
    return () => {}; // Return no-op cleanup function
  }

  let cleanup: (() => void) | void;
  let stopped = false;
  let errorCount = 0;
  const maxErrors = 10; // Prevent infinite error loops
  const effectCleanups = new Set<() => void>();

  // Track this effect for memory management
  const resourceId = memoryManager.resourceTracker.track(
    'effect',
    undefined,
    undefined,
    {
      function: fn.toString().substring(0, 100),
    }
  );

  const effectFn = () => {
    if (stopped) return;

    try {
      // Clean up previous run safely
      if (cleanup && typeof cleanup === 'function') {
        globalErrorHandler.safe(
          () => {
            (cleanup as () => void)();
          },
          ErrorCategory.REACTIVE,
          { phase: 'cleanup' },
          undefined
        );
      }

      // Clear previous dependencies safely
      const effectDeps = effectDepsMap.get(effectFn);
      if (effectDeps) {
        effectDeps.forEach((dep) => dep.delete(effectFn));
        effectDeps.clear();
      }

      // Clear previous cleanup functions
      const prevCleanups = effectCleanupMap.get(effectFn);
      if (prevCleanups) {
        prevCleanups.forEach((cleanupFn) => {
          try {
            cleanupFn();
          } catch (error) {
            console.warn('Error in effect cleanup:', error);
          }
        });
        prevCleanups.clear();
      }

      activeEffect = effectFn;

      // Execute effect function with error handling
      cleanup = globalErrorHandler.safe(
        () => fn(),
        ErrorCategory.REACTIVE,
        { phase: 'execution', errorCount },
        undefined
      );

      activeEffect = null;
      errorCount = 0; // Reset error count on successful execution
    } catch (error) {
      activeEffect = null;
      errorCount++;

      const reactiveError = new ReactiveError(
        'effect execution',
        error instanceof Error ? error : new Error(String(error)),
        {
          effectFunction: fn.toString().substring(0, 200),
          errorCount,
          maxErrors,
        }
      );

      globalErrorHandler.handle(reactiveError);

      // Stop effect if too many errors occur
      if (errorCount >= maxErrors) {
        stopped = true;
        globalErrorHandler.handleGenericError(
          new Error(`Effect stopped due to too many errors (${maxErrors})`),
          ErrorCategory.REACTIVE,
          { effectFunction: fn.toString().substring(0, 200) }
        );
      }
    }
  };

  // Run effect immediately with error handling
  globalErrorHandler.safe(
    () => effectFn(),
    ErrorCategory.REACTIVE,
    { phase: 'initial-run' },
    undefined
  );

  // Store cleanup registry for this effect
  effectCleanupMap.set(effectFn, effectCleanups);

  // Return stop function with error handling
  return () => {
    try {
      stopped = true;

      // Cleanup tracked resource
      memoryManager.resourceTracker.untrack(resourceId);

      if (cleanup && typeof cleanup === 'function') {
        globalErrorHandler.safe(
          () => {
            (cleanup as () => void)();
          },
          ErrorCategory.REACTIVE,
          { phase: 'final-cleanup' },
          undefined
        );
      }

      // Run all registered cleanups
      const cleanups = effectCleanupMap.get(effectFn);
      if (cleanups) {
        cleanups.forEach((cleanupFn) => {
          try {
            cleanupFn();
          } catch (error) {
            console.warn('Error in effect cleanup:', error);
          }
        });
        cleanups.clear();
        effectCleanupMap.delete(effectFn);
      }

      // Remove from all dependency sets
      const effectDeps = effectDepsMap.get(effectFn);
      if (effectDeps) {
        effectDeps.forEach((dep) => dep.delete(effectFn));
        effectDeps.clear();
      }
      effectDepsMap.delete(effectFn);
    } catch (error) {
      globalErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.REACTIVE,
        { phase: 'cleanup' }
      );
    }
  };
}

const reactiveMap = new WeakMap<object, unknown>();

/**
 * Enhanced effect function with automatic cleanup registration
 */
export function registerEffectCleanup(cleanup: () => void): void {
  if (activeEffect) {
    const cleanups = effectCleanupMap.get(activeEffect);
    if (cleanups) {
      cleanups.add(cleanup);
    }
  }
}

/**
 * Create an abortable effect with timeout
 */
export function abortableEffect(
  fn: Effect,
  timeoutMs?: number
): { stop: () => void; abort: () => void } {
  const abortController = new AbortController();
  let timeoutId: number | undefined;

  const wrappedFn = () => {
    if (abortController.signal.aborted) return;
    return fn();
  };

  const stop = effect(wrappedFn);

  if (timeoutMs) {
    timeoutId = window.setTimeout(() => {
      abortController.abort();
      stop();
    }, timeoutMs);
  }

  const abort = () => {
    abortController.abort();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    stop();
  };

  // Register cleanup
  registerEffectCleanup(abort);

  return { stop, abort };
}

export function createReactive<T extends Record<string | symbol, unknown>>(
  target: T
): T & ReactiveMarkers {
  try {
    // Validate input
    validate('target', target, {
      required: true,
      type: 'object',
      custom: (value) => {
        if (value === null) return 'Target cannot be null';
        if (typeof value === 'function')
          return 'Functions cannot be made reactive';
        if (value instanceof Date)
          return 'Date objects should be marked as raw';
        if (value instanceof RegExp)
          return 'RegExp objects should be marked as raw';
        return true;
      },
    });

    // Check if already reactive
    if (reactiveMap.has(target)) {
      return reactiveMap.get(target) as T;
    }

    // Check if marked raw
    if ((target as Record<string, unknown>).__markRaw) {
      return target;
    }

    const handler: ProxyHandler<T> = {
      get(target, key, receiver) {
        try {
          if (key === '__isReactive') return true;
          if (key === '__raw') return target;

          track(target, key);
          const value = Reflect.get(target, key, receiver);

          // Handle array methods that modify the array
          if (Array.isArray(target) && typeof value === 'function') {
            const arrayMethods = [
              'push',
              'pop',
              'shift',
              'unshift',
              'splice',
              'sort',
              'reverse',
            ];
            if (arrayMethods.includes(key as string)) {
              return function (...args: unknown[]) {
                return globalErrorHandler.safe(
                  () => {
                    const result = (
                      value as (...args: unknown[]) => unknown
                    ).apply(target, args);
                    // Trigger updates for length and indices
                    trigger(target, 'length');
                    trigger(target, Symbol.for('iterate'));
                    return result;
                  },
                  ErrorCategory.REACTIVE,
                  {
                    operation: 'array-method',
                    method: key as string,
                    args: Array.from(args),
                  }
                );
              };
            }
          }

          // Recursively make nested objects reactive
          if (
            value !== null &&
            typeof value === 'object' &&
            !(value as Record<string, unknown>).__markRaw
          ) {
            return globalErrorHandler.safe(
              () => createReactive(value as Record<string | symbol, unknown>),
              ErrorCategory.REACTIVE,
              { operation: 'nested-reactive', key: key.toString() },
              value as any // Return original value if making reactive fails
            );
          }
          return value;
        } catch (error) {
          globalErrorHandler.handleGenericError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorCategory.REACTIVE,
            { operation: 'get', key: key.toString() }
          );
          return undefined;
        }
      },

      set(target, key, value, receiver) {
        try {
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
        } catch (error) {
          globalErrorHandler.handleGenericError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorCategory.REACTIVE,
            { operation: 'set', key: key.toString(), value: typeof value }
          );
          return false;
        }
      },

      deleteProperty(target, key) {
        try {
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
        } catch (error) {
          globalErrorHandler.handleGenericError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorCategory.REACTIVE,
            { operation: 'delete', key: key.toString() }
          );
          return false;
        }
      },

      has(target, key) {
        try {
          track(target, key);
          return Reflect.has(target, key);
        } catch (error) {
          globalErrorHandler.handleGenericError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorCategory.REACTIVE,
            { operation: 'has', key: key.toString() }
          );
          return false;
        }
      },

      ownKeys(target) {
        try {
          track(target, Symbol.for('iterate'));
          return Reflect.ownKeys(target);
        } catch (error) {
          globalErrorHandler.handleGenericError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorCategory.REACTIVE,
            { operation: 'ownKeys' }
          );
          return [];
        }
      },
    };

    const proxy = new Proxy(target, handler);
    reactiveMap.set(target, proxy);

    // Track proxy relationships for cleanup
    proxyTargetMap.set(proxy, target);
    targetProxyMap.set(target, proxy);

    // Track reactive resource
    const resourceId = memoryManager.resourceTracker.track(
      'proxy',
      target,
      () => {
        reactiveMap.delete(target);
        proxyTargetMap.delete(proxy);
        targetProxyMap.delete(target);
      },
      {
        type: Array.isArray(target) ? 'array' : 'object',
        keys: Object.keys(target).length,
      }
    );

    reactiveResourceMap.set(proxy, resourceId);

    return proxy;
  } catch (error) {
    if (error instanceof ValidationError) {
      globalErrorHandler.handle(error);
    } else {
      globalErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.REACTIVE,
        { operation: 'createReactive' }
      );
    }

    // Return original target as fallback
    return target;
  }
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
  const updates = Array.from(updateQueue);
  updateQueue.clear();
  updates.forEach((update) => update());
}

export function watch<T>(
  source: () => T,
  callback: WatchCallback<T>,
  options?: WatchOptions
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

export function isReactive(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__isReactive === true
  );
}

export function toRaw<T>(observed: T): T {
  if (observed && typeof observed === 'object') {
    const rawValue = (observed as Record<string, unknown>).__raw;
    return rawValue ? (rawValue as T) : observed;
  }
  return observed;
}

export function markRaw<T extends object>(value: T): T {
  Object.defineProperty(value, '__markRaw', {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  return value;
}

// Enhanced Ref types are now in types.ts

export function ref<T>(value: T): Ref<T> {
  // Type guard for better error messages
  if (typeof value === 'function') {
    throw new TypeError(
      'Functions cannot be used directly in refs. Use computed() instead.'
    );
  }
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
      __isRef: true as const,
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
    __isRef: true as const,
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
    },
  });
}

export function isRef<T = unknown>(value: unknown): value is Ref<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__isRef === true
  );
}

// Main reactive function (alias for createReactive)
export function reactive<T extends Record<string | symbol, unknown>>(
  target: T
): T & ReactiveMarkers {
  // If target is already reactive, return it directly
  if ((target as Record<string, unknown>).__isReactive) {
    return target;
  }
  return createReactive(target);
}

// Enhanced ComputedRef types are now in types.ts

export function computed<T>(getter: () => T): ComputedRef<T> {
  // Type validation for getter
  if (typeof getter !== 'function') {
    throw new TypeError('Computed getter must be a function');
  }
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
    __isRef: true as const,
  };

  return computedRef;
}

// ============================================================================
// ENHANCED TYPE UTILITIES FOR REACTIVE SYSTEM
// ============================================================================

/**
 * Type-safe reactive creation with validation
 */
export function safeReactive<T extends Record<string | symbol, unknown>>(
  target: T
): Result<T & ReactiveMarkers, TypeError> {
  try {
    if (target === null || typeof target !== 'object') {
      return {
        success: false,
        error: new TypeError('Target must be a non-null object'),
      };
    }

    if (Array.isArray(target) && target.length > 10000) {
      return {
        success: false,
        error: new TypeError(
          'Arrays with more than 10000 items are not recommended for reactivity'
        ),
      };
    }

    const result = createReactive(target);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof TypeError ? error : new TypeError(String(error)),
    };
  }
}

/**
 * Type-safe ref creation with validation
 */
export function safeRef<T>(value: T): Result<Ref<T>, TypeError> {
  try {
    const result = ref(value);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof TypeError ? error : new TypeError(String(error)),
    };
  }
}

/**
 * Deep reactive conversion with circular reference detection and memory management
 */
export function deepReactive<T extends Record<string | symbol, unknown>>(
  target: T,
  seen = new WeakSet(),
  maxDepth = 10,
  currentDepth = 0
): T & ReactiveMarkers {
  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    console.warn(
      'Max recursion depth reached in deepReactive, returning original'
    );
    return target as T & ReactiveMarkers;
  }

  if (seen.has(target)) {
    // Circular reference detected, break it with WeakRef
    console.warn(
      'Circular reference detected in deepReactive, breaking with WeakRef'
    );
    return memoryManager.circularRefManager.breakCircular(target) as T &
      ReactiveMarkers;
  }

  seen.add(target);

  // Convert nested objects recursively with depth tracking
  for (const key in target) {
    const value = target[key];
    if (
      value &&
      typeof value === 'object' &&
      !isReactive(value) &&
      !isRef(value)
    ) {
      (target as any)[key] = deepReactive(
        value as Record<string | symbol, unknown>,
        seen,
        maxDepth,
        currentDepth + 1
      );
    }
  }

  return createReactive(target);
}

/**
 * Shallow reactive conversion (only first level)
 */
export function shallowReactive<T extends Record<string | symbol, unknown>>(
  target: T
): T & ReactiveMarkers {
  // Mark nested objects as raw to prevent deep reactivity
  const processed = { ...target };
  for (const key in processed) {
    const value = processed[key];
    if (value && typeof value === 'object') {
      processed[key] = markRaw(value);
    }
  }
  return createReactive(processed);
}

/**
 * Create readonly reactive proxy
 */
export function readonly<T extends Record<string | symbol, unknown>>(
  target: T
): Readonly<T & ReactiveMarkers> {
  const reactive = createReactive(target);

  return new Proxy(reactive, {
    set() {
      console.warn('Cannot set property on readonly reactive object');
      return false;
    },
    deleteProperty() {
      console.warn('Cannot delete property on readonly reactive object');
      return false;
    },
  }) as Readonly<T & ReactiveMarkers>;
}

/**
 * Batch updates for better performance
 */
let isBatching = false;
const batchedUpdates = new Set<() => void>();

export function batchUpdates<T>(fn: () => T): T {
  if (isBatching) {
    return fn();
  }

  isBatching = true;
  try {
    const result = fn();

    // Flush all batched updates
    const updates = Array.from(batchedUpdates);
    batchedUpdates.clear();
    updates.forEach((update) => update());

    return result;
  } finally {
    isBatching = false;
  }
}

/**
 * Enhanced effect with dependencies tracking
 */
export function effectWithDeps<T extends readonly unknown[]>(
  fn: (...deps: T) => void | (() => void),
  deps: T
): () => void {
  let cleanup: (() => void) | undefined;

  return effect(() => {
    if (cleanup) {
      cleanup();
    }

    const result = fn(...deps);
    if (typeof result === 'function') {
      cleanup = result;
    }
  });
}
