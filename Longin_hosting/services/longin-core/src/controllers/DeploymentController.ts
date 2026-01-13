import { Request, Response } from 'express';
import { DeploymentService } from '../services/DeploymentService';
import { AuthRequest } from '../middleware/auth.middleware';

export class DeploymentController {
  private deploymentService: DeploymentService;

  constructor() {
    this.deploymentService = new DeploymentService();
  }

  deploy = async (req: AuthRequest, res: Response) => {
    try {
      const { appId } = req.params;
      const { version, config } = req.body;
      const userId = req.user.userId;

      const deployment = await this.deploymentService.deployApplication(appId, userId, version, config);
      res.json(deployment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getHistory = async (req: Request, res: Response) => {
    try {
      const { appId } = req.params;
      const deployments = await this.deploymentService.getDeployments(appId);
      res.json(deployments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
