/**
 * Story Engine - Interactive Story Generation
 * Generates and manages interactive stories using AI models
 * @module services/story-engine
 */

import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import logger, { logInfo, logError, logDebug, logWarn } from '../utils/logger';
import { modelService } from './model-service';
import { memoryService } from './memory-service';
import {
    Story,
    StoryChapter,
    StoryFeedback,
    Character,
    GenerationResult
} from '../types';

// SQLite verbose mode for debugging
const sqlite3Verbose = sqlite3.verbose();

type StoryLength = 'short' | 'medium' | 'long';

interface StoryGenerateOptions {
    userId: string;
    characterId?: string;
    length?: StoryLength;
    genre?: string;
}

interface PublicStoriesOptions {
    limit?: number;
    offset?: number;
    genre?: string;
    sortBy?: 'updated_at' | 'created_at' | 'title';
    sortOrder?: 'ASC' | 'DESC';
}

interface StoryRow {
    id: string;
    user_id: string;
    character_id: string | null;
    title: string;
    prompt: string;
    content: string;
    created_at: number;
    updated_at: number;
    length: string;
    genre: string | null;
    is_public: number;
}

interface ChapterRow {
    id: string;
    story_id: string;
    title: string;
    content: string;
    chapter_number: number;
    created_at: number;
}

interface CharacterRow {
    id: string;
    user_id: string;
    name: string;
    personality: string;
    appearance: string | null;
    voice_id: string | null;
}

interface FeedbackRow {
    id: string;
    story_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: number;
}

/**
 * Engine for generating interactive stories using AI
 */
export class StoryEngine {
    private db: sqlite3.Database;

    private readonly lengthGuide: Record<StoryLength, string> = {
        short: 'Vygeneruj krátký příběh o délce přibližně 300-500 slov.',
        medium: 'Vygeneruj středně dlouhý příběh o délce přibližně 800-1200 slov.',
        long: 'Vygeneruj delší příběh o délce přibližně 2000-3000 slov.'
    };

    private readonly maxTokensByLength: Record<StoryLength, number> = {
        short: 1000,
        medium: 2000,
        long: 3000
    };

    /**
     * Creates a new StoryEngine instance
     * @param dbPath - Path to SQLite database file
     */
    constructor(dbPath: string) {
        this.db = new sqlite3Verbose.Database(dbPath);
        this.initDatabase();
        logInfo('StoryEngine initialized', { dbPath });
    }

    /**
     * Initializes database tables for stories
     */
    private initDatabase (): void {
        this.db.serialize(() => {
            // Stories table
            this.db.run(`CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        length TEXT NOT NULL,
        genre TEXT,
        is_public BOOLEAN DEFAULT 0
      )`);

            // Story chapters table
            this.db.run(`CREATE TABLE IF NOT EXISTS story_chapters (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (story_id) REFERENCES stories(id)
      )`);

            // Story feedback table
            this.db.run(`CREATE TABLE IF NOT EXISTS story_feedback (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (story_id) REFERENCES stories(id)
      )`);

            // Indexes
            this.db.run('CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id)');
            this.db.run('CREATE INDEX IF NOT EXISTS idx_stories_character ON stories(character_id)');
            this.db.run('CREATE INDEX IF NOT EXISTS idx_story_chapters_story ON story_chapters(story_id)');

            logDebug('Database tables initialized');
        });
    }

    /**
     * Generates a new story based on prompt
     */
    public async generateStory (prompt: string, options: StoryGenerateOptions): Promise<Story> {
        const { userId, characterId, length = 'medium', genre } = options;

        try
        {
            let storyContext = this.lengthGuide[length] + ' ';

            if (genre)
            {
                storyContext += `Příběh by měl být v žánru ${genre}. `;
            }

            storyContext += `Vytvoř poutavý příběh na základě následujícího zadání. Příběh by měl mít jasný začátek, střed a konec. Používej bohatý popis prostředí, postav a děje.\n\n`;

            // Add character context if available
            if (characterId)
            {
                const character = await this.getCharacter(characterId);
                if (character)
                {
                    storyContext += `Hlavní postavou příběhu je ${character.name}. `;
                    storyContext += `Charakter této postavy je: ${character.personality}. `;

                    // Get relevant memories
                    const memories = memoryService.getRelevantMemories(characterId, prompt, 3);
                    if (memories.length > 0)
                    {
                        storyContext += `\nKontext z předchozích interakcí:\n`;
                        memories.forEach(memory => {
                            storyContext += `- ${memory.content.slice(0, 200)}\n`;
                        });
                    }
                }
            }

            storyContext += `\nZadání příběhu: ${prompt}\n\nZačni psát příběh:`;

            // Generate story content
            const storyResult = await modelService.generateResponse(storyContext, {
                maxTokens: this.maxTokensByLength[length],
                temperature: 0.8
            });

            if (!storyResult.success || !storyResult.response)
            {
                throw new Error('Nepodařilo se vygenerovat obsah příběhu');
            }

            const storyContent = storyResult.response;

            // Generate title
            const titlePrompt = `Na základě následujícího příběhu vytvoř krátký poutavý název (max 7 slov):\n\n${storyContent.substring(0, 500)}\n\nNázev:`;
            const titleResult = await modelService.generateResponse(titlePrompt, {
                maxTokens: 30,
                temperature: 0.7
            });

            const title = titleResult.response?.trim().replace(/^["']|["']$/g, '') || 'Nový příběh';

            // Save to database
            const storyId = uuidv4();
            const now = Date.now();

            await this.dbRun(
                `INSERT INTO stories (id, user_id, character_id, title, prompt, content, created_at, updated_at, length, genre, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [storyId, userId, characterId || null, title, prompt, storyContent, now, now, length, genre || null, 0]
            );

            logInfo('Story generated', { storyId, userId, length });

            return {
                id: storyId,
                title,
                content: storyContent,
                characterId: characterId || undefined,
                userId,
                chapters: [],
                isPublic: false,
                createdAt: new Date(now),
                updatedAt: new Date(now)
            };
        } catch (error)
        {
            logError('Error generating story', error as Error, { userId, characterId });
            throw new Error('Nepodařilo se vygenerovat příběh');
        }
    }

    /**
     * Gets a story by ID with chapters
     */
    public async getStory (storyId: string): Promise<Story | null> {
        try
        {
            const story = await this.dbGet<StoryRow>(
                'SELECT * FROM stories WHERE id = ?',
                [storyId]
            );

            if (!story) return null;

            const chapters = await this.dbAll<ChapterRow>(
                'SELECT * FROM story_chapters WHERE story_id = ? ORDER BY chapter_number ASC',
                [storyId]
            );

            return {
                id: story.id,
                title: story.title,
                content: story.content,
                summary: this.generateSummary(story.content),
                characterId: story.character_id || undefined,
                userId: story.user_id,
                chapters: chapters.map(ch => ({
                    id: ch.id,
                    storyId: ch.story_id,
                    title: ch.title,
                    content: ch.content,
                    orderIndex: ch.chapter_number,
                    createdAt: new Date(ch.created_at)
                })),
                isPublic: story.is_public === 1,
                createdAt: new Date(story.created_at),
                updatedAt: new Date(story.updated_at)
            };
        } catch (error)
        {
            logError('Error getting story', error as Error, { storyId });
            throw error;
        }
    }

    /**
     * Gets all stories for a user
     */
    public async getUserStories (userId: string): Promise<Story[]> {
        try
        {
            const stories = await this.dbAll<StoryRow>(
                'SELECT * FROM stories WHERE user_id = ? ORDER BY updated_at DESC',
                [userId]
            );

            return stories.map(story => ({
                id: story.id,
                title: story.title,
                content: story.content,
                summary: this.generateSummary(story.content),
                characterId: story.character_id || undefined,
                userId: story.user_id,
                chapters: [],
                isPublic: story.is_public === 1,
                createdAt: new Date(story.created_at),
                updatedAt: new Date(story.updated_at)
            }));
        } catch (error)
        {
            logError('Error getting user stories', error as Error, { userId });
            throw error;
        }
    }

    /**
     * Generates a continuation (new chapter) for a story
     */
    public async generateContinuation (storyId: string, prompt: string): Promise<StoryChapter> {
        try
        {
            const story = await this.getStory(storyId);
            if (!story)
            {
                throw new Error('Příběh nebyl nalezen');
            }

            // Get last content
            const lastContent = story.chapters.length > 0
                ? story.chapters[story.chapters.length - 1].content
                : story.content;

            const continuationContext = `Následující text je část existujícího příběhu. Napiš pokračování tohoto příběhu.

Název příběhu: ${story.title}

Poslední část příběhu:
${lastContent.slice(-1000)}

Nové zadání pro pokračování: ${prompt}

Pokračování příběhu:`;

            const result = await modelService.generateResponse(continuationContext, {
                maxTokens: 2000,
                temperature: 0.8
            });

            if (!result.success || !result.response)
            {
                throw new Error('Nepodařilo se vygenerovat pokračování');
            }

            // Generate chapter title
            const titleResult = await modelService.generateResponse(
                `Vytvoř krátký název kapitoly (max 5 slov) pro tento text:\n${result.response.slice(0, 300)}`,
                { maxTokens: 20 }
            );

            const chapterId = uuidv4();
            const now = Date.now();
            const chapterNumber = story.chapters.length + 1;
            const chapterTitle = titleResult.response?.trim() || `Kapitola ${chapterNumber}`;

            await this.dbRun(
                `INSERT INTO story_chapters (id, story_id, title, content, chapter_number, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [chapterId, storyId, chapterTitle, result.response, chapterNumber, now]
            );

            // Update story timestamp
            await this.dbRun('UPDATE stories SET updated_at = ? WHERE id = ?', [now, storyId]);

            logInfo('Story continuation generated', { storyId, chapterId, chapterNumber });

            return {
                id: chapterId,
                storyId,
                title: chapterTitle,
                content: result.response,
                orderIndex: chapterNumber,
                createdAt: new Date(now)
            };
        } catch (error)
        {
            logError('Error generating continuation', error as Error, { storyId });
            throw error;
        }
    }

    /**
     * Adds feedback to a story
     */
    public async addFeedback (
        storyId: string,
        userId: string,
        rating: number,
        comment?: string
    ): Promise<StoryFeedback> {
        if (rating < 1 || rating > 5)
        {
            throw new Error('Hodnocení musí být v rozmezí 1-5');
        }

        try
        {
            const existing = await this.dbGet<FeedbackRow>(
                'SELECT * FROM story_feedback WHERE story_id = ? AND user_id = ?',
                [storyId, userId]
            );

            const feedbackId = existing?.id || uuidv4();
            const now = Date.now();

            if (existing)
            {
                await this.dbRun(
                    'UPDATE story_feedback SET rating = ?, comment = ?, created_at = ? WHERE id = ?',
                    [rating, comment || null, now, feedbackId]
                );
            } else
            {
                await this.dbRun(
                    `INSERT INTO story_feedback (id, story_id, user_id, rating, comment, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [feedbackId, storyId, userId, rating, comment || null, now]
                );
            }

            logDebug('Feedback added', { storyId, userId, rating });

            return {
                id: feedbackId,
                storyId,
                userId,
                rating,
                comment,
                createdAt: new Date(now)
            };
        } catch (error)
        {
            logError('Error adding feedback', error as Error, { storyId, userId });
            throw error;
        }
    }

    /**
     * Gets character information from database
     */
    private async getCharacter (characterId: string): Promise<Character | null> {
        try
        {
            const character = await this.dbGet<CharacterRow>(
                'SELECT * FROM characters WHERE id = ?',
                [characterId]
            );

            if (!character) return null;

            return {
                id: character.id,
                name: character.name,
                personality: character.personality,
                traits: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
        } catch (error)
        {
            logWarn('Could not get character', { characterId });
            return null;
        }
    }

    /**
     * Generates a short summary of content
     */
    public generateSummary (content: string): string {
        if (!content) return '';
        const summary = content.substring(0, 200).trim();
        return content.length > 200 ? summary + '...' : summary;
    }

    /**
     * Sets story visibility (public/private)
     */
    public async setStoryVisibility (storyId: string, isPublic: boolean): Promise<boolean> {
        try
        {
            const result = await this.dbRun(
                'UPDATE stories SET is_public = ? WHERE id = ?',
                [isPublic ? 1 : 0, storyId]
            );
            return result.changes > 0;
        } catch (error)
        {
            logError('Error setting visibility', error as Error, { storyId });
            return false;
        }
    }

    /**
     * Gets public stories with pagination
     */
    public async getPublicStories (options: PublicStoriesOptions = {}): Promise<Story[]> {
        const {
            limit = 10,
            offset = 0,
            genre,
            sortBy = 'updated_at',
            sortOrder = 'DESC'
        } = options;

        try
        {
            let query = 'SELECT * FROM stories WHERE is_public = 1';
            const params: (string | number)[] = [];

            if (genre)
            {
                query += ' AND genre = ?';
                params.push(genre);
            }

            // Validate sortBy to prevent SQL injection
            const allowedSortBy = ['updated_at', 'created_at', 'title'];
            const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'updated_at';
            const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

            query += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const stories = await this.dbAll<StoryRow>(query, params);

            return stories.map(story => ({
                id: story.id,
                title: story.title,
                content: story.content,
                summary: this.generateSummary(story.content),
                characterId: story.character_id || undefined,
                userId: story.user_id,
                chapters: [],
                isPublic: true,
                createdAt: new Date(story.created_at),
                updatedAt: new Date(story.updated_at)
            }));
        } catch (error)
        {
            logError('Error getting public stories', error as Error);
            throw error;
        }
    }

    /**
     * Closes database connection
     */
    public close (): void {
        this.db.close();
        logInfo('StoryEngine database connection closed');
    }

    // ============================================================
    // Database Helper Methods
    // ============================================================

    private dbRun (sql: string, params: (string | number | null)[] = []): Promise<{ changes: number }> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    private dbGet<T> (sql: string, params: (string | number)[] = []): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row as T | undefined);
            });
        });
    }

    private dbAll<T> (sql: string, params: (string | number)[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve((rows || []) as T[]);
            });
        });
    }
}

export default StoryEngine;
