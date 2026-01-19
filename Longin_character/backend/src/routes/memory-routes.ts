/**
 * Memory Routes
 * @module routes/memory-routes
 */

import { Router } from 'express';
import { memoryController } from '../controllers/memory-controller';

const router = Router();

/**
 * GET /api/memories/:characterId
 * Get all memories for a character
 */
router.get('/:characterId', (req, res, next) => memoryController.getMemories(req, res, next));

/**
 * GET /api/memories/:characterId/stats
 * Get memory statistics
 */
router.get('/:characterId/stats', (req, res, next) => memoryController.getStats(req, res, next));

/**
 * GET /api/memories/:characterId/:memoryId
 * Get a specific memory
 */
router.get('/:characterId/:memoryId', (req, res, next) => memoryController.getMemory(req, res, next));

/**
 * POST /api/memories/:characterId
 * Create a new memory
 */
router.post('/:characterId', (req, res, next) => memoryController.createMemory(req, res, next));

/**
 * PUT /api/memories/:characterId/:memoryId
 * Update a memory
 */
router.put('/:characterId/:memoryId', (req, res, next) => memoryController.updateMemory(req, res, next));

/**
 * DELETE /api/memories/:characterId/:memoryId
 * Delete a memory
 */
router.delete('/:characterId/:memoryId', (req, res, next) => memoryController.deleteMemory(req, res, next));

export default router;
