import type { Uus } from '@uusjs/core';

export interface RealtimeOptions {
  /**
   * WebSocket URL or Socket.io server URL
   */
  url?: string;
  
  /**
   * Reconnection options
   */
  reconnect?: {
    enabled?: boolean;
    delay?: number;
    maxDelay?: number;
    attempts?: number;
  };
  
  /**
   * Authentication
   */
  auth?: Record<string, any> | (() => Record<string, any> | Promise<Record<string, any>>);
  
  /**
   * Transport options
   */
  transports?: Array<'websocket' | 'polling' | 'sse'>;
  
  /**
   * Debug mode
   */
  debug?: boolean;
}

export interface RealtimeConnection {
  /**
   * Connection state
   */
  connected: boolean;
  connecting: boolean;
  
  /**
   * Connect to server
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from server
   */
  disconnect(): void;
  
  /**
   * Send message to server
   */
  send(event: string, data?: any): void;
  
  /**
   * Listen for events
   */
  on(event: string, handler: (data: any) => void): () => void;
  
  /**
   * Listen for event once
   */
  once(event: string, handler: (data: any) => void): () => void;
  
  /**
   * Remove event listener
   */
  off(event: string, handler?: (data: any) => void): void;
  
  /**
   * Join a room/channel
   */
  join(room: string): Promise<void>;
  
  /**
   * Leave a room/channel
   */
  leave(room: string): Promise<void>;
}

export interface WebSocketOptions extends RealtimeOptions {
  /**
   * WebSocket protocols
   */
  protocols?: string | string[];
  
  /**
   * Binary type
   */
  binaryType?: 'blob' | 'arraybuffer';
  
  /**
   * Heartbeat interval
   */
  heartbeat?: {
    interval?: number;
    timeout?: number;
    message?: string;
  };
}

export interface SSEOptions extends RealtimeOptions {
  /**
   * Retry after connection loss (ms)
   */
  retry?: number;
  
  /**
   * With credentials
   */
  withCredentials?: boolean;
  
  /**
   * Custom headers
   */
  headers?: Record<string, string>;
}

export interface RealtimePlugin {
  /**
   * Install the plugin
   */
  install(app: Uus): void;
  
  /**
   * Get connection instance
   */
  connection: RealtimeConnection;
}

export interface RealtimeDirective {
  /**
   * Directive name
   */
  name: string;
  
  /**
   * Mount callback
   */
  mounted(el: Element, binding: any, app: Uus): void;
  
  /**
   * Update callback
   */
  updated?(el: Element, binding: any, app: Uus): void;
  
  /**
   * Unmount callback
   */
  unmounted?(el: Element, binding: any, app: Uus): void;
}

export interface RealtimeMessage<T = any> {
  /**
   * Message ID
   */
  id?: string;
  
  /**
   * Event type
   */
  event: string;
  
  /**
   * Message data
   */
  data?: T;
  
  /**
   * Timestamp
   */
  timestamp?: number;
  
  /**
   * Metadata
   */
  meta?: Record<string, any>;
}

export interface RealtimeStore<T = any> {
  /**
   * Store state
   */
  state: T;
  
  /**
   * Subscribe to changes
   */
  subscribe(handler: (state: T) => void): () => void;
  
  /**
   * Update state
   */
  update(updater: (state: T) => void): void;
  
  /**
   * Reset state
   */
  reset(): void;
}