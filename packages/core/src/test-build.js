// Simple test to verify the build works
import { Uus, createReactive, effect, computed } from '../dist/index.js';

console.log('Testing Uus.js Core...');

// Test reactive system
const state = createReactive({ count: 0 });
let effectCount = 0;

effect(() => {
  console.log('Count:', state.count);
  effectCount++;
});

state.count++;
console.log('Effect ran', effectCount, 'times');

// Test computed
const double = computed(() => state.count * 2);
console.log('Double:', double());

// Test Uus instance
const app = new Uus();
console.log('Uus version:', Uus.version);
console.log('Directives registered:', app.directives.size);

console.log('All tests passed!');