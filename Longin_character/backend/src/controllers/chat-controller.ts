/**
 * Chat Controller - Handles AI chat interactions
 * @module controllers/chat-controller
 */

import { Request, Response, NextFunction } from 'express';
import { modelService } from '../services/model-service';
import { memoryService } from '../services/memory-service';
import { logInfo, logError, logDebug } from '../utils/logger';
import { ApiResponse, Character, ChatMessage } from '../types';

interface ChatRequest {
    message: string;
    characterId?: string;
    conversationId?: string;
}

interface ChatResponse {
    response: string;
    characterId?: string;
    conversationId: string;
    timestamp: Date;
}

/**
 * Chat Controller class for handling chat operations
 */
export class ChatController {
    /**
     * Send a message to AI character
     */
    public async sendMessage (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { message, characterId, conversationId } = req.body as ChatRequest;

            if (!message || message.trim() === '')
            {
                res.status(400).json({
                    success: false,
                    error: { code: 'EMPTY_MESSAGE', message: 'Zpráva nemůže být prázdná' }
                } as ApiResponse);
                return;
            }

            // Get character context if provided
            let character: Character | undefined;
            if (characterId)
            {
                // In production, this would come from database
                character = {
                    id: characterId,
                    name: 'AI Assistant',
                    personality: 'Helpful and friendly',
                    traits: ['intelligent', 'curious'],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }

            // Get relevant memories for context
            const memories = characterId
                ? memoryService.getRelevantMemories(characterId, message, 5)
                : [];

            // Generate response
            const result = await modelService.generateResponse(message, {
                character,
                memories,
                temperature: 0.8
            });

            if (!result.success)
            {
                throw new Error(result.error || 'Chyba při generování odpovědi');
            }

            // Save conversation to memory
            if (characterId && result.response)
            {
                memoryService.createConversationMemory(
                    characterId,
                    message,
                    result.response
                );
            }

            const newConversationId = conversationId || `conv_${Date.now()}`;

            const response: ApiResponse<ChatResponse> = {
                success: true,
                data: {
                    response: result.response || '',
                    characterId,
                    conversationId: newConversationId,
                    timestamp: new Date()
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    version: '2.0.0'
                }
            };

            logInfo('Chat message processed', { characterId, conversationId: newConversationId });
            res.json(response);
        } catch (error)
        {
            logError('Error in chat', error as Error);
            next(error);
        }
    }

    /**
     * Get chat history for a conversation
     */
    public async getHistory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId } = req.params;
            const { limit = 20 } = req.query;

            const memories = memoryService.getMemories(characterId, {
                type: 'conversation',
                limit: Number(limit),
                sortBy: 'timestamp',
                sortOrder: 'desc'
            });

            const response: ApiResponse<{ messages: ChatMessage[] }> = {
                success: true,
                data: {
                    messages: memories.map(m => ({
                        role: 'assistant' as const,
                        content: m.content,
                        timestamp: m.timestamp
                    }))
                }
            };

            res.json(response);
        } catch (error)
        {
            logError('Error getting chat history', error as Error);
            next(error);
        }
    }

    /**
     * Clear chat history for a character
     */
    public async clearHistory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { characterId } = req.params;

            // Get and delete all conversation memories
            const memories = memoryService.getMemories(characterId, { type: 'conversation' });
            let deleted = 0;

            for (const memory of memories)
            {
                if (memoryService.deleteMemory(characterId, memory.id))
                {
                    deleted++;
                }
            }

            const response: ApiResponse<{ deleted: number }> = {
                success: true,
                data: { deleted }
            };

            logInfo('Chat history cleared', { characterId, deleted });
            res.json(response);
        } catch (error)
        {
            logError('Error clearing chat history', error as Error);
            next(error);
        }
    }
}

export const chatController = new ChatController();
export default chatController;
