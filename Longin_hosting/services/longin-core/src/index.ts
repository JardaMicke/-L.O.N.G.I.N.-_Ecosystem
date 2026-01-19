import 'reflect-metadata';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import dockerRoutes from './routes/docker.routes';
import deploymentRoutes from './routes/deployment.routes';
import githubRoutes from './routes/github.routes';
import { metricsRouter } from './routes/metrics.routes';
import { SocketServer } from './websocket/SocketServer';
import { MetricsService } from './services/MetricsService';
import { EventBus } from './services/EventBus';

dotenv.config();

const app = express();
const port = process.env.LONGIN_CORE_API_PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', metricsRouter);

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/docker', dockerRoutes);
app.use('/api', deploymentRoutes);
app.use('/api', githubRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Database
AppDataSource.initialize()
  .then(async () => {
    console.log('[Longin Core] Database initialized successfully');
    
    // Initialize Socket.io
    const socketServer = SocketServer.getInstance(httpServer);
    console.log('[Longin Core] Socket.io initialized');

    // Initialize Event Bus
    const eventBus = EventBus.getInstance();
    await eventBus.subscribe('character.thought', (msg) => {
      console.log('[Longin Core] Received character thought:', msg);
      // Broadcast to UI via WebSocket
      socketServer.io.emit('agent_activity', msg);
    });
    console.log('[Longin Core] Event Bus initialized');

    // Start Metrics Service
    const metricsService = new MetricsService();
    metricsService.startMonitoring();
    console.log('[Longin Core] Metrics Service started');
 
    httpServer.listen(port, () => {
      console.log(`[Longin Core] Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('[Longin Core] Error during database initialization', error);
  });
