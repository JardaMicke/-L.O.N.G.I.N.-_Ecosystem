import { Router } from 'express';
import { GithubController } from '../controllers/GithubController';

const router = Router();
const githubController = new GithubController();

router.post('/webhooks/github', githubController.handleWebhook);

export default router;
