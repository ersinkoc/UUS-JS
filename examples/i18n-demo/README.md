# UUS.js Internationalization (i18n) Demo

A comprehensive internationalization example built with UUS.js, demonstrating:

- **Multi-language Support** - English, Turkish, Arabic, and Spanish
- **Dynamic Translation** - Real-time language switching
- **String Interpolation** - Variables and placeholders in translations
- **Pluralization** - Complex plural forms including Arabic plurals
- **Number & Date Formatting** - Locale-aware formatting
- **RTL/LTR Support** - Automatic text direction based on language
- **Form Validation** - Translated error messages

## Features

### 🌍 Language Support
- **English** - Default language with comprehensive translations
- **Turkish** - Full Turkish localization
- **Arabic** - Right-to-left (RTL) with complex pluralization
- **Spanish** - Spanish translations with proper grammar

### 🔄 Translation Features
- Simple string translation
- Variable interpolation with named placeholders
- Complex pluralization rules
- Locale-aware number formatting
- Date and time formatting
- Missing translation fallbacks

### 📱 User Experience
- Instant language switching
- Automatic text direction (RTL/LTR)
- Responsive design for all languages
- Interactive examples and demos

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Translation System

### Basic Translation
```html
<h1 uus-text="t('title')"></h1>
<!-- Renders: "UUS.js Internationalization Demo" in English -->
```

### Variable Interpolation
```html
<span uus-text="t('examples.welcome', { name: userName })"></span>
<!-- Renders: "Welcome, John!" with user input -->
```

### Pluralization
```html
<span uus-text="tp('plurals.item', itemCount)"></span>
<!-- Renders: "No items", "1 item", "5 items" based on count -->
```

### Number Formatting
```html
<span uus-text="n(price, 'currency')"></span>
<!-- Renders: "$1,234.56" in English, "1.234,56 $" in Turkish -->
```

### Date Formatting
```html
<span uus-text="d(currentDate, 'long')"></span>
<!-- Renders locale-appropriate date format -->
```

## Implementation

### State Management
```html
<div id="app" uus-state="{
  // Current locale
  currentLocale: 'en',
  
  // All translation messages
  messages: {
    en: { /* English translations */ },
    tr: { /* Turkish translations */ },
    ar: { /* Arabic translations */ },
    es: { /* Spanish translations */ }
  },
  
  // Translation methods
  t(key, params = {}) {
    // Translation logic with interpolation
  },
  
  tp(key, count) {
    // Pluralization logic
  }
}">
```

### Language Switching
```html
<button 
  uus-for="lang in languages"
  uus-on:click="changeLanguage(lang.code)"
  uus-class="{ active: currentLocale === lang.code }"
>
  <span uus-text="lang.flag"></span>
  <span uus-text="lang.name"></span>
</button>
```

### RTL/LTR Support
```javascript
get isRTL() {
  return ['ar', 'he', 'fa'].includes(this.currentLocale);
}

changeLanguage(locale) {
  this.currentLocale = locale;
  document.documentElement.dir = this.isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}
```

## Translation Files

### English (en.json)
```json
{
  "title": "UUS.js Internationalization Demo",
  "examples": {
    "welcome": "Welcome, {name}!",
    "user_greeting": "Hello {name}, you have {count} {count, plural, one {message} other {messages}}"
  },
  "plurals": {
    "item": "{count, plural, =0 {No items} one {1 item} other {{count} items}}"
  }
}
```

### Arabic (ar.json) with Complex Plurals
```json
{
  "plurals": {
    "item": "{count, plural, =0 {لا توجد عناصر} one {عنصر واحد} two {عنصران} few {عناصر} many {عنصر} other {عنصر}}"
  }
}
```

## Pluralization Rules

### English Pluralization
- 0: "No items"
- 1: "1 item" 
- 2+: "X items"

### Arabic Pluralization (Complex)
- 0: لا توجد عناصر (No items)
- 1: عنصر واحد (One item)
- 2: عنصران (Two items)
- 3-10: عناصر (Few items)
- 11-99: عنصر (Many items)
- 100+: عنصر (Other items)

### Turkish Pluralization
- 0: Öğe yok (No items)
- 1: 1 öğe (1 item)
- 2+: X öğe (X items)

## Formatting Examples

### Currency Formatting
```javascript
// English: $1,234.56
// Turkish: 1.234,56 ₺ 
// Arabic: ١٬٢٣٤٫٥٦ ﷼
// Spanish: 1.234,56 €
n(1234.56, 'currency')
```

### Date Formatting
```javascript
// English: Monday, January 15, 2024 at 2:30 PM
// Turkish: 15 Ocak 2024 Pazartesi 14:30
// Arabic: الاثنين، 15 يناير 2024 في 2:30 م
// Spanish: lunes, 15 de enero de 2024, 14:30
d(new Date(), 'long')
```

## Form Validation

### Translated Error Messages
```html
<input uus-model="formData.email" type="email">
<div uus-show="!isValidEmail(formData.email) && showValidation" class="error">
  <span uus-text="t('examples.form_validation.email')"></span>
</div>
```

### Validation Messages by Language
- **English**: "Please enter a valid email address"
- **Turkish**: "Lütfen geçerli bir e-posta adresi girin"
- **Arabic**: "يرجى إدخال عنوان بريد إلكتروني صحيح"
- **Spanish**: "Por favor ingresa una dirección de correo válida"

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Full mobile browser support
- RTL text rendering support

## Customization

### Adding New Languages
1. Create translation file in `src/locales/`
2. Add language to the `languages` array
3. Include RTL support if needed

### Custom Pluralization
Modify the `tp()` method to support additional plural forms:

```javascript
tp(key, count) {
  const message = this.t(key);
  // Add custom pluralization logic
  return formatPluralMessage(message, count, this.currentLocale);
}
```

### Number Format Customization
```javascript
n(number, format) {
  const locale = this.currentLocale;
  if (format === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: getCurrencyForLocale(locale) // Custom currency logic
    }).format(number);
  }
}
```

## Performance

- Efficient translation lookup with nested object access
- Lazy loading of translation files (ready for implementation)
- Minimal runtime overhead for interpolation
- Optimized pluralization logic

## License

MIT