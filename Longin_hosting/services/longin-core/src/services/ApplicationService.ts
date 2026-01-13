import { AppDataSource } from '../config/database';
import { Application } from '../entities/Application.entity';
import { User } from '../entities/User.entity';
import { Between, Not } from 'typeorm';
import axios from 'axios';

export class ApplicationService {
  private applicationRepo = AppDataSource.getRepository(Application);
  private userRepo = AppDataSource.getRepository(User);

  async validateUrl(url: string, currentAppId?: string): Promise<{ valid: boolean; message: string; reachable?: boolean }> {
    // 1. Syntax check
    try {
      new URL(url);
    } catch (e) {
      return { valid: false, message: 'Invalid URL format' };
    }

    // 2. DB Uniqueness
    const existingApp = await this.applicationRepo.findOne({
      where: { public_url: url },
    });

    if (existingApp && existingApp.id !== currentAppId) {
      return { valid: false, message: 'URL is already in use by another application' };
    }

    // 3. Reachability check (Optional - just info)
    let reachable = false;
    try {
      await axios.head(url, { timeout: 5000 });
      reachable = true;
    } catch (e) {
      // It's okay if it's not reachable yet, user might be setting it up
      reachable = false;
    }

    return { valid: true, message: 'URL is valid', reachable };
  }

  async createApplication(userId: string, data: Partial<Application>) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate slug
    let slug = data.slug || this.generateSlug(data.name!);
    let counter = 1;
    while (await this.applicationRepo.findOne({ where: { slug } })) {
      slug = `${data.slug || this.generateSlug(data.name!)}-${counter}`;
      counter++;
    }

    // Assign Port
    const port = await this.findAvailablePort();

    const application = this.applicationRepo.create({
      ...data,
      user,
      user_id: userId,
      slug,
      port,
      status: 'stopped',
    });

    return await this.applicationRepo.save(application);
  }

  async findAllByUser(userId: string) {
    return await this.applicationRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      relations: ['containers', 'deployments'],
    });
  }

  async findOne(id: string, userId: string) {
    const app = await this.applicationRepo.findOne({
      where: { id, user_id: userId },
      relations: ['containers', 'deployments', 'deployments.triggered_by'],
    });
    
    if (!app) {
      throw new Error('Application not found');
    }
    return app;
  }

  async update(id: string, userId: string, data: Partial<Application>) {
    const app = await this.findOne(id, userId);
    
    // If updating name, update slug if not provided, or check collision
    if (data.name && data.name !== app.name) {
       // logic to update slug if needed, for now let's keep slug stable unless explicitly changed
    }

    Object.assign(app, data);
    return await this.applicationRepo.save(app);
  }

  async remove(id: string, userId: string) {
    const app = await this.findOne(id, userId);
    return await this.applicationRepo.remove(app);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private async findAvailablePort(): Promise<number> {
    const minPort = 3100;
    const maxPort = 4000;
    
    const usedPorts = await this.applicationRepo.find({
      select: ['port'],
      where: {
        port: Between(minPort, maxPort)
      }
    });

    const usedPortSet = new Set(usedPorts.map(app => app.port));

    for (let port = minPort; port <= maxPort; port++) {
      if (!usedPortSet.has(port)) {
        return port;
      }
    }

    throw new Error('No available ports in range 3100-4000');
  }
}
