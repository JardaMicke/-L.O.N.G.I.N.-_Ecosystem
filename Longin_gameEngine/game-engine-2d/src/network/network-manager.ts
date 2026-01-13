import { io, Socket } from 'socket.io-client';

import { ConfigManager } from '../core/config-manager';
import { EventSystem } from '../core/event-system';
import { Logger } from '../utils/logger';

/**
 * Manages network connections and communication with the game server.
 * Wrapper around Socket.IO client.
 */
export class NetworkManager {
  private socket: Socket | null = null;
  private eventSystem: EventSystem;
  private connected: boolean = false;

  /**
   * Creates a new NetworkManager.
   */
  constructor() {
    this.eventSystem = EventSystem.getInstance();
  }

  /**
   * Establishes a connection to the server based on configuration.
   */
  public connect(): void {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getConfig().network;

    if (!config.enabled) {
      Logger.info('Network disabled in config');
      return;
    }

    const url = `http://${config.host}:${config.port}`;
    Logger.info(`Connecting to game server at ${url}...`);

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupHandlers();
  }

  /**
   * Sets up socket event listeners.
   * Forwards socket events to the EventSystem.
   */
  private setupHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      Logger.info(`Connected to server with ID: ${this.socket?.id}`);
      this.eventSystem.emit('network:connected', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      Logger.info('Disconnected from server');
      this.eventSystem.emit('network:disconnected');
    });

    this.socket.on('connect_error', (err: any) => {
      Logger.error('Connection error', err);
      this.eventSystem.emit('network:error', err);
    });

    // Forward arbitrary events
    this.socket.onAny((event: any, ...args: any[]) => {
      if (typeof event === 'string' && event.startsWith('game:')) {
        this.eventSystem.emit(`network:${event}`, ...args);
      }
    });
  }

  /**
   * Sends an event to the server.
   * 
   * @param {string} event - The event name.
   * @param {any} data - The payload data.
   */
  public send(event: string, data: any): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Gets the underlying socket instance.
   * 
   * @returns {Socket | null} The Socket.IO client instance or null.
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Checks if the client is currently connected to the server.
   * 
   * @returns {boolean} True if connected.
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnects from the server.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
