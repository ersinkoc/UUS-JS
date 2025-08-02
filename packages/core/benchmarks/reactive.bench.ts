import { bench, describe } from 'vitest';
import { createReactive, effect, computed, batchUpdates } from '../src/reactive';

describe('Reactive System Benchmarks', () => {
  bench('createReactive - simple object', () => {
    const obj = createReactive({ count: 0 });
    obj.count++;
  });

  bench('createReactive - nested object', () => {
    const obj = createReactive({
      user: {
        name: 'John',
        profile: {
          age: 30,
          hobbies: ['reading', 'coding']
        }
      }
    });
    obj.user.profile.age++;
  });

  bench('createReactive - array operations', () => {
    const arr = createReactive([1, 2, 3, 4, 5]);
    arr.push(6);
    arr.pop();
    arr[0] = 10;
  });

  bench('effect - simple dependency', () => {
    const state = createReactive({ count: 0 });
    let result = 0;
    
    const cleanup = effect(() => {
      result = state.count * 2;
    });
    
    state.count++;
    cleanup();
  });

  bench('effect - multiple dependencies', () => {
    const state = createReactive({ a: 1, b: 2, c: 3 });
    let result = 0;
    
    const cleanup = effect(() => {
      result = state.a + state.b + state.c;
    });
    
    state.a++;
    state.b++;
    state.c++;
    cleanup();
  });

  bench('computed - simple calculation', () => {
    const state = createReactive({ count: 0 });
    const doubled = computed(() => state.count * 2);
    
    state.count++;
    const value = doubled.value;
  });

  bench('computed - complex calculation', () => {
    const state = createReactive({
      items: Array(100).fill(0).map((_, i) => ({ id: i, value: i }))
    });
    
    const stats = computed(() => ({
      total: state.items.length,
      sum: state.items.reduce((acc, item) => acc + item.value, 0),
      average: state.items.reduce((acc, item) => acc + item.value, 0) / state.items.length
    }));
    
    state.items.push({ id: 100, value: 100 });
    const result = stats.value;
  });

  bench('batchUpdates - multiple updates', () => {
    const state = createReactive({ a: 0, b: 0, c: 0 });
    let effectRuns = 0;
    
    effect(() => {
      effectRuns++;
      const sum = state.a + state.b + state.c;
    });
    
    batchUpdates(() => {
      state.a++;
      state.b++;
      state.c++;
    });
  });

  bench('reactive array - map/filter/reduce', () => {
    const state = createReactive({
      items: Array(1000).fill(0).map((_, i) => ({ id: i, value: i }))
    });
    
    const result = state.items
      .filter(item => item.value % 2 === 0)
      .map(item => item.value * 2)
      .reduce((acc, value) => acc + value, 0);
  });

  bench('deep reactive updates', () => {
    const state = createReactive({
      level1: {
        level2: {
          level3: {
            level4: {
              value: 0
            }
          }
        }
      }
    });
    
    state.level1.level2.level3.level4.value++;
  });

  bench('large object creation', () => {
    const largeObj: any = {};
    for (let i = 0; i < 1000; i++) {
      largeObj[`key${i}`] = i;
    }
    
    const reactive = createReactive(largeObj);
    reactive.key500++;
  });

  bench('effect cleanup performance', () => {
    const state = createReactive({ count: 0 });
    const cleanups: Array<() => void> = [];
    
    for (let i = 0; i < 100; i++) {
      cleanups.push(effect(() => {
        const value = state.count * i;
      }));
    }
    
    state.count++;
    
    cleanups.forEach(cleanup => cleanup());
  });

  bench('circular reference handling', () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    
    const reactive = createReactive(obj);
    reactive.a++;
  });

  bench('WeakMap performance', () => {
    const objects = Array(1000).fill(0).map(() => ({}));
    const weakMap = new WeakMap();
    
    objects.forEach(obj => {
      weakMap.set(obj, { data: 'value' });
    });
    
    objects.forEach(obj => {
      weakMap.get(obj);
    });
  });

  bench('reactive vs non-reactive performance', () => {
    const normal = { count: 0 };
    const reactive = createReactive({ count: 0 });
    
    // Normal object updates
    for (let i = 0; i < 100; i++) {
      normal.count++;
    }
    
    // Reactive object updates
    for (let i = 0; i < 100; i++) {
      reactive.count++;
    }
  });
});