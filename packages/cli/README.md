# @uusjs/cli

CLI tool for scaffolding Uus.js projects.

## Installation

```bash
npm install -g @uusjs/cli
# or
yarn global add @uusjs/cli
# or
pnpm add -g @uusjs/cli
```

## Usage

### Create a new project

```bash
uus create my-app
# or
npx @uusjs/cli create my-app
```

Follow the interactive prompts to customize your project:

- Choose a template (Basic, Vite, TypeScript, SSR, Full Stack)
- Select features (Router, Animations, Forms, i18n, PWA, Testing)
- Pick a package manager (npm, yarn, pnpm)
- Initialize git repository

### Add packages to existing project

```bash
# Add router
uus add router

# Add animations
uus add animate

# Add forms
uus add forms
```

### Development commands

```bash
# Start dev server
uus dev

# Build for production
uus build
```

## Templates

### Basic (HTML + CDN)

Simple HTML template with Uus.js loaded from CDN. Perfect for quick prototypes and learning.

### Vite

Modern development with HMR, optimized builds, and ES modules.

### TypeScript

Full TypeScript support with type safety and IntelliSense.

### SSR

Server-side rendering with Express.js and client hydration.

### Full Stack

Complete setup with Express.js API backend and Uus.js frontend.

## Features

- 🚀 Zero-config project scaffolding
- 📦 Multiple templates for different use cases
- 🔧 Interactive CLI with beautiful prompts
- 🎯 Automatic dependency installation
- 🎨 Pre-configured with best practices
- 📱 Optional PWA support
- 🧪 Testing setup included

## Project Structure

```
my-app/
├── src/
│   ├── main.js      # App entry point
│   └── style.css    # Styles
├── index.html       # HTML template
├── package.json     # Dependencies
└── vite.config.js   # Vite config (if using Vite)
```

## Contributing

See [Contributing Guide](../../CONTRIBUTING.md) for development setup and guidelines.
