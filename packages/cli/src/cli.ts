#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import validateProjectName from 'validate-npm-package-name';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// ASCII art logo
const logo = chalk.blue(`
 _   _            _     
| | | |_   _ ___ (_)___ 
| | | | | | / __|| / __|
| |_| | |_| \\__ \\| \\__ \\
 \\___/ \\__,_|___// |___/
               |__/     
`);

program
  .name('uus')
  .description('CLI tool for creating Uus.js projects')
  .version('0.0.1');

program
  .command('create [project-name]')
  .description('Create a new Uus.js project')
  .action(async (projectName) => {
    console.log(logo);
    console.log(chalk.blue("Welcome to Uus.js! Let's create your project.\n"));

    // Get project details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: projectName || 'my-uus-app',
        validate: (input) => {
          const validation = validateProjectName(input);
          if (validation.validForNewPackages) {
            return true;
          }
          return (
            'Invalid project name: ' +
            (validation.errors?.[0] || 'Unknown error')
          );
        },
      },
      {
        type: 'list',
        name: 'template',
        message: 'Select a template:',
        choices: [
          { name: 'Basic (HTML + CDN)', value: 'basic' },
          { name: 'Vite', value: 'vite' },
          { name: 'TypeScript', value: 'typescript' },
          { name: 'SSR', value: 'ssr' },
          { name: 'Full Stack (with API)', value: 'fullstack' },
        ],
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features:',
        choices: [
          { name: 'Router', value: 'router', checked: true },
          { name: 'Animations', value: 'animate', checked: true },
          { name: 'Forms', value: 'forms' },
          { name: 'i18n', value: 'i18n' },
          { name: 'PWA', value: 'pwa' },
          { name: 'Testing', value: 'testing' },
        ],
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: ['npm', 'yarn', 'pnpm'],
      },
      {
        type: 'confirm',
        name: 'git',
        message: 'Initialize git repository?',
        default: true,
      },
    ]);

    const projectPath = path.join(process.cwd(), answers.projectName);

    // Check if directory exists
    if (await fs.pathExists(projectPath)) {
      console.log(
        chalk.red(`\nError: Directory ${answers.projectName} already exists!`)
      );
      process.exit(1);
    }

    // Create project
    const spinner = ora('Creating project...').start();

    try {
      // Create project directory
      await fs.ensureDir(projectPath);

      // Copy template
      const templatePath = path.join(
        __dirname,
        '..',
        'templates',
        answers.template
      );
      await fs.copy(templatePath, projectPath);

      // Update package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        packageJson.name = answers.projectName;

        // Add selected features
        if (answers.features.includes('router')) {
          packageJson.dependencies['@uusjs/router'] = '^0.0.1';
        }
        if (answers.features.includes('animate')) {
          packageJson.dependencies['@uusjs/animate'] = '^0.0.1';
        }
        if (answers.features.includes('forms')) {
          packageJson.dependencies['@uusjs/forms'] = '^0.0.1';
        }

        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      }

      // Initialize git
      if (answers.git) {
        await execa('git', ['init'], { cwd: projectPath });
        await fs.writeFile(
          path.join(projectPath, '.gitignore'),
          'node_modules\ndist\n.DS_Store\n*.log\n.env\n.env.local'
        );
      }

      spinner.succeed('Project created successfully!');

      // Install dependencies
      if (answers.packageManager !== 'skip') {
        const installSpinner = ora('Installing dependencies...').start();

        try {
          await execa(answers.packageManager, ['install'], {
            cwd: projectPath,
            stdio: 'pipe',
          });
          installSpinner.succeed('Dependencies installed!');
        } catch (error) {
          installSpinner.fail('Failed to install dependencies');
          console.log(chalk.yellow('\nYou can install them manually later.'));
        }
      }

      // Success message
      console.log(chalk.green('\n✨ Your Uus.js project is ready!\n'));
      console.log('Next steps:');
      console.log(chalk.cyan(`  cd ${answers.projectName}`));

      if (answers.template === 'basic') {
        console.log(chalk.cyan('  Open index.html in your browser'));
      } else {
        console.log(chalk.cyan(`  ${answers.packageManager} run dev`));
      }

      console.log('\nHappy coding! 🚀');
    } catch (error) {
      spinner.fail('Failed to create project');
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('add <package>')
  .description('Add a Uus.js package to your project')
  .action(async (packageName) => {
    const validPackages = ['router', 'animate', 'forms', 'ssr', 'i18n'];

    if (!validPackages.includes(packageName)) {
      console.log(chalk.red(`Invalid package: ${packageName}`));
      console.log(`Available packages: ${validPackages.join(', ')}`);
      process.exit(1);
    }

    // Detect package manager
    const packageManager = await detectPackageManager();

    const spinner = ora(`Adding @uusjs/${packageName}...`).start();

    try {
      await execa(packageManager, ['add', `@uusjs/${packageName}`]);
      spinner.succeed(`Added @uusjs/${packageName}`);

      // Show usage hint
      console.log(chalk.green('\n✨ Package added successfully!\n'));
      console.log('Usage:');

      switch (packageName) {
        case 'router':
          console.log(
            chalk.cyan(`
import { createRouter } from '@uusjs/router';

const router = createRouter({
  routes: [
    { path: '/', component: 'home' },
    { path: '/about', component: 'about' }
  ]
});

app.use(router);
`)
          );
          break;

        case 'animate':
          console.log(
            chalk.cyan(`
import { createAnimate } from '@uusjs/animate';

const animate = createAnimate();
app.use(animate);

// In template:
<div uus-animate="fadeIn">Animated content</div>
`)
          );
          break;

        case 'forms':
          console.log(
            chalk.cyan(`
import { createForm } from '@uusjs/forms';

const form = createForm({
  name: '',
  email: ''
}, {
  name: [validators.required()],
  email: [validators.required(), validators.email()]
});
`)
          );
          break;
      }
    } catch (error) {
      spinner.fail(`Failed to add @uusjs/${packageName}`);
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start development server')
  .action(async () => {
    const packageManager = await detectPackageManager();

    try {
      await execa(packageManager, ['run', 'dev'], { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('Failed to start dev server'));
      process.exit(1);
    }
  });

program
  .command('build')
  .description('Build for production')
  .action(async () => {
    const packageManager = await detectPackageManager();

    try {
      await execa(packageManager, ['run', 'build'], { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('Failed to build'));
      process.exit(1);
    }
  });

// Helper functions
async function detectPackageManager(): Promise<string> {
  if (await fs.pathExists('pnpm-lock.yaml')) return 'pnpm';
  if (await fs.pathExists('yarn.lock')) return 'yarn';
  return 'npm';
}

// Parse arguments
program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
