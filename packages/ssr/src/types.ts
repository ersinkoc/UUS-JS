import { Uus } from '@uusjs/core';

export interface SSRContext {
  url: string;
  title?: string;
  meta?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  data?: any;
  error?: Error;
  redirect?: string;
  statusCode?: number;
}

export interface SSRPlugin {
  name: string;
  beforeRender?: (app: Uus, context: SSRContext) => void | Promise<void>;
  afterRender?: (html: string, context: SSRContext) => string | Promise<string>;
}

export interface HydrationOptions {
  /**
   * Suppress hydration mismatch warnings
   */
  suppressWarnings?: boolean;
  
  /**
   * Custom element matcher
   */
  matcher?: (el: Element) => boolean;
  
  /**
   * Preserve existing DOM
   */
  preserve?: boolean;
}