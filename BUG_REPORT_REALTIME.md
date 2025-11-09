# Bug Analysis Report: @uusjs/realtime Package

**Package**: @uusjs/realtime
**Location**: /home/user/UUS-JS/packages/realtime/
**Analysis Date**: 2025-11-08
**Analyzed Files**: websocket.ts, socketio.ts, sse.ts, store.ts, index.ts

---

## Executive Summary

This analysis identified **29 bugs** across 5 source files:
- **3 CRITICAL** severity bugs (security vulnerabilities, data corruption)
- **7 HIGH** severity bugs (memory leaks, race conditions)
- **13 MEDIUM** severity bugs (connection issues, state management)
- **6 LOW** severity bugs (minor inefficiencies, edge cases)

**Primary Concerns**:
1. Security vulnerability in SSE URL parameter handling
2. Multiple memory leaks in event listener management
3. Race conditions in connection state management
4. Missing cleanup mechanisms throughout

---

## CRITICAL Severity Bugs

### BUG-RT-001: Options Mutation in WebSocket Disconnect
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`
**Lines**: 260
**Severity**: CRITICAL
**Category**: Connection State Management

**Description**:
The `disconnect()` function mutates the shared options object by setting `opts.reconnect.enabled = false`. This creates a permanent side effect that affects the original configuration object passed to `createWebSocket()`.

```typescript
function disconnect() {
  opts.reconnect.enabled = false;  // MUTATES SHARED OPTIONS
  // ...
}
```

**Impact**:
- If the same options object is reused across multiple connections, all instances are affected
- Reconnection becomes permanently disabled even if user wants to reconnect later
- Unexpected behavior when sharing configuration objects

**Fix**:
Use a local flag instead of mutating the options:
```typescript
let reconnectEnabled = opts.reconnect.enabled;

function disconnect() {
  reconnectEnabled = false;
  // Check reconnectEnabled instead of opts.reconnect.enabled
}
```

---

### BUG-RT-002: URL Parameter Injection in SSE
**File**: `/home/user/UUS-JS/packages/realtime/src/sse.ts`
**Lines**: 68-71
**Severity**: CRITICAL
**Category**: WebSocket Security

**Description**:
Authentication parameters are added to the URL without proper sanitization, unlike the WebSocket implementation which has `sanitizeAuthParams()`.

```typescript
const url = new URL(opts.url, window.location.origin);
Object.entries(authData).forEach(([key, value]) => {
  url.searchParams.set(key, String(value));  // NO SANITIZATION
});
```

**Impact**:
- URL injection attacks possible through malicious auth parameter keys
- Could allow arbitrary query parameters to be injected
- Security vulnerability in authentication flow

**Fix**:
Implement sanitization similar to websocket.ts:
```typescript
function sanitizeAuthParams(params: Record<string, any>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (/^[a-zA-Z0-9_-]+$/.test(key)) {
      safe[key] = encodeURIComponent(String(value));
    } else {
      console.warn(`[SSE] Skipping invalid auth parameter key: ${key}`);
    }
  }
  return safe;
}
```

---

### BUG-RT-003: Version Control Race Condition in Store
**File**: `/home/user/UUS-JS/packages/realtime/src/store.ts`
**Lines**: 41-43
**Severity**: CRITICAL
**Category**: Race Conditions

**Description**:
The version comparison for conflict resolution doesn't handle concurrent updates correctly. Out-of-order updates can corrupt state.

```typescript
if (data.version <= version) {
  return; // Ignore older updates - BUT WHAT IF THEY ARRIVE OUT OF ORDER?
}
```

**Impact**:
- State corruption when updates arrive out of order
- Lost updates in high-concurrency scenarios
- Inconsistent state across clients

**Fix**:
Implement proper conflict resolution with vector clocks or operational transformation:
```typescript
// Track both local and remote versions
let localVersion = 0;
let remoteVersion = 0;

// Use timestamps as tiebreaker for concurrent updates
if (data.version < remoteVersion) {
  return; // Definitely old
} else if (data.version === remoteVersion) {
  // Use timestamp to resolve conflict
  if (data.timestamp <= lastUpdateTimestamp) {
    return;
  }
}
```

---

## HIGH Severity Bugs

### BUG-RT-004: Event Handler Memory Leak in Socket.io
**File**: `/home/user/UUS-JS/packages/realtime/src/socketio.ts`
**Lines**: 110-129
**Severity**: HIGH
**Category**: Memory Leaks

**Description**:
Event handlers (`connect`, `disconnect`, `connect_error`, `error`) are registered on the socket but never removed. If `connect()` is called multiple times (e.g., after connection failures), handlers accumulate.

```typescript
socket.on('connect', () => { /* ... */ });
socket.on('disconnect', (reason: string) => { /* ... */ });
socket.on('connect_error', (error: any) => { /* ... */ });
socket.on('error', (error: any) => { /* ... */ });
// NO CLEANUP OF THESE HANDLERS
```

**Impact**:
- Memory leak that grows with each reconnection attempt
- Multiple handlers fire for the same event
- Performance degradation over time

**Fix**:
Store handler references and clean them up on disconnect:
```typescript
const handlers = {
  connect: () => { /* ... */ },
  disconnect: (reason: string) => { /* ... */ },
  connect_error: (error: any) => { /* ... */ },
  error: (error: any) => { /* ... */ }
};

// Register
Object.entries(handlers).forEach(([event, handler]) => {
  socket.on(event, handler);
});

// In disconnect()
Object.entries(handlers).forEach(([event, handler]) => {
  socket?.off(event, handler);
});
```

---

### BUG-RT-005: EventSource Listener Memory Leak in SSE
**File**: `/home/user/UUS-JS/packages/realtime/src/sse.ts`
**Lines**: 147-164, 276-292
**Severity**: HIGH
**Category**: Memory Leaks

**Description**:
EventSource event listeners are added in `setupEventSource()` and `on()` but never removed. Each call to `on()` for a custom event adds a new listener to EventSource.

```typescript
// In setupEventSource()
listeners.forEach((_, event) => {
  eventSource!.addEventListener(event, (e: any) => { /* ... */ });
  // NEVER REMOVED
});

// In on()
if (eventSource && /* custom event */) {
  eventSource.addEventListener(event, (e: any) => { /* ... */ });
  // NEVER REMOVED
}
```

**Impact**:
- Severe memory leak as listeners accumulate
- EventSource object can't be garbage collected
- Event handlers fire multiple times

**Fix**:
Track EventSource listeners and remove them on disconnect:
```typescript
const eventSourceListeners = new Map<string, Function>();

// When adding listener
const handler = (e: any) => { /* ... */ };
eventSource.addEventListener(event, handler);
eventSourceListeners.set(event, handler);

// In disconnect()
eventSourceListeners.forEach((handler, event) => {
  eventSource?.removeEventListener(event, handler as any);
});
eventSourceListeners.clear();
```

---

### BUG-RT-006: Race Condition in WebSocket Connect
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`
**Lines**: 137-140
**Severity**: HIGH
**Category**: Race Conditions

**Description**:
There's a window between checking the connection state and setting `state.connecting = true` where multiple simultaneous calls can pass the guard.

```typescript
if (state.connected || state.connecting) return;  // CHECK

state.connecting = true;  // SET (not atomic with check)
```

**Impact**:
- Multiple WebSocket connections created simultaneously
- Resource waste and connection conflicts
- Unpredictable connection state

**Fix**:
Use atomic check-and-set pattern:
```typescript
let connectPromise: Promise<void> | null = null;

async function connect(): Promise<void> {
  if (connectPromise) return connectPromise;
  if (state.connected) return;

  connectPromise = (async () => {
    try {
      state.connecting = true;
      // ... connection logic
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}
```

---

### BUG-RT-007: Race Condition in Socket.io Connect
**File**: `/home/user/UUS-JS/packages/realtime/src/socketio.ts`
**Lines**: 80-108
**Severity**: HIGH
**Category**: Race Conditions

**Description**:
Multiple simultaneous calls to `connect()` can create multiple socket instances without cleaning up previous ones.

```typescript
async function connect(): Promise<void> {
  if (state.connected || state.connecting) return;

  state.connecting = true;
  // ... socket = io(...) creates new instance
}
```

**Impact**:
- Multiple socket connections to the same server
- Memory leak from abandoned socket instances
- Message delivery confusion

**Fix**:
Same as BUG-RT-006, use promise memoization pattern.

---

### BUG-RT-008: Heartbeat Timer Leak in WebSocket
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`
**Lines**: 102-112
**Severity**: HIGH
**Category**: Memory Leaks

**Description**:
If `connect()` is called multiple times before completing, or if connection fails after heartbeat setup, multiple interval timers could be created.

```typescript
function setupHeartbeat() {
  if (!opts.heartbeat.interval) return;

  clearInterval(heartbeatTimer);  // Only clears previous timer

  heartbeatTimer = setInterval(() => { /* ... */ }, opts.heartbeat.interval);
  // If connect() fails before ws.onopen, this timer leaks
}
```

**Impact**:
- Memory leak from orphaned timers
- CPU usage from unnecessary heartbeat attempts
- Timers continue running without active connection

**Fix**:
Clear heartbeat immediately on any error:
```typescript
// In connect() catch block
catch (error) {
  clearHeartbeat();  // ADD THIS
  // ...
}
```

---

### BUG-RT-009: EventSource Not Closed on Connection Error
**File**: `/home/user/UUS-JS/packages/realtime/src/sse.ts`
**Lines**: 100-109
**Severity**: HIGH
**Category**: Connection State Management

**Description**:
If connection fails in the try block (when using fetch with headers), a partially created EventSource might not be properly closed.

```typescript
try {
  // ... might create eventSource here
  if (options.headers && Object.keys(options.headers).length > 0) {
    // Use fetch - what about eventSource created before?
  } else {
    eventSource = new EventSource(url.toString(), {
      withCredentials: opts.withCredentials,
    });
    setupEventSource();
  }
} catch (error) {
  // eventSource might be set but not closed
  log('Connection failed', error);
  // ...
}
```

**Impact**:
- Connection leak if EventSource partially initialized
- Browser keeps connection open
- Resource waste

**Fix**:
Ensure cleanup in catch block:
```typescript
catch (error) {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  // ...
}
```

---

### BUG-RT-010: Effect Cleanup Not Called in Store
**File**: `/home/user/UUS-JS/packages/realtime/src/store.ts`
**Lines**: 83-104
**Severity**: HIGH
**Category**: Memory Leaks

**Description**:
The `effect()` function returns a `stopWatching` cleanup function that is never stored or called, causing the effect to run forever even if the store is destroyed.

```typescript
const stopWatching = effect(() => {
  // ... effect logic
});
// stopWatching is NEVER called
```

**Impact**:
- Memory leak as effect continues running after store destruction
- Unnecessary network traffic sending updates
- CPU waste

**Fix**:
Return cleanup function from createRealtimeStore:
```typescript
return {
  get state() { /* ... */ },
  subscribe,
  update,
  reset,
  destroy() {
    stopWatching();
    if (opts.channel) {
      connection.leave(opts.channel);
    }
  }
};
```

---

## MEDIUM Severity Bugs

### BUG-RT-011: Double URL Encoding in WebSocket
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`
**Lines**: 123-157
**Severity**: MEDIUM
**Category**: Type Safety / Edge Cases

**Description**:
Auth parameters are encoded with `encodeURIComponent()` in `sanitizeAuthParams()`, then `url.searchParams.set()` encodes them again, causing double encoding.

```typescript
function sanitizeAuthParams(params: Record<string, any>): Record<string, string> {
  // ...
  safe[key] = encodeURIComponent(String(value));  // FIRST ENCODING
}

// Later
Object.entries(sanitizedAuth).forEach(([key, value]) => {
  url.searchParams.set(key, value);  // SECOND ENCODING
});
```

**Impact**:
- Server receives double-encoded values
- Authentication failures
- Must decode twice on server side

**Fix**:
Don't encode in sanitizeAuthParams since searchParams.set() encodes:
```typescript
function sanitizeAuthParams(params: Record<string, any>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (/^[a-zA-Z0-9_-]+$/.test(key)) {
      safe[key] = String(value);  // Don't encode here
    }
  }
  return safe;
}
```

---

### BUG-RT-012: Unbounded Message Queue in WebSocket
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`
**Lines**: 62, 290-292
**Severity**: MEDIUM
**Category**: Memory Leaks

**Description**:
The `messageQueue` array has no size limit and could grow unbounded if the connection is down for extended periods.

```typescript
const messageQueue: RealtimeMessage[] = [];

// In send()
messageQueue.push(message);  // NO SIZE LIMIT
```

**Impact**:
- Memory exhaustion if offline for long time
- Application crashes in extreme cases
- Performance degradation with large queues

**Fix**:
Implement queue size limit with overflow handling:
```typescript
const MAX_QUEUE_SIZE = 100;

// In send()
if (messageQueue.length >= MAX_QUEUE_SIZE) {
  // Option 1: Drop oldest
  messageQueue.shift();
  // Option 2: Drop and warn
  log('Message queue full, dropping oldest message');
}
messageQueue.push(message);
```

---

### BUG-RT-013: Listeners Lost Before Connection in Socket.io
**File**: `/home/user/UUS-JS/packages/realtime/src/socketio.ts`
**Lines**: 160-169
**Severity**: MEDIUM
**Category**: Connection State Management

**Description**:
The `on()` function returns an empty function if socket doesn't exist, meaning event listeners registered before connection are completely lost.

```typescript
function on(event: string, handler: (data: any) => void): () => void {
  if (!socket) {
    log('Not connected');
    return () => {};  // LISTENER LOST
  }
  // ...
}
```

**Impact**:
- Event listeners registered before connection never fire
- Silent failure - no error or warning to developer
- Must re-register listeners after connection

**Fix**:
Queue listeners and register them on connection:
```typescript
const pendingListeners = new Map<string, Set<Function>>();

function on(event: string, handler: (data: any) => void): () => void {
  if (!socket) {
    if (!pendingListeners.has(event)) {
      pendingListeners.set(event, new Set());
    }
    pendingListeners.get(event)!.add(handler);
    return () => {
      pendingListeners.get(event)?.delete(handler);
    };
  }
  socket.on(event, handler);
  return () => off(event, handler);
}

// In connect() after socket creation
pendingListeners.forEach((handlers, event) => {
  handlers.forEach(handler => socket.on(event, handler));
});
pendingListeners.clear();
```

---

### BUG-RT-014: No Timeout on Socket.io join/leave
**File**: `/home/user/UUS-JS/packages/realtime/src/socketio.ts`
**Lines**: 194-226
**Severity**: MEDIUM
**Category**: Connection State Management

**Description**:
The `join()` and `leave()` promises can hang forever if the server doesn't respond with a callback.

```typescript
async function join(room: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket!.emit('join', room, (error?: any) => {
      // WHAT IF CALLBACK NEVER FIRES?
      if (error) reject(error);
      else resolve();
    });
  });
}
```

**Impact**:
- Application hangs waiting for room join/leave
- UI freezes if awaiting these promises
- No error feedback to user

**Fix**:
Add timeout like websocket.ts and sse.ts already have:
```typescript
async function join(room: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for join confirmation: ${room}`));
    }, 5000);

    socket!.emit('join', room, (error?: any) => {
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    });
  });
}
```

---

### BUG-RT-015: Stream Reader Not Cancelled in SSE
**File**: `/home/user/UUS-JS/packages/realtime/src/sse.ts`
**Lines**: 167-218
**Severity**: MEDIUM
**Category**: Memory Leaks

**Description**:
The `processStream()` function doesn't cancel the reader on errors, potentially leaving the fetch connection open.

```typescript
async function processStream(reader: ReadableStreamDefaultReader<Uint8Array>) {
  try {
    while (true) {
      const { done, value } = await reader.read();
      // ...
    }
  } catch (error) {
    log('Stream error', error);
    emit('error', error);
    // READER NOT CANCELLED
  } finally {
    // ...
  }
}
```

**Impact**:
- Connection leak if stream errors occur
- Browser connection limit reached
- Resource waste

**Fix**:
Cancel reader in error handler:
```typescript
catch (error) {
  try {
    await reader.cancel();
  } catch (cancelError) {
    log('Failed to cancel reader', cancelError);
  }
  log('Stream error', error);
  emit('error', error);
}
```

---

### BUG-RT-016: No Exponential Backoff in SSE Reconnection
**File**: `/home/user/UUS-JS/packages/realtime/src/sse.ts`
**Lines**: 221-234
**Severity**: MEDIUM
**Category**: Reconnection Logic

**Description**:
SSE reconnection uses a fixed delay instead of exponential backoff like WebSocket implementation, which can overwhelm the server during outages.

```typescript
function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = opts.reconnect.delay;  // ALWAYS THE SAME
  log(`Reconnecting in ${delay}ms`);
  // ...
}
```

**Impact**:
- Server overwhelmed during outages (thundering herd)
- Unnecessary network traffic
- Inconsistent behavior with WebSocket

**Fix**:
Implement exponential backoff like websocket.ts:
```typescript
let reconnectAttempts = 0;

function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectAttempts++;
  const delay = Math.min(
    opts.reconnect.delay * Math.pow(2, reconnectAttempts - 1),
    opts.reconnect.maxDelay
  );

  log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
  // ...
}

// Reset on successful connection
reconnectAttempts = 0;
```

---

### BUG-RT-017: Connection Listeners Not Cleaned Up in Store
**File**: `/home/user/UUS-JS/packages/realtime/src/store.ts`
**Lines**: 35-69, 184-218
**Severity**: MEDIUM
**Category**: Memory Leaks

**Description**:
`connection.on()` is called but unsubscribe functions are never stored or called, leading to memory leaks when the store is destroyed.

```typescript
connection.on(opts.updateEvent, (data) => {
  // ... handler logic
});
// UNSUBSCRIBE FUNCTION IGNORED

connection.on('text:operation', (data) => {
  // ... handler logic
});
// UNSUBSCRIBE FUNCTION IGNORED
```

**Impact**:
- Memory leak when store is destroyed
- Handlers continue to fire after store destruction
- Possible state corruption

**Fix**:
Store unsubscribe functions and call in destroy method:
```typescript
const unsubscribeUpdate = connection.on(opts.updateEvent, handler);

return {
  // ...
  destroy() {
    unsubscribeUpdate();
    stopWatching();
  }
};
```

---

### BUG-RT-018: Debounce Timer Not Cleared in Collaborative Text
**File**: `/home/user/UUS-JS/packages/realtime/src/store.ts`
**Lines**: 176, 222-231
**Severity**: MEDIUM
**Category**: Memory Leaks

**Description**:
The `debounceTimer` in `createCollaborativeText()` is never cleared on cleanup, causing timer leaks.

```typescript
let debounceTimer: any = null;

function sendOperation(op: any) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { /* ... */ }, opts.debounce);
}
// NO CLEANUP MECHANISM
```

**Impact**:
- Timer continues to fire after collaborative text is destroyed
- Memory leak
- Unexpected network requests

**Fix**:
Return cleanup function:
```typescript
return {
  get content() { return content; },
  insert,
  remove,
  replace,
  subscribe,
  destroy() {
    clearTimeout(debounceTimer);
    if (opts.channel) {
      connection.leave(opts.channel);
    }
  }
};
```

---

### BUG-RT-019: No Cleanup for Auto-Connect in Plugin
**File**: `/home/user/UUS-JS/packages/realtime/src/index.ts`
**Lines**: 52-55
**Severity**: MEDIUM
**Category**: Memory Leaks

**Description**:
The plugin calls `connection.connect()` automatically in `install()`, but there's no cleanup mechanism when the app is unmounted.

```typescript
install(app: Uus) {
  // ...
  connection.connect().catch((error) => {
    console.error(`Failed to connect ${type}:`, error);
  });
  // NO CLEANUP ON APP UNMOUNT
}
```

**Impact**:
- Connection remains open after app unmounts
- Resource leak in SPA navigation scenarios
- Possible memory leak

**Fix**:
Provide cleanup hook:
```typescript
return {
  connection,

  install(app: Uus) {
    // ... existing code
  },

  uninstall(app: Uus) {
    connection.disconnect();
    // Clean up directives
    // Clean up state
  }
};
```

---

### BUG-RT-020: Reactive State Not Properly Integrated
**File**: `/home/user/UUS-JS/packages/realtime/src/index.ts`
**Lines**: 73-80
**Severity**: MEDIUM
**Category**: Type Safety / Connection State

**Description**:
Creating getters on `app.state.$realtime` might not integrate properly with the app's reactivity system.

```typescript
app.state.$realtime = {
  get connected() {
    return connection.connected;
  },
  get connecting() {
    return connection.connecting;
  },
};
```

**Impact**:
- Reactive updates might not propagate
- UI not updating on connection state changes
- Depends on @uusjs/core reactivity implementation

**Fix**:
Use the app's reactive system properly:
```typescript
const realtimeState = reactive({
  connected: false,
  connecting: false
});

// Update state when connection changes
connection.on('connect', () => {
  realtimeState.connected = true;
  realtimeState.connecting = false;
});

connection.on('disconnect', () => {
  realtimeState.connected = false;
  realtimeState.connecting = false;
});

app.state.$realtime = realtimeState;
```

---

### BUG-RT-021: Reconnection Counter Not Reset on Manual Disconnect
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`
**Lines**: 54, 172, 242, 259-276
**Severity**: MEDIUM
**Category**: Reconnection Logic

**Description**:
The `reconnectAttempts` counter is reset only on successful connection, not when `disconnect()` is called manually.

```typescript
let reconnectAttempts = 0;

ws.onopen = () => {
  reconnectAttempts = 0;  // Reset here
};

function disconnect() {
  // NOT RESET HERE
}
```

**Impact**:
- Counter keeps growing across connect/disconnect cycles
- Exponential backoff gets unnecessarily long
- Poor reconnection behavior after manual disconnect

**Fix**:
Reset counter on disconnect:
```typescript
function disconnect() {
  opts.reconnect.enabled = false;
  reconnectAttempts = 0;  // ADD THIS
  // ...
}
```

---

### BUG-RT-022: State Not Updated on All Error Paths in Socket.io
**File**: `/home/user/UUS-JS/packages/realtime/src/socketio.ts`
**Lines**: 122-125
**Severity**: MEDIUM
**Category**: Connection State Management

**Description**:
The `connect_error` handler sets `state.connecting = false` but doesn't explicitly set `state.connected = false`.

```typescript
socket.on('connect_error', (error: any) => {
  log('Connection error', error);
  state.connecting = false;  // What about state.connected?
});
```

**Impact**:
- Inconsistent state if connect_error fires while connected
- UI shows wrong connection status
- State machine confusion

**Fix**:
Ensure both states are set correctly:
```typescript
socket.on('connect_error', (error: any) => {
  log('Connection error', error);
  state.connected = false;
  state.connecting = false;
});
```

---

### BUG-RT-023: Initial Effect Trigger in Store
**File**: `/home/user/UUS-JS/packages/realtime/src/store.ts`
**Lines**: 83-104
**Severity**: MEDIUM
**Category**: Message Handling Edge Cases

**Description**:
The effect triggers immediately on creation, sending an update to the server even before any real user changes occur.

```typescript
const stopWatching = effect(() => {
  JSON.stringify(state);  // Triggers immediately

  if (syncing) return;

  version++;
  connection.send(opts.syncEvent, { /* ... */ });  // SENDS ON INIT
});
```

**Impact**:
- Unnecessary network traffic on store creation
- Server receives spurious updates
- Version counter starts at 1 instead of 0

**Fix**:
Skip first trigger:
```typescript
let isFirstRun = true;

const stopWatching = effect(() => {
  JSON.stringify(state);

  if (isFirstRun) {
    isFirstRun = false;
    return;
  }

  if (syncing) return;
  // ...
});
```

---

## LOW Severity Bugs

### BUG-RT-024: Type Safety Violation in Plugin
**File**: `/home/user/UUS-JS/packages/realtime/src/index.ts`
**Lines**: 50
**Severity**: LOW
**Category**: Type Safety

**Description**:
Using `(app as any)` bypasses TypeScript's type checking completely.

```typescript
(app as any)[`$${type === 'socketio' ? 'io' : type}`] = connection;
```

**Impact**:
- No compile-time type safety
- Typos not caught
- IntelliSense not available

**Fix**:
Properly extend the app type:
```typescript
interface UusWithRealtime extends Uus {
  $ws?: RealtimeConnection;
  $sse?: RealtimeConnection;
  $io?: RealtimeConnection;
}

const appWithRealtime = app as UusWithRealtime;
appWithRealtime[`$${type === 'socketio' ? 'io' : type}`] = connection;
```

---

### BUG-RT-025: Inefficient Change Detection in Store
**File**: `/home/user/UUS-JS/packages/realtime/src/store.ts`
**Lines**: 85
**Severity**: LOW
**Category**: Performance

**Description**:
Using `JSON.stringify(state)` for change detection is inefficient for large state objects.

```typescript
effect(() => {
  JSON.stringify(state);  // Expensive for large objects
  // ...
});
```

**Impact**:
- CPU usage for large state
- Unnecessary JSON serialization
- Performance degradation

**Fix**:
Use shallow comparison or proxy-based change detection (likely already provided by @uusjs/core reactive system).

---

### BUG-RT-026: Incomplete SSE Event Parsing
**File**: `/home/user/UUS-JS/packages/realtime/src/sse.ts`
**Lines**: 189-206
**Severity**: LOW
**Category**: Message Handling Edge Cases

**Description**:
Custom SSE event parsing (event: field) is incomplete and doesn't properly handle multi-line SSE events.

```typescript
for (const line of lines) {
  if (line.startsWith('data: ')) {
    // ...
  } else if (line.startsWith('event: ')) {
    const event = line.slice(7);
    // Next data line will be for this event - BUT NOT IMPLEMENTED
  }
}
```

**Impact**:
- Custom SSE events not properly handled
- Data associated with wrong events
- SSE spec not fully implemented

**Fix**:
Implement proper SSE event buffering:
```typescript
let currentEvent = 'message';
let currentData = '';

for (const line of lines) {
  if (line.startsWith('data: ')) {
    currentData += line.slice(6) + '\n';
  } else if (line.startsWith('event: ')) {
    currentEvent = line.slice(7).trim();
  } else if (line === '') {
    // Empty line = end of event
    if (currentData) {
      emit(currentEvent, JSON.parse(currentData.trim()));
      currentEvent = 'message';
      currentData = '';
    }
  }
}
```

---

### BUG-RT-027: Missing Prototype Pollution Check in Socket.io
**File**: `/home/user/UUS-JS/packages/realtime/src/socketio.ts`
**Lines**: All
**Severity**: LOW
**Category**: WebSocket Security

**Description**:
Unlike websocket.ts which has `safeJsonParse()` to prevent prototype pollution, socketio.ts has no such protection. Socket.io library itself should handle this, but for consistency and defense in depth, it should be present.

**Impact**:
- Potential prototype pollution if Socket.io has vulnerability
- Inconsistent security posture across transports
- Defense in depth missing

**Fix**:
Add same safeJsonParse utility and use for any manual JSON parsing.

---

### BUG-RT-028: Missing Error Boundaries in Message Handlers
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`, `sse.ts`
**Lines**: Multiple
**Severity**: LOW
**Category**: Message Handling Edge Cases

**Description**:
While there are try-catch blocks around JSON parsing, there's no error boundary around the entire message handling flow.

**Impact**:
- User handler errors could crash connection
- Error in one handler affects others
- Poor error isolation

**Fix**:
Already mostly handled by emit() function wrapping handlers in try-catch (line 92-97 in websocket.ts).

---

### BUG-RT-029: Binary Type Not Set on MockWebSocket
**File**: `/home/user/UUS-JS/packages/realtime/src/websocket.ts`
**Lines**: 163-165
**Severity**: LOW
**Category**: Type Safety

**Description**:
The code sets `binaryType` on WebSocket, but there's no check if it's already set to that value, causing an unnecessary property set.

**Impact**:
- Minor: unnecessary property assignment
- Test found this (line 239 in tests) but no validation in production code

**Fix**:
Add conditional check:
```typescript
if (options.binaryType && ws.binaryType !== options.binaryType) {
  ws.binaryType = options.binaryType;
}
```

---

## Summary by Category

### WebSocket Security Issues (3)
- BUG-RT-002: URL Parameter Injection in SSE (CRITICAL)
- BUG-RT-027: Missing Prototype Pollution Check in Socket.io (LOW)
- BUG-RT-011: Double URL Encoding (MEDIUM)

### Connection State Management Bugs (8)
- BUG-RT-001: Options Mutation (CRITICAL)
- BUG-RT-006: Race Condition in WebSocket Connect (HIGH)
- BUG-RT-007: Race Condition in Socket.io Connect (HIGH)
- BUG-RT-009: EventSource Not Closed on Error (HIGH)
- BUG-RT-013: Listeners Lost Before Connection (MEDIUM)
- BUG-RT-014: No Timeout on join/leave (MEDIUM)
- BUG-RT-020: Reactive State Integration (MEDIUM)
- BUG-RT-022: State Not Updated on Error Paths (MEDIUM)

### Memory Leaks in Event Listeners (7)
- BUG-RT-004: Socket.io Event Handler Leak (HIGH)
- BUG-RT-005: SSE EventSource Listener Leak (HIGH)
- BUG-RT-008: Heartbeat Timer Leak (HIGH)
- BUG-RT-010: Effect Cleanup Not Called (HIGH)
- BUG-RT-012: Unbounded Message Queue (MEDIUM)
- BUG-RT-017: Store Connection Listeners Not Cleaned (MEDIUM)
- BUG-RT-018: Debounce Timer Not Cleared (MEDIUM)
- BUG-RT-019: No Cleanup for Auto-Connect (MEDIUM)

### Race Conditions (1)
- BUG-RT-003: Version Control Race in Store (CRITICAL)

### Reconnection Logic Errors (2)
- BUG-RT-016: No Exponential Backoff in SSE (MEDIUM)
- BUG-RT-021: Reconnection Counter Not Reset (MEDIUM)

### Message Handling Edge Cases (3)
- BUG-RT-023: Initial Effect Trigger (MEDIUM)
- BUG-RT-026: Incomplete SSE Event Parsing (LOW)
- BUG-RT-028: Missing Error Boundaries (LOW)

### Type Safety Violations (3)
- BUG-RT-024: Type Casting in Plugin (LOW)
- BUG-RT-025: Inefficient Change Detection (LOW)
- BUG-RT-029: Binary Type Setting (LOW)

### Resource Leaks (1)
- BUG-RT-015: Stream Reader Not Cancelled (MEDIUM)

---

## Recommended Fix Priority

### Immediate (Week 1)
1. BUG-RT-002: URL Parameter Injection (CRITICAL security issue)
2. BUG-RT-001: Options Mutation (CRITICAL state corruption)
3. BUG-RT-003: Version Control Race Condition (CRITICAL data corruption)

### High Priority (Week 2)
4. BUG-RT-004: Socket.io Event Handler Memory Leak
5. BUG-RT-005: SSE EventSource Memory Leak
6. BUG-RT-006: WebSocket Connect Race Condition
7. BUG-RT-007: Socket.io Connect Race Condition

### Medium Priority (Week 3-4)
8. All MEDIUM severity bugs
9. Implement comprehensive cleanup mechanisms
10. Add exponential backoff to SSE

### Low Priority (Ongoing)
11. Type safety improvements
12. Performance optimizations
13. Better error handling

---

## Testing Recommendations

1. **Memory Leak Tests**: Run long-duration tests with frequent connect/disconnect cycles
2. **Race Condition Tests**: Parallel connection attempts
3. **Security Tests**: Malicious input in auth parameters
4. **Integration Tests**: Test all three transports (WebSocket, Socket.io, SSE)
5. **Cleanup Tests**: Verify all resources released on disconnect
6. **Reconnection Tests**: Test various network failure scenarios

---

## Code Quality Recommendations

1. **Consistent Patterns**: Align all three transports (WebSocket, Socket.io, SSE) to use same patterns for:
   - Connection state management
   - Event listener cleanup
   - Reconnection logic
   - Error handling

2. **Resource Management**: Implement explicit lifecycle management:
   - Create/Connect/Disconnect/Destroy pattern
   - Cleanup functions for all resources
   - Reference counting for shared resources

3. **Type Safety**: Eliminate use of `any` and type assertions where possible

4. **Documentation**: Add JSDoc comments for all public APIs explaining lifecycle and cleanup requirements

---

**End of Report**
