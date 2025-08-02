# Testing Guide

Uus.js uses [Vitest](https://vitest.dev/) for unit testing across all packages. This guide covers how to write and run tests in the Uus.js monorepo.

## Running Tests

### All Packages

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Individual Package

```bash
# Navigate to package
cd packages/core

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Test Structure

Tests are located in `__tests__` directories within each package:

```
packages/
  core/
    __tests__/
      reactive.test.ts
      parser.test.ts
      evaluator.test.ts
      directives/
        state.test.ts
        text.test.ts
        ...
```

## Writing Tests

### Basic Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { ref, reactive } from '@uusjs/core';

describe('Reactive System', () => {
  it('should create a ref', () => {
    const count = ref(0);
    expect(count.value).toBe(0);

    count.value = 5;
    expect(count.value).toBe(5);
  });
});
```

### Testing Directives

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTextDirective } from '../../src/directives/text';
import { Uus } from '../../src/uus';

describe('Text Directive', () => {
  let el: HTMLElement;
  let app: Uus;

  beforeEach(() => {
    el = document.createElement('div');
    app = new Uus();
    app.state = reactive({ message: 'Hello' });
  });

  it('should set text content', () => {
    const directive = createTextDirective();
    directive(el, 'message', app);

    expect(el.textContent).toBe('Hello');
  });
});
```

### Testing Async Code

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Async Operations', () => {
  it('should handle async validation', async () => {
    const validator = vi.fn(async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return value === 'valid' ? null : { error: true };
    });

    const result = await validator('valid');
    expect(result).toBeNull();
  });
});
```

### Mocking

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Event Handling', () => {
  it('should call event handler', () => {
    const handler = vi.fn();
    const button = document.createElement('button');

    button.addEventListener('click', handler);
    button.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

## Test Coverage

We aim for high test coverage across all packages:

- **Core Package**: >90% coverage for reactive system, directives, parser
- **Router Package**: >85% coverage for routing logic
- **Animate Package**: >80% coverage for animation system
- **Forms Package**: >85% coverage for validation and state management

View coverage reports:

```bash
pnpm test:coverage
# Coverage reports are generated in packages/*/coverage/
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should survive refactoring

2. **Use Descriptive Test Names**

   ```typescript
   // Good
   it('should update text content when state changes');

   // Bad
   it('test update');
   ```

3. **Arrange, Act, Assert**

   ```typescript
   it('should validate email', () => {
     // Arrange
     const validator = validators.email();

     // Act
     const result = validator('test@example.com');

     // Assert
     expect(result).toBeNull();
   });
   ```

4. **Test Edge Cases**
   - Null/undefined values
   - Empty arrays/objects
   - Boundary conditions
   - Error scenarios

5. **Keep Tests Fast**
   - Mock external dependencies
   - Use minimal DOM elements
   - Avoid unnecessary async operations

## Debugging Tests

### Run Single Test File

```bash
pnpm vitest packages/core/__tests__/reactive.test.ts
```

### Run Tests Matching Pattern

```bash
pnpm vitest -t "should create ref"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current Test File",
  "autoAttachChildProcesses": true,
  "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
  "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${relativeFile}"],
  "smartStep": true,
  "console": "integratedTerminal"
}
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Pushes to main branch
- Release builds

See `.github/workflows/ci.yml` for CI configuration.

## Common Issues

### DOM Not Available

Vitest uses `jsdom` or `happy-dom` for DOM APIs. Ensure `environment: 'jsdom'` is set in `vitest.config.ts`.

### Module Resolution

Use path aliases configured in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@uusjs/core': resolve(__dirname, './packages/core/src')
  }
}
```

### Async Test Timeout

Increase timeout for slow async tests:

```typescript
it('should handle slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```
