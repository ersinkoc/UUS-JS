import type { Uus } from '@uusjs/core';
import type { I18nOptions, I18nPlugin, I18nInstance } from './types';
import { I18n } from './i18n';

/**
 * Create i18n plugin for Uus.js
 */
export function createI18n(options: I18nOptions = {}): I18nPlugin {
  const i18n = new I18n(options);

  return {
    i18n,
    
    install(app: Uus) {
      // Add i18n instance to app
      (app as any).$i18n = i18n;
      
      // Add global properties to state
      if (app.state) {
        app.state.$t = i18n.t.bind(i18n);
        app.state.$tp = i18n.tp.bind(i18n);
        app.state.$te = i18n.te.bind(i18n);
        app.state.$d = i18n.d.bind(i18n);
        app.state.$n = i18n.n.bind(i18n);
        app.state.$locale = i18n.locale;
        
        // Reactive locale property
        Object.defineProperty(app.state, '$locale', {
          get: () => i18n.locale,
          set: (locale: string) => i18n.setLocale(locale),
          enumerable: true,
          configurable: true
        });
      }
      
      // Register directives
      app.directive('t', {
        mounted(el: Element, binding: any) {
          const { value, arg } = binding;
          const key = arg || value;
          
          if (typeof key === 'string') {
            el.textContent = i18n.t(key);
          }
        },
        
        updated(el: Element, binding: any) {
          const { value, arg } = binding;
          const key = arg || value;
          
          if (typeof key === 'string') {
            el.textContent = i18n.t(key);
          }
        }
      });
      
      app.directive('t-html', {
        mounted(el: Element, binding: any) {
          const { value, arg } = binding;
          const key = arg || value;
          
          if (typeof key === 'string') {
            el.innerHTML = i18n.t(key);
          }
        },
        
        updated(el: Element, binding: any) {
          const { value, arg } = binding;
          const key = arg || value;
          
          if (typeof key === 'string') {
            el.innerHTML = i18n.t(key);
          }
        }
      });
      
      app.directive('tp', {
        mounted(el: Element, binding: any, app: Uus) {
          const { value } = binding;
          
          if (typeof value === 'object' && value.key && typeof value.count === 'number') {
            el.textContent = i18n.tp(value.key, value.count, value.params || {});
          }
        },
        
        updated(el: Element, binding: any, app: Uus) {
          const { value } = binding;
          
          if (typeof value === 'object' && value.key && typeof value.count === 'number') {
            el.textContent = i18n.tp(value.key, value.count, value.params || {});
          }
        }
      });
      
      // Add locale change handler
      const originalSetLocale = i18n.setLocale.bind(i18n);
      (i18n as any).setLocale = async (locale: string) => {
        await originalSetLocale(locale);
        
        // Update reactive property
        if (app.state) {
          (app.state as any).$locale = locale;
        }
        
        // Trigger re-render of translation directives
        app.update();
      };
    }
  };
}

/**
 * Directive helpers
 */
export const i18nDirectives = {
  /**
   * Translation directive: uus-t="key"
   */
  t: {
    mounted(el: Element, binding: any, app: Uus) {
      const i18n = (app as any).$i18n as I18nInstance;
      const { value, arg } = binding;
      const key = arg || value;
      
      if (typeof key === 'string') {
        el.textContent = i18n.t(key);
      }
      
      // Store key for updates
      (el as any).__i18nKey = key;
    },
    
    updated(el: Element, binding: any, app: Uus) {
      const i18n = (app as any).$i18n as I18nInstance;
      const { value, arg } = binding;
      const key = arg || value;
      
      if (typeof key === 'string' && key !== (el as any).__i18nKey) {
        el.textContent = i18n.t(key);
        (el as any).__i18nKey = key;
      }
    }
  },
  
  /**
   * HTML translation directive: uus-t-html="key"
   */
  't-html': {
    mounted(el: Element, binding: any, app: Uus) {
      const i18n = (app as any).$i18n as I18nInstance;
      const { value, arg } = binding;
      const key = arg || value;
      
      if (typeof key === 'string') {
        el.innerHTML = i18n.t(key);
      }
      
      (el as any).__i18nKey = key;
    },
    
    updated(el: Element, binding: any, app: Uus) {
      const i18n = (app as any).$i18n as I18nInstance;
      const { value, arg } = binding;
      const key = arg || value;
      
      if (typeof key === 'string' && key !== (el as any).__i18nKey) {
        el.innerHTML = i18n.t(key);
        (el as any).__i18nKey = key;
      }
    }
  },
  
  /**
   * Plural translation directive: uus-tp="{ key, count, params }"
   */
  tp: {
    mounted(el: Element, binding: any, app: Uus) {
      const i18n = (app as any).$i18n as I18nInstance;
      const { value } = binding;
      
      if (typeof value === 'object' && value.key && typeof value.count === 'number') {
        el.textContent = i18n.tp(value.key, value.count, value.params || {});
      }
      
      (el as any).__i18nValue = value;
    },
    
    updated(el: Element, binding: any, app: Uus) {
      const i18n = (app as any).$i18n as I18nInstance;
      const { value } = binding;
      
      if (typeof value === 'object' && value.key && typeof value.count === 'number') {
        const prev = (el as any).__i18nValue;
        
        if (!prev || prev.key !== value.key || prev.count !== value.count) {
          el.textContent = i18n.tp(value.key, value.count, value.params || {});
          (el as any).__i18nValue = value;
        }
      }
    }
  }
};