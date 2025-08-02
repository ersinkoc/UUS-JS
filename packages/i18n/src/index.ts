export * from './types';
export * from './i18n';
export * from './plugin';
export * from './utils';
export * from './pluralization';
export * from './loaders';

// Re-export main functions
import { createI18n as createI18nPlugin } from './plugin';
export { createI18nPlugin as createI18n };
export { I18n } from './i18n';

// Default export
export default { createI18n: createI18nPlugin };
