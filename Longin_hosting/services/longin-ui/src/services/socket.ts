import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string) {
    if (this.socket?.connected) return;

    // Use environment variable or default to localhost:3001
    // Note: VITE_API_URL usually includes /api, so we might need to strip it or use a separate VITE_SOCKET_URL
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public subscribeLogs(appId: string) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:logs', appId);
    }
  }

  public unsubscribeLogs(appId: string) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:logs', appId);
    }
  }

  public subscribeMetrics(containerId: string) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:metrics', containerId);
    }
  }

  public unsubscribeMetrics(containerId: string) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:metrics', containerId);
    }
  }

  public on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }
  
  public isConnected(): boolean {
      return this.socket?.connected || false;
  }
}

export const socketService = SocketService.getInstance();
