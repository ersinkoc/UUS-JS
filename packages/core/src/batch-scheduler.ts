/**
 * Batch Scheduler for optimizing DOM updates
 * Groups multiple updates into a single render cycle for better performance
 */

export type UpdateFunction = () => void;

export interface BatchSchedulerOptions {
  // Maximum time to wait before flushing (in ms)
  maxWaitTime?: number;
  // Use requestAnimationFrame instead of microtask
  useRAF?: boolean;
  // Debug mode
  debug?: boolean;
}

export class BatchScheduler {
  private queue: Set<UpdateFunction> = new Set();
  private scheduled = false;
  private flushTimer: number | null = null;
  private options: Required<BatchSchedulerOptions>;
  private rafId: number | null = null;

  constructor(options: BatchSchedulerOptions = {}) {
    this.options = {
      maxWaitTime: options.maxWaitTime ?? 16, // Default to one frame (60fps)
      useRAF: options.useRAF ?? false,
      debug: options.debug ?? false,
    };
  }

  /**
   * Schedule a function to be executed in the next batch
   */
  schedule(fn: UpdateFunction): void {
    this.queue.add(fn);

    if (this.options.debug) {
      console.log(
        `[BatchScheduler] Scheduled update, queue size: ${this.queue.size}`
      );
    }

    if (!this.scheduled) {
      this.scheduled = true;
      this.scheduleFlush();
    }
  }

  /**
   * Schedule multiple functions at once
   */
  scheduleAll(fns: UpdateFunction[]): void {
    fns.forEach((fn) => this.queue.add(fn));

    if (this.options.debug) {
      console.log(
        `[BatchScheduler] Scheduled ${fns.length} updates, queue size: ${this.queue.size}`
      );
    }

    if (!this.scheduled) {
      this.scheduled = true;
      this.scheduleFlush();
    }
  }

  /**
   * Remove a scheduled function from the queue
   */
  unschedule(fn: UpdateFunction): void {
    this.queue.delete(fn);

    if (this.options.debug) {
      console.log(
        `[BatchScheduler] Unscheduled update, queue size: ${this.queue.size}`
      );
    }

    // If queue is empty, cancel scheduled flush
    if (this.queue.size === 0) {
      this.cancelScheduledFlush();
    }
  }

  /**
   * Execute all queued updates immediately
   */
  flush(): void {
    if (this.queue.size === 0) return;

    const startTime = performance.now();
    const queue = Array.from(this.queue);

    // Clear state before executing
    this.queue.clear();
    this.scheduled = false;
    this.cancelScheduledFlush();

    if (this.options.debug) {
      console.log(`[BatchScheduler] Flushing ${queue.length} updates`);
    }

    // Execute all updates
    for (const fn of queue) {
      try {
        if (typeof fn === 'function') {
          fn();
        }
      } catch (error) {
        console.error('[BatchScheduler] Error executing update:', error);
      }
    }

    if (this.options.debug) {
      const duration = performance.now() - startTime;
      console.log(
        `[BatchScheduler] Flush completed in ${duration.toFixed(2)}ms`
      );
    }
  }

  /**
   * Clear all pending updates without executing them
   */
  clear(): void {
    this.queue.clear();
    this.scheduled = false;
    this.cancelScheduledFlush();

    if (this.options.debug) {
      console.log('[BatchScheduler] Cleared all pending updates');
    }
  }

  /**
   * Get the current queue size
   */
  get size(): number {
    return this.queue.size;
  }

  /**
   * Check if there are pending updates
   */
  get hasPending(): boolean {
    return this.queue.size > 0;
  }

  private scheduleFlush(): void {
    if (this.options.useRAF) {
      // Use requestAnimationFrame for visual updates
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.flush();
      });
    } else {
      // Use microtask for immediate scheduling
      queueMicrotask(() => {
        if (this.scheduled) {
          this.flush();
        }
      });
    }

    // Set max wait timer to prevent indefinite delays
    if (this.options.maxWaitTime > 0) {
      this.flushTimer = window.setTimeout(() => {
        this.flushTimer = null;
        if (this.scheduled) {
          this.flush();
        }
      }, this.options.maxWaitTime);
    }
  }

  private cancelScheduledFlush(): void {
    this.scheduled = false;

    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Destroy the scheduler and clear all pending updates
   */
  destroy(): void {
    this.clear();

    if (this.options.debug) {
      console.log('[BatchScheduler] Destroyed');
    }
  }
}

// Global singleton instance for shared batching
let globalScheduler: BatchScheduler | null = null;

/**
 * Get or create the global batch scheduler
 */
export function getGlobalBatchScheduler(
  options?: BatchSchedulerOptions
): BatchScheduler {
  if (!globalScheduler) {
    globalScheduler = new BatchScheduler(options);
  }
  return globalScheduler;
}

/**
 * Schedule a function in the global batch
 */
export function scheduleBatch(fn: UpdateFunction): void {
  getGlobalBatchScheduler().schedule(fn);
}

/**
 * Flush the global batch immediately
 */
export function flushBatch(): void {
  if (globalScheduler) {
    globalScheduler.flush();
  }
}

/**
 * Clear the global batch
 */
export function clearBatch(): void {
  if (globalScheduler) {
    globalScheduler.clear();
  }
}

/**
 * Destroy the global batch scheduler
 */
export function destroyGlobalScheduler(): void {
  if (globalScheduler) {
    globalScheduler.destroy();
    globalScheduler = null;
  }
}

// Helper for creating scoped batch schedulers
export function createScopedScheduler(
  options?: BatchSchedulerOptions
): BatchScheduler {
  return new BatchScheduler(options);
}

// Utility for batching async operations
export class AsyncBatchScheduler<T> {
  private queue: Map<
    string,
    { resolve: (value: T) => void; reject: (error: any) => void }[]
  > = new Map();
  private scheduled = false;
  private batchProcessor: (keys: string[]) => Promise<Map<string, T>>;
  private options: BatchSchedulerOptions;

  constructor(
    batchProcessor: (keys: string[]) => Promise<Map<string, T>>,
    options: BatchSchedulerOptions = {}
  ) {
    this.batchProcessor = batchProcessor;
    this.options = options;
  }

  async get(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }

      this.queue.get(key)!.push({ resolve, reject });

      if (!this.scheduled) {
        this.scheduled = true;
        this.scheduleProcess();
      }
    });
  }

  private scheduleProcess(): void {
    queueMicrotask(async () => {
      if (!this.scheduled) return;

      const keys = Array.from(this.queue.keys());
      const callbacks = new Map(this.queue);

      this.queue.clear();
      this.scheduled = false;

      try {
        const results = await this.batchProcessor(keys);

        for (const [key, resolvers] of callbacks) {
          const result = results.get(key);
          if (result !== undefined) {
            resolvers.forEach(({ resolve }) => resolve(result));
          } else {
            resolvers.forEach(({ reject }) =>
              reject(new Error(`No result for key: ${key}`))
            );
          }
        }
      } catch (error) {
        // Reject all pending promises
        for (const resolvers of callbacks.values()) {
          resolvers.forEach(({ reject }) => reject(error));
        }
      }
    });
  }
}

export default BatchScheduler;
