import Docker from 'dockerode';
import { Readable } from 'stream';

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });
    // For Windows development, if not running in container, it might need:
    // this.docker = new Docker({ socketPath: '//./pipe/docker_engine' });
    // But we'll stick to env var configuration.
  }

  async listContainers(all: boolean = false) {
    return this.docker.listContainers({ all });
  }

  async getContainer(id: string) {
    const container = this.docker.getContainer(id);
    return container.inspect();
  }

  async startContainer(id: string) {
    const container = this.docker.getContainer(id);
    return container.start();
  }

  async stopContainer(id: string) {
    const container = this.docker.getContainer(id);
    return container.stop();
  }

  async restartContainer(id: string) {
    const container = this.docker.getContainer(id);
    return container.restart();
  }

  async getContainerLogs(id: string, tail: number = 100) {
    const container = this.docker.getContainer(id);
    const logs = await container.logs({
      follow: false,
      stdout: true,
      stderr: true,
      tail: tail,
    });
    // Logs come as Buffer, need parsing if we want structured, but string is fine for now
    return logs.toString();
  }

  async getContainerStats(id: string) {
    const container = this.docker.getContainer(id);
    // stream: false returns a single snapshot
    return container.stats({ stream: false });
  }

  async getContainerLogStream(id: string): Promise<Readable> {
    const container = this.docker.getContainer(id);
    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 100
    });
    return stream as Readable;
  }

  // Basic creation - will be expanded for Deployment logic
  async createContainer(name: string, image: string, env: string[], ports: any) {
    return this.docker.createContainer({
      Image: image,
      name: name,
      Env: env,
      HostConfig: {
        PortBindings: ports,
      },
    });
  }
}
