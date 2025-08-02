# @uusjs/realtime

Real-time WebSocket and SSE support for Uus.js applications.

## Features

- 🔌 Multiple transport support (WebSocket, SSE, Socket.io)
- 🔄 Automatic reconnection with exponential backoff
- 💓 Heartbeat/keepalive
- 🔐 Authentication support
- 📦 Message queueing
- 🎯 Event-based API
- 📊 Real-time store synchronization
- 📝 Collaborative editing
- 🎨 Declarative directives

## Installation

```bash
npm install @uusjs/realtime
```

## Quick Start

### WebSocket

```javascript
import { Uus } from '@uusjs/core';
import { websocket } from '@uusjs/realtime';

const app = new Uus({
  state: {
    messages: [],

    sendMessage(text) {
      this.$ws.send('message', { text });
    },
  },
});

// Configure WebSocket
app.use(
  websocket({
    url: 'ws://localhost:3000',
    reconnect: {
      enabled: true,
      delay: 1000,
    },
  })
);

// Listen for messages
app.$ws.on('message', (data) => {
  app.state.messages.push(data);
});
```

### Server-Sent Events (SSE)

```javascript
import { sse } from '@uusjs/realtime';

app.use(
  sse({
    url: '/api/events',
    withCredentials: true,
  })
);

// Listen for updates
app.$sse.on('update', (data) => {
  console.log('Update received:', data);
});
```

### Socket.io

```javascript
import { socketio } from '@uusjs/realtime';

app.use(
  socketio({
    url: 'http://localhost:3000',
    transports: ['websocket', 'polling'],
  })
);

// Join room
app.$io.join('chat-room');

// Send message
app.$io.send('chat', { message: 'Hello!' });
```

## Directives

### WebSocket Directive

```html
<!-- Listen for WebSocket events -->
<div uus-ws:message="handleMessage"></div>

<!-- Update content with received data -->
<span uus-ws:price="updatePrice"></span>
```

### SSE Directive

```html
<!-- Listen for SSE events -->
<div uus-sse:notification="showNotification"></div>

<!-- Auto-update content -->
<div uus-sse:status></div>
```

### Socket.io Directive

```html
<!-- Listen for Socket.io events -->
<div uus-io:chat="onChatMessage"></div>
```

## Real-time Store

Synchronize state across clients:

```javascript
import { createRealtimeStore } from '@uusjs/realtime';

const store = createRealtimeStore(
  app.$ws,
  {
    todos: [],
    filter: 'all',
  },
  {
    channel: 'todos',
    conflictResolution: 'remote',
  }
);

// Subscribe to changes
store.subscribe((state) => {
  console.log('Store updated:', state);
});

// Update store
store.update((state) => {
  state.todos.push({
    id: Date.now(),
    text: 'New todo',
    done: false,
  });
});
```

## Collaborative Text

Real-time collaborative editing:

```javascript
import { createCollaborativeText } from '@uusjs/realtime';

const editor = createCollaborativeText(app.$ws, {
  channel: 'document-1',
  debounce: 300,
});

// Subscribe to changes
editor.subscribe((content) => {
  document.getElementById('editor').value = content;
});

// Handle user input
document.getElementById('editor').addEventListener('input', (e) => {
  const newContent = e.target.value;
  editor.replace(newContent);
});
```

## Authentication

```javascript
app.use(
  websocket({
    url: 'wss://api.example.com',
    auth: async () => {
      const token = await getAuthToken();
      return { token };
    },
  })
);
```

## Connection Management

```javascript
// Check connection status
if (app.$ws.connected) {
  console.log('Connected');
}

// Manual connect/disconnect
await app.$ws.connect();
app.$ws.disconnect();

// Listen for connection events
app.$ws.on('connect', () => {
  console.log('Connected');
});

app.$ws.on('disconnect', ({ code, reason }) => {
  console.log('Disconnected:', reason);
});

app.$ws.on('error', (error) => {
  console.error('Connection error:', error);
});
```

## Advanced Configuration

### WebSocket with Heartbeat

```javascript
app.use(
  websocket({
    url: 'wss://api.example.com',
    heartbeat: {
      interval: 30000, // 30 seconds
      timeout: 60000, // 60 seconds
      message: 'ping',
    },
    reconnect: {
      enabled: true,
      delay: 1000,
      maxDelay: 30000,
      attempts: 10,
    },
  })
);
```

### SSE with Custom Headers

```javascript
app.use(
  sse({
    url: '/api/stream',
    headers: {
      Authorization: 'Bearer token',
      'X-Custom-Header': 'value',
    },
    retry: 5000, // 5 seconds
  })
);
```

## Server Examples

### Node.js WebSocket Server

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    const message = JSON.parse(data);

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            event: message.event,
            data: message.data,
            timestamp: Date.now(),
          })
        );
      }
    });
  });
});
```

### Express SSE Server

```javascript
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Send initial data
  res.write(`data: ${JSON.stringify({ event: 'connected' })}\n\n`);

  // Send updates every second
  const interval = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({
        event: 'update',
        data: { time: new Date().toISOString() },
      })}\n\n`
    );
  }, 1000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});
```

## TypeScript Support

```typescript
import { Uus } from '@uusjs/core';
import { websocket, RealtimeConnection } from '@uusjs/realtime';

interface AppState {
  messages: Message[];
  $ws?: RealtimeConnection;
}

interface Message {
  id: string;
  text: string;
  timestamp: number;
}

const app = new Uus<AppState>({
  state: {
    messages: [],
  },
});

app.use(websocket());

// Type-safe event handling
app.$ws?.on('message', (data: Message) => {
  app.state.messages.push(data);
});
```

## Best Practices

1. **Connection Management**: Always handle connection errors and disconnections
2. **Message Queuing**: Messages are queued when disconnected
3. **Authentication**: Use secure tokens and refresh them as needed
4. **Error Handling**: Implement proper error handling for network issues
5. **Performance**: Use debouncing for high-frequency updates

## API Reference

### Connection Methods

- `connect()`: Connect to server
- `disconnect()`: Disconnect from server
- `send(event, data)`: Send message
- `on(event, handler)`: Listen for events
- `once(event, handler)`: Listen once
- `off(event, handler)`: Remove listener
- `join(room)`: Join room/channel
- `leave(room)`: Leave room/channel

### Connection Properties

- `connected`: Connection status
- `connecting`: Currently connecting

### Events

- `connect`: Connected to server
- `disconnect`: Disconnected from server
- `error`: Connection error
- `message`: Generic message event
