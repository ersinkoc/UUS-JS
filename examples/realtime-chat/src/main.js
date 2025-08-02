import { Uus } from '@uusjs/core';

// Initialize UUS.js app
const app = new Uus();
window.app = app; // For debugging and state access

// Mount the app
app.mount('#app');

console.log('💬 UUS.js Realtime Chat loaded successfully!');
console.log('Start the server with: npm start');
console.log('Open multiple browser windows to test real-time chat features!');
