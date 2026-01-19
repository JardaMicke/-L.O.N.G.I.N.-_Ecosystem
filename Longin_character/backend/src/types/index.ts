/**
 * Longin Character Backend - Core Type Definitions
 * @module types
 */

// ============================================================
// Character Types
// ============================================================

export interface Character {
    id: string;
    name: string;
    personality: string;
    traits: string[];
    backstory?: string;
    avatarUrl?: string;
    voiceSettings?: VoiceSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface VoiceSettings {
    provider: 'local' | 'cloud';
    voice: string;
    pitch?: number;
    speed?: number;
}

// ============================================================
// Memory Types
// ============================================================

export type MemoryType = 'conversation' | 'event' | 'narrative' | 'system';

export interface Memory {
    id: string;
    characterId: string;
    type: MemoryType;
    content: string;
    importance: number;
    timestamp: Date;
    keywords: string[];
    metadata?: Record<string, unknown>;
}

export interface MemoryCreateInput {
    type: MemoryType;
    content: string;
    importance?: number;
    keywords?: string[];
    metadata?: Record<string, unknown>;
}

export interface MemoryFilter {
    type?: MemoryType;
    minImportance?: number;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    sortBy?: 'timestamp' | 'importance';
    sortOrder?: 'asc' | 'desc';
}

// ============================================================
// Model/AI Types
// ============================================================

export type AIProvider = 'openai' | 'claude' | 'local' | 'ollama';

export interface ModelOptions {
    character?: Character;
    memories?: Memory[];
    temperature?: number;
    maxTokens?: number;
    provider?: AIProvider;
    model?: string;
}

export interface GenerationResult {
    success: boolean;
    response?: string;
    error?: string;
    timestamp: Date;
    provider?: AIProvider;
    tokensUsed?: number;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

// ============================================================
// Story Types
// ============================================================

export interface Story {
    id: string;
    title: string;
    content: string;
    summary?: string;
    characterId?: string;
    userId?: string;
    chapters: StoryChapter[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface StoryChapter {
    id: string;
    storyId: string;
    title?: string;
    content: string;
    orderIndex: number;
    createdAt: Date;
}

export interface StoryFeedback {
    id: string;
    storyId: string;
    userId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
}

// ============================================================
// API Types
// ============================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ApiMeta {
    timestamp: string;
    version: string;
    traceId?: string;
}

// ============================================================
// Service Types
// ============================================================

export interface MemoryStats {
    totalMemories: number;
    memoriesByType: Record<MemoryType, number>;
    averageImportance: number;
    oldestMemory?: Date;
    newestMemory?: Date;
}

export interface ModelStats {
    activeModels: string[];
    memoryUsage: number;
    lastGeneration?: Date;
    totalGenerations: number;
    averageResponseTime: number;
}

// ============================================================
// Configuration Types
// ============================================================

export interface AppConfig {
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    coreApiUrl?: string;
    redisUrl?: string;
    ollamaBaseUrl: string;
    openaiApiKey?: string;
    claudeApiKey?: string;
}

// ============================================================
// Generation Types
// ============================================================

export type GenerationType = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video' | 'video-to-video';

export interface Generation {
    id: string;
    success: boolean;
    promptType: GenerationType;
    prompt?: string;
    instructions?: string;
    originalImage?: string;
    originalVideo?: string;
    image?: string;
    video?: string;
    duration?: number;
    timestamp: Date;
    userId: string;
}

// ============================================================
// Express Request Extensions
// ============================================================

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    characterId?: string;
}
