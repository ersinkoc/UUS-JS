# Directives

Directives are special attributes that tell Uus.js how to react to changes in your data. All directives start with `uus-` prefix.

## Core Directives

### uus-state

Initializes reactive state for the element and its children.

```html
<div uus-state="{ count: 0, message: 'Hello' }">
  <!-- State is available here -->
</div>
```

**Advanced usage with computed values:**

```html
<div
  uus-state="{ 
  price: 100,
  quantity: 2,
  total: computed(() => price * quantity)
}"
>
  Total: $<span uus-text="total"></span>
</div>
```

### uus-text

Updates the text content of an element.

```html
<span uus-text="message">This will be replaced</span>
<p uus-text="'Hello ' + name"></p>
<div uus-text="count > 0 ? count : 'No items'"></div>
```

### uus-html

Updates the inner HTML of an element. ⚠️ **Use with caution** - can lead to XSS vulnerabilities.

```html
<div uus-html="htmlContent"></div>
<div uus-html="markdown.render(text)"></div>
```

### uus-show

Toggles the display of an element using CSS.

```html
<div uus-show="isVisible">Visible when isVisible is true</div>
<p uus-show="count > 0">You have items!</p>
```

**How it works:**

- `true`: Removes `display: none`
- `false`: Adds `display: none`
- Element stays in DOM

### uus-if

Conditionally renders an element by adding/removing it from the DOM.

```html
<div uus-if="isLoggedIn">Welcome back!</div>

<template uus-if="loading">
  <div class="spinner"></div>
</template>
```

**vs uus-show:**

- `uus-if`: Removes from DOM (better for rarely shown content)
- `uus-show`: CSS display toggle (better for frequently toggled content)

### uus-for

Renders a list of elements.

```html
<!-- Array iteration -->
<ul>
  <li uus-for="item in items" uus-text="item"></li>
</ul>

<!-- With index -->
<ul>
  <li uus-for="(item, index) in items">
    <span uus-text="index"></span>: <span uus-text="item"></span>
  </li>
</ul>

<!-- Object iteration -->
<dl>
  <template uus-for="(value, key) in object">
    <dt uus-text="key"></dt>
    <dd uus-text="value"></dd>
  </template>
</dl>

<!-- With key binding for performance -->
<div uus-for="user in users" uus-bind:key="user.id">
  <span uus-text="user.name"></span>
</div>
```

### uus-model

Creates two-way data binding on form elements.

```html
<!-- Text input -->
<input uus-model="username" />

<!-- Number input -->
<input type="number" uus-model="age" />

<!-- Checkbox -->
<input type="checkbox" uus-model="agreed" />

<!-- Radio buttons -->
<input type="radio" uus-model="plan" value="basic" />
<input type="radio" uus-model="plan" value="pro" />

<!-- Select -->
<select uus-model="country">
  <option value="us">United States</option>
  <option value="ca">Canada</option>
</select>

<!-- Textarea -->
<textarea uus-model="description"></textarea>

<!-- With modifiers -->
<input uus-model.trim="username" />
<!-- Trims whitespace -->
<input uus-model.number="age" />
<!-- Converts to number -->
<input uus-model.lazy="search" />
<!-- Updates on change, not input -->
```

### uus-bind

Dynamically binds attributes to expressions.

```html
<!-- Basic binding -->
<img uus-bind:src="imageUrl" />
<a uus-bind:href="link">Link</a>
<button uus-bind:disabled="!isValid">Submit</button>

<!-- Shorthand with : -->
<img :src="imageUrl" />
<input :value="name" :placeholder="placeholder" />

<!-- Class binding -->
<div :class="{ active: isActive, disabled: isDisabled }"></div>
<div :class="[baseClass, { active: isActive }]"></div>

<!-- Style binding -->
<div :style="{ color: textColor, fontSize: size + 'px' }"></div>
<div :style="[baseStyles, overrideStyles]"></div>

<!-- Multiple attributes -->
<input
  :type="inputType"
  :placeholder="placeholder"
  :disabled="isDisabled"
  :required="isRequired"
/>
```

### uus-on

Attaches event listeners to elements.

```html
<!-- Basic events -->
<button uus-on:click="count++">Increment</button>
<input uus-on:input="handleInput" />
<form uus-on:submit="handleSubmit">
  <!-- Shorthand with @ -->
  <button @click="handleClick">Click me</button>

  <!-- With event modifiers -->
  <form @submit.prevent="handleSubmit">
    <!-- preventDefault() -->
    <button @click.stop="handleClick">
      <!-- stopPropagation() -->
      <input @keyup.enter="submit" />
      <!-- Key filter -->
      <button @click.once="showAlert">
        <!-- One-time listener -->
        <div @scroll.passive="handleScroll">
          <!-- Passive listener -->
          <button @click.capture="handleClick">
            <!-- Capture phase -->
            <input @input.debounce="search" />
            <!-- Debounced (custom) -->

            <!-- Key modifiers -->
            <input @keyup.enter="submit" />
            <input @keyup.esc="cancel" />
            <input @keyup.tab="next" />
            <input @keyup.delete="remove" />
            <input @keyup.space="pause" />
            <input @keyup.up="moveUp" />
            <input @keyup.down="moveDown" />
            <input @keyup.left="moveLeft" />
            <input @keyup.right="moveRight" />

            <!-- Mouse modifiers -->
            <button @click.left="handleLeftClick">
              <button @click.right="handleRightClick">
                <button @click.middle="handleMiddleClick">
                  <!-- Combination modifiers -->
                  <input @keyup.ctrl.enter="submit" />
                  <button @click.shift="selectMultiple">
                    <div @click.alt.prevent="showMenu">
                      <!-- Inline expressions -->
                      <button @click="count++; showMessage = true">
                        Multiple actions
                      </button>

                      <!-- Method calls with arguments -->
                      <button @click="addItem('apple', 5)">Add Apple</button>

                      <!-- Access event object -->
                      <input @input="handleInput($event)" />
                      <button @click="handleClick($event, extraParam)"></button>
                    </div>
                  </button>
                </button>
              </button>
            </button>
          </button>
        </div>
      </button>
    </button>
  </form>
</form>
```

### uus-class

Dynamically manages CSS classes.

```html
<!-- Object syntax -->
<div uus-class="{ active: isActive, 'text-error': hasError }"></div>

<!-- Array syntax -->
<div uus-class="[baseClass, { active: isActive }]"></div>

<!-- Computed classes -->
<div uus-class="computedClasses"></div>

<!-- Multiple classes -->
<button
  uus-class="{
  'btn': true,
  'btn-primary': type === 'primary',
  'btn-disabled': isDisabled,
  'btn-loading': isLoading
}"
>
  Click me
</button>
```

### uus-style

Dynamically manages inline styles.

```html
<!-- Object syntax -->
<div uus-style="{ color: textColor, fontSize: size + 'px' }"></div>

<!-- With units -->
<div
  uus-style="{ 
  width: width + 'px',
  height: height + 'px',
  transform: `rotate(${rotation}deg)`
}"
></div>

<!-- Conditional styles -->
<div
  uus-style="{
  backgroundColor: isError ? 'red' : 'green',
  opacity: isVisible ? 1 : 0
}"
></div>

<!-- CSS variables -->
<div
  uus-style="{
  '--primary-color': primaryColor,
  '--spacing': spacing + 'px'
}"
></div>
```

### uus-component

Defines lifecycle hooks for elements.

```html
<div
  uus-component="{
  onMount() {
    console.log('Component mounted');
    this.interval = setInterval(() => this.time = Date.now(), 1000);
  },
  
  onUnmount() {
    console.log('Component unmounting');
    clearInterval(this.interval);
  },
  
  onUpdate() {
    console.log('Component updated');
  }
}"
>
  Current time: <span uus-text="time"></span>
</div>
```

## Directive Modifiers

### Event Modifiers

- `.prevent` - Calls `event.preventDefault()`
- `.stop` - Calls `event.stopPropagation()`
- `.capture` - Use capture mode
- `.once` - Remove listener after first trigger
- `.passive` - Passive event listener
- `.self` - Only trigger if event target is the element itself

### Key Modifiers

- `.enter` - Enter key
- `.tab` - Tab key
- `.delete` - Delete key
- `.esc` - Escape key
- `.space` - Space bar
- `.up` - Arrow up
- `.down` - Arrow down
- `.left` - Arrow left
- `.right` - Arrow right
- `.ctrl` - Control key
- `.alt` - Alt key
- `.shift` - Shift key
- `.meta` - Cmd (Mac) or Windows key

### Model Modifiers

- `.lazy` - Update on change instead of input
- `.number` - Cast to number
- `.trim` - Trim whitespace

## Custom Directives

Create your own directives:

```javascript
// Register a custom directive
app.directive('focus', {
  // Called when directive is first bound
  mounted(el, binding) {
    if (binding.value) {
      el.focus();
    }
  },

  // Called when value changes
  updated(el, binding) {
    if (binding.value) {
      el.focus();
    } else {
      el.blur();
    }
  },

  // Called when element is removed
  unmounted(el) {
    // Cleanup if needed
  },
});
```

Use your custom directive:

```html
<input uus-focus="shouldFocus" />
```

## Directive Processing Order

Directives are processed in a specific order:

1. `uus-state` - Initialize state first
2. `uus-for` - Create list items
3. `uus-if` - Conditional rendering
4. `uus-show` - Visibility
5. `uus-bind` - Attributes
6. `uus-model` - Two-way binding
7. `uus-class` - CSS classes
8. `uus-style` - Inline styles
9. `uus-on` - Event handlers
10. `uus-text`/`uus-html` - Content
11. Custom directives
12. `uus-component` - Lifecycle

## Best Practices

1. **Use `:key` with `uus-for`** for better performance
2. **Prefer `uus-show` over `uus-if`** for frequently toggled content
3. **Avoid `uus-html`** unless necessary (XSS risk)
4. **Use `.prevent` modifier** on form submissions
5. **Debounce expensive operations** in event handlers
6. **Keep expressions simple** - use methods for complex logic

## Examples

### Dynamic Form

```html
<form
  uus-state="{ 
  fields: [
    { name: 'username', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'age', type: 'number', required: false }
  ],
  values: {},
  errors: {}
}"
  @submit.prevent="handleSubmit"
>
  <div uus-for="field in fields">
    <label :for="field.name" uus-text="field.name"></label>
    <input
      :id="field.name"
      :type="field.type"
      :required="field.required"
      uus-model="values[field.name]"
      @blur="validateField(field.name)"
    />
    <span
      uus-show="errors[field.name]"
      uus-text="errors[field.name]"
      class="error"
    ></span>
  </div>

  <button type="submit">Submit</button>
</form>
```

### Interactive Gallery

```html
<div
  uus-state="{ 
  images: [...],
  selectedIndex: 0,
  selected: computed(() => images[selectedIndex])
}"
>
  <img :src="selected.url" :alt="selected.title" uus-animate="fadeIn" />

  <div class="thumbnails">
    <img
      uus-for="(img, index) in images"
      :src="img.thumbnail"
      :class="{ active: index === selectedIndex }"
      @click="selectedIndex = index"
    />
  </div>

  <button
    @click="selectedIndex = Math.max(0, selectedIndex - 1)"
    :disabled="selectedIndex === 0"
  >
    Previous
  </button>

  <button
    @click="selectedIndex = Math.min(images.length - 1, selectedIndex + 1)"
    :disabled="selectedIndex === images.length - 1"
  >
    Next
  </button>
</div>
```

Need more examples? Check out our [Examples](../examples/) section!
