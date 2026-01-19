/**
 * Memory Service - AI Memory Management
 * Handles storage, retrieval, and optimization of AI character memories
 * @module services/memory-service
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger, { logInfo, logError, logDebug } from '../utils/logger';
import {
    Memory,
    MemoryCreateInput,
    MemoryFilter,
    MemoryStats,
    MemoryType
} from '../types';

interface ActiveModel {
    modelId: string;
    loadedAt: Date;
    lastUsed: Date;
    memoryUsage: number;
}

/**
 * Service for managing AI character memories with optimization
 */
export class MemoryService {
    private memories: Map<string, Memory[]> = new Map();
    private memoryIndex: Map<string, Map<string, string[]>> = new Map();
    private activeModels: Map<string, ActiveModel> = new Map();

    private readonly maxMemoriesPerCharacter: number = 1000;
    private readonly memoryPruneInterval: number = 5 * 60 * 1000; // 5 minutes
    private readonly modelUnloadTimeout: number = 30 * 60 * 1000; // 30 minutes
    private readonly dataDir: string;

    constructor() {
        this.dataDir = path.join(__dirname, '../../data/memories');
        this._ensureDirectoryExists();
        this._setupMemoryPruning();
        this._setupModelMemoryManagement();
        logInfo('MemoryService initialized');
    }

    /**
     * Ensures the data directory exists
     */
    private _ensureDirectoryExists (): void {
        if (!fs.existsSync(this.dataDir))
        {
            fs.mkdirSync(this.dataDir, { recursive: true });
            logInfo(`Created memory data directory: ${this.dataDir}`);
        }
    }

    /**
     * Sets up automatic memory pruning
     */
    private _setupMemoryPruning (): void {
        setInterval(() => {
            this._pruneMemories();
            this._consolidateMemories();
        }, this.memoryPruneInterval);
    }

    /**
     * Sets up automatic model memory management
     */
    private _setupModelMemoryManagement (): void {
        setInterval(() => {
            const now = new Date();
            for (const [modelId, model] of this.activeModels)
            {
                const timeSinceLastUse = now.getTime() - model.lastUsed.getTime();
                if (timeSinceLastUse > this.modelUnloadTimeout)
                {
                    this._unloadModel(modelId);
                }
            }
        }, 60 * 1000); // Check every minute
    }

    /**
     * Prunes old memories when limit exceeded
     */
    private _pruneMemories (): void {
        for (const [characterId, characterMemories] of this.memories)
        {
            if (characterMemories.length > this.maxMemoriesPerCharacter)
            {
                // Sort by importance and age
                characterMemories.sort((a, b) => {
                    const importanceDiff = b.importance - a.importance;
                    if (importanceDiff !== 0) return importanceDiff;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

                // Keep only top memories
                const prunedMemories = characterMemories.slice(0, this.maxMemoriesPerCharacter);
                this.memories.set(characterId, prunedMemories);

                const removedCount = characterMemories.length - prunedMemories.length;
                logInfo(`Pruned ${removedCount} memories for character ${characterId}`);

                // Rebuild index
                this._rebuildMemoryIndex(characterId);

                // Persist changes
                this._persistMemories(characterId);
            }
        }
    }

    /**
     * Consolidates similar memories
     */
    private _consolidateMemories (): void {
        for (const [characterId, characterMemories] of this.memories)
        {
            const consolidationCandidates: Map<string, Memory[]> = new Map();

            // Group memories by similar content using keywords
            for (const memory of characterMemories)
            {
                const keywordHash = memory.keywords.sort().join('|');
                if (!consolidationCandidates.has(keywordHash))
                {
                    consolidationCandidates.set(keywordHash, []);
                }
                consolidationCandidates.get(keywordHash)!.push(memory);
            }

            // Consolidate groups with multiple similar memories
            let consolidated = 0;
            for (const [, group] of consolidationCandidates)
            {
                if (group.length > 3)
                {
                    // Keep the most important, merge others
                    group.sort((a, b) => b.importance - a.importance);
                    const primary = group[0];

                    // Merge content from secondary memories
                    const mergedContent = group.slice(1).map(m => m.content).join(' ');
                    primary.content += `\n[Consolidated from ${group.length - 1} memories]: ${mergedContent.slice(0, 500)}`;
                    primary.importance = Math.min(10, primary.importance + 1);

                    // Remove secondary memories
                    group.slice(1).forEach(m => {
                        const index = characterMemories.findIndex(cm => cm.id === m.id);
                        if (index > -1) characterMemories.splice(index, 1);
                    });

                    consolidated += group.length - 1;
                }
            }

            if (consolidated > 0)
            {
                logInfo(`Consolidated ${consolidated} memories for character ${characterId}`);
                this._persistMemories(characterId);
            }
        }
    }

    /**
     * Rebuilds memory index for a character
     */
    private _rebuildMemoryIndex (characterId: string): void {
        const newIndex: Map<string, string[]> = new Map();
        const characterMemories = this.memories.get(characterId) || [];

        for (const memory of characterMemories)
        {
            for (const keyword of memory.keywords)
            {
                const normalizedKeyword = keyword.toLowerCase();
                if (!newIndex.has(normalizedKeyword))
                {
                    newIndex.set(normalizedKeyword, []);
                }
                newIndex.get(normalizedKeyword)!.push(memory.id);
            }
        }

        this.memoryIndex.set(characterId, newIndex);
    }

    /**
     * Extracts keywords from memory content
     */
    private _extractKeywords (content: string): string[] {
        // Simple keyword extraction - can be enhanced with NLP
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'just', 'don', 'now']);

        const words = content
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

        // Count word frequency
        const wordFreq: Map<string, number> = new Map();
        for (const word of words)
        {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }

        // Return top keywords
        return Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    /**
     * Creates a new memory for a character
     */
    public createMemory (characterId: string, input: MemoryCreateInput): Memory {
        if (!this.memories.has(characterId))
        {
            this.memories.set(characterId, []);
            this.loadMemories(characterId);
        }

        const memory: Memory = {
            id: uuidv4(),
            characterId,
            type: input.type,
            content: input.content,
            importance: input.importance ?? 5,
            timestamp: new Date(),
            keywords: input.keywords ?? this._extractKeywords(input.content),
            metadata: input.metadata
        };

        this.memories.get(characterId)!.push(memory);

        // Update index
        for (const keyword of memory.keywords)
        {
            const index = this.memoryIndex.get(characterId) || new Map();
            if (!index.has(keyword))
            {
                index.set(keyword, []);
            }
            index.get(keyword)!.push(memory.id);
            this.memoryIndex.set(characterId, index);
        }

        // Persist asynchronously
        this._persistMemories(characterId);

        logDebug(`Created memory for character ${characterId}`, { memoryId: memory.id });
        return memory;
    }

    /**
     * Gets memories for a character with optional filtering
     */
    public getMemories (characterId: string, filter?: MemoryFilter): Memory[] {
        if (!this.memories.has(characterId))
        {
            this.loadMemories(characterId);
        }

        let memories = this.memories.get(characterId) || [];

        // Apply filters
        if (filter)
        {
            if (filter.type)
            {
                memories = memories.filter(m => m.type === filter.type);
            }
            if (filter.minImportance !== undefined)
            {
                memories = memories.filter(m => m.importance >= filter.minImportance!);
            }
            if (filter.fromDate)
            {
                memories = memories.filter(m => new Date(m.timestamp) >= filter.fromDate!);
            }
            if (filter.toDate)
            {
                memories = memories.filter(m => new Date(m.timestamp) <= filter.toDate!);
            }

            // Sort
            const sortBy = filter.sortBy || 'timestamp';
            const sortOrder = filter.sortOrder || 'desc';
            memories.sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'timestamp')
                {
                    comparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                } else if (sortBy === 'importance')
                {
                    comparison = b.importance - a.importance;
                }
                return sortOrder === 'asc' ? -comparison : comparison;
            });

            // Limit
            if (filter.limit)
            {
                memories = memories.slice(0, filter.limit);
            }
        }

        return memories;
    }

    /**
     * Gets a specific memory by ID
     */
    public getMemory (characterId: string, memoryId: string): Memory | null {
        const memories = this.memories.get(characterId) || [];
        return memories.find(m => m.id === memoryId) || null;
    }

    /**
     * Updates an existing memory
     */
    public updateMemory (characterId: string, memoryId: string, updates: Partial<MemoryCreateInput>): Memory | null {
        const memory = this.getMemory(characterId, memoryId);
        if (!memory) return null;

        if (updates.content !== undefined)
        {
            memory.content = updates.content;
            memory.keywords = this._extractKeywords(updates.content);
            this._rebuildMemoryIndex(characterId);
        }
        if (updates.importance !== undefined)
        {
            memory.importance = updates.importance;
        }
        if (updates.type !== undefined)
        {
            memory.type = updates.type;
        }
        if (updates.metadata !== undefined)
        {
            memory.metadata = { ...memory.metadata, ...updates.metadata };
        }

        this._persistMemories(characterId);
        return memory;
    }

    /**
     * Deletes a memory
     */
    public deleteMemory (characterId: string, memoryId: string): boolean {
        const memories = this.memories.get(characterId);
        if (!memories) return false;

        const index = memories.findIndex(m => m.id === memoryId);
        if (index === -1) return false;

        memories.splice(index, 1);
        this._rebuildMemoryIndex(characterId);
        this._persistMemories(characterId);

        logDebug(`Deleted memory ${memoryId} for character ${characterId}`);
        return true;
    }

    /**
     * Creates a memory from conversation
     */
    public createConversationMemory (
        characterId: string,
        userMessage: string,
        characterResponse: string,
        options: { importance?: number } = {}
    ): Memory {
        const content = `User: ${userMessage}\nCharacter: ${characterResponse}`;
        return this.createMemory(characterId, {
            type: 'conversation',
            content,
            importance: options.importance ?? 5
        });
    }

    /**
     * Persists memories to disk
     */
    private _persistMemories (characterId: string): void {
        try
        {
            const memories = this.memories.get(characterId) || [];
            const filePath = path.join(this.dataDir, `${characterId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(memories, null, 2));
            logDebug(`Persisted ${memories.length} memories for character ${characterId}`);
        } catch (error)
        {
            logError(`Failed to persist memories for character ${characterId}`, error as Error);
        }
    }

    /**
     * Loads memories from disk
     */
    public loadMemories (characterId: string): Memory[] {
        try
        {
            const filePath = path.join(this.dataDir, `${characterId}.json`);
            if (fs.existsSync(filePath))
            {
                const data = fs.readFileSync(filePath, 'utf-8');
                const memories: Memory[] = JSON.parse(data);
                this.memories.set(characterId, memories);
                this._rebuildMemoryIndex(characterId);
                logDebug(`Loaded ${memories.length} memories for character ${characterId}`);
                return memories;
            }
        } catch (error)
        {
            logError(`Failed to load memories for character ${characterId}`, error as Error);
        }
        return [];
    }

    /**
     * Gets relevant memories for context
     */
    public getRelevantMemories (characterId: string, context: string, limit: number = 5): Memory[] {
        const keywords = this._extractKeywords(context);
        const index = this.memoryIndex.get(characterId) || new Map();
        const memoryScores: Map<string, number> = new Map();

        // Score memories by keyword matches
        for (const keyword of keywords)
        {
            const memoryIds = index.get(keyword) || [];
            for (const memoryId of memoryIds)
            {
                memoryScores.set(memoryId, (memoryScores.get(memoryId) || 0) + 1);
            }
        }

        // Get memories sorted by relevance
        const memories = this.memories.get(characterId) || [];
        const scoredMemories = memories
            .map(m => ({
                memory: m,
                score: (memoryScores.get(m.id) || 0) + (m.importance / 10)
            }))
            .filter(sm => sm.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(sm => sm.memory);

        return scoredMemories;
    }

    /**
     * Loads an AI model into memory tracking
     */
    public loadModel (modelId: string, memoryUsage: number = 0): ActiveModel {
        const model: ActiveModel = {
            modelId,
            loadedAt: new Date(),
            lastUsed: new Date(),
            memoryUsage
        };
        this.activeModels.set(modelId, model);
        logInfo(`Model ${modelId} loaded`, { memoryUsage });
        return model;
    }

    /**
     * Updates model last used time
     */
    public touchModel (modelId: string): void {
        const model = this.activeModels.get(modelId);
        if (model)
        {
            model.lastUsed = new Date();
        }
    }

    /**
     * Unloads a model from memory tracking
     */
    private _unloadModel (modelId: string): boolean {
        if (this.activeModels.has(modelId))
        {
            this.activeModels.delete(modelId);
            logInfo(`Model ${modelId} unloaded (timeout)`);
            return true;
        }
        return false;
    }

    /**
     * Gets memory statistics
     */
    public getMemoryStats (characterId?: string): MemoryStats {
        let allMemories: Memory[] = [];

        if (characterId)
        {
            allMemories = this.memories.get(characterId) || [];
        } else
        {
            for (const memories of this.memories.values())
            {
                allMemories.push(...memories);
            }
        }

        const byType: Record<MemoryType, number> = {
            conversation: 0,
            event: 0,
            narrative: 0,
            system: 0
        };

        let totalImportance = 0;
        let oldest: Date | undefined;
        let newest: Date | undefined;

        for (const memory of allMemories)
        {
            byType[memory.type]++;
            totalImportance += memory.importance;

            const ts = new Date(memory.timestamp);
            if (!oldest || ts < oldest) oldest = ts;
            if (!newest || ts > newest) newest = ts;
        }

        return {
            totalMemories: allMemories.length,
            memoriesByType: byType,
            averageImportance: allMemories.length > 0 ? totalImportance / allMemories.length : 0,
            oldestMemory: oldest,
            newestMemory: newest
        };
    }
}

// Export singleton instance
export const memoryService = new MemoryService();
export default memoryService;
