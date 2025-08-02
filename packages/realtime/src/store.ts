import { createReactive as reactive, effect } from '@uusjs/core';
import type { RealtimeConnection, RealtimeStore } from './types';

/**
 * Create a real-time synchronized store
 */
export function createRealtimeStore<T = any>(
  connection: RealtimeConnection,
  initialState: T,
  options: {
    channel?: string;
    syncEvent?: string;
    updateEvent?: string;
    conflictResolution?: 'local' | 'remote' | ((local: T, remote: T) => T);
  } = {}
): RealtimeStore<T> {
  const opts = {
    channel: 'store',
    syncEvent: 'store:sync',
    updateEvent: 'store:update',
    conflictResolution: 'remote' as const,
    ...options
  };
  
  // Create reactive state
  const state = reactive<T>(
    typeof initialState === 'object' ? { ...initialState } : initialState
  );
  
  const subscribers = new Set<(state: T) => void>();
  let version = 0;
  let syncing = false;
  
  // Subscribe to remote updates
  connection.on(opts.updateEvent, (data: {
    state: T;
    version: number;
    timestamp: number;
  }) => {
    if (syncing) return;
    
    // Handle version conflicts
    if (data.version <= version) {
      return; // Ignore older updates
    }
    
    // Apply conflict resolution
    if (opts.conflictResolution === 'local') {
      // Keep local state
      return;
    } else if (opts.conflictResolution === 'remote') {
      // Use remote state
      Object.assign(state, data.state);
      version = data.version;
    } else if (typeof opts.conflictResolution === 'function') {
      // Custom conflict resolution
      const resolved = opts.conflictResolution(state as T, data.state);
      Object.assign(state, resolved);
      version = data.version;
    }
    
    // Notify subscribers with clean state
    const cleanState = getCleanState();
    subscribers.forEach(handler => handler(cleanState));
  });
  
  // Helper function to get clean state without internal properties
  function getCleanState(): T {
    const cleanState = {} as T;
    for (const key in state) {
      if (key !== '__trigger') {
        cleanState[key] = state[key];
      }
    }
    return cleanState;
  }
  
  // Watch for local changes
  const stopWatching = effect(() => {
    // Access state to track changes
    JSON.stringify(state);
    
    if (syncing) return;
    
    // Increment version
    version++;
    
    const cleanState = getCleanState();
    
    // Send update to server
    connection.send(opts.syncEvent, {
      channel: opts.channel,
      state: cleanState,
      version,
      timestamp: Date.now()
    });
    
    // Notify subscribers with clean state
    subscribers.forEach(handler => handler(cleanState));
  });
  
  // Join channel
  if (opts.channel) {
    connection.join(opts.channel);
  }
  
  function subscribe(handler: (state: T) => void): () => void {
    subscribers.add(handler);
    
    // Call handler with current clean state
    const cleanState = getCleanState();
    handler(cleanState);
    
    // Return unsubscribe function
    return () => {
      subscribers.delete(handler);
    };
  }
  
  function update(updater: (state: T) => void) {
    syncing = true;
    updater(state as T);
    syncing = false;
    
    // Trigger watchers
    (state as any).__trigger = Date.now();
  }
  
  function reset() {
    syncing = true;
    Object.assign(
      state,
      typeof initialState === 'object' ? { ...initialState } : initialState
    );
    syncing = false;
    
    version = 0;
    
    // Trigger watchers
    (state as any).__trigger = Date.now();
  }
  
  return {
    get state() { return getCleanState(); },
    subscribe,
    update,
    reset
  };
}

/**
 * Create a collaborative text editor
 */
export function createCollaborativeText(
  connection: RealtimeConnection,
  options: {
    channel?: string;
    debounce?: number;
  } = {}
) {
  const opts = {
    channel: 'collab-text',
    debounce: 300,
    ...options
  };
  
  let content = '';
  let version = 0;
  const subscribers = new Set<(content: string) => void>();
  let debounceTimer: any = null;
  
  // Join channel
  if (opts.channel) {
    connection.join(opts.channel);
  }
  
  // Handle remote operations
  connection.on('text:operation', (data: {
    op: 'insert' | 'delete' | 'replace';
    position: number;
    text?: string;
    length?: number;
    version: number;
  }) => {
    if (data.version <= version) return;
    
    switch (data.op) {
      case 'insert':
        content = 
          content.slice(0, data.position) + 
          data.text + 
          content.slice(data.position);
        break;
        
      case 'delete':
        content = 
          content.slice(0, data.position) + 
          content.slice(data.position + (data.length || 0));
        break;
        
      case 'replace':
        content = data.text || '';
        break;
    }
    
    version = data.version;
    
    // Notify subscribers
    subscribers.forEach(handler => handler(content));
  });
  
  function sendOperation(op: any) {
    clearTimeout(debounceTimer);
    
    debounceTimer = setTimeout(() => {
      version++;
      connection.send('text:operation', {
        ...op,
        version,
        channel: opts.channel
      });
    }, opts.debounce);
  }
  
  function insert(position: number, text: string) {
    content = 
      content.slice(0, position) + 
      text + 
      content.slice(position);
    
    sendOperation({
      op: 'insert',
      position,
      text
    });
    
    // Notify subscribers
    subscribers.forEach(handler => handler(content));
  }
  
  function remove(position: number, length: number) {
    content = 
      content.slice(0, position) + 
      content.slice(position + length);
    
    sendOperation({
      op: 'delete',
      position,
      length
    });
    
    // Notify subscribers
    subscribers.forEach(handler => handler(content));
  }
  
  function replace(text: string) {
    content = text;
    
    sendOperation({
      op: 'replace',
      text
    });
    
    // Notify subscribers
    subscribers.forEach(handler => handler(content));
  }
  
  function subscribe(handler: (content: string) => void): () => void {
    subscribers.add(handler);
    handler(content);
    
    return () => {
      subscribers.delete(handler);
    };
  }
  
  return {
    get content() { return content; },
    insert,
    remove,
    replace,
    subscribe
  };
}