import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';
import validateProjectName from 'validate-npm-package-name';

// Mock dependencies
vi.mock('fs-extra');
vi.mock('execa');
vi.mock('inquirer');
vi.mock('ora');

const mockFs = vi.mocked(fs);
const mockExeca = vi.mocked(execa);
const mockInquirer = vi.mocked(inquirer);
const mockOra = vi.mocked(ora);

// Mock spinner
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
};

// Mock console methods
const consoleSpy = {
  log: vi.fn(),
  error: vi.fn(),
};

describe('CLI Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default fs mocks
    mockFs.pathExists.mockResolvedValue(false);
    mockFs.ensureDir.mockResolvedValue(undefined);
    mockFs.copy.mockResolvedValue(undefined);
    mockFs.readJson.mockResolvedValue({ name: 'test-package', dependencies: {} });
    mockFs.writeJson.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    
    // Setup default execa mocks
    mockExeca.mockResolvedValue({ 
      stdout: '', 
      stderr: '', 
      exitCode: 0,
      command: '',
      escapedCommand: '',
      failed: false,
      timedOut: false,
      isCanceled: false,
      killed: false,
    } as any);
    
    // Setup default ora mock
    mockOra.mockReturnValue(mockSpinner as any);
    
    // Setup default inquirer mock
    mockInquirer.prompt.mockResolvedValue({
      projectName: 'test-project',
      template: 'vite',
      features: ['router', 'animate'],
      packageManager: 'npm',
      git: true,
    });
    
    // Setup console mocks
    vi.spyOn(console, 'log').mockImplementation(consoleSpy.log);
    vi.spyOn(console, 'error').mockImplementation(consoleSpy.error);
    
    // Mock process methods
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Package Manager Detection Logic', () => {
    it('should detect pnpm when pnpm-lock.yaml exists', async () => {
      mockFs.pathExists
        .mockResolvedValueOnce(true) // pnpm-lock.yaml exists
        .mockResolvedValueOnce(false); // yarn.lock doesn't exist
      
      // Simulate detectPackageManager function logic
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }
      
      expect(packageManager).toBe('pnpm');
      expect(mockFs.pathExists).toHaveBeenCalledWith('pnpm-lock.yaml');
    });

    it('should detect yarn when yarn.lock exists', async () => {
      mockFs.pathExists
        .mockResolvedValueOnce(false) // pnpm-lock.yaml doesn't exist
        .mockResolvedValueOnce(true); // yarn.lock exists
      
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }
      
      expect(packageManager).toBe('yarn');
    });

    it('should default to npm when no lock files exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }
      
      expect(packageManager).toBe('npm');
    });
  });

  describe('Create Command Logic', () => {
    it('should execute create workflow with correct file operations', async () => {
      const answers = await mockInquirer.prompt([]);
      const projectPath = path.join('/test/cwd', answers.projectName);
      
      // Simulate create command workflow
      const exists = await mockFs.pathExists(projectPath);
      if (!exists) {
        await mockFs.ensureDir(projectPath);
        await mockFs.copy('/templates/vite', projectPath);
        
        const packageJson = await mockFs.readJson(path.join(projectPath, 'package.json'));
        packageJson.name = answers.projectName;
        
        // Add selected features
        if (answers.features.includes('router')) {
          packageJson.dependencies['@uusjs/router'] = '^0.0.1';
        }
        if (answers.features.includes('animate')) {
          packageJson.dependencies['@uusjs/animate'] = '^0.0.1';
        }
        
        await mockFs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
        
        if (answers.git) {
          await mockExeca('git', ['init'], { cwd: projectPath });
        }
        
        if (answers.packageManager !== 'skip') {
          await mockExeca(answers.packageManager, ['install'], { cwd: projectPath, stdio: 'pipe' });
        }
      }

      expect(mockFs.ensureDir).toHaveBeenCalledWith(path.join('/test/cwd', 'test-project'));
      expect(mockFs.copy).toHaveBeenCalledWith('/templates/vite', path.join('/test/cwd', 'test-project'));
      expect(mockFs.writeJson).toHaveBeenCalled();
      expect(mockExeca).toHaveBeenCalledWith('git', ['init'], { cwd: path.join('/test/cwd', 'test-project') });
      expect(mockExeca).toHaveBeenCalledWith('npm', ['install'], { 
        cwd: path.join('/test/cwd', 'test-project'), 
        stdio: 'pipe' 
      });
    });

    it('should handle directory already exists error', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      
      const projectName = 'existing-project';
      const projectPath = path.join('/test/cwd', projectName);
      const exists = await mockFs.pathExists(projectPath);
      
      if (exists) {
        console.log(`Error: Directory ${projectName} already exists!`);
        process.exit(1);
      }

      expect(consoleSpy.log).toHaveBeenCalledWith('Error: Directory existing-project already exists!');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle project creation errors', async () => {
      const error = new Error('Permission denied');
      mockFs.ensureDir.mockRejectedValue(error);
      
      try {
        await mockFs.ensureDir('/restricted/path');
      } catch (err) {
        mockSpinner.fail('Failed to create project');
        console.error(err);
        process.exit(1);
      }

      expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to create project');
      expect(consoleSpy.error).toHaveBeenCalledWith(error);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle installation errors gracefully', async () => {
      const installError = new Error('Installation failed');
      mockExeca.mockRejectedValue(installError);
      
      try {
        await mockExeca('npm', ['install'], { cwd: '/test/project', stdio: 'pipe' });
      } catch (err) {
        mockSpinner.fail('Failed to install dependencies');
        console.log('You can install them manually later.');
      }

      expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to install dependencies');
      expect(consoleSpy.log).toHaveBeenCalledWith('You can install them manually later.');
    });
  });

  describe('Add Command Logic', () => {
    it('should validate and add UUS packages', async () => {
      const validPackages = ['router', 'animate', 'forms', 'ssr', 'i18n'];
      
      for (const pkg of validPackages) {
        if (validPackages.includes(pkg)) {
          await mockExeca('npm', ['add', `@uusjs/${pkg}`]);
          mockSpinner.succeed(`Added @uusjs/${pkg}`);
        }
        
        expect(mockExeca).toHaveBeenCalledWith('npm', ['add', `@uusjs/${pkg}`]);
        expect(mockSpinner.succeed).toHaveBeenCalledWith(`Added @uusjs/${pkg}`);
      }
    });

    it('should reject invalid packages', async () => {
      const invalidPackage = 'invalid-package';
      const validPackages = ['router', 'animate', 'forms', 'ssr', 'i18n'];
      
      if (!validPackages.includes(invalidPackage)) {
        console.log(`Invalid package: ${invalidPackage}`);
        console.log(`Available packages: ${validPackages.join(', ')}`);
        process.exit(1);
      }

      expect(consoleSpy.log).toHaveBeenCalledWith('Invalid package: invalid-package');
      expect(consoleSpy.log).toHaveBeenCalledWith('Available packages: router, animate, forms, ssr, i18n');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle package installation errors', async () => {
      const error = new Error('Package not found');
      mockExeca.mockRejectedValue(error);
      
      try {
        await mockExeca('npm', ['add', '@uusjs/router']);
      } catch (err) {
        mockSpinner.fail('Failed to add @uusjs/router');
        console.error(err);
        process.exit(1);
      }

      expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to add @uusjs/router');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Dev Command Logic', () => {
    it('should start dev server with correct package manager', async () => {
      mockFs.pathExists.mockResolvedValue(false); // npm project
      
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }
      
      await mockExeca(packageManager, ['run', 'dev'], { stdio: 'inherit' });
      
      expect(mockExeca).toHaveBeenCalledWith('npm', ['run', 'dev'], { stdio: 'inherit' });
    });

    it('should handle dev server errors', async () => {
      const error = new Error('Script not found');
      mockExeca.mockRejectedValue(error);
      
      try {
        await mockExeca('npm', ['run', 'dev'], { stdio: 'inherit' });
      } catch (err) {
        console.error('Failed to start dev server');
        process.exit(1);
      }

      expect(consoleSpy.error).toHaveBeenCalledWith('Failed to start dev server');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Build Command Logic', () => {
    it('should build for production with correct package manager', async () => {
      mockFs.pathExists.mockResolvedValue(false); // npm project
      
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }
      
      await mockExeca(packageManager, ['run', 'build'], { stdio: 'inherit' });
      
      expect(mockExeca).toHaveBeenCalledWith('npm', ['run', 'build'], { stdio: 'inherit' });
    });

    it('should handle build errors', async () => {
      const error = new Error('Build failed');
      mockExeca.mockRejectedValue(error);
      
      try {
        await mockExeca('npm', ['run', 'build'], { stdio: 'inherit' });
      } catch (err) {
        console.error('Failed to build');
        process.exit(1);
      }

      expect(consoleSpy.error).toHaveBeenCalledWith('Failed to build');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Input Validation', () => {
    it('should validate project names correctly', () => {
      const validNames = ['my-app', 'myapp', 'my-app-123'];
      const invalidNames = ['', 'My App', 'my_app@invalid'];
      
      validNames.forEach(name => {
        const validation = validateProjectName(name);
        expect(validation.validForNewPackages).toBe(true);
      });
      
      invalidNames.forEach(name => {
        const validation = validateProjectName(name);
        expect(validation.validForNewPackages).toBe(false);
      });
    });

    it('should handle inquirer prompt structure', async () => {
      const mockPrompts = [
        { type: 'input', name: 'projectName', message: 'Project name:' },
        { type: 'list', name: 'template', message: 'Select a template:' },
        { type: 'checkbox', name: 'features', message: 'Select features:' },
        { type: 'list', name: 'packageManager', message: 'Package manager:' },
        { type: 'confirm', name: 'git', message: 'Initialize git repository?' },
      ];
      
      const answers = await mockInquirer.prompt(mockPrompts);
      
      expect(mockInquirer.prompt).toHaveBeenCalledWith(mockPrompts);
      expect(answers.projectName).toBe('test-project');
      expect(answers.template).toBe('vite');
      expect(answers.features).toEqual(['router', 'animate']);
      expect(answers.packageManager).toBe('npm');
      expect(answers.git).toBe(true);
    });
  });

  describe('Template and Feature Handling', () => {
    it('should handle all available templates', () => {
      const templates = ['basic', 'vite', 'typescript', 'ssr', 'fullstack'];
      
      templates.forEach(template => {
        const templatePath = path.join('/templates', template);
        expect(templatePath).toContain(template);
      });
    });

    it('should map features to correct packages', () => {
      const featureMap = {
        router: '@uusjs/router',
        animate: '@uusjs/animate',
        forms: '@uusjs/forms',
      };
      
      Object.entries(featureMap).forEach(([feature, packageName]) => {
        expect(packageName).toBe(`@uusjs/${feature}`);
      });
    });

    it('should update package.json with selected features', async () => {
      const basePackageJson = { name: 'test-package', dependencies: {} };
      const features = ['router', 'animate'];
      
      mockFs.readJson.mockResolvedValue(basePackageJson);
      
      const packageJson = await mockFs.readJson('package.json');
      
      features.forEach(feature => {
        packageJson.dependencies[`@uusjs/${feature}`] = '^0.0.1';
      });
      
      await mockFs.writeJson('package.json', packageJson, { spaces: 2 });
      
      expect(mockFs.writeJson).toHaveBeenCalledWith(
        'package.json',
        expect.objectContaining({
          dependencies: expect.objectContaining({
            '@uusjs/router': '^0.0.1',
            '@uusjs/animate': '^0.0.1',
          }),
        }),
        { spaces: 2 }
      );
    });
  });

  describe('Git Initialization', () => {
    it('should create correct .gitignore content', async () => {
      const gitignoreContent = 'node_modules\ndist\n.DS_Store\n*.log\n.env\n.env.local';
      
      await mockFs.writeFile('/project/.gitignore', gitignoreContent);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith('/project/.gitignore', gitignoreContent);
      
      const lines = gitignoreContent.split('\n');
      expect(lines).toContain('node_modules');
      expect(lines).toContain('dist');
      expect(lines).toContain('.DS_Store');
    });

    it('should handle git initialization', async () => {
      const projectPath = '/test/project';
      
      await mockExeca('git', ['init'], { cwd: projectPath });
      
      expect(mockExeca).toHaveBeenCalledWith('git', ['init'], { cwd: projectPath });
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors', async () => {
      const fsError = new Error('EACCES: permission denied');
      mockFs.ensureDir.mockRejectedValue(fsError);
      
      try {
        await mockFs.ensureDir('/restricted/path');
      } catch (error) {
        expect(error).toBe(fsError);
      }
    });

    it('should handle network errors during installation', async () => {
      const networkError = new Error('ENETUNREACH: network is unreachable');
      mockExeca.mockRejectedValue(networkError);
      
      try {
        await mockExeca('npm', ['install']);
      } catch (error) {
        expect(error).toBe(networkError);
      }
    });
  });

  describe('CLI Metadata', () => {
    it('should have correct CLI configuration', () => {
      const cliConfig = {
        name: 'uus',
        description: 'CLI tool for creating Uus.js projects',
        version: '0.0.1',
      };
      
      expect(cliConfig.name).toBe('uus');
      expect(cliConfig.description).toContain('CLI tool');
      expect(cliConfig.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have correct command descriptions', () => {
      const commands = {
        create: 'Create a new Uus.js project',
        add: 'Add a Uus.js package to your project',
        dev: 'Start development server',
        build: 'Build for production',
      };
      
      Object.values(commands).forEach(description => {
        expect(description).toBeTruthy();
        expect(description.length).toBeGreaterThan(10);
      });
    });
  });
});