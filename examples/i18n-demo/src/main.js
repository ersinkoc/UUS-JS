import { Uus } from '@uusjs/core';

// Initialize UUS.js app
const app = new Uus();
window.app = app; // For debugging and state access

// Mount the app
app.mount('#app');

// Auto-update time every second
setInterval(() => {
  // Access state from the mounted app
  const state = app._state || app.state;
  if (state && state.currentDate !== undefined) {
    state.currentDate = new Date();
  }
}, 1000);

// Set initial document direction based on default locale
document.documentElement.dir = 'ltr';
document.documentElement.lang = 'en';

console.log('🌍 UUS.js i18n Demo loaded successfully!');
console.log('Try switching languages to see RTL/LTR text direction changes!');
console.log('All translations are built-in without external dependencies.');