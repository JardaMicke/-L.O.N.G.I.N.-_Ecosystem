import * as crypto from 'crypto';
import { AppDataSource } from '../config/database';
import { Application } from '../entities/Application.entity';
import { DeploymentService } from './DeploymentService';

export class GithubService {
  private applicationRepo = AppDataSource.getRepository(Application);
  private deploymentService: DeploymentService;

  constructor() {
    this.deploymentService = new DeploymentService();
  }

  verifySignature(payload: any, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  async processWebhook(payload: any, signature: string) {
    const repoUrl = payload.repository?.html_url;
    const branch = payload.ref?.replace('refs/heads/', '');
    
    if (!repoUrl || !branch) {
      throw new Error('Invalid payload: missing repository URL or branch');
    }

    // Find applications linked to this repo and branch
    const applications = await this.applicationRepo.find({
      where: {
        github_repo_url: repoUrl,
        github_branch: branch,
      },
      relations: ['user'],
    });

    if (applications.length === 0) {
      console.log(`No applications found for ${repoUrl} on branch ${branch}`);
      return;
    }

    // Trigger Deployments
    for (const app of applications) {
      if (app.auto_deploy) {
        console.log(`Triggering deployment for app ${app.name}`);
        try {
          // Convert env_vars Record to array of strings "KEY=VALUE"
          const envArray = app.env_vars 
            ? Object.entries(app.env_vars).map(([k, v]) => `${k}=${v}`) 
            : [];

          await this.deploymentService.deployApplication(
            app.id,
            app.user.id,
            payload.after, // Commit hash
            {
              env: envArray,
              image: 'node:18-alpine' // Default or derived from config
            }
          );
        } catch (error) {
          console.error(`Failed to deploy app ${app.name}`, error);
        }
      }
    }
  }
}
