import { Readable } from 'stream';
import { AppDataSource } from '../config/database';
import { Container } from '../entities/Container.entity';
import { DockerService } from './DockerService';
import { SocketServer } from '../websocket/SocketServer';

export class LogService {
  private static instance: LogService;
  private dockerService: DockerService;
  private activeStreams: Map<string, Readable> = new Map();
  private activeListeners: Map<string, number> = new Map();

  private constructor() {
    this.dockerService = new DockerService();
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  public async handleSubscribe(appId: string) {
    // Increment listener count
    const currentCount = this.activeListeners.get(appId) || 0;
    this.activeListeners.set(appId, currentCount + 1);

    // If already streaming, do nothing
    if (this.activeStreams.has(appId)) {
      console.log(`[LogService] Stream already active for app ${appId}`);
      return;
    }

    console.log(`[LogService] Starting new log stream for app ${appId}`);
    await this.startStream(appId);
  }

  public handleUnsubscribe(appId: string) {
    const currentCount = this.activeListeners.get(appId) || 0;
    if (currentCount <= 1) {
      this.activeListeners.delete(appId);
      this.stopStream(appId);
    } else {
      this.activeListeners.set(appId, currentCount - 1);
    }
  }

  private async startStream(appId: string) {
    try {
      const containerRepo = AppDataSource.getRepository(Container);
      const container = await containerRepo.findOne({
        where: { application_id: appId, status: 'running' },
        order: { created_at: 'DESC' } // Get latest running container
      });

      if (!container || !container.docker_container_id) {
        console.warn(`[LogService] No running container found for app ${appId}`);
        return;
      }

      const stream = await this.dockerService.getContainerLogStream(container.docker_container_id);
      
      stream.on('data', (chunk) => {
        // Docker log stream format needs parsing usually, but raw string is okay for now
        // Dockerode returns Buffer.
        const log = chunk.toString('utf8');
        SocketServer.getInstance().emitToAppLogs(appId, log);
      });

      stream.on('error', (err) => {
        console.error(`[LogService] Stream error for app ${appId}:`, err);
        this.stopStream(appId);
      });

      stream.on('end', () => {
        console.log(`[LogService] Stream ended for app ${appId}`);
        this.stopStream(appId);
      });

      this.activeStreams.set(appId, stream);

    } catch (error) {
      console.error(`[LogService] Error starting stream for app ${appId}:`, error);
    }
  }

  private stopStream(appId: string) {
    const stream = this.activeStreams.get(appId);
    if (stream) {
      stream.destroy(); // Stop the stream
      this.activeStreams.delete(appId);
      console.log(`[LogService] Stopped stream for app ${appId}`);
    }
  }
}
