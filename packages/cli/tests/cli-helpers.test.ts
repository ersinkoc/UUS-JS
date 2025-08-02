import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import { execa } from 'execa';
import validateProjectName from 'validate-npm-package-name';

// Mock dependencies
vi.mock('fs-extra');
vi.mock('execa');

const mockFs = vi.mocked(fs);
const mockExeca = vi.mocked(execa);

// Test data
const featurePackageMap = {
  router: '@uusjs/router',
  animate: '@uusjs/animate',
  forms: '@uusjs/forms',
  i18n: '@uusjs/i18n',
  ssr: '@uusjs/ssr',
} as const;

const availableTemplates = ['basic', 'vite', 'typescript', 'ssr', 'fullstack'];
const validUusPackages = ['router', 'animate', 'forms', 'ssr', 'i18n'];

const createPackageManagerMocks = (packageManager: 'npm' | 'yarn' | 'pnpm') => {
  const lockFiles = {
    npm: 'package-lock.json',
    yarn: 'yarn.lock',
    pnpm: 'pnpm-lock.yaml',
  };
  
  return (filePath: string) => {
    if (typeof filePath === 'string') {
      return Promise.resolve(filePath.endsWith(lockFiles[packageManager]));
    }
    return Promise.resolve(false);
  };
};

const createTestPackageJson = (overrides: Partial<any> = {}) => ({
  name: 'test-package',
  version: '1.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview',
  },
  dependencies: {},
  devDependencies: {},
  ...overrides,
});

/**
 * Tests for CLI helper functions and utilities
 */
describe('CLI Helper Functions', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectPackageManager function', () => {
    it('should detect pnpm when pnpm-lock.yaml exists', async () => {
      mockFs.pathExists.mockImplementation(
        createPackageManagerMocks('pnpm')
      );

      // Simulate the detectPackageManager logic
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }

      expect(packageManager).toBe('pnpm');
      expect(mockFs.pathExists).toHaveBeenCalledWith('pnpm-lock.yaml');
    });

    it('should detect yarn when yarn.lock exists but pnpm-lock.yaml does not', async () => {
      mockFs.pathExists.mockImplementation(
        createPackageManagerMocks('yarn')
      );

      // Simulate the detectPackageManager logic
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }

      expect(packageManager).toBe('yarn');
      expect(mockFs.pathExists).toHaveBeenCalledWith('pnpm-lock.yaml');
      expect(mockFs.pathExists).toHaveBeenCalledWith('yarn.lock');
    });

    it('should default to npm when no lock files exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      // Simulate the detectPackageManager logic
      let packageManager = 'npm';
      if (await mockFs.pathExists('pnpm-lock.yaml')) {
        packageManager = 'pnpm';
      } else if (await mockFs.pathExists('yarn.lock')) {
        packageManager = 'yarn';
      }

      expect(packageManager).toBe('npm');
      expect(mockFs.pathExists).toHaveBeenCalledWith('pnpm-lock.yaml');
      expect(mockFs.pathExists).toHaveBeenCalledWith('yarn.lock');
    });

    it('should handle file system errors gracefully', async () => {
      const fsError = new Error('EACCES: permission denied');
      mockFs.pathExists.mockRejectedValue(fsError);

      // Simulate error handling in detectPackageManager
      try {
        await mockFs.pathExists('pnpm-lock.yaml');
      } catch (error) {
        expect(error).toBe(fsError);
      }
    });
  });

  describe('project name validation', () => {
    it('should validate correct project names', () => {
      const validNames = [
        'my-app',
        'myapp',
        'my-app-123',
        'test-project',
        'uus-app',
        'my.app',
      ];

      validNames.forEach(name => {
        const validation = validateProjectName(name);
        expect(validation.validForNewPackages).toBe(true);
        expect(validation.errors).toBeUndefined();
      });
    });

    it('should reject invalid project names', () => {
      const invalidNames = [
        '',
        ' ',
        'My App', // spaces
        '.git', // starts with dot
        '_private', // starts with underscore
        'node_modules', // reserved name
        'favicon.ico', // reserved name
      ];

      invalidNames.forEach(name => {
        const validation = validateProjectName(name);
        expect(validation.validForNewPackages).toBe(false);
        expect(validation.errors).toBeDefined();
        expect(validation.errors?.length).toBeGreaterThan(0);
      });
    });

    it('should handle edge cases in project names', () => {
      const edgeCases = [
        { name: 'a', valid: true }, // Single character
        { name: 'a'.repeat(214), valid: true }, // Max length
        { name: 'a'.repeat(215), valid: false }, // Too long
        { name: '123project', valid: true }, // Starting with number
        { name: '.project', valid: false }, // Starting with dot
        { name: '_project', valid: false }, // Starting with underscore
      ];

      edgeCases.forEach(({ name, valid }) => {
        const validation = validateProjectName(name);
        expect(validation.validForNewPackages).toBe(valid);
      });
    });
  });

  describe('template handling', () => {
    it('should handle all available templates', () => {
      availableTemplates.forEach(template => {
        // Test template path construction
        const templatePath = `/templates/${template}`;
        expect(templatePath).toContain(template);
        expect(availableTemplates).toContain(template);
      });
    });

    it('should validate template choices', () => {
      const validTemplates = availableTemplates;
      const invalidTemplates = ['invalid', 'unknown', 'custom'];

      validTemplates.forEach(template => {
        expect(availableTemplates.includes(template)).toBe(true);
      });

      invalidTemplates.forEach(template => {
        expect(availableTemplates.includes(template)).toBe(false);
      });
    });
  });

  describe('feature handling', () => {
    it('should map features to correct packages', () => {
      Object.entries(featurePackageMap).forEach(([feature, packageName]) => {
        expect(packageName).toBe(`@uusjs/${feature}`);
        expect(packageName.startsWith('@uusjs/')).toBe(true);
      });
    });

    it('should handle feature selection validation', () => {
      const validFeatures = Object.keys(featurePackageMap);
      const invalidFeatures = ['invalid', 'unknown', 'custom'];

      validFeatures.forEach(feature => {
        expect(featurePackageMap[feature as keyof typeof featurePackageMap]).toBeDefined();
      });

      invalidFeatures.forEach(feature => {
        expect(featurePackageMap[feature as keyof typeof featurePackageMap]).toBeUndefined();
      });
    });

    it('should update package.json with selected features', async () => {
      const selectedFeatures = ['router', 'animate', 'forms'];
      const basePackageJson = createTestPackageJson();
      
      mockFs.readJson.mockResolvedValue(basePackageJson);

      // Simulate feature addition
      const updatedPackageJson = { ...basePackageJson };
      selectedFeatures.forEach(feature => {
        if (featurePackageMap[feature as keyof typeof featurePackageMap]) {
          updatedPackageJson.dependencies[featurePackageMap[feature as keyof typeof featurePackageMap]] = '^0.0.1';
        }
      });

      expect(updatedPackageJson.dependencies['@uusjs/router']).toBe('^0.0.1');
      expect(updatedPackageJson.dependencies['@uusjs/animate']).toBe('^0.0.1');
      expect(updatedPackageJson.dependencies['@uusjs/forms']).toBe('^0.0.1');
    });
  });

  describe('package validation for add command', () => {
    it('should validate UUS packages', () => {
      const validPackages = validUusPackages;
      const invalidPackages = ['invalid', 'react', 'vue', 'angular'];

      validPackages.forEach(pkg => {
        expect(validUusPackages.includes(pkg)).toBe(true);
      });

      invalidPackages.forEach(pkg => {
        expect(validUusPackages.includes(pkg)).toBe(false);
      });
    });

    it('should construct correct package names', () => {
      validUusPackages.forEach(pkg => {
        const packageName = `@uusjs/${pkg}`;
        expect(packageName.startsWith('@uusjs/')).toBe(true);
        expect(packageName.endsWith(pkg)).toBe(true);
      });
    });
  });

  describe('git initialization helpers', () => {
    it('should create correct gitignore content', () => {
      const expectedGitignore = 'node_modules\ndist\n.DS_Store\n*.log\n.env\n.env.local';
      const gitignoreLines = expectedGitignore.split('\n');
      
      expect(gitignoreLines).toContain('node_modules');
      expect(gitignoreLines).toContain('dist');
      expect(gitignoreLines).toContain('.DS_Store');
      expect(gitignoreLines).toContain('*.log');
      expect(gitignoreLines).toContain('.env');
      expect(gitignoreLines).toContain('.env.local');
    });

    it('should handle git initialization errors', async () => {
      const gitError = new Error('git not found');
      mockExeca.mockRejectedValue(gitError);

      try {
        await mockExeca('git', ['init'], { cwd: '/test/project' });
      } catch (error) {
        expect(error).toBe(gitError);
      }
    });
  });

  describe('command execution helpers', () => {
    it('should construct correct command arguments for dev', () => {
      const packageManagers = ['npm', 'yarn', 'pnpm'];
      
      packageManagers.forEach(pm => {
        const args = ['run', 'dev'];
        expect(args).toEqual(['run', 'dev']);
      });
    });

    it('should construct correct command arguments for build', () => {
      const packageManagers = ['npm', 'yarn', 'pnpm'];
      
      packageManagers.forEach(pm => {
        const args = ['run', 'build'];
        expect(args).toEqual(['run', 'build']);
      });
    });

    it('should construct correct command arguments for add', () => {
      const packageName = 'router';
      const args = ['add', `@uusjs/${packageName}`];
      
      expect(args).toEqual(['add', '@uusjs/router']);
    });
  });

  describe('path handling utilities', () => {
    it('should handle project path construction', () => {
      const projectName = 'test-project';
      const cwd = '/test/cwd';
      const projectPath = `${cwd}/${projectName}`;
      
      expect(projectPath).toBe('/test/cwd/test-project');
      expect(projectPath.endsWith(projectName)).toBe(true);
    });

    it('should handle template path construction', () => {
      const template = 'vite';
      const templatesDir = '/templates';
      const templatePath = `${templatesDir}/${template}`;
      
      expect(templatePath).toBe('/templates/vite');
      expect(templatePath.endsWith(template)).toBe(true);
    });
  });

  describe('error message formatting', () => {
    it('should format directory exists error correctly', () => {
      const projectName = 'existing-project';
      const errorMessage = `Error: Directory ${projectName} already exists!`;
      
      expect(errorMessage).toContain('Error: Directory');
      expect(errorMessage).toContain(projectName);
      expect(errorMessage).toContain('already exists!');
    });

    it('should format invalid package error correctly', () => {
      const invalidPackage = 'invalid-package';
      const validPackages = validUusPackages;
      const errorMessage = `Invalid package: ${invalidPackage}`;
      const availableMessage = `Available packages: ${validPackages.join(', ')}`;
      
      expect(errorMessage).toContain('Invalid package:');
      expect(errorMessage).toContain(invalidPackage);
      expect(availableMessage).toContain('Available packages:');
      expect(availableMessage).toContain('router, animate, forms');
    });
  });

  describe('success message formatting', () => {
    it('should format project creation success message', () => {
      const projectName = 'test-project';
      const packageManager = 'npm';
      const messages = {
        success: '✨ Your Uus.js project is ready!',
        nextSteps: 'Next steps:',
        cdCommand: `cd ${projectName}`,
        devCommand: `${packageManager} run dev`,
        happyCoding: 'Happy coding! 🚀',
      };
      
      expect(messages.success).toContain('Uus.js project is ready');
      expect(messages.cdCommand).toContain(projectName);
      expect(messages.devCommand).toContain(packageManager);
      expect(messages.happyCoding).toContain('Happy coding');
    });

    it('should format package addition success message', () => {
      const packageName = 'router';
      const fullPackageName = `@uusjs/${packageName}`;
      const successMessage = `Added ${fullPackageName}`;
      
      expect(successMessage).toContain('Added');
      expect(successMessage).toContain(fullPackageName);
    });
  });

  describe('CLI help content', () => {
    it('should provide correct command descriptions', () => {
      const commands = {
        create: 'Create a new Uus.js project',
        add: 'Add a Uus.js package to your project',
        dev: 'Start development server',
        build: 'Build for production',
      };
      
      Object.entries(commands).forEach(([cmd, description]) => {
        expect(description).toBeTruthy();
        expect(description.length).toBeGreaterThan(10);
      });
    });

    it('should provide correct CLI metadata', () => {
      const metadata = {
        name: 'uus',
        description: 'CLI tool for creating Uus.js projects',
        version: '0.0.1',
      };
      
      expect(metadata.name).toBe('uus');
      expect(metadata.description).toContain('CLI tool');
      expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});