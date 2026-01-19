/**
 * Chat Routes
 * @module routes/chat-routes
 */

import { Router } from 'express';
import { chatController } from '../controllers/chat-controller';

const router = Router();

/**
 * POST /api/chat
 * Send a message to AI character
 */
router.post('/', (req, res, next) => chatController.sendMessage(req, res, next));

/**
 * GET /api/chat/:characterId/history
 * Get chat history for a character
 */
router.get('/:characterId/history', (req, res, next) => chatController.getHistory(req, res, next));

/**
 * DELETE /api/chat/:characterId/history
 * Clear chat history for a character
 */
router.delete('/:characterId/history', (req, res, next) => chatController.clearHistory(req, res, next));

export default router;
