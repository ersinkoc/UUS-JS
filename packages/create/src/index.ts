#!/usr/bin/env node

/**
 * Create UUS.js App - Project Scaffolding CLI
 * Quickly scaffold new UUS.js projects with templates
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

interface ProjectConfig {
  name: string;
  template: string;
  typescript: boolean;
  features: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

const TEMPLATES = {
  basic: {
    name: 'Basic HTML',
    description: 'Simple single-page app with UUS.js',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - UUS.js App</title>
  <script src="https://unpkg.com/@uusjs/core/dist/uus.min.js"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .counter {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 2rem 0;
    }
    
    button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      border-radius: 4px;
      border: 1px solid #ddd;
      background: #fff;
      cursor: pointer;
    }
    
    button:hover {
      background: #f0f0f0;
    }
  </style>
</head>
<body>
  <div id="app">
    <h1>Welcome to {{name}}!</h1>
    
    <div uus-state="{ count: 0, message: 'Hello, UUS.js!' }">
      <h2 uus-text="message"></h2>
      
      <div class="counter">
        <button uus-on:click="count--">-</button>
        <span uus-text="'Count: ' + count"></span>
        <button uus-on:click="count++">+</button>
      </div>
      
      <input 
        type="text" 
        uus-model="message"
        placeholder="Type a message..."
        style="width: 100%; padding: 0.5rem; margin-top: 1rem;"
      >
      
      <p uus-show="count > 0">
        You've clicked {{ count }} times!
      </p>
    </div>
  </div>
  
  <script>
    const app = new Uus();
    app.mount('#app');
  </script>
</body>
</html>`,
      'README.md': `# {{name}}

A UUS.js application.

## Getting Started

Open \`index.html\` in your browser to see the app.

## Learn More

- [UUS.js Documentation](https://github.com/uusjs/uus)
- [Examples](https://github.com/uusjs/uus/tree/main/examples)
`
    }
  },
  
  spa: {
    name: 'Single Page Application',
    description: 'Full-featured SPA with routing and components',
    files: {
      'package.json': `{
  "name": "{{name}}",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@uusjs/core": "latest",
    "@uusjs/router": "latest"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}`,
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`,
      'src/main.js': `import Uus from '@uusjs/core';
import Router from '@uusjs/router';
import './style.css';

// Import pages
import HomePage from './pages/Home.js';
import AboutPage from './pages/About.js';

// Initialize UUS with router
const app = new Uus();
app.use(Router);

// Define routes
const router = app.router;
router.addRoute('/', HomePage);
router.addRoute('/about', AboutPage);

// Mount app
app.mount('#app');

// Setup navigation
document.getElementById('app').innerHTML = \`
  <nav>
    <a href="/" uus-link>Home</a>
    <a href="/about" uus-link>About</a>
  </nav>
  <main id="router-view"></main>
\`;

router.start();
`,
      'src/style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
}

nav {
  background: #333;
  padding: 1rem;
}

nav a {
  color: white;
  text-decoration: none;
  margin-right: 1rem;
}

nav a:hover {
  text-decoration: underline;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
`,
      'src/pages/Home.js': `export default {
  template: \`
    <div uus-state="{ count: 0 }">
      <h1>Home Page</h1>
      <p>Welcome to your UUS.js SPA!</p>
      
      <div class="counter">
        <button uus-on:click="count++">Click me: {{ count }}</button>
      </div>
    </div>
  \`
};
`,
      'src/pages/About.js': `export default {
  template: \`
    <div>
      <h1>About Page</h1>
      <p>This is a UUS.js single page application.</p>
      <p>It uses client-side routing for navigation.</p>
    </div>
  \`
};
`
    }
  },
  
  typescript: {
    name: 'TypeScript Application',
    description: 'TypeScript app with full type safety',
    files: {
      'package.json': `{
  "name": "{{name}}",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@uusjs/core": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "jsx": "preserve"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
      'src/main.ts': `import Uus from '@uusjs/core';
import type { ReactiveState } from '@uusjs/core';

interface AppState extends ReactiveState {
  count: number;
  message: string;
  items: string[];
}

const app = new Uus<AppState>();

// Define initial state
const initialState: AppState = {
  count: 0,
  message: 'Hello from TypeScript!',
  items: ['Item 1', 'Item 2', 'Item 3']
};

// Mount with template
app.mount('#app', {
  template: \`
    <div uus-state="\${JSON.stringify(initialState)}">
      <h1 uus-text="message"></h1>
      
      <div>
        <button uus-on:click="count++">
          Clicked: {{ count }} times
        </button>
      </div>
      
      <ul>
        <li uus-for="item in items" uus-text="item"></li>
      </ul>
    </div>
  \`
});
`,
      'src/vite-env.d.ts': `/// <reference types="vite/client" />
`
    }
  }
};

async function createProject(config: ProjectConfig) {
  const spinner = ora();
  
  try {
    // Create project directory
    spinner.start(`Creating project ${chalk.cyan(config.name)}...`);
    const projectPath = path.join(process.cwd(), config.name);
    await fs.mkdir(projectPath, { recursive: true });
    
    // Get template
    const template = TEMPLATES[config.template as keyof typeof TEMPLATES];
    if (!template) {
      throw new Error(`Unknown template: ${config.template}`);
    }
    
    // Write template files
    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = path.join(projectPath, filePath);
      const dir = path.dirname(fullPath);
      
      await fs.mkdir(dir, { recursive: true });
      
      // Replace placeholders
      const processedContent = content.replace(/{{name}}/g, config.name);
      await fs.writeFile(fullPath, processedContent);
    }
    
    spinner.succeed(`Project created at ${chalk.green(projectPath)}`);
    
    // Install dependencies if package.json exists
    if (template.files['package.json']) {
      spinner.start('Installing dependencies...');
      
      const installCmd = {
        npm: 'npm install',
        yarn: 'yarn',
        pnpm: 'pnpm install'
      }[config.packageManager];
      
      execSync(installCmd, {
        cwd: projectPath,
        stdio: 'inherit'
      });
      
      spinner.succeed('Dependencies installed');
    }
    
    // Add selected features
    if (config.features.length > 0) {
      spinner.start('Adding features...');
      
      for (const feature of config.features) {
        await addFeature(projectPath, feature, config);
      }
      
      spinner.succeed('Features added');
    }
    
    // Show success message
    console.log('\n' + chalk.green('✨ Project created successfully!'));
    console.log('\nNext steps:');
    console.log(chalk.cyan(`  cd ${config.name}`));
    
    if (template.files['package.json']) {
      console.log(chalk.cyan(`  ${config.packageManager} run dev`));
    } else {
      console.log(chalk.cyan('  Open index.html in your browser'));
    }
    
    console.log('\n' + chalk.gray('Happy coding! 🚀'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(error);
    process.exit(1);
  }
}

async function addFeature(projectPath: string, feature: string, config: ProjectConfig) {
  switch (feature) {
    case 'router':
      await addRouter(projectPath, config);
      break;
    case 'forms':
      await addForms(projectPath, config);
      break;
    case 'i18n':
      await addI18n(projectPath, config);
      break;
    case 'animate':
      await addAnimation(projectPath, config);
      break;
    case 'realtime':
      await addRealtime(projectPath, config);
      break;
  }
}

async function addRouter(projectPath: string, config: ProjectConfig) {
  // Add router dependency
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.dependencies['@uusjs/router'] = 'latest';
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

async function addForms(projectPath: string, config: ProjectConfig) {
  // Add forms dependency
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.dependencies['@uusjs/forms'] = 'latest';
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

async function addI18n(projectPath: string, config: ProjectConfig) {
  // Add i18n dependency
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.dependencies['@uusjs/i18n'] = 'latest';
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

async function addAnimation(projectPath: string, config: ProjectConfig) {
  // Add animation dependency
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.dependencies['@uusjs/animate'] = 'latest';
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

async function addRealtime(projectPath: string, config: ProjectConfig) {
  // Add realtime dependency
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.dependencies['@uusjs/realtime'] = 'latest';
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(chalk.cyan('\n🚀 Create UUS.js App\n'));
  
  // Get project configuration from user
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: 'my-uus-app',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return 'Project name is required';
        }
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, and hyphens';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: Object.entries(TEMPLATES).map(([key, template]) => ({
        name: `${template.name} - ${template.description}`,
        value: key
      }))
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to add:',
      choices: [
        { name: '🚦 Router - Client-side routing', value: 'router' },
        { name: '📝 Forms - Form validation and handling', value: 'forms' },
        { name: '🌍 I18n - Internationalization', value: 'i18n' },
        { name: '✨ Animate - Animations and transitions', value: 'animate' },
        { name: '🔌 Realtime - WebSocket support', value: 'realtime' }
      ]
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: ['npm', 'yarn', 'pnpm'],
      default: 'npm'
    }
  ]);
  
  // Create the project
  await createProject(answers as ProjectConfig);
}

// Run CLI
main().catch(console.error);