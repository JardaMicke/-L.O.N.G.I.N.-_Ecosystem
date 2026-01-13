# Frontend Implementation Guide - Phase 5

## 1. Architecture Overview

The frontend is built with **React 18**, **TypeScript**, and **Vite**. It uses **Socket.io Client** for real-time communication and **Recharts** for data visualization.

### Key Components
- **SocketService**: A singleton service (`src/services/socket.ts`) that manages the WebSocket connection. It handles authentication via JWT token and provides methods to subscribe/unsubscribe to events.
- **SocketProvider**: A React Context (`src/context/SocketContext.tsx`) that makes the `SocketService` available throughout the component tree and manages connection lifecycle based on user authentication.
- **LogTerminal**: A component for displaying streaming logs with auto-scroll and filtering capabilities.
- **MetricsGraph**: A component for visualizing real-time metrics (CPU, Memory) using area charts.

## 2. Real-time Integration

### Connection Flow
1. User logs in.
2. `AuthContext` saves token to localStorage.
3. `SocketProvider` detects user presence and token, calls `socketService.connect(token)`.
4. Socket connects to backend (default: `http://localhost:3001`).

### Events
- **Client -> Server**:
    - `subscribe:logs` (appId)
    - `unsubscribe:logs` (appId)
    - `subscribe:metrics` (containerId)
    - `unsubscribe:metrics` (containerId)
- **Server -> Client**:
    - `app:log`: Payload `{ appId, log, timestamp }`
    - `container:metrics`: Payload `{ containerId, cpu, memory, timestamp }`

## 3. Components

### LogTerminal
- **Location**: `src/components/LogTerminal.tsx`
- **Usage**: `<LogTerminal appId="uuid" />`
- **Features**:
    - Auto-scrolls to bottom on new logs (can be paused).
    - Client-side filtering of displayed logs.
    - Visual connection status indicator.

### MetricsGraph
- **Location**: `src/components/MetricsGraph.tsx`
- **Usage**: `<MetricsGraph containerId="uuid" type="cpu" />`
- **Features**:
    - Real-time updates via Socket.io.
    - Maintains a rolling window of last 50 data points.
    - Supports 'cpu' and 'memory' types.

## 4. Dependencies
- `react`, `react-dom`: Core framework.
- `socket.io-client`: WebSocket communication.
- `recharts`: Charting library.
- `lucide-react`: Icons.
- `tailwindcss`: Styling.

## 5. Future Expansion Guide

### Adding New Real-time Features
1. **Backend**: Ensure the event is emitted by the server.
2. **SocketService**: Add `subscribeX` and `unsubscribeX` methods to `src/services/socket.ts` if specific rooms are needed.
3. **Component**:
    - Use `useSocket()` hook.
    - Subscribe in `useEffect`.
    - Listen for the event: `socket.on('event:name', handler)`.
    - Clean up: `socket.off(...)` and `unsubscribe`.

### Adding New Charts
1. Create a new component in `src/components`.
2. Use `MetricsGraph` as a template.
3. Adjust `recharts` components (e.g., `BarChart`, `PieChart`) as needed.
