/**
 * Model Service - AI Response Generation
 * Handles communication with various AI providers (OpenAI, Claude, Ollama)
 * @module services/model-service
 */

import axios, { AxiosError } from 'axios';
import logger, { logInfo, logError, logDebug, logWarn } from '../utils/logger';
import {
    Character,
    Memory,
    ModelOptions,
    GenerationResult,
    AIProvider,
    ChatMessage
} from '../types';

interface ProviderConfig {
    openai: string;
    claude: string;
    ollama: string;
}

interface CacheEntry {
    response: string;
    timestamp: Date;
    prompt: string;
}

/**
 * Service for generating AI responses with multiple provider support
 */
export class ModelService {
    private readonly apiEndpoints: ProviderConfig = {
        openai: 'https://api.openai.com/v1/chat/completions',
        claude: 'https://api.anthropic.com/v1/messages',
        ollama: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    };

    private readonly providerPriority: AIProvider[] = ['local', 'openai', 'claude'];
    private responseCache: Map<string, CacheEntry> = new Map();
    private readonly cacheMaxSize: number = 100;
    private readonly cacheMaxAge: number = 60 * 60 * 1000; // 1 hour

    constructor() {
        logInfo('ModelService initialized');
        this._cleanupCache();
    }

    /**
     * Periodically cleans up expired cache entries
     */
    private _cleanupCache (): void {
        setInterval(() => {
            const now = new Date();
            for (const [key, entry] of this.responseCache)
            {
                if (now.getTime() - entry.timestamp.getTime() > this.cacheMaxAge)
                {
                    this.responseCache.delete(key);
                }
            }
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    /**
     * Generates a response from AI model with automatic fallback
     */
    public async generateResponse (prompt: string, options: ModelOptions = {}): Promise<GenerationResult> {
        const startTime = Date.now();

        // Check cache first
        const cacheKey = this._getCacheKey(prompt, options);
        const cached = this.responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp.getTime() < this.cacheMaxAge)
        {
            logDebug('Returning cached response');
            return {
                success: true,
                response: cached.response,
                timestamp: new Date(),
                provider: 'local'
            };
        }

        // Build context with character and memories
        const context = this.buildContext(prompt, options.character, options.memories || []);

        // Try providers in order
        const providersToTry = options.provider
            ? [options.provider]
            : this.providerPriority;

        for (const provider of providersToTry)
        {
            try
            {
                const response = await this.tryProvider(provider, context, options);
                if (response)
                {
                    const duration = Date.now() - startTime;
                    logInfo(`Generated response via ${provider}`, { duration: `${duration}ms` });

                    // Cache successful response
                    this.responseCache.set(cacheKey, {
                        response,
                        timestamp: new Date(),
                        prompt
                    });

                    // Trim cache if too large
                    if (this.responseCache.size > this.cacheMaxSize)
                    {
                        const firstKey = this.responseCache.keys().next().value;
                        if (firstKey) this.responseCache.delete(firstKey);
                    }

                    return {
                        success: true,
                        response,
                        timestamp: new Date(),
                        provider
                    };
                }
            } catch (error)
            {
                logWarn(`Provider ${provider} failed`, { error: (error as Error).message });
                continue;
            }
        }

        // All providers failed - use fallback
        logWarn('All providers failed, using fallback');
        const fallbackResponse = this.intelligentFallback(prompt, options.character);

        return {
            success: true,
            response: fallbackResponse,
            timestamp: new Date(),
            provider: 'local'
        };
    }

    /**
     * Tries a specific provider
     */
    private async tryProvider (
        provider: AIProvider,
        context: string,
        options: ModelOptions
    ): Promise<string | null> {
        switch (provider)
        {
            case 'openai':
                return this.generateOpenAIResponse(context, options);
            case 'claude':
                return this.generateClaudeResponse(context, options);
            case 'local':
            case 'ollama':
                return this.generateLocalResponse(context, options);
            default:
                return null;
        }
    }

    /**
     * Generates cache key for a request
     */
    private _getCacheKey (prompt: string, options: ModelOptions): string {
        const characterPart = options.character?.id || 'default';
        const promptHash = prompt.slice(0, 100).replace(/\s+/g, '_');
        return `${characterPart}_${promptHash}`;
    }

    /**
     * Builds context for AI model
     */
    public buildContext (prompt: string, character?: Character, memories: Memory[] = []): string {
        const parts: string[] = [];

        // Character personality
        if (character)
        {
            parts.push(`You are ${character.name}.`);
            parts.push(`Personality: ${character.personality}`);
            if (character.traits && character.traits.length > 0)
            {
                parts.push(`Traits: ${character.traits.join(', ')}`);
            }
            if (character.backstory)
            {
                parts.push(`Background: ${character.backstory}`);
            }
        }

        // Relevant memories
        if (memories.length > 0)
        {
            parts.push('\nRelevant memories:');
            for (const memory of memories.slice(0, 5))
            {
                parts.push(`- ${memory.content}`);
            }
        }

        // Current prompt
        parts.push(`\nUser message: ${prompt}`);
        parts.push('\nRespond in character:');

        return parts.join('\n');
    }

    /**
     * Generates response using OpenAI API
     */
    private async generateOpenAIResponse (context: string, options: ModelOptions): Promise<string | null> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey)
        {
            logDebug('OpenAI API key not configured');
            return null;
        }

        try
        {
            const response = await axios.post(
                this.apiEndpoints.openai,
                {
                    model: options.model || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a helpful AI character assistant.' },
                        { role: 'user', content: context }
                    ],
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.maxTokens ?? 1000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data.choices[0]?.message?.content || null;
        } catch (error)
        {
            const axiosError = error as AxiosError;
            logError('OpenAI API error', new Error(axiosError.message), {
                status: axiosError.response?.status
            });
            return null;
        }
    }

    /**
     * Generates response using Claude API
     */
    private async generateClaudeResponse (context: string, options: ModelOptions): Promise<string | null> {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey)
        {
            logDebug('Claude API key not configured');
            return null;
        }

        try
        {
            const response = await axios.post(
                this.apiEndpoints.claude,
                {
                    model: options.model || 'claude-3-sonnet-20240229',
                    max_tokens: options.maxTokens ?? 1000,
                    messages: [
                        { role: 'user', content: context }
                    ]
                },
                {
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data.content[0]?.text || null;
        } catch (error)
        {
            const axiosError = error as AxiosError;
            logError('Claude API error', new Error(axiosError.message), {
                status: axiosError.response?.status
            });
            return null;
        }
    }

    /**
     * Generates response using local Ollama
     */
    private async generateLocalResponse (context: string, options: ModelOptions): Promise<string | null> {
        const ollamaUrl = this.apiEndpoints.ollama;
        const model = options.model || process.env.OLLAMA_MODEL || 'dolphin-mistral';

        try
        {
            const response = await axios.post(
                `${ollamaUrl}/api/generate`,
                {
                    model,
                    prompt: context,
                    stream: false,
                    options: {
                        temperature: options.temperature ?? 0.8,
                        num_predict: options.maxTokens ?? 500
                    }
                },
                {
                    timeout: 60000 // Longer timeout for local models
                }
            );

            return response.data.response || null;
        } catch (error)
        {
            const axiosError = error as AxiosError;
            logError('Ollama API error', new Error(axiosError.message));
            return null;
        }
    }

    /**
     * Intelligent fallback when all providers fail
     */
    private intelligentFallback (prompt: string, character?: Character): string {
        const characterName = character?.name || 'AI';

        // Pattern matching for common queries
        const lowerPrompt = prompt.toLowerCase();

        if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('ahoj'))
        {
            return `Hello! I'm ${characterName}. How can I help you today?`;
        }

        if (lowerPrompt.includes('how are you') || lowerPrompt.includes('jak se máš'))
        {
            return `I'm doing well, thank you for asking! What would you like to talk about?`;
        }

        if (lowerPrompt.includes('who are you') || lowerPrompt.includes('kdo jsi'))
        {
            const traits = character?.traits?.join(', ') || 'helpful and friendly';
            return `I am ${characterName}. I'm ${traits}. How may I assist you?`;
        }

        if (lowerPrompt.includes('help') || lowerPrompt.includes('pomoc'))
        {
            return `I'd be happy to help! Please tell me more about what you need.`;
        }

        // Generic fallback
        return `*${characterName} considers your message thoughtfully* I understand you're asking about "${prompt.slice(0, 50)}...". Could you tell me more about what specifically interests you?`;
    }

    /**
     * Generates a conversation summary
     */
    public async generateConversationSummary (messages: ChatMessage[]): Promise<string> {
        if (messages.length === 0) return 'No conversation to summarize.';

        const conversationText = messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        const prompt = `Summarize this conversation in 2-3 sentences:\n\n${conversationText}`;

        const result = await this.generateResponse(prompt, { maxTokens: 150 });
        return result.response || 'Unable to generate summary.';
    }

    /**
     * Generates a title for a conversation
     */
    public async generateConversationTitle (messages: ChatMessage[]): Promise<string> {
        if (messages.length === 0) return 'New Conversation';

        const firstMessage = messages[0].content.slice(0, 100);
        const prompt = `Generate a short title (max 5 words) for a conversation starting with: "${firstMessage}"`;

        const result = await this.generateResponse(prompt, { maxTokens: 20 });
        return result.response?.replace(/['"]/g, '').slice(0, 50) || 'Conversation';
    }
}

// Export singleton instance
export const modelService = new ModelService();
export default modelService;
