# @uusjs/core

The core reactive engine for Uus.js - a fresh reactive HTML framework.

## Installation

```bash
npm install @uusjs/core
# or
pnpm add @uusjs/core
# or
yarn add @uusjs/core
```

## Usage

### Via CDN

```html
<script src="https://unpkg.com/@uusjs/core"></script>
<script>
  new Uus().mount('#app');
</script>
```

### Via NPM

```javascript
import { Uus } from '@uusjs/core';

const app = new Uus();
app.mount('#app');
```

## Basic Example

```html
<div id="app" uus-state="{ count: 0 }">
  <h1>Count: <span uus-text="count"></span></h1>
  <button uus-on:click="count++">Increment</button>
</div>

<script>
  new Uus().mount('#app');
</script>
```

## Core Directives

### uus-state

Initialize reactive state for an element and its children:

```html
<div uus-state="{ name: 'World', count: 0 }">
  <!-- State is available to all child elements -->
</div>
```

### uus-text

Set the text content of an element:

```html
<span uus-text="message"></span>
<span uus-text="'Hello ' + name"></span>
<span uus-text="count * 2"></span>
```

### uus-on

Attach event listeners with optional modifiers:

```html
<!-- Basic event -->
<button uus-on:click="handleClick()">Click me</button>

<!-- With modifiers -->
<form uus-on:submit.prevent="handleSubmit()">
  <button uus-on:click.once="showAlert()">
    <input uus-on:keyup.enter="submit()" />

    <!-- Access event object -->
    <input uus-on:input="value = $event.target.value" />
  </button>
</form>
```

## API Reference

### Constructor

```javascript
const app = new Uus(config);
```

**Config Options:**

- `debug` (boolean): Enable debug logging
- `prefix` (string): Custom directive prefix (default: 'uus-')

### Methods

#### mount(element)

Mount Uus to a DOM element:

```javascript
app.mount('#app');
// or
app.mount(document.getElementById('app'));
```

#### unmount()

Unmount and clean up:

```javascript
app.unmount();
```

#### use(plugin)

Install a plugin:

```javascript
app.use(myPlugin);
```

### Static Methods

#### Uus.config(options)

Set global configuration:

```javascript
Uus.config({
  debug: true,
  plugins: [plugin1, plugin2],
});
```

## Creating Plugins

```javascript
const myPlugin = {
  name: 'my-plugin',
  install(uus) {
    // Register custom directives
    uus.registerDirective({
      name: 'custom',
      bind(el, binding, uus) {
        // Directive logic
      },
    });
  },
};
```

## License

MIT
