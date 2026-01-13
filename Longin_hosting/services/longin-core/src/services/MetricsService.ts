import { AppDataSource } from '../config/database';
import { Container } from '../entities/Container.entity';
import { Metric } from '../entities/Metric.entity';
import { DockerService } from './DockerService';
import { SocketServer } from '../websocket/SocketServer';

export class MetricsService {
  private dockerService: DockerService;
  private socketServer: SocketServer;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 5000;

  constructor() {
    this.dockerService = new DockerService();
    this.socketServer = SocketServer.getInstance();
  }

  public startMonitoring() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[MetricsService] Starting monitoring loop...');
    
    this.intervalId = setInterval(async () => {
      await this.collectAndEmitMetrics();
    }, this.INTERVAL_MS);
  }

  public stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[MetricsService] Stopped monitoring loop.');
  }

  private async collectAndEmitMetrics() {
    const containerRepo = AppDataSource.getRepository(Container);
    
    try {
      // Find all running containers
      const runningContainers = await containerRepo.find({
        where: { status: 'running' }
      });

      if (runningContainers.length === 0) return;

      await Promise.all(runningContainers.map(async (container) => {
        if (!container.docker_container_id) return;

        try {
          const stats = await this.dockerService.getContainerStats(container.docker_container_id);
          const processedMetrics = this.processDockerStats(stats);
          
          // Emit to socket
          this.socketServer.emitToContainerMetrics(container.id, processedMetrics);

          // Save to DB (Optional: maybe sample less frequently or aggregate)
          // For now, let's skip DB save to save IO, or save every X minutes. 
          // We will just stream for now as per Phase 4 reqs.
          
        } catch (error) {
          console.error(`[MetricsService] Error fetching stats for ${container.id}:`, error);
        }
      }));

    } catch (error) {
      console.error('[MetricsService] Error in monitoring loop:', error);
    }
  }

  private processDockerStats(stats: any) {
    // CPU Calculation
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const numberCpus = stats.cpu_stats.online_cpus || 1;
    
    let cpuPercent = 0.0;
    if (systemDelta > 0.0 && cpuDelta > 0.0) {
      cpuPercent = (cpuDelta / systemDelta) * numberCpus * 100.0;
    }

    // Memory Calculation
    const usedMemory = stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
    const availableMemory = stats.memory_stats.limit;
    const memoryPercent = (usedMemory / availableMemory) * 100.0;

    // Network I/O (Sum of all interfaces)
    let rxBytes = 0;
    let txBytes = 0;
    if (stats.networks) {
      Object.values(stats.networks).forEach((net: any) => {
        rxBytes += net.rx_bytes;
        txBytes += net.tx_bytes;
      });
    }

    return {
      cpuPercent: parseFloat(cpuPercent.toFixed(2)),
      memoryPercent: parseFloat(memoryPercent.toFixed(2)),
      memoryUsage: usedMemory,
      memoryLimit: availableMemory,
      networkRx: rxBytes,
      networkTx: txBytes,
      timestamp: new Date()
    };
  }
}
