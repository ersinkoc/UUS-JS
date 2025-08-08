import Uus from '@uusjs/core';
import SSR from '@uusjs/ssr';

// Initialize UUS with SSR support
const app = new Uus();
app.use(SSR);

// Hydrate the server-rendered content
app.hydrate('#app', window.__INITIAL_STATE__ || {});

// Setup client-side interactions
if (app.state) {
  // Add client-only functionality
  app.state.clientTime = new Date().toLocaleTimeString();
  
  // Update time every second
  setInterval(() => {
    if (app.state) {
      app.state.clientTime = new Date().toLocaleTimeString();
    }
  }, 1000);
}

// Export for debugging
window.app = app;