/**
 * API Routes - Main API router
 * @module routes/api
 */

import { Router } from 'express';
import chatRoutes from './chat-routes';
import memoryRoutes from './memory-routes';
import storyRoutes from './story-routes';
import generationRoutes from './generation-routes';
import updateRoutes from './update-routes';

const router = Router();

// Generation routes (mounted at root to match original /api/text-to-image structure)
router.use('/', generationRoutes);

// Update routes
router.use('/update', updateRoutes);

// Chat routes
router.use('/chat', chatRoutes);

// Memory routes
router.use('/memories', memoryRoutes);

// Stories routes
router.use('/stories', storyRoutes);

// Characters routes (placeholder)
router.use('/characters', (req, res) => {
    res.json({
        success: true,
        message: 'Character routes available',
        endpoints: [
            'GET /api/characters - List characters',
            'POST /api/characters - Create character',
            'GET /api/characters/:id - Get character',
            'PUT /api/characters/:id - Update character',
            'DELETE /api/characters/:id - Delete character'
        ]
    });
});

export default router;
