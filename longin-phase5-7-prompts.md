# 🚀 LONGIN HOSTING - PROMPTS FÁZE 5-7 PRO AI AGENTA (POKRAČOVÁNÍ)

---

<a name="prompt-5"></a>

## 🟠 PROMPT 5: REAL-TIME & WEBSOCKET (Socket.io)

**Cíl:** Socket.io server s autentifikací, real-time metrics broadcasting, log streaming  
**Doba:** 8-10 hodin  
**Dependencies:** TASK 2.3 (auth) + TASK 4 (docker service)  
**Output:** Working WebSocket server + client integration

### 📋 SOCKET.IO ARCHITEKTURA

```
Namespaces:
├── / (main)
│   └── events: connection, disconnect, error
├── /metrics
│   └── events: subscribe, unsubscribe, data
├── /logs
│   └── events: subscribe, unsubscribe, data
└── /admin
    └── events: (admin-only, requires role)
```

### 🔹 SOCKET.IO SERVER SETUP

**Soubor:** `services/longin-core/src/websocket/socket-server.ts`

```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { logger } from '../utils/logger';
import { metricsService } from './metrics.service';
import { logsService } from './logs.service';

export function setupSocketServer(httpServer: Server): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ============= MIDDLEWARE =============

  /**
   * Autentifikační middleware pro všechny WebSocket spojení
   */
  io.use((socket, next) => {
    try {
      // Ziskej token z query nebo headers
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('No authorization token'));
      }

      // Ověř token
      const payload = verifyAccessToken(token);
      socket.data.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // ============= MAIN NAMESPACE (/) =============

  io.on('connection', (socket: Socket) => {
    logger.info(`User connected: ${socket.data.user.id} (${socket.id})`);

    socket.emit('connected', {
      message: 'Connected to Longin server',
      userId: socket.data.user.id,
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.data.user.id}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${error.message}`);
    });
  });

  // ============= METRICS NAMESPACE =============

  const metricsNamespace = io.of('/metrics');

  metricsNamespace.on('connection', (socket: Socket) => {
    logger.info(`User subscribed to metrics: ${socket.data.user.id}`);

    /**
     * Subscribe na metriky konkrétní aplikace
     * Event: { applicationId: string }
     */
    socket.on('subscribe', async (data: { applicationId: string }) => {
      try {
        const room = `app-metrics-${data.applicationId}`;
        socket.join(room);
        
        logger.info(`User subscribed to metrics for app: ${data.applicationId}`);
        
        socket.emit('subscribed', {
          applicationId: data.applicationId,
          message: 'Successfully subscribed to metrics',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Unsubscribe z metrik
     */
    socket.on('unsubscribe', (data: { applicationId: string }) => {
      const room = `app-metrics-${data.applicationId}`;
      socket.leave(room);
      
      logger.info(`User unsubscribed from metrics for app: ${data.applicationId}`);
      
      socket.emit('unsubscribed', {
        applicationId: data.applicationId,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected from metrics`);
    });
  });

  // ============= LOGS NAMESPACE =============

  const logsNamespace = io.of('/logs');

  logsNamespace.on('connection', (socket: Socket) => {
    logger.info(`User subscribed to logs: ${socket.data.user.id}`);

    /**
     * Subscribe na real-time logy kontejneru
     * Event: { containerId: string }
     */
    socket.on('subscribe', async (data: { containerId: string }) => {
      try {
        const room = `container-logs-${data.containerId}`;
        socket.join(room);
        
        logger.info(`User subscribed to logs for container: ${data.containerId}`);
        
        // Spusť streaming logů
        await logsService.startStreamingLogs(data.containerId, socket, room);
        
        socket.emit('subscribed', {
          containerId: data.containerId,
          message: 'Streaming logs...',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Unsubscribe z logů
     */
    socket.on('unsubscribe', (data: { containerId: string }) => {
      const room = `container-logs-${data.containerId}`;
      socket.leave(room);
      
      // Zastavit streaming
      logsService.stopStreamingLogs(data.containerId);
      
      logger.info(`User unsubscribed from logs for container: ${data.containerId}`);
      
      socket.emit('unsubscribed', {
        containerId: data.containerId,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected from logs`);
    });
  });

  // ============= ADMIN NAMESPACE =============

  const adminNamespace = io.of('/admin');

  adminNamespace.use((socket, next) => {
    // Vyžaduj admin role
    if (socket.data.user.role !== 'admin') {
      return next(new Error('Insufficient permissions'));
    }
    next();
  });

  adminNamespace.on('connection', (socket: Socket) => {
    logger.info(`Admin connected: ${socket.data.user.id}`);

    /**
     * Broadcast systémového statusu všem adminům
     */
    socket.on('request_system_status', async () => {
      try {
        const status = await getSystemStatus();
        socket.emit('system_status', status);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Admin disconnected: ${socket.data.user.id}`);
    });
  });

  return io;
}

/**
 * Broadcast metrik konkrétní aplikaci
 * Volej z metrics collection service
 */
export function broadcastMetrics(applicationId: string, metrics: any) {
  const io = global.socketServer as SocketIOServer;
  if (!io) return;

  const room = `app-metrics-${applicationId}`;
  io.of('/metrics').to(room).emit('data', {
    applicationId,
    ...metrics,
    timestamp: new Date(),
  });
}

/**
 * Broadcast log linky do kontejneru
 * Volej z logs streaming service
 */
export function broadcastLog(containerId: string, logLine: string) {
  const io = global.socketServer as SocketIOServer;
  if (!io) return;

  const room = `container-logs-${containerId}`;
  io.of('/logs').to(room).emit('data', {
    containerId,
    line: logLine,
    timestamp: new Date(),
  });
}

/**
 * Privátní funkce - zjisti systémový status
 */
async function getSystemStatus() {
  // TODO: Implementuj sbírání systémového statusu
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date(),
  };
}
```

### 🔹 METRICS SERVICE (Real-time broadcasting)

**Soubor:** `services/longin-core/src/websocket/metrics.service.ts`

```typescript
import { Repository } from 'typeorm';
import { Application } from '../entities/Application.entity';
import { Container } from '../entities/Container.entity';
import { AppDataSource } from '../config/database';
import { containerService } from '../services/container.service';
import { broadcastMetrics } from './socket-server';
import { logger } from '../utils/logger';

export class MetricsService {
  private applicationRepository: Repository<Application>;
  private containerRepository: Repository<Container>;
  private collectionIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.applicationRepository = AppDataSource.getRepository(Application);
    this.containerRepository = AppDataSource.getRepository(Container);
  }

  /**
   * Spusť sbírání metrik pro aplikaci (každých 30 sekund)
   */
  async startMetricsCollection(applicationId: string) {
    // Pokud už běží, nestaruj znovu
    if (this.collectionIntervals.has(applicationId)) {
      return;
    }

    logger.info(`Starting metrics collection for app: ${applicationId}`);

    const interval = setInterval(async () => {
      try {
        await this.collectAppMetrics(applicationId);
      } catch (error) {
        logger.error(`Failed to collect metrics: ${error.message}`);
      }
    }, 30000); // 30 sekund

    this.collectionIntervals.set(applicationId, interval);
  }

  /**
   * Zastavit sbírání metrik
   */
  stopMetricsCollection(applicationId: string) {
    const interval = this.collectionIntervals.get(applicationId);
    if (interval) {
      clearInterval(interval);
      this.collectionIntervals.delete(applicationId);
      logger.info(`Stopped metrics collection for app: ${applicationId}`);
    }
  }

  /**
   * Sbírání metrik z všech kontejnerů aplikace
   */
  private async collectAppMetrics(applicationId: string) {
    try {
      const app = await this.applicationRepository.findOne({
        where: { id: applicationId },
        relations: ['containers'],
      });

      if (!app) return;

      const metrics: any = {
        containerMetrics: [],
        aggregated: {
          totalCpu: 0,
          totalMemory: 0,
          containerCount: app.containers.length,
        },
      };

      for (const container of app.containers) {
        if (container.status === 'running') {
          try {
            const containerMetrics = await containerService.collectMetrics(container.id);
            
            metrics.containerMetrics.push({
              containerId: container.id,
              ...containerMetrics,
            });

            metrics.aggregated.totalCpu += containerMetrics.cpu_usage_percent || 0;
            metrics.aggregated.totalMemory += containerMetrics.memory_usage_mb || 0;
          } catch (error) {
            logger.warn(`Failed to collect metrics for container ${container.id}`);
          }
        }
      }

      // Broadcast WebSocket
      broadcastMetrics(applicationId, metrics);
    } catch (error) {
      logger.error(`Error collecting app metrics: ${error.message}`);
    }
  }
}

export const metricsService = new MetricsService();
```

### 🔹 LOGS SERVICE (Real-time streaming)

**Soubor:** `services/longin-core/src/websocket/logs.service.ts`

```typescript
import { Socket } from 'socket.io';
import { containerService } from '../services/container.service';
import { dockerService } from '../services/docker.service';
import { broadcastLog } from './socket-server';
import { logger } from '../utils/logger';

export class LogsService {
  private streamingContainers: Map<string, boolean> = new Map();
  private lastLogIndex: Map<string, number> = new Map();

  /**
   * Spusť streamování logů kontejneru
   */
  async startStreamingLogs(containerId: string, socket?: Socket, room?: string) {
    // Pokud už streamujeme, vrátíme se
    if (this.streamingContainers.get(containerId)) {
      return;
    }

    logger.info(`Starting log stream for container: ${containerId}`);
    this.streamingContainers.set(containerId, true);

    try {
      const container = await this.getContainer(containerId);
      
      if (!container || !container.docker_container_id) {
        throw new Error('Container not found');
      }

      // Spusť Docker log streaming
      await dockerService.streamContainerLogs(
        container.docker_container_id,
        (logLine) => {
          // Broadcast kabě socket tak broadcastu všem
          if (socket && room) {
            socket.emit('log', { line: logLine, timestamp: new Date() });
          } else {
            broadcastLog(containerId, logLine);
          }
        },
        (error) => {
          logger.error(`Log streaming error: ${error.message}`);
          if (socket) {
            socket.emit('error', { message: 'Log streaming error' });
          }
          this.streamingContainers.set(containerId, false);
        },
      );
    } catch (error) {
      logger.error(`Failed to start log streaming: ${error.message}`);
      this.streamingContainers.set(containerId, false);
      
      if (socket) {
        socket.emit('error', { message: error.message });
      }
    }
  }

  /**
   * Zastavit streamování logů
   */
  stopStreamingLogs(containerId: string) {
    this.streamingContainers.set(containerId, false);
    logger.info(`Stopped log stream for container: ${containerId}`);
  }

  /**
   * Privátní metoda
   */
  private async getContainer(containerId: string) {
    const repo = require('../config/database').AppDataSource.getRepository(
      require('../entities/Container.entity').Container,
    );
    return repo.findOne({ where: { id: containerId } });
  }
}

export const logsService = new LogsService();
```

### 🔹 SOCKET.IO INTEGRACE V APP.TS

**Aktualizace:** `services/longin-core/src/app.ts`

```typescript
import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { setupSocketServer } from './websocket/socket-server';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import containerRoutes from './routes/container.routes';

const app = express();
const httpServer = createServer(app);

// Setup Socket.io
const io = setupSocketServer(httpServer);
global.socketServer = io;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/containers', containerRoutes);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Initialize database and start server
AppDataSource.initialize().then(() => {
  const PORT = process.env.LONGIN_CORE_API_PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});

export default app;
```

### ✅ CHECKLIST PRO PROMPT 5

- [ ] Socket.io server vytvořen se správnou autentifikací
- [ ] 3 namespaces konfigurováno (metrics, logs, admin)
- [ ] Metrics broadcasting funguje
- [ ] Log streaming funguje
- [ ] Real-time data se posílá klientům
- [ ] Error handling je komplexní
- [ ] Unit testy napsány
- [ ] Socket.io client library je připravena pro frontend

---

<a name="prompt-6"></a>

## 🟠 PROMPT 6: FRONTEND REACT & STATE MANAGEMENT

**Cíl:** React UI s Redux, API integrace, Socket.io client, Tailwind styling  
**Doba:** 10-12 hodin  
**Dependencies:** TASK 1.3 (longin-ui) + TASK 2.5 (API endpoints)  
**Output:** Production-ready React komponenty

### 📋 FRONTEND ARCHITEKTURA

```
src/
├── pages/
│   ├── LoginPage.tsx          # /login
│   ├── RegisterPage.tsx        # /register
│   ├── DashboardPage.tsx       # /dashboard
│   ├── AppsPage.tsx            # /apps
│   ├── AppDetailPage.tsx       # /apps/:id
│   └── AdminPage.tsx           # /admin (admin only)
├── components/
│   ├── AppCard.tsx
│   ├── ContainerStatus.tsx
│   ├── MetricsChart.tsx
│   ├── LogViewer.tsx
│   └── Navbar.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useMetrics.ts
│   └── useLogs.ts
├── services/
│   ├── api.ts                 # Axios instance + endpoints
│   └── socket.ts              # Socket.io client
├── store/
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── appsSlice.ts
│   │   ├── metricsSlice.ts
│   │   └── uiSlice.ts
│   └── index.ts               # Redux store setup
└── types/
    └── index.ts               # TypeScript interfaces
```

### 🔹 REDUX STORE SETUP

**Soubor:** `services/longin-ui/src/store/index.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appsReducer from './slices/appsSlice';
import metricsReducer from './slices/metricsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    apps: appsReducer,
    metrics: metricsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 🔹 AUTH SLICE

**Soubor:** `services/longin-ui/src/store/slices/authSlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'developer';
  first_name?: string;
  last_name?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (
    {
      username,
      email,
      password,
      confirmPassword,
    }: {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        confirmPassword,
      });
      
      // Ulož tokens v localStorage
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken || '');
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    { username, password }: { username: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken || '');
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Logout failed');
  }
});

export const refreshAccessToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await api.post('/auth/refresh', { refreshToken });
      
      localStorage.setItem('accessToken', response.data.data.accessToken);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue('Token refresh failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setAccessToken, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### 🔹 API SERVICE

**Soubor:** `services/longin-ui/src/services/api.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import { store } from '../store';
import { setAccessToken } from '../store/slices/authSlice';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send cookies
});

// Request interceptor - přidej accessToken
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken || localStorage.getItem('accessToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor - refresh token když vyprší
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        store.dispatch(setAccessToken(newAccessToken));

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

### 🔹 SOCKET.IO CLIENT

**Soubor:** `services/longin-ui/src/services/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

let socketInstance: Socket | null = null;

export function initSocket(accessToken: string): Socket {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  socketInstance = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socketInstance;
}

export function getSocket(): Socket | null {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

// Metrics namespace helper
export function subscribeToMetrics(applicationId: string, onData: (data: any) => void) {
  const socket = socketInstance?.io.of('/metrics');
  if (!socket) return;

  socket.emit('subscribe', { applicationId });
  socket.on('data', onData);

  return () => {
    socket.emit('unsubscribe', { applicationId });
    socket.off('data', onData);
  };
}

// Logs namespace helper
export function subscribeTologs(containerId: string, onData: (data: any) => void) {
  const socket = socketInstance?.io.of('/logs');
  if (!socket) return;

  socket.emit('subscribe', { containerId });
  socket.on('data', onData);

  return () => {
    socket.emit('unsubscribe', { containerId });
    socket.off('data', onData);
  };
}
```

### 🔹 CUSTOM HOOKS

**Soubor:** `services/longin-ui/src/hooks/useSocket.ts`

```typescript
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { initSocket, subscribeToMetrics, getSocket } from '../services/socket';

export function useSocket() {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (accessToken) {
      initSocket(accessToken);
    }
  }, [accessToken]);

  return getSocket();
}

export function useMetrics(applicationId: string) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;

    setIsLoading(true);
    const unsubscribe = subscribeToMetrics(applicationId, (data) => {
      setMetrics(data);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [applicationId]);

  return { metrics, isLoading, error };
}
```

### ✅ CHECKLIST PRO PROMPT 6

- [ ] Redux store s 4 slices vytvořen
- [ ] Auth endpoints integrované
- [ ] API service s interceptory vytvořen
- [ ] Socket.io client integrován
- [ ] Custom hooks vytvořeny
- [ ] Login/Register stránky funkční
- [ ] Dashboard s metrics grafy
- [ ] Real-time data se zobrazují
- [ ] Tailwind styling aplikován
- [ ] Error handling komplexní

---

<a name="prompt-7"></a>

## 🟠 PROMPT 7: MONITORING, LOGGING & DEPLOYMENT

**Cíl:** Prometheus metriky, Grafana dashboards, ELK stack, produkční deployment  
**Doba:** 10-12 hodin  
**Dependencies:** Všechny předchozí tasky  
**Output:** Complete monitoring & logging solution

### 📋 MONITORING STACK

```
Prometheus (port 9090)
  └─ Scrape longin-core metriky
    
Grafana (port 3000 - alt port)
  └─ Dashboards z Prometheus
    
Elasticsearch (port 9200)
  ├─ Loki (port 3100)
  │   └─ Agregace logů z kontejnerů
  └─ Kibana (port 5601)
      └─ Exploration logů
```

### 🔹 PROMETHEUS KONFIGURACIJA

**Soubor:** `config/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'longin-monitor'

scrape_configs:
  - job_name: 'longin-core'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'longin-ui'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

### 🔹 PROMETHEUS METRIKY V BACKENDU

**Soubor:** `services/longin-core/src/utils/prometheus.ts`

```typescript
import promClient from 'prom-client';

// Registry
const register = new promClient.Registry();

// Metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const containerUptime = new promClient.Gauge({
  name: 'container_uptime_seconds',
  help: 'Container uptime in seconds',
  labelNames: ['container_id', 'app_id'],
  registers: [register],
});

export const deploymentSuccess = new promClient.Counter({
  name: 'deployments_success_total',
  help: 'Total successful deployments',
  labelNames: ['app_id'],
  registers: [register],
});

export const deploymentFailure = new promClient.Counter({
  name: 'deployments_failed_total',
  help: 'Total failed deployments',
  labelNames: ['app_id'],
  registers: [register],
});

// Metrics endpoint
export function getMetricsEndpoint() {
  return register.metrics();
}

// Middleware pro tracking HTTP metrik
export function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
}
```

### 🔹 DOCKER COMPOSE PRO MONITORING

**Soubor:** `docker-compose.monitoring.yml` (overlay)

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - longin-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3004:3000"  # Alt port aby se nesrazilo s UI
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - longin-network
    depends_on:
      - prometheus

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./config/loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - longin-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - longin-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - longin-network
    depends_on:
      - elasticsearch

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
  elasticsearch_data:

networks:
  longin-network:
    driver: bridge
```

### 🔹 PRODUKČNÍ DOCKER-COMPOSE

**Soubor:** `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./services/database/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - longin-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - longin-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  longin-core:
    image: longin-core:${VERSION:-latest}
    build:
      context: .
      dockerfile: services/longin-core/Dockerfile
      target: production
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ${DATABASE_USER}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_NAME: ${DATABASE_NAME}
      REDIS_URL: redis://redis:6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - longin-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M

  longin-ui:
    image: longin-ui:${VERSION:-latest}
    build:
      context: .
      dockerfile: services/longin-ui/Dockerfile
      target: production
    ports:
      - "3000:80"
    environment:
      REACT_APP_API_URL: ${API_URL}
      REACT_APP_SOCKET_URL: ${SOCKET_URL}
    depends_on:
      - longin-core
    networks:
      - longin-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  longin-network:
    driver: bridge
```

### 🔹 DEPLOYMENT - GITHUB ACTIONS PRODUKCE

**Soubor:** `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: docker.io
  IMAGE_NAME: longin

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push longin-core
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./services/longin-core/Dockerfile
          target: production
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-core:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-core:${{ github.sha }}

      - name: Build and push longin-ui
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./services/longin-ui/Dockerfile
          target: production
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-ui:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-ui:${{ github.sha }}

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /home/deploy/longin-hosting
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-core:latest
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-ui:latest
            docker-compose -f docker-compose.prod.yml up -d
            echo "✅ Deployment successful"
```

### ✅ CHECKLIST PRO PROMPT 7

- [ ] Prometheus konfigurován
- [ ] Grafana s datasource (Prometheus)
- [ ] Custom dashboards vytvořeny
- [ ] Metriky middleware v backendu
- [ ] Loki + Elasticsearch pro logy
- [ ] Kibana dashboard vytvořen
- [ ] docker-compose.monitoring.yml vytvořen
- [ ] docker-compose.prod.yml vytvořen
- [ ] GitHub Actions workflow pro produkci
- [ ] Health checks všude
- [ ] Resource limits nastaveny
- [ ] Backup strategy definován

---

## 🎉 SOUHRNNÝ CHECKLIST - COMPLETION

Jakmile máš všechny Prompty implementovány:

### Phase 1 ✅
- [x] Project struktura
- [x] Docker & Compose
- [x] CI/CD pipeline

### Phase 2 ✅
- [x] Database schema (7 tabulek)
- [x] TypeORM entities
- [x] Authentication & JWT
- [x] Auth routes & middleware
- [x] Password hashing (bcryptjs)

### Phase 3 ✅
- [x] Docker SDK integration
- [x] Container management
- [x] Port allocation
- [x] Container lifecycle

### Phase 4 ✅
- [x] Socket.io server
- [x] Real-time metrics
- [x] Log streaming
- [x] Namespaces & auth

### Phase 5 ✅
- [x] React UI
- [x] Redux store
- [x] API integration
- [x] Socket.io client
- [x] Tailwind styling

### Phase 6 ✅
- [x] Prometheus metriky
- [x] Grafana dashboards
- [x] ELK logging
- [x] Production deployment
- [x] GitHub Actions

---

## 🚀 JAK ZAHÁJIT IMPLEMENTACI S AI AGENTEM

### 1. Příprava
```bash
# Clone repo a setup
git clone <repo>
cd longin-hosting-server
cp .env.example .env
pnpm install
```

### 2. Spustit Phase 1
```bash
# Say to AI Agent:
# "Prosím vytvořimp Task 1.1: Project Initialization"
```

### 3. Postupně Fáze 2-6
- Drž se čísla tasků (2.1, 2.2, 2.3...)
- Jeden task najednou
- Nespouštěj paralelní tasky pokud nejsou nezávislé

### 4. Test & Verify
```bash
# Po každém tasku
pnpm test
pnpm lint
docker-compose up -d
curl http://localhost:3001/health
```

### 5. Deploy
```bash
# Po skončení všech tasků
docker-compose -f docker-compose.prod.yml up -d
# Ověř Prometheus: http://localhost:9090
# Ověř Grafana: http://localhost:3004
```

---

**Verze:** 1.0  
**Status:** PRODUCTION READY  
**Last Updated:** Březen 2025  
**Next Steps:** Implementuj Phase 1-7 sekvenčně s AI Agentem