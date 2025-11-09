import { JSDOM } from 'jsdom';
import { Uus } from '@uusjs/core';
import { SSRContext } from './types';

/**
 * Render a Uus app to string
 */
export async function renderToString(
  app: Uus | (() => Uus),
  options?: {
    url?: string;
    context?: SSRContext;
    template?: string;
  }
): Promise<string> {
  const dom = new JSDOM(options?.template || DEFAULT_TEMPLATE, {
    url: options?.url || 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  // Set up globals
  global.window = dom.window as any;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.location = dom.window.location;

  try {
    // Create or get app instance
    const appInstance = typeof app === 'function' ? app() : app;

    // Set SSR context
    if (options?.context) {
      (appInstance as any).__SSR_CONTEXT__ = options.context;
    }

    // Mount the app
    await appInstance.mount();

    // Wait for async operations
    await waitForAsyncOps(appInstance);

    // Serialize state
    const state = serializeState(appInstance);

    // Get HTML
    let html = dom.serialize();

    // Inject state
    if (state) {
      // Inject state as a JSON string for proper hydration
      // Use JSON.stringify to properly escape and quote the JSON string
      // This ensures window.__UUS_STATE__ is a string, not an object
      const stateScript = JSON.stringify(state)
        .replace(/<\//g, '<\\/')  // Escape closing tags like </script>
        .replace(/<!--/g, '<\\!--')  // Escape HTML comments
        .replace(/\u2028/g, '\\u2028')  // Escape line separator
        .replace(/\u2029/g, '\\u2029');  // Escape paragraph separator

      html = html.replace(
        '</head>',
        `<script>window.__UUS_STATE__=${stateScript}</script></head>`
      );
    }

    // Add hydration markers
    html = addHydrationMarkers(html);

    return html;
  } finally {
    // Cleanup globals
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).navigator;
    delete (global as any).location;
  }
}

/**
 * Render to Node.js stream
 */
export function renderToStream(
  app: Uus | (() => Uus),
  options?: {
    url?: string;
    context?: SSRContext;
    template?: string;
  }
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const html = await renderToString(app, options);
        const chunks = splitIntoChunks(html, 4096); // 4KB chunks

        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Wait for async operations to complete
 */
async function waitForAsyncOps(app: Uus, timeout = 5000): Promise<void> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      // Check if there are pending async operations
      const pending = (app as any).__pendingAsync;

      if (!pending || pending.size === 0) {
        resolve();
        return;
      }

      if (Date.now() - start > timeout) {
        reject(new Error('SSR timeout: async operations did not complete'));
        return;
      }

      setTimeout(check, 10);
    };

    check();
  });
}

/**
 * Serialize app state for hydration
 */
function serializeState(app: Uus): string | null {
  try {
    const state = (app as any).state;
    if (!state) return null;

    // Convert to plain object
    const plain = toPlainObject(state);

    return JSON.stringify(plain);
  } catch (error) {
    console.error('Failed to serialize state:', error);
    return null;
  }
}

/**
 * Convert reactive state to plain object
 */
function toPlainObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (obj instanceof RegExp) return obj.toString();

  if (Array.isArray(obj)) {
    return obj.map(toPlainObject);
  }

  const plain: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      plain[key] = toPlainObject(obj[key]);
    }
  }

  return plain;
}

/**
 * Add hydration markers to HTML
 */
function addHydrationMarkers(html: string): string {
  // Add data-uus-ssr attribute to elements with directives
  return html.replace(/(<[^>]+(?:uus-|:[@])[\s\S]*?>)/g, (match) => {
    if (!match.includes('data-uus-ssr')) {
      return match.replace('>', ' data-uus-ssr>');
    }
    return match;
  });
}

/**
 * Split HTML into chunks for streaming
 */
function splitIntoChunks(html: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let current = 0;

  while (current < html.length) {
    // Try to break at a tag boundary
    let end = current + chunkSize;

    if (end < html.length) {
      // Look for a good break point
      const lastTag = html.lastIndexOf('>', end);
      if (lastTag > current) {
        end = lastTag + 1;
      }
    }

    chunks.push(html.slice(current, end));
    current = end;
  }

  return chunks;
}

/**
 * Default HTML template
 */
const DEFAULT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uus.js App</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
`;
