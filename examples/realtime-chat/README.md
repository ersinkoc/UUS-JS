# UUS.js Realtime Chat Example

A fully functional real-time chat application built with UUS.js that demonstrates WebSocket communication, reactive state management, and live user interactions.

## Features

- **Real-time messaging** - Send and receive messages instantly
- **Online user list** - See who's currently connected
- **Typing indicators** - Know when someone is typing
- **Message history** - Persistent chat history during session
- **Auto-reconnection** - Automatically reconnects if connection is lost
- **Responsive design** - Works on desktop and mobile
- **System notifications** - Join/leave notifications

## Running the Example

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the WebSocket server:**
   ```bash
   npm start
   ```

3. **Open the client:**
   - Open http://localhost:3000 in your browser
   - Enter your name to join the chat
   - Open multiple browser windows to test real-time features

## Architecture

### Frontend (UUS.js)
- **Reactive state management** - All chat data managed with UUS.js state
- **Real-time UI updates** - Automatic DOM updates when state changes
- **WebSocket integration** - Direct WebSocket handling in the state object
- **Event-driven** - All user interactions handled through UUS.js directives

### Backend (Node.js + WebSocket)
- **Express server** - Serves static files and WebSocket endpoint
- **WebSocket Server** - Handles real-time connections using `ws` library
- **Message broadcasting** - Efficiently sends messages to all connected clients
- **User management** - Tracks online users and handles disconnections

## WebSocket Events

### Client → Server
- `user:join` - User joins the chat
- `message:send` - Send a chat message
- `user:typing` - Send typing indicator

### Server → Client
- `user:joined` - New user joined
- `user:left` - User disconnected
- `users:list` - Current online users
- `message:new` - New message received
- `messages:history` - Chat history
- `user:typing` - Typing indicator update

## Key UUS.js Concepts Demonstrated

1. **Complex State Management**
   ```javascript
   uus-state="{
     messages: [],
     users: [],
     connected: false,
     // ... complex nested state
   }"
   ```

2. **Real-time WebSocket Integration**
   ```javascript
   initWebSocket() {
     this.ws = new WebSocket('ws://localhost:3000');
     this.ws.onmessage = (event) => {
       this.handleWebSocketMessage(JSON.parse(event.data));
     };
   }
   ```

3. **Computed Properties**
   ```javascript
   get typingText() {
     if (this.typingUsers.length === 1) {
       return this.typingUsers[0].name + ' is typing...';
     }
     // ... complex logic
   }
   ```

4. **Event Handling**
   ```html
   <form uus-on:submit.prevent="sendMessage()">
     <input uus-on:input="handleTyping()" />
   </form>
   ```

## Customization

- **Styling** - All CSS is inline and can be customized
- **WebSocket URL** - Change the WebSocket server URL in `initWebSocket()`
- **Message limits** - Adjust `MAX_MESSAGES` in server.js
- **Reconnection logic** - Modify auto-reconnection timing

## Production Considerations

- Add authentication and user management
- Implement message persistence (database)
- Add rate limiting and spam protection
- Use secure WebSocket (WSS) for HTTPS
- Add file/image sharing capabilities
- Implement private messaging and channels