import { Router } from 'express';
import { DeploymentController } from '../controllers/DeploymentController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const deploymentController = new DeploymentController();

router.use(authenticateToken);

router.post('/applications/:appId/deploy', deploymentController.deploy);
router.get('/applications/:appId/history', deploymentController.getHistory);

export default router;
