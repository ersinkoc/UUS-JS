# Contributing to Uus.js

Thank you for your interest in contributing to Uus.js! We're excited to have you join our community.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Code samples (if applicable)
- Environment details (OS, browser, Uus.js version)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

- Use a clear and descriptive title
- Provide a detailed description of the enhancement
- Explain why this enhancement would be useful
- Include code examples if possible

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code follows our style guide
5. Issue the pull request

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/uus-js/uus.git
   cd uus
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build all packages:

   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

### Development Workflow

- `pnpm dev` - Start development mode for all packages
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm size` - Check bundle sizes

### Project Structure

```
uus/
├── packages/         # Package source code
│   ├── core/        # Core framework
│   ├── router/      # Router package
│   ├── animate/     # Animation package
│   └── forms/       # Forms package
├── apps/            # Applications
│   ├── docs/        # Documentation site
│   └── playground/  # Interactive playground
└── examples/        # Example projects
```

### Testing

- Write tests for all new features
- Maintain test coverage above 90%
- Tests should be in `__tests__` directories or `.test.ts` files
- Use descriptive test names

### Coding Style

- We use ESLint and Prettier for code formatting
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

Examples:

```
feat(core): add watch function to reactive system
fix(router): handle special characters in route params
docs: update installation guide
```

### Versioning

We use [Changesets](https://github.com/changesets/changesets) for version management:

1. Create a changeset:

   ```bash
   pnpm changeset
   ```

2. Follow the prompts to describe your changes

3. Commit the changeset file with your PR

### Documentation

- Update documentation for any API changes
- Include code examples
- Keep language clear and concise
- Test all code examples

## Getting Help

- Join our [Discord](https://discord.gg/uusjs)
- Check existing [issues](https://github.com/uus-js/uus/issues)
- Read the [documentation](https://uusjs.dev)

## Recognition

Contributors will be recognized in:

- Our README contributors section
- The official documentation
- Release notes

Thank you for contributing to Uus.js! 🎉
