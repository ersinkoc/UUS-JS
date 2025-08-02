import type { LocaleMessages } from './types';

/**
 * Load locale messages from JSON files
 */
export async function loadLocaleMessages(
  locale: string,
  basePath = '/locales'
): Promise<LocaleMessages> {
  try {
    const response = await fetch(`${basePath}/${locale}.json`);

    if (!response.ok) {
      throw new Error(`Failed to load locale ${locale}: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Failed to load locale messages for ${locale}:`, error);
    return {};
  }
}

/**
 * Load locale messages from dynamic imports (webpack chunks)
 */
export async function loadLocaleMessagesChunk(
  locale: string
): Promise<LocaleMessages> {
  // Dynamic imports with variables are not supported in all build tools
  // This is a placeholder - in real usage, you would:
  // 1. Use a build tool plugin to handle dynamic imports
  // 2. Or pre-load all locales and select at runtime
  // 3. Or use fetch() to load JSON files dynamically
  console.warn(
    `Dynamic import for locale ${locale} not implemented. Use loadLocaleMessages() instead.`
  );
  return {};
}

/**
 * Load locale messages from a CDN
 */
export async function loadLocaleMessagesCDN(
  locale: string,
  cdnUrl: string
): Promise<LocaleMessages> {
  try {
    const response = await fetch(`${cdnUrl}/locales/${locale}.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to load locale ${locale} from CDN: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.warn(
      `Failed to load locale messages from CDN for ${locale}:`,
      error
    );
    return {};
  }
}

/**
 * Load locale messages from localStorage cache with fallback
 */
export async function loadLocaleMessagesWithCache(
  locale: string,
  loader: (locale: string) => Promise<LocaleMessages>,
  cacheKey?: string
): Promise<LocaleMessages> {
  const storageKey = cacheKey || `uus-i18n-${locale}`;

  // Try to load from cache first
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);

        // Check if cache is valid (you might want to add timestamp validation)
        if (parsed.messages) {
          return parsed.messages;
        }
      }
    } catch (error) {
      console.warn('Failed to load locale from cache:', error);
    }
  }

  // Load from network
  try {
    const messages = await loader(locale);

    // Cache the result
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            messages,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.warn('Failed to cache locale messages:', error);
      }
    }

    return messages;
  } catch (error) {
    console.warn(`Failed to load locale messages for ${locale}:`, error);
    return {};
  }
}

/**
 * Create a locale loader with retry logic
 */
export function createRetryLoader(
  baseLoader: (locale: string) => Promise<LocaleMessages>,
  maxRetries = 3,
  retryDelay = 1000
): (locale: string) => Promise<LocaleMessages> {
  return async (locale: string) => {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await baseLoader(locale);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
        }
      }
    }

    throw lastError!;
  };
}

/**
 * Create a locale loader with multiple fallback sources
 */
export function createFallbackLoader(
  loaders: Array<(locale: string) => Promise<LocaleMessages>>
): (locale: string) => Promise<LocaleMessages> {
  return async (locale: string) => {
    const errors: Error[] = [];

    for (const loader of loaders) {
      try {
        const messages = await loader(locale);

        // Return first successful result
        if (Object.keys(messages).length > 0) {
          return messages;
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // If all loaders failed, throw combined error
    throw new Error(
      `All locale loaders failed for ${locale}: ${errors.map((e) => e.message).join(', ')}`
    );
  };
}

/**
 * Preload locale messages for better UX
 */
export class LocalePreloader {
  private cache = new Map<string, Promise<LocaleMessages>>();
  private loader: (locale: string) => Promise<LocaleMessages>;

  constructor(loader: (locale: string) => Promise<LocaleMessages>) {
    this.loader = loader;
  }

  /**
   * Preload a locale
   */
  preload(locale: string): Promise<LocaleMessages> {
    if (!this.cache.has(locale)) {
      const promise = this.loader(locale);
      this.cache.set(locale, promise);
    }

    return this.cache.get(locale)!;
  }

  /**
   * Preload multiple locales
   */
  async preloadAll(locales: string[]): Promise<Record<string, LocaleMessages>> {
    const promises = locales.map((locale) =>
      this.preload(locale).then((messages) => ({ locale, messages }))
    );

    const results = await Promise.allSettled(promises);
    const loaded: Record<string, LocaleMessages> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loaded[result.value.locale] = result.value.messages;
      } else {
        console.warn(
          `Failed to preload locale ${locales[index]}:`,
          result.reason
        );
      }
    });

    return loaded;
  }

  /**
   * Get cached locale messages
   */
  getCached(locale: string): LocaleMessages | null {
    const promise = this.cache.get(locale);

    if (promise) {
      // Check if promise is resolved
      let result: LocaleMessages | null = null;

      promise
        .then((messages) => {
          result = messages;
        })
        .catch(() => {
          result = null;
        });

      return result;
    }

    return null;
  }

  /**
   * Clear cache
   */
  clearCache(locale?: string): void {
    if (locale) {
      this.cache.delete(locale);
    } else {
      this.cache.clear();
    }
  }
}
