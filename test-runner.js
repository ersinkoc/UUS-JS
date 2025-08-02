#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Uus.js Tests...\n');

const packages = ['core', 'router', 'animate', 'forms'];

async function runTest(pkg) {
  return new Promise((resolve) => {
    console.log(`📦 Testing @uusjs/${pkg}...`);

    const testProcess = spawn('pnpm', ['test'], {
      cwd: join(__dirname, 'packages', pkg),
      shell: true,
      stdio: 'inherit',
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ @uusjs/${pkg} tests passed!\n`);
      } else {
        console.log(`❌ @uusjs/${pkg} tests failed!\n`);
      }
      resolve(code);
    });
  });
}

async function runAllTests() {
  let failed = false;

  for (const pkg of packages) {
    const code = await runTest(pkg);
    if (code !== 0) failed = true;
  }

  if (failed) {
    console.log('❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

runAllTests().catch(console.error);
