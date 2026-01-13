import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', ApplicationController.create);
router.post('/validate-url', ApplicationController.validateUrl);
router.get('/', ApplicationController.findAll);
router.get('/:id', ApplicationController.findOne);
router.patch('/:id', ApplicationController.update);
router.delete('/:id', ApplicationController.remove);

export default router;
