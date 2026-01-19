/**
 * Story Routes
 * @module routes/story-routes
 */

import { Router } from 'express';
import { storyController } from '../controllers/story-controller';

const router = Router();

/**
 * POST /api/stories
 * Generate a new story
 */
router.post('/', (req, res, next) => storyController.generateStory(req, res, next));

/**
 * GET /api/stories/public
 * Get public stories
 */
router.get('/public', (req, res, next) => storyController.getPublicStories(req, res, next));

/**
 * GET /api/stories/user/:userId
 * Get all stories for a user
 */
router.get('/user/:userId', (req, res, next) => storyController.getUserStories(req, res, next));

/**
 * GET /api/stories/:storyId
 * Get a story by ID
 */
router.get('/:storyId', (req, res, next) => storyController.getStory(req, res, next));

/**
 * POST /api/stories/:storyId/continue
 * Generate story continuation
 */
router.post('/:storyId/continue', (req, res, next) => storyController.generateContinuation(req, res, next));

/**
 * POST /api/stories/:storyId/feedback
 * Add feedback to a story
 */
router.post('/:storyId/feedback', (req, res, next) => storyController.addFeedback(req, res, next));

/**
 * PUT /api/stories/:storyId/visibility
 * Set story visibility
 */
router.put('/:storyId/visibility', (req, res, next) => storyController.setVisibility(req, res, next));

export default router;
