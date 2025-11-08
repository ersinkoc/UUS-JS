import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files
app.use(express.static(__dirname));

// Store connected users and messages
const users = new Map();
const messages = [];
const MAX_MESSAGES = 100;

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New connection');

  let userId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.event) {
        case 'user:join':
          // BUG-NEW-023 FIX: Validate message.data exists before accessing properties
          if (!message.data || !message.data.id || !message.data.name) {
            console.error('Invalid user:join message - missing data');
            break;
          }
          userId = message.data.id;
          users.set(userId, {
            ...message.data,
            ws,
          });

          // Send user list to new user
          ws.send(
            JSON.stringify({
              event: 'users:list',
              data: Array.from(users.values()).map((u) => ({
                id: u.id,
                name: u.name,
              })),
            })
          );

          // Send message history
          ws.send(
            JSON.stringify({
              event: 'messages:history',
              data: messages,
            })
          );

          // Broadcast new user to others
          broadcast(
            {
              event: 'user:joined',
              data: {
                id: message.data.id,
                name: message.data.name,
              },
            },
            userId
          );
          break;

        case 'message:send':
          // BUG-NEW-023 FIX: Validate message.data exists
          if (!message.data) {
            console.error('Invalid message:send - missing data');
            break;
          }
          // Add message to history
          messages.push(message.data);
          if (messages.length > MAX_MESSAGES) {
            messages.shift();
          }

          // Broadcast message to all users
          broadcast({
            event: 'message:new',
            data: message.data,
          });
          break;

        case 'user:typing':
          // BUG-NEW-023 FIX: Validate message.data and typing property exist
          if (!message.data || typeof message.data.typing === 'undefined') {
            console.error('Invalid user:typing message - missing data');
            break;
          }
          // Broadcast typing status
          broadcast(
            {
              event: 'user:typing',
              data: {
                userId,
                typing: message.data.typing,
              },
            },
            userId
          );
          break;

        case 'ping':
          // Respond to heartbeat
          ws.send(
            JSON.stringify({
              event: 'pong',
              data: message.data || {},
            })
          );
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (userId) {
      users.delete(userId);

      // Broadcast user left
      broadcast({
        event: 'user:left',
        data: userId,
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast message to all connected clients
function broadcast(message, excludeUserId = null) {
  const data = JSON.stringify(message);

  users.forEach((user) => {
    if (user.id !== excludeUserId && user.ws.readyState === 1) {
      user.ws.send(data);
    }
  });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
