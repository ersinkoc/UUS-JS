import { describe, it, expect, vi } from 'vitest';
import { createRealtimeStore, createCollaborativeText } from '../src/store';
import type { RealtimeConnection } from '../src/types';

// Mock connection
function createMockConnection(): RealtimeConnection {
  const listeners = new Map<string, Set<Function>>();

  return {
    connected: true,
    connecting: false,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn((event, handler) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(handler);
      return () => {
        listeners.get(event)?.delete(handler);
      };
    }),
    once: vi.fn(),
    off: vi.fn(),
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),

    // Helper to trigger events
    trigger(event: string, data: any) {
      listeners.get(event)?.forEach((handler) => handler(data));
    },
  } as any;
}

describe('RealtimeStore', () => {
  it('should create a store with initial state', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, {
      count: 0,
      items: [],
    });

    expect(store.state).toEqual({
      count: 0,
      items: [],
    });
  });

  it('should notify subscribers on state changes', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 });

    const handler = vi.fn();
    store.subscribe(handler);

    // Initial call
    expect(handler).toHaveBeenCalledWith({ count: 0 });

    // Update state
    store.update((state) => {
      state.count = 1;
    });

    expect(handler).toHaveBeenCalledWith({ count: 1 });
  });

  it('should sync state changes to remote', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 });

    store.update((state) => {
      state.count = 5;
    });

    expect(connection.send).toHaveBeenCalledWith('store:sync', {
      channel: 'store',
      state: { count: 5 },
      version: expect.any(Number),
      timestamp: expect.any(Number),
    });
  });

  it('should handle remote updates', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 });

    const handler = vi.fn();
    store.subscribe(handler);

    // Simulate remote update
    connection.trigger('store:update', {
      state: { count: 10 },
      version: 2,
      timestamp: Date.now(),
    });

    expect(store.state.count).toBe(10);
    expect(handler).toHaveBeenCalledWith({ count: 10 });
  });

  it('should handle conflict resolution', () => {
    const connection = createMockConnection();

    // Test local preference
    const localStore = createRealtimeStore(
      connection,
      { count: 5 },
      {
        conflictResolution: 'local',
      }
    );

    connection.trigger('store:update', {
      state: { count: 10 },
      version: 2,
      timestamp: Date.now(),
    });

    expect(localStore.state.count).toBe(5); // Keep local

    // Test custom resolution
    const customStore = createRealtimeStore(
      connection,
      { count: 5 },
      {
        conflictResolution: (local, remote) => ({
          count: Math.max(local.count, remote.count),
        }),
      }
    );

    connection.trigger('store:update', {
      state: { count: 3 },
      version: 2,
      timestamp: Date.now(),
    });

    expect(customStore.state.count).toBe(5); // Max of 5 and 3
  });

  it('should reset to initial state', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0, name: 'test' });

    store.update((state) => {
      state.count = 10;
      state.name = 'changed';
    });

    store.reset();

    expect(store.state).toEqual({ count: 0, name: 'test' });
  });

  it('should handle object initial state with primitive fallback', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { value: 'initial-string' });

    expect(store.state).toEqual({ value: 'initial-string' });
  });

  it('should ignore older versions in remote updates', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 });

    // Update to version 2
    store.update((state) => {
      state.count = 1;
    });
    store.update((state) => {
      state.count = 2;
    });

    // Try to apply version 1 (older)
    connection.trigger('store:update', {
      state: { count: 999 },
      version: 1,
      timestamp: Date.now(),
    });

    expect(store.state.count).toBe(2); // Should not change
  });

  it('should ignore updates when syncing', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 });

    // During an update, simulate a remote update
    store.update((state) => {
      state.count = 5;
      
      // This should be ignored since we're syncing
      connection.trigger('store:update', {
        state: { count: 999 },
        version: 10,
        timestamp: Date.now(),
      });
    });

    expect(store.state.count).toBe(5); // Should keep local update
  });

  it('should handle custom channel and event names', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 }, {
      channel: 'custom-channel',
      syncEvent: 'custom:sync',
      updateEvent: 'custom:update',
    });

    expect(connection.join).toHaveBeenCalledWith('custom-channel');

    store.update((state) => {
      state.count = 5;
    });

    expect(connection.send).toHaveBeenCalledWith('custom:sync', expect.objectContaining({
      channel: 'custom-channel',
      state: { count: 5 },
    }));
  });

  it('should not join channel when channel is empty', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 }, {
      channel: '',
    });

    expect(connection.join).not.toHaveBeenCalled();
  });

  it('should unsubscribe from store correctly', () => {
    const connection = createMockConnection();
    const store = createRealtimeStore(connection, { count: 0 });

    const handler = vi.fn();
    const unsubscribe = store.subscribe(handler);

    // Initial call
    expect(handler).toHaveBeenCalledWith({ count: 0 });

    // Update state
    store.update((state) => {
      state.count = 1;
    });

    expect(handler).toHaveBeenCalledWith({ count: 1 });

    // Unsubscribe
    unsubscribe();
    handler.mockClear();

    // Update again - should not be called
    store.update((state) => {
      state.count = 2;
    });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('CollaborativeText', () => {
  it('should handle text insertion', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    const handler = vi.fn();
    editor.subscribe(handler);

    editor.insert(0, 'Hello ');
    expect(editor.content).toBe('Hello ');

    editor.insert(6, 'World');
    expect(editor.content).toBe('Hello World');
  });

  it('should handle text deletion', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    editor.replace('Hello World');
    editor.remove(5, 6); // Remove " World"

    expect(editor.content).toBe('Hello');
  });

  it('should handle remote operations', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    const handler = vi.fn();
    editor.subscribe(handler);

    // Simulate remote insert
    connection.trigger('text:operation', {
      op: 'insert',
      position: 0,
      text: 'Hi ',
      version: 1,
    });

    expect(editor.content).toBe('Hi ');
    expect(handler).toHaveBeenCalledWith('Hi ');
  });

  it('should debounce operations', () => {
    vi.useFakeTimers();

    const connection = createMockConnection();
    const editor = createCollaborativeText(connection, {
      debounce: 100,
    });

    editor.insert(0, 'H');
    editor.insert(1, 'e');
    editor.insert(2, 'l');

    expect(connection.send).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(connection.send).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should handle remote delete operations', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    editor.replace('Hello World');

    // Simulate remote delete
    connection.trigger('text:operation', {
      op: 'delete',
      position: 5,
      length: 6, // Delete ' World'
      version: 1,
    });

    expect(editor.content).toBe('Hello');
  });

  it('should ignore older version operations', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    editor.replace('Initial');

    // Simulate remote operation with higher version
    connection.trigger('text:operation', {
      op: 'replace',
      text: 'Updated',
      version: 5,
    });

    expect(editor.content).toBe('Updated');

    // Try to apply older version - should be ignored
    connection.trigger('text:operation', {
      op: 'replace',
      text: 'Older',
      version: 3,
    });

    expect(editor.content).toBe('Updated'); // Should not change
  });

  it('should handle custom channel', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection, {
      channel: 'my-doc',
    });

    expect(connection.join).toHaveBeenCalledWith('my-doc');
  });

  it('should not join channel when channel is empty', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection, {
      channel: '',
    });

    expect(connection.join).not.toHaveBeenCalled();
  });

  it('should unsubscribe from text editor correctly', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    const handler = vi.fn();
    const unsubscribe = editor.subscribe(handler);

    // Initial call with empty content
    expect(handler).toHaveBeenCalledWith('');

    // Insert text
    editor.insert(0, 'Hello');
    expect(handler).toHaveBeenCalledWith('Hello');

    // Unsubscribe
    unsubscribe();
    handler.mockClear();

    // Insert more text - should not be called
    editor.insert(5, ' World');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle delete operations with missing length', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    editor.replace('Hello World');

    // Simulate remote delete without length (should default to 0)
    connection.trigger('text:operation', {
      op: 'delete',
      position: 5,
      version: 1,
    });

    expect(editor.content).toBe('Hello World'); // Should not change
  });

  it('should handle replace operations with empty text', () => {
    const connection = createMockConnection();
    const editor = createCollaborativeText(connection);

    editor.replace('Hello World');

    // Simulate remote replace with undefined text
    connection.trigger('text:operation', {
      op: 'replace',
      version: 1,
    });

    expect(editor.content).toBe(''); // Should clear content
  });
});
