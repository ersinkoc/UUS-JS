# @uusjs/i18n

Internationalization and localization support for Uus.js applications.

## Features

- 🌍 **Multi-language Support**: Easy translation management
- 🔄 **Reactive Locale Switching**: Automatic UI updates on language change
- 📝 **Pluralization**: Advanced plural forms for different languages
- 🎯 **Template Interpolation**: Dynamic values in translations
- 📅 **Date/Number Formatting**: Locale-aware formatting
- 💾 **Lazy Loading**: Load translations on demand
- 🗂️ **Nested Keys**: Organize translations hierarchically
- 🔍 **Missing Translation Handling**: Graceful fallbacks
- 📱 **Browser Language Detection**: Auto-detect user's preferred language
- 💽 **Persistence**: Remember user's language choice

## Installation

```bash
npm install @uusjs/i18n
```

## Quick Start

### Basic Setup

```javascript
import { Uus } from '@uusjs/core';
import { createI18n } from '@uusjs/i18n';

// Define translations
const messages = {
  en: {
    hello: 'Hello',
    welcome: 'Welcome {name}!',
    items: {
      0: 'No items',
      1: 'One item',
      2: '{count} items',
    },
  },
  es: {
    hello: 'Hola',
    welcome: '¡Bienvenido {name}!',
    items: {
      0: 'Sin artículos',
      1: 'Un artículo',
      2: '{count} artículos',
    },
  },
  tr: {
    hello: 'Merhaba',
    welcome: 'Hoş geldin {name}!',
    items: {
      0: 'Öğe yok',
      1: 'Bir öğe',
      2: '{count} öğe',
    },
  },
};

// Create i18n instance
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});

// Create app
const app = new Uus({
  state: {
    name: 'John',
    itemCount: 3,
  },
});

// Install i18n plugin
app.use(i18n);

// Mount app
app.mount('#app');
```

### Template Usage

```html
<div uus-state>
  <!-- Basic translation -->
  <h1 uus-t="hello"></h1>

  <!-- Translation with interpolation -->
  <p uus-text="$t('welcome', { name })"></p>

  <!-- Pluralization -->
  <span uus-text="$tp('items', itemCount)"></span>

  <!-- Directive with parameters -->
  <div uus-t-html="'welcome'"></div>

  <!-- Language switcher -->
  <select uus-model="$locale">
    <option value="en">English</option>
    <option value="es">Español</option>
    <option value="tr">Türkçe</option>
  </select>
</div>
```

## Advanced Usage

### Lazy Loading

```javascript
import { createI18n, loadLocaleMessages } from '@uusjs/i18n';

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  loadMessages: async (locale) => {
    // Load from JSON files
    return await loadLocaleMessages(locale, '/locales');
  },
});

// Change language (will auto-load if needed)
await i18n.i18n.setLocale('es');
```

### Date and Number Formatting

```javascript
const i18n = createI18n({
  locale: 'en',
  dateTimeFormats: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    },
  },
  numberFormats: {
    currency: {
      style: 'currency',
      currency: 'USD',
    },
    percent: {
      style: 'percent',
    },
  },
});

// In your app
app.state.formatDate = (date) => i18n.i18n.d(date, 'short');
app.state.formatPrice = (price) => i18n.i18n.n(price, 'currency');
```

### Custom Missing Handler

```javascript
const i18n = createI18n({
  locale: 'en',
  missingHandler: (locale, key, fallback) => {
    // Log missing translations in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation: ${locale}.${key}`);
    }

    // Return a styled fallback
    return `[${key}]`;
  },
});
```

### Programmatic API

```javascript
// Get i18n instance
const { i18n } = app.$i18n;

// Translate
const message = i18n.t('hello');
const withParams = i18n.t('welcome', { name: 'John' });

// Pluralization
const pluralized = i18n.tp('items', 5);

// Check if translation exists
if (i18n.te('some.key')) {
  // Translation exists
}

// Format date/number
const formatted = i18n.d(new Date());
const number = i18n.n(1234.56);

// Change locale
await i18n.setLocale('es');

// Add/update messages
i18n.setMessages('fr', {
  hello: 'Bonjour',
  welcome: 'Bienvenue {name}!',
});
```

## Pluralization

The i18n package supports complex pluralization rules for different languages:

### English (Simple)

```json
{
  "item": {
    "0": "No items",
    "1": "One item",
    "2": "{count} items"
  }
}
```

### Russian (Complex)

```json
{
  "item": {
    "0": "{count} предмет",
    "1": "{count} предмета",
    "2": "{count} предметов"
  }
}
```

### Arabic (Very Complex)

```json
{
  "item": {
    "0": "لا توجد عناصر",
    "1": "عنصر واحد",
    "2": "عنصران",
    "3": "{count} عناصر",
    "4": "{count} عنصراً",
    "5": "{count} عنصر"
  }
}
```

## Directives

### `uus-t`

Basic translation directive:

```html
<!-- Static key -->
<span uus-t="hello"></span>

<!-- Dynamic key -->
<span uus-t="dynamicKey"></span>
```

### `uus-t-html`

HTML translation directive (renders HTML):

```html
<div uus-t-html="richContent"></div>
```

### `uus-tp`

Pluralization directive:

```html
<span uus-tp="{ key: 'items', count: itemCount }"></span>
```

## Loading Strategies

### From JSON Files

```javascript
import { loadLocaleMessages } from '@uusjs/i18n';

const i18n = createI18n({
  loadMessages: (locale) => loadLocaleMessages(locale, '/locales'),
});
```

### From CDN

```javascript
import { loadLocaleMessagesCDN } from '@uusjs/i18n';

const i18n = createI18n({
  loadMessages: (locale) =>
    loadLocaleMessagesCDN(locale, 'https://cdn.example.com'),
});
```

### With Caching

```javascript
import { loadLocaleMessagesWithCache } from '@uusjs/i18n';

const i18n = createI18n({
  loadMessages: (locale) =>
    loadLocaleMessagesWithCache(locale, (locale) =>
      loadLocaleMessages(locale, '/locales')
    ),
});
```

### With Retry Logic

```javascript
import { createRetryLoader, loadLocaleMessages } from '@uusjs/i18n';

const retryLoader = createRetryLoader(
  (locale) => loadLocaleMessages(locale, '/locales'),
  3, // max retries
  1000 // delay between retries
);

const i18n = createI18n({
  loadMessages: retryLoader,
});
```

## File Organization

### Flat Structure

```
locales/
├── en.json
├── es.json
└── tr.json
```

### Nested Structure

```javascript
// en.json
{
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "forms": {
    "validation": {
      "required": "This field is required",
      "email": "Please enter a valid email"
    }
  }
}
```

Usage:

```html
<span uus-t="navigation.home"></span>
<span uus-t="forms.validation.required"></span>
```

## TypeScript Support

```typescript
import { createI18n, I18nInstance } from '@uusjs/i18n';

interface Messages {
  hello: string;
  welcome: string;
  items: Record<string, string>;
}

const i18n = createI18n({
  locale: 'en',
  messages: {
    en: {
      hello: 'Hello',
      welcome: 'Welcome {name}!',
    } as Messages,
  },
});

// Type-safe access
const instance: I18nInstance = i18n.i18n;
```

## Best Practices

### 1. Organize Keys Logically

```json
{
  "pages": {
    "home": {
      "title": "Welcome Home",
      "subtitle": "Your journey starts here"
    }
  },
  "components": {
    "button": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}
```

### 2. Use Meaningful Keys

```javascript
// Good
i18n.t('user.profile.edit.title');

// Bad
i18n.t('text1');
```

### 3. Handle Missing Translations

```javascript
const i18n = createI18n({
  missingHandler: (locale, key) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing: ${locale}.${key}`);
    }

    // Return fallback
    return key.split('.').pop() || key;
  },
});
```

### 4. Lazy Load Large Translations

```javascript
// Only load when needed
const i18n = createI18n({
  loadMessages: async (locale) => {
    const { default: messages } = await import(`./locales/${locale}.json`);
    return messages;
  },
});
```

### 5. Use Pluralization Correctly

```json
{
  "notifications": {
    "0": "No new notifications",
    "1": "You have 1 notification",
    "2": "You have {count} notifications"
  }
}
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- IE 11+ (with polyfills)

## License

MIT
