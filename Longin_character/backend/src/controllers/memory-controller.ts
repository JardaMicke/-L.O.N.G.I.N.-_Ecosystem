/**
 * Memory Controller - Handles memory CRUD operations
 * @module controllers/memory-controller
 */

import { Request, Response, NextFunction } from 'express';
import { memoryService } from '../services/memory-service';
import { logInfo, logError } from '../utils/logger';
import { ApiResponse, Memory, MemoryCreateInput, MemoryFilter, MemoryStats } from '../types';

/**
 * Memory Controller class
 */
export class MemoryController {
    /**
     * Get all memories for a character
     */
    public async getMemories (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId } = req.params;
            const { type, limit, sortBy, sortOrder, minImportance } = req.query;

            const filter: MemoryFilter = {};
            if (type) filter.type = type as MemoryFilter['type'];
            if (limit) filter.limit = Number(limit);
            if (sortBy) filter.sortBy = sortBy as MemoryFilter['sortBy'];
            if (sortOrder) filter.sortOrder = sortOrder as MemoryFilter['sortOrder'];
            if (minImportance) filter.minImportance = Number(minImportance);

            const memories = memoryService.getMemories(characterId, filter);

            const response: ApiResponse<{ memories: Memory[]; count: number }> = {
                success: true,
                data: {
                    memories,
                    count: memories.length
                }
            };

            res.json(response);
        } catch (error)
        {
            logError('Error getting memories', error as Error);
            next(error);
        }
    }

    /**
     * Get a specific memory
     */
    public async getMemory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId, memoryId } = req.params;

            const memory = memoryService.getMemory(characterId, memoryId);

            if (!memory)
            {
                res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Vzpomínka nenalezena' }
                } as ApiResponse);
                return;
            }

            const response: ApiResponse<Memory> = {
                success: true,
                data: memory
            };

            res.json(response);
        } catch (error)
        {
            logError('Error getting memory', error as Error);
            next(error);
        }
    }

    /**
     * Create a new memory
     */
    public async createMemory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId } = req.params;
            const input: MemoryCreateInput = req.body;

            if (!input.content || input.content.trim() === '')
            {
                res.status(400).json({
                    success: false,
                    error: { code: 'EMPTY_CONTENT', message: 'Obsah vzpomínky je povinný' }
                } as ApiResponse);
                return;
            }

            const memory = memoryService.createMemory(characterId, input);

            const response: ApiResponse<Memory> = {
                success: true,
                data: memory
            };

            logInfo('Memory created', { characterId, memoryId: memory.id });
            res.status(201).json(response);
        } catch (error)
        {
            logError('Error creating memory', error as Error);
            next(error);
        }
    }

    /**
     * Update an existing memory
     */
    public async updateMemory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId, memoryId } = req.params;
            const updates: Partial<MemoryCreateInput> = req.body;

            const memory = memoryService.updateMemory(characterId, memoryId, updates);

            if (!memory)
            {
                res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Vzpomínka nenalezena' }
                } as ApiResponse);
                return;
            }

            const response: ApiResponse<Memory> = {
                success: true,
                data: memory
            };

            logInfo('Memory updated', { characterId, memoryId });
            res.json(response);
        } catch (error)
        {
            logError('Error updating memory', error as Error);
            next(error);
        }
    }

    /**
     * Delete a memory
     */
    public async deleteMemory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId, memoryId } = req.params;

            const deleted = memoryService.deleteMemory(characterId, memoryId);

            if (!deleted)
            {
                res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Vzpomínka nenalezena' }
                } as ApiResponse);
                return;
            }

            const response: ApiResponse<{ deleted: boolean }> = {
                success: true,
                data: { deleted: true }
            };

            logInfo('Memory deleted', { characterId, memoryId });
            res.json(response);
        } catch (error)
        {
            logError('Error deleting memory', error as Error);
            next(error);
        }
    }

    /**
     * Get memory statistics
     */
    public async getStats (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId } = req.params;

            const stats = memoryService.getMemoryStats(characterId);

            const response: ApiResponse<MemoryStats> = {
                success: true,
                data: stats
            };

            res.json(response);
        } catch (error)
        {
            logError('Error getting memory stats', error as Error);
            next(error);
        }
    }
}

export const memoryController = new MemoryController();
export default memoryController;
