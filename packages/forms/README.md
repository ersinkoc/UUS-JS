# @uusjs/forms

Form handling and validation for Uus.js applications.

## Installation

```bash
npm install @uusjs/forms
```

## Usage

```javascript
import { Uus } from '@uusjs/core';
import { createForms } from '@uusjs/forms';

const app = new Uus();
app.use(createForms());
app.mount('#app');
```

### Basic Form

```html
<form uus-form="contactForm" 
      uus-on:submit="handleSubmit($values)"
      uus-validate-on="blur">
  
  <!-- Text input with validation -->
  <input uus-field="email" 
         uus-validate="required|email"
         type="email"
         placeholder="Email">
  <span uus-error="email"></span>
  
  <!-- Password with custom validation -->
  <input uus-field="password"
         uus-validate="required|minLength:8"
         type="password"
         placeholder="Password">
  <span uus-error="password"></span>
  
  <!-- Confirm password -->
  <input uus-field="confirmPassword"
         uus-validate="required|match:password"
         type="password"
         placeholder="Confirm Password">
  <span uus-error="confirmPassword"></span>
  
  <!-- Submit button (disabled when invalid) -->
  <button uus-submit>Submit</button>
</form>
```

### Form State

Access form state in your templates:

```html
<div uus-state="{ submitted: false }">
  <form uus-form="myForm">
    <!-- Form fields... -->
    
    <!-- Show form state -->
    <div>
      Valid: <span uus-text="myForm.valid"></span><br>
      Dirty: <span uus-text="myForm.dirty"></span><br>
      Touched: <span uus-text="myForm.touched"></span><br>
      Submitting: <span uus-text="myForm.submitting"></span>
    </div>
  </form>
</div>
```

## Built-in Validators

### Basic Validators
- `required` - Field must have a value
- `email` - Valid email format
- `number` - Must be a number
- `integer` - Must be a whole number
- `url` - Valid URL format
- `phone` - Valid phone number
- `date` - Valid date

### Length Validators
- `minLength:n` - Minimum length
- `maxLength:n` - Maximum length

### Range Validators
- `min:n` - Minimum value
- `max:n` - Maximum value

### Pattern Validator
- `pattern:/regex/` - Match regular expression

### Comparison Validator
- `match:fieldName` - Must match another field

### Multiple Validators
Combine validators with pipe `|`:
```html
<input uus-field="age" 
       uus-validate="required|integer|min:18|max:120">
```

## Custom Validators

### Inline Custom Validator
```javascript
import { custom } from '@uusjs/forms';

// In your state
const customValidators = {
  strongPassword: custom(
    (value) => /^(?=.*[A-Z])(?=.*[0-9])/.test(value),
    'Password must contain uppercase and number'
  )
};
```

### Async Validators
```javascript
import { asyncEmailAvailable } from '@uusjs/forms';

const checkEmail = asyncEmailAvailable(async (email) => {
  const response = await fetch(`/api/check-email?email=${email}`);
  return response.ok;
});

// Add to form
form.addAsyncValidator('email', checkEmail);
```

## Form Options

### Validation Timing
- `uus-validate-on` - When to validate (change, blur, submit)
- `uus-revalidate-on` - When to revalidate after error

```html
<form uus-form="myForm" 
      uus-validate-on="change"
      uus-revalidate-on="blur">
```

## Programmatic Form Usage

```javascript
import { Form } from '@uusjs/forms';

// Create form instance
const form = new Form({
  initialValues: {
    name: '',
    email: ''
  },
  validators: {
    name: [required, minLength(2)],
    email: [required, email]
  }
});

// Set field value
form.setFieldValue('name', 'John');

// Validate specific field
await form.validateField('email');

// Validate entire form
const isValid = await form.validateForm();

// Submit form
await form.submitForm(async (values) => {
  await api.post('/submit', values);
});

// Reset form
form.resetForm();
```

## Advanced Features

### Conditional Fields
```html
<div uus-state="{ showPhone: false }">
  <label>
    <input type="checkbox" uus-model="showPhone">
    Add phone number
  </label>
  
  <input uus-if="showPhone"
         uus-field="phone"
         uus-validate="required|phone"
         placeholder="Phone">
</div>
```

### Dynamic Validation
```javascript
// Add validator dynamically
form.addFieldValidator('email', (value) => {
  if (value.endsWith('.test')) {
    return 'Test emails not allowed';
  }
  return null;
});
```

### Field Arrays
```html
<div uus-for="(item, index) in formData.items">
  <input uus-field="`items.${index}.name`"
         uus-validate="required">
  <button uus-on:click="formData.items.splice(index, 1)">
    Remove
  </button>
</div>
<button uus-on:click="formData.items.push({ name: '' })">
  Add Item
</button>
```

## Accessibility

Forms automatically include:
- `aria-invalid` on invalid fields
- `aria-describedby` linking to error messages
- `role="alert"` on error messages
- `aria-busy` on submit buttons during submission

## License

MIT