import { vi } from 'vitest';
import fs from 'fs-extra';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';

/**
 * Test utilities for UUS CLI testing
 */

// Mock factory functions
export const createMockFs = () => {
  const mockFs = vi.mocked(fs);
  
  // Default implementations
  mockFs.pathExists.mockResolvedValue(false);
  mockFs.ensureDir.mockResolvedValue(undefined);
  mockFs.copy.mockResolvedValue(undefined);
  mockFs.readJson.mockResolvedValue({ name: 'test-package', dependencies: {} });
  mockFs.writeJson.mockResolvedValue(undefined);
  mockFs.writeFile.mockResolvedValue(undefined);
  mockFs.remove.mockResolvedValue(undefined);
  mockFs.readdir.mockResolvedValue([]);
  
  return mockFs;
};

export const createMockExeca = () => {
  const mockExeca = vi.mocked(execa);
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
  
  return mockExeca;
};

export const createMockInquirer = () => {
  const mockInquirer = vi.mocked(inquirer);
  
  // Default prompt responses
  const defaultAnswers = {
    projectName: 'test-project',
    template: 'vite',
    features: ['router', 'animate'],
    packageManager: 'npm',
    git: true,
  };
  
  mockInquirer.prompt.mockResolvedValue(defaultAnswers);
  
  return mockInquirer;
};

export const createMockOra = () => {
  const mockSpinner = {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: '',
  };
  
  const mockOra = vi.mocked(ora);
  mockOra.mockReturnValue(mockSpinner as any);
  
  return { mockOra, mockSpinner };
};

export const createMockProcess = () => {
  const mockProcess = {
    cwd: vi.fn().mockReturnValue('/test/cwd'),
    exit: vi.fn(),
    argv: ['node', 'cli.js'] as string[],
  };
  
  return mockProcess;
};

// Test data factories
export const createTestProjectAnswers = (overrides: Partial<any> = {}) => ({
  projectName: 'test-project',
  template: 'vite',
  features: ['router', 'animate'],
  packageManager: 'npm',
  git: true,
  ...overrides,
});

export const createTestPackageJson = (overrides: Partial<any> = {}) => ({
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

// Template test data
export const availableTemplates = ['basic', 'vite', 'typescript', 'ssr', 'fullstack'];
export const availableFeatures = ['router', 'animate', 'forms', 'i18n', 'pwa', 'testing'];
export const availablePackageManagers = ['npm', 'yarn', 'pnpm'];
export const validUusPackages = ['router', 'animate', 'forms', 'ssr', 'i18n'];

// Feature to package mapping
export const featurePackageMap = {
  router: '@uusjs/router',
  animate: '@uusjs/animate',
  forms: '@uusjs/forms',
  i18n: '@uusjs/i18n',
  ssr: '@uusjs/ssr',
} as const;

// Package manager detection helpers
export const createPackageManagerMocks = (packageManager: 'npm' | 'yarn' | 'pnpm') => {
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

// Error factories for testing error scenarios
export const createFsError = (code: string, message: string) => {
  const error = new Error(message) as any;
  error.code = code;
  return error;
};

export const createNetworkError = (message: string) => {
  const error = new Error(message) as any;
  error.code = 'ENETUNREACH';
  return error;
};

export const createPermissionError = (path: string) => {
  return createFsError('EACCES', `EACCES: permission denied, mkdir '${path}'`);
};

export const createNotFoundError = (path: string) => {
  return createFsError('ENOENT', `ENOENT: no such file or directory, open '${path}'`);
};

// Console mock helpers
export const createConsoleMocks = () => {
  const consoleSpy = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
  
  // Setup console spies
  vi.spyOn(console, 'log').mockImplementation(consoleSpy.log);
  vi.spyOn(console, 'error').mockImplementation(consoleSpy.error);
  vi.spyOn(console, 'warn').mockImplementation(consoleSpy.warn);
  vi.spyOn(console, 'info').mockImplementation(consoleSpy.info);
  
  return consoleSpy;
};

// Test assertion helpers
export const expectProjectCreated = (mockFs: ReturnType<typeof createMockFs>, projectPath: string) => {
  expect(mockFs.ensureDir).toHaveBeenCalledWith(projectPath);
  expect(mockFs.copy).toHaveBeenCalled();
  expect(mockFs.writeJson).toHaveBeenCalled();
};

export const expectPackageInstalled = (mockExeca: ReturnType<typeof createMockExeca>, packageManager: string, packageName: string) => {
  expect(mockExeca).toHaveBeenCalledWith(packageManager, ['add', packageName]);
};

export const expectGitInitialized = (mockExeca: ReturnType<typeof createMockExeca>, mockFs: ReturnType<typeof createMockFs>, projectPath: string) => {
  expect(mockExeca).toHaveBeenCalledWith('git', ['init'], { cwd: projectPath });
  expect(mockFs.writeFile).toHaveBeenCalledWith(
    expect.stringContaining('.gitignore'),
    expect.stringContaining('node_modules')
  );
};

// CLI command simulation helpers
export const simulateCreateCommand = async (
  answers: any,
  mockFs: ReturnType<typeof createMockFs>,
  mockExeca: ReturnType<typeof createMockExeca>
) => {
  const projectPath = `/test/cwd/${answers.projectName}`;
  
  // Simulate create command flow
  const exists = await mockFs.pathExists(projectPath);
  if (exists) {
    throw new Error('Directory already exists');
  }
  
  await mockFs.ensureDir(projectPath);
  await mockFs.copy('/templates/vite', projectPath);
  
  const packageJson = await mockFs.readJson(`${projectPath}/package.json`);
  packageJson.name = answers.projectName;
  
  // Add features
  if (answers.features.includes('router')) {
    packageJson.dependencies['@uusjs/router'] = '^0.0.1';
  }
  if (answers.features.includes('animate')) {
    packageJson.dependencies['@uusjs/animate'] = '^0.0.1';
  }
  
  await mockFs.writeJson(`${projectPath}/package.json`, packageJson, { spaces: 2 });
  
  if (answers.git) {
    await mockExeca('git', ['init'], { cwd: projectPath });
  }
  
  if (answers.packageManager !== 'skip') {
    await mockExeca(answers.packageManager, ['install'], { cwd: projectPath, stdio: 'pipe' });
  }
  
  return projectPath;
};

export const simulateAddCommand = async (
  packageName: string,
  packageManager: string,
  mockExeca: ReturnType<typeof createMockExeca>
) => {
  const validPackages = ['router', 'animate', 'forms', 'ssr', 'i18n'];
  
  if (!validPackages.includes(packageName)) {
    throw new Error(`Invalid package: ${packageName}`);
  }
  
  await mockExeca(packageManager, ['add', `@uusjs/${packageName}`]);
  
  return `@uusjs/${packageName}`;
};

// Mock setup utilities
export const setupAllMocks = () => {
  const mockFs = createMockFs();
  const mockExeca = createMockExeca();
  const mockInquirer = createMockInquirer();
  const { mockOra, mockSpinner } = createMockOra();
  const mockProcess = createMockProcess();
  const consoleSpy = createConsoleMocks();
  
  // Setup process mocks
  Object.defineProperty(process, 'cwd', {
    value: mockProcess.cwd,
    writable: true,
  });
  Object.defineProperty(process, 'exit', {
    value: mockProcess.exit,
    writable: true,
  });
  Object.defineProperty(process, 'argv', {
    value: mockProcess.argv,
    writable: true,
  });
  
  return {
    mockFs,
    mockExeca,
    mockInquirer,
    mockOra,
    mockSpinner,
    mockProcess,
    consoleSpy,
  };
};

export const resetAllMocks = () => {
  vi.clearAllMocks();
};

// Custom matchers for better assertions
export const customMatchers = {
  toHaveCreatedProject: (received: any, projectPath: string) => {
    const pass = received.ensureDir.mock.calls.some((call: any[]) => 
      call[0] === projectPath
    );
    
    return {
      message: () => `Expected project to be created at ${projectPath}`,
      pass,
    };
  },
  
  toHaveInstalledPackage: (received: any, packageName: string) => {
    const pass = received.mock.calls.some((call: any[]) => 
      call[1] && call[1].includes(packageName)
    );
    
    return {
      message: () => `Expected package ${packageName} to be installed`,
      pass,
    };
  },
};