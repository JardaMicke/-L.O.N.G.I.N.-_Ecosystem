import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/socket.middleware';
import { LogService } from '../services/LogService';

export class SocketServer {
  private static instance: SocketServer;
  public io: Server;

  private constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.initializeMiddlewares();
    this.initializeEvents();
  }

  public static getInstance(httpServer?: HttpServer): SocketServer {
    if (!SocketServer.instance && httpServer) {
      SocketServer.instance = new SocketServer(httpServer);
    } else if (!SocketServer.instance && !httpServer) {
      throw new Error('SocketServer must be initialized with an HttpServer first');
    }
    return SocketServer.instance;
  }

  private initializeMiddlewares() {
    this.io.use(socketAuthMiddleware);
  }

  private initializeEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] User connected: ${socket.user?.email} (${socket.id})`);

      socket.join(`user:${socket.user?.userId}`); // Join user-specific room

      socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.user?.email} (${socket.id})`);
        // Clean up log subscriptions logic could be added here if we track sockets per app
      });
      
      // Example: Subscribe to specific application logs
      socket.on('subscribe:logs', (appId: string) => {
         // Verify ownership if needed, then join room
         console.log(`[Socket] User ${socket.user?.userId} subscribed to logs for ${appId}`);
         socket.join(`logs:${appId}`);
         LogService.getInstance().handleSubscribe(appId);
      });
      
      socket.on('unsubscribe:logs', (appId: string) => {
         console.log(`[Socket] User ${socket.user?.userId} unsubscribed from logs for ${appId}`);
         socket.leave(`logs:${appId}`);
         LogService.getInstance().handleUnsubscribe(appId);
      });

      socket.on('subscribe:metrics', (containerId: string) => {
        console.log(`[Socket] User ${socket.user?.userId} subscribed to metrics for ${containerId}`);
        socket.join(`metrics:${containerId}`);
      });

      socket.on('unsubscribe:metrics', (containerId: string) => {
        console.log(`[Socket] User ${socket.user?.userId} unsubscribed from metrics for ${containerId}`);
        socket.leave(`metrics:${containerId}`);
      });
    });
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
  
  public emitToAppLogs(appId: string, log: string) {
    this.io.to(`logs:${appId}`).emit('app:log', { appId, log, timestamp: new Date().toISOString() });
  }

  public emitToContainerMetrics(containerId: string, metrics: any) {
    this.io.to(`metrics:${containerId}`).emit('container:metrics', { containerId, ...metrics, timestamp: new Date().toISOString() });
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }
}
