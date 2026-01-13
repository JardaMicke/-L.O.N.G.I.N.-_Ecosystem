import { Router } from 'express';
import { DockerController } from '../controllers/DockerController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const dockerController = new DockerController();

// All routes are protected
router.use(authenticateToken);

router.get('/containers', dockerController.listContainers);
router.get('/containers/:id', dockerController.getContainer);
router.post('/containers/:id/start', dockerController.startContainer);
router.post('/containers/:id/stop', dockerController.stopContainer);
router.post('/containers/:id/restart', dockerController.restartContainer);
router.get('/containers/:id/logs', dockerController.getLogs);
router.get('/containers/:id/stats', dockerController.getStats);

export default router;
