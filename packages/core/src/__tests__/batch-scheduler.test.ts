import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BatchScheduler,
  getGlobalBatchScheduler,
  scheduleBatch,
  flushBatch,
  clearBatch,
  destroyGlobalScheduler,
  createScopedScheduler,
  AsyncBatchScheduler,
} from '../batch-scheduler';

describe('BatchScheduler', () => {
  let scheduler: BatchScheduler;

  beforeEach(() => {
    scheduler = new BatchScheduler();
    vi.useFakeTimers();
  });

  afterEach(() => {
    scheduler.destroy();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should create a scheduler instance', () => {
      expect(scheduler).toBeDefined();
      expect(scheduler.size).toBe(0);
      expect(scheduler.hasPending).toBe(false);
    });

    it('should schedule a function', () => {
      const fn = vi.fn();
      scheduler.schedule(fn);

      expect(scheduler.size).toBe(1);
      expect(scheduler.hasPending).toBe(true);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should execute scheduled functions on flush', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      scheduler.schedule(fn1);
      scheduler.schedule(fn2);

      scheduler.flush();

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(scheduler.size).toBe(0);
    });

    it('should not schedule duplicate functions', () => {
      const fn = vi.fn();

      scheduler.schedule(fn);
      scheduler.schedule(fn);

      expect(scheduler.size).toBe(1);

      scheduler.flush();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should schedule multiple functions at once', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const fn3 = vi.fn();

      scheduler.scheduleAll([fn1, fn2, fn3]);

      expect(scheduler.size).toBe(3);

      scheduler.flush();

      expect(fn1).toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
      expect(fn3).toHaveBeenCalled();
    });

    it('should unschedule a function', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      scheduler.schedule(fn1);
      scheduler.schedule(fn2);
      scheduler.unschedule(fn1);

      expect(scheduler.size).toBe(1);

      scheduler.flush();

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
    });

    it('should clear all pending updates', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      scheduler.schedule(fn1);
      scheduler.schedule(fn2);

      scheduler.clear();

      expect(scheduler.size).toBe(0);
      expect(scheduler.hasPending).toBe(false);

      // Verify functions were not called
      vi.runAllTimers();
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });

    it('should handle errors in scheduled functions', () => {
      const errorFn = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalFn = vi.fn();

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      scheduler.schedule(errorFn);
      scheduler.schedule(normalFn);

      scheduler.flush();

      expect(errorFn).toHaveBeenCalled();
      expect(normalFn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[BatchScheduler] Error executing update:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Automatic Scheduling', () => {
    it('should automatically flush using microtask', async () => {
      const fn = vi.fn();
      scheduler.schedule(fn);

      expect(fn).not.toHaveBeenCalled();

      // Wait for microtask
      await Promise.resolve();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use requestAnimationFrame when configured', () => {
      const rafScheduler = new BatchScheduler({ useRAF: true });
      const fn = vi.fn();

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      rafScheduler.schedule(fn);

      expect(rafSpy).toHaveBeenCalled();
      expect(fn).not.toHaveBeenCalled();

      rafScheduler.destroy();
    });

    it('should respect maxWaitTime', () => {
      const scheduler = new BatchScheduler({ maxWaitTime: 100 });
      const fn = vi.fn();

      scheduler.schedule(fn);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);

      scheduler.destroy();
    });

    it('should cancel scheduled flush when cleared', () => {
      const scheduler = new BatchScheduler({ maxWaitTime: 100 });
      const fn = vi.fn();

      scheduler.schedule(fn);
      scheduler.clear();

      vi.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();

      scheduler.destroy();
    });
  });

  describe('Debug Mode', () => {
    it('should log debug messages when enabled', () => {
      const debugScheduler = new BatchScheduler({ debug: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const fn = vi.fn();
      debugScheduler.schedule(fn);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[BatchScheduler] Scheduled update, queue size: 1'
      );

      debugScheduler.flush();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[BatchScheduler] Flushing 1 updates'
      );

      debugScheduler.destroy();

      expect(consoleSpy).toHaveBeenCalledWith('[BatchScheduler] Destroyed');

      consoleSpy.mockRestore();
    });

    it('should log performance metrics in debug mode', () => {
      const debugScheduler = new BatchScheduler({ debug: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      debugScheduler.schedule(() => {});
      debugScheduler.flush();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BatchScheduler] Flush completed in')
      );

      consoleSpy.mockRestore();
      debugScheduler.destroy();
    });
  });

  describe('Global Scheduler', () => {
    afterEach(() => {
      destroyGlobalScheduler();
    });

    it('should create and return global scheduler', () => {
      const scheduler1 = getGlobalBatchScheduler();
      const scheduler2 = getGlobalBatchScheduler();

      expect(scheduler1).toBe(scheduler2);
    });

    it('should schedule in global batch', async () => {
      const fn = vi.fn();

      scheduleBatch(fn);

      await Promise.resolve();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should flush global batch', () => {
      const fn = vi.fn();

      scheduleBatch(fn);
      flushBatch();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should clear global batch', async () => {
      const fn = vi.fn();

      scheduleBatch(fn);
      clearBatch();

      await Promise.resolve();

      expect(fn).not.toHaveBeenCalled();
    });

    it('should destroy global scheduler', () => {
      const scheduler = getGlobalBatchScheduler();
      destroyGlobalScheduler();

      const newScheduler = getGlobalBatchScheduler();
      expect(newScheduler).not.toBe(scheduler);
    });
  });

  describe('Scoped Scheduler', () => {
    it('should create independent scoped schedulers', () => {
      const scheduler1 = createScopedScheduler();
      const scheduler2 = createScopedScheduler();

      expect(scheduler1).not.toBe(scheduler2);

      const fn1 = vi.fn();
      const fn2 = vi.fn();

      scheduler1.schedule(fn1);
      scheduler2.schedule(fn2);

      scheduler1.flush();

      expect(fn1).toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();

      scheduler2.flush();

      expect(fn2).toHaveBeenCalled();

      scheduler1.destroy();
      scheduler2.destroy();
    });
  });

  describe('AsyncBatchScheduler', () => {
    it('should batch async operations', async () => {
      const results = new Map<string, number>();
      results.set('key1', 100);
      results.set('key2', 200);
      results.set('key3', 300);

      const batchProcessor = vi.fn(async (keys: string[]) => {
        const map = new Map<string, number>();
        keys.forEach((key) => {
          if (results.has(key)) {
            map.set(key, results.get(key)!);
          }
        });
        return map;
      });

      const asyncScheduler = new AsyncBatchScheduler(batchProcessor);

      const promise1 = asyncScheduler.get('key1');
      const promise2 = asyncScheduler.get('key2');
      const promise3 = asyncScheduler.get('key3');

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      expect(result1).toBe(100);
      expect(result2).toBe(200);
      expect(result3).toBe(300);

      // Batch processor should only be called once
      expect(batchProcessor).toHaveBeenCalledTimes(1);
      expect(batchProcessor).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should handle errors in async batch processing', async () => {
      const batchProcessor = vi.fn(async () => {
        throw new Error('Batch processing failed');
      });

      const asyncScheduler = new AsyncBatchScheduler(batchProcessor);

      await expect(asyncScheduler.get('key1')).rejects.toThrow(
        'Batch processing failed'
      );
    });

    it('should handle missing results', async () => {
      const batchProcessor = vi.fn(async () => {
        return new Map(); // Return empty map
      });

      const asyncScheduler = new AsyncBatchScheduler(batchProcessor);

      await expect(asyncScheduler.get('key1')).rejects.toThrow(
        'No result for key: key1'
      );
    });

    it('should process multiple batches', async () => {
      let callCount = 0;
      const batchProcessor = vi.fn(async (keys: string[]) => {
        callCount++;
        const map = new Map<string, number>();
        keys.forEach((key) => {
          map.set(key, callCount * 100);
        });
        return map;
      });

      const asyncScheduler = new AsyncBatchScheduler(batchProcessor);

      // First batch
      const result1 = await asyncScheduler.get('key1');
      expect(result1).toBe(100);

      // Second batch
      const result2 = await asyncScheduler.get('key2');
      expect(result2).toBe(200);

      expect(batchProcessor).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty flush', () => {
      expect(() => scheduler.flush()).not.toThrow();
      expect(scheduler.size).toBe(0);
    });

    it('should handle unschedule of non-existent function', () => {
      const fn = vi.fn();
      expect(() => scheduler.unschedule(fn)).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      expect(() => {
        scheduler.destroy();
        scheduler.destroy();
      }).not.toThrow();
    });

    it('should handle scheduling after destroy', () => {
      scheduler.destroy();
      const fn = vi.fn();

      scheduler.schedule(fn);
      scheduler.flush();

      // Function should still be called even after destroy
      expect(fn).toHaveBeenCalled();
    });

    it('should handle null and undefined functions gracefully', () => {
      expect(() => {
        scheduler.schedule(null as any);
        scheduler.schedule(undefined as any);
        scheduler.flush();
      }).not.toThrow();
    });
  });
});
