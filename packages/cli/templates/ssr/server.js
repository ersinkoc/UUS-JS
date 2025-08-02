import express from 'express';
import { renderToString, createSSRApp } from '@uusjs/ssr';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use('/public', express.static(join(__dirname, 'public')));

// Create the Uus app factory
const createApp = createSSRApp((context) => ({
  state: {
    title: 'My SSR App',
    message: 'Welcome to server-side rendered Uus.js!',
    count: 0,
    
    increment() {
      this.count++;
    },
    
    decrement() {
      this.count--;
    }
  }
}));

// HTML template
const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uus.js SSR App</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      margin: 0 0 1rem 0;
    }
    .counter {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 2rem 0;
    }
    button {
      padding: 0.5rem 1rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #2980b9;
    }
    .count {
      font-size: 2rem;
      font-weight: bold;
      color: #3498db;
    }
  </style>
</head>
<body>
  <div id="app" class="container" uus-state>
    <h1 uus-text="title"></h1>
    <p uus-text="message"></p>
    
    <div class="counter">
      <button @click="decrement">-</button>
      <span class="count" uus-text="count"></span>
      <button @click="increment">+</button>
    </div>
    
    <p>This page was rendered on the server and hydrated on the client!</p>
  </div>
  
  <script src="https://unpkg.com/@uusjs/core"></script>
  <script src="https://unpkg.com/@uusjs/ssr"></script>
  <script>
    // Client-side hydration
    const { createSSRApp, hydrate } = UusSSR;
    const app = createSSRApp((context) => ({
      state: {
        title: 'My SSR App',
        message: 'Welcome to server-side rendered Uus.js!',
        count: 0,
        
        increment() {
          this.count++;
        },
        
        decrement() {
          this.count--;
        }
      }
    }))();
    hydrate(app, '#app');
  </script>
</body>
</html>
`;

// Routes
app.get('/', async (req, res) => {
  try {
    const context = {
      url: req.url,
      title: 'Uus.js SSR Demo'
    };
    
    const html = await renderToString(createApp, {
      context,
      template
    });
    
    res.send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 SSR server running at http://localhost:${port}`);
});