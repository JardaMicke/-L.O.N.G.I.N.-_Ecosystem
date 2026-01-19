/**
 * Story Controller - Handles story generation operations
 * @module controllers/story-controller
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { StoryEngine } from '../services/story-engine';
import { logInfo, logError } from '../utils/logger';
import { ApiResponse, Story, StoryChapter, StoryFeedback } from '../types';

// Initialize StoryEngine with database path
const dbPath = path.join(__dirname, '../../data/stories.db');
const storyEngine = new StoryEngine(dbPath);

interface GenerateStoryRequest {
    prompt: string;
    userId: string;
    characterId?: string;
    length?: 'short' | 'medium' | 'long';
    genre?: string;
}

/**
 * Story Controller class
 */
export class StoryController {
    /**
     * Generate a new story
     */
    public async generateStory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { prompt, userId, characterId, length, genre } = req.body as GenerateStoryRequest;

            if (!prompt || prompt.trim() === '')
            {
                res.status(400).json({
                    success: false,
                    error: { code: 'EMPTY_PROMPT', message: 'Zadání příběhu je povinné' }
                } as ApiResponse);
                return;
            }

            if (!userId)
            {
                res.status(400).json({
                    success: false,
                    error: { code: 'MISSING_USER', message: 'ID uživatele je povinné' }
                } as ApiResponse);
                return;
            }

            const story = await storyEngine.generateStory(prompt, {
                userId,
                characterId,
                length: length || 'medium',
                genre
            });

            const response: ApiResponse<Story> = {
                success: true,
                data: story
            };

            logInfo('Story generated', { storyId: story.id, userId });
            res.status(201).json(response);
        } catch (error)
        {
            logError('Error generating story', error as Error);
            next(error);
        }
    }

    /**
     * Get a story by ID
     */
    public async getStory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { storyId } = req.params;

            const story = await storyEngine.getStory(storyId);

            if (!story)
            {
                res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Příběh nenalezen' }
                } as ApiResponse);
                return;
            }

            const response: ApiResponse<Story> = {
                success: true,
                data: story
            };

            res.json(response);
        } catch (error)
        {
            logError('Error getting story', error as Error);
            next(error);
        }
    }

    /**
     * Get all stories for a user
     */
    public async getUserStories (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { userId } = req.params;

            const stories = await storyEngine.getUserStories(userId);

            const response: ApiResponse<{ stories: Story[]; count: number }> = {
                success: true,
                data: {
                    stories,
                    count: stories.length
                }
            };

            res.json(response);
        } catch (error)
        {
            logError('Error getting user stories', error as Error);
            next(error);
        }
    }

    /**
     * Generate story continuation
     */
    public async generateContinuation (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { storyId } = req.params;
            const { prompt } = req.body;

            if (!prompt || prompt.trim() === '')
            {
                res.status(400).json({
                    success: false,
                    error: { code: 'EMPTY_PROMPT', message: 'Zadání pokračování je povinné' }
                } as ApiResponse);
                return;
            }

            const chapter = await storyEngine.generateContinuation(storyId, prompt);

            const response: ApiResponse<StoryChapter> = {
                success: true,
                data: chapter
            };

            logInfo('Story continuation generated', { storyId, chapterId: chapter.id });
            res.status(201).json(response);
        } catch (error)
        {
            logError('Error generating continuation', error as Error);
            next(error);
        }
    }

    /**
     * Add feedback to a story
     */
    public async addFeedback (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { storyId } = req.params;
            const { userId, rating, comment } = req.body;

            if (!userId || !rating)
            {
                res.status(400).json({
                    success: false,
                    error: { code: 'MISSING_FIELDS', message: 'ID uživatele a hodnocení jsou povinné' }
                } as ApiResponse);
                return;
            }

            const feedback = await storyEngine.addFeedback(storyId, userId, rating, comment);

            const response: ApiResponse<StoryFeedback> = {
                success: true,
                data: feedback
            };

            res.json(response);
        } catch (error)
        {
            logError('Error adding feedback', error as Error);
            next(error);
        }
    }

    /**
     * Get public stories
     */
    public async getPublicStories (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { limit, offset, genre, sortBy, sortOrder } = req.query;

            const stories = await storyEngine.getPublicStories({
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
                genre: genre as string,
                sortBy: sortBy as 'updated_at' | 'created_at' | 'title',
                sortOrder: sortOrder as 'ASC' | 'DESC'
            });

            const response: ApiResponse<{ stories: Story[]; count: number }> = {
                success: true,
                data: {
                    stories,
                    count: stories.length
                }
            };

            res.json(response);
        } catch (error)
        {
            logError('Error getting public stories', error as Error);
            next(error);
        }
    }

    /**
     * Set story visibility
     */
    public async setVisibility (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { storyId } = req.params;
            const { isPublic } = req.body;

            const success = await storyEngine.setStoryVisibility(storyId, isPublic);

            if (!success)
            {
                res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Příběh nenalezen' }
                } as ApiResponse);
                return;
            }

            const response: ApiResponse<{ updated: boolean }> = {
                success: true,
                data: { updated: true }
            };

            logInfo('Story visibility updated', { storyId, isPublic });
            res.json(response);
        } catch (error)
        {
            logError('Error setting visibility', error as Error);
            next(error);
        }
    }
}

export const storyController = new StoryController();
export default storyController;
