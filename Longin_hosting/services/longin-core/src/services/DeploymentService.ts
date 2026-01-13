import { AppDataSource } from '../config/database';
import { Deployment } from '../entities/Deployment.entity';
import { Application } from '../entities/Application.entity';
import { Container } from '../entities/Container.entity';
import { DockerService } from './DockerService';
import { User } from '../entities/User.entity';

export class DeploymentService {
  private deploymentRepo = AppDataSource.getRepository(Deployment);
  private applicationRepo = AppDataSource.getRepository(Application);
  private containerRepo = AppDataSource.getRepository(Container);
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  async deployApplication(appId: string, userId: string, version: string, config: any) {
    const app = await this.applicationRepo.findOne({ where: { id: appId } });
    if (!app) throw new Error('Application not found');

    // Create Deployment Record
    const deployment = this.deploymentRepo.create({
      application: app,
      status: 'pending',
      commit_sha: version,
      deployment_log: 'Starting deployment...',
    });
    
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (user) deployment.triggered_by = user;

    await this.deploymentRepo.save(deployment);

    try {
      // Logic to pull image/build would go here.
      // For now, assuming image is ready or using a standard image.
      const imageName = config.image || 'nginx:latest'; // Placeholder
      
      // Stop existing container if any
      const existingContainer = await this.containerRepo.findOne({ 
        where: { application: { id: appId }, status: 'running' } 
      });

      if (existingContainer && existingContainer.docker_container_id) {
        try {
          await this.dockerService.stopContainer(existingContainer.docker_container_id);
          existingContainer.status = 'stopped';
          existingContainer.stopped_at = new Date();
          await this.containerRepo.save(existingContainer);
        } catch (e) {
          console.warn('Failed to stop existing container', e);
        }
      }

      // Create new container
      const containerName = `${app.name}-${deployment.id}`;
      // Map ports
      const portBindings: any = {};
      if (app.port) {
        portBindings[`${app.port}/tcp`] = [{ HostPort: `${app.port}` }];
      }

      // Process env vars
      // const env = config.env ? Object.entries(config.env).map(([k, v]) => `${k}=${v}`) : [];
      // But DockerService expects array of strings.
      const env = Array.isArray(config.env) ? config.env : [];

      const dockerContainer = await this.dockerService.createContainer(
        containerName,
        imageName,
        env,
        portBindings
      );

      await this.dockerService.startContainer(dockerContainer.id);

      // Update Deployment
      deployment.status = 'success';
      deployment.build_completed_at = new Date();
      deployment.deployment_log += '\nDeployment successful';
      await this.deploymentRepo.save(deployment);

      // Save Container Record
      const newContainer = this.containerRepo.create({
        application: app,
        docker_container_id: dockerContainer.id,
        docker_image_name: imageName,
        // port: app.port, // Container entity uses internal_port/host_port
        internal_port: app.port,
        host_port: app.port,
        status: 'running',
        started_at: new Date(),
      });
      await this.containerRepo.save(newContainer);

      return deployment;

    } catch (error: any) {
      deployment.status = 'failed';
      deployment.build_completed_at = new Date();
      deployment.deployment_log += `\nError: ${error.message}`;
      await this.deploymentRepo.save(deployment);
      throw error;
    }
  }

  async getDeployments(appId: string) {
    return this.deploymentRepo.find({
      where: { application: { id: appId } },
      order: { created_at: 'DESC' },
      relations: ['triggered_by'],
    });
  }
}
