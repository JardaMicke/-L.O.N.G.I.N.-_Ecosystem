/**
 * Achievement Service - Gamification and user progression
 * Manages unlocking achievements and tracking user statistics
 * @module services/achievement-service
 */

import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import logger, { logInfo, logError, logDebug, logWarn } from '../utils/logger';

// Use verbose mode for better debugging
const sqlite3Verbose = sqlite3.verbose();

export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    condition?: (stats: UserStats) => boolean;
}

export interface UserStats {
    user_id: string;
    messages_sent: number;
    conversations_started: number;
    characters_created: number;
    days_active: number;
    last_active_date: string | null;
    stories_generated: number;
    images_uploaded: number;
}

export interface Achievement {
    id: string;
    userId: string;
    achievementId: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    unlockedAt: number;
}

interface AchievementRow {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: number;
}

interface UserStatsRow {
    user_id: string;
    messages_sent: number;
    conversations_started: number;
    characters_created: number;
    days_active: number;
    last_active_date: string;
    stories_generated: number;
    images_uploaded: number;
}

type StatsUpdate = Partial<Omit<UserStats, 'user_id' | 'days_active' | 'last_active_date'>>;

export class AchievementService {
    private db: sqlite3.Database;
    private achievementDefinitions: Record<string, AchievementDefinition>;

    /**
     * Creates a new AchievementService instance
     * @param dbPath - Path to SQLite database file
     */
    constructor(dbPath: string) {
        this.db = new sqlite3Verbose.Database(dbPath);
        this.initDatabase();
        this.achievementDefinitions = this.getAchievementDefinitions();
    }

    /**
     * Initializes database tables
     */
    private initDatabase (): void {
        this.db.serialize(() => {
            // Achievements table
            this.db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

            // User statistics table
            this.db.run(`CREATE TABLE IF NOT EXISTS user_stats (
        user_id TEXT PRIMARY KEY,
        messages_sent INTEGER DEFAULT 0,
        conversations_started INTEGER DEFAULT 0,
        characters_created INTEGER DEFAULT 0,
        days_active INTEGER DEFAULT 0,
        last_active_date TEXT,
        stories_generated INTEGER DEFAULT 0,
        images_uploaded INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

            // Indexes
            this.db.run('CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id)');
            this.db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_unique ON achievements(user_id, achievement_id)');
        });
    }

    /**
     * Defines all available achievements
     */
    private getAchievementDefinitions (): Record<string, AchievementDefinition> {
        return {
            // Achievements for conversations
            FIRST_CONVERSATION: {
                id: 'FIRST_CONVERSATION',
                name: 'První krok',
                description: 'Zahájili jste svou první konverzaci',
                icon: 'chat',
                points: 10
            },
            CONVERSATION_MASTER: {
                id: 'CONVERSATION_MASTER',
                name: 'Mistr konverzace',
                description: 'Odeslali jste 100 zpráv',
                icon: 'chat_bubble',
                points: 50,
                condition: (stats: UserStats) => stats.messages_sent >= 100
            },
            CONVERSATION_GRANDMASTER: {
                id: 'CONVERSATION_GRANDMASTER',
                name: 'Velmistr konverzace',
                description: 'Odeslali jste 1000 zpráv',
                icon: 'forum',
                points: 200,
                condition: (stats: UserStats) => stats.messages_sent >= 1000
            },

            // Achievements for characters
            FIRST_CHARACTER: {
                id: 'FIRST_CHARACTER',
                name: 'Tvůrce postav',
                description: 'Vytvořili jste svou první postavu',
                icon: 'person_add',
                points: 20
            },
            CHARACTER_COLLECTOR: {
                id: 'CHARACTER_COLLECTOR',
                name: 'Sběratel postav',
                description: 'Vytvořili jste 5 různých postav',
                icon: 'people',
                points: 50,
                condition: (stats: UserStats) => stats.characters_created >= 5
            },
            CHARACTER_MAESTRO: {
                id: 'CHARACTER_MAESTRO',
                name: 'Maestro postav',
                description: 'Vytvořili jste 10 různých postav',
                icon: 'diversity_3',
                points: 100,
                condition: (stats: UserStats) => stats.characters_created >= 10
            },

            // Achievements for activity
            WEEKLY_ACTIVE: {
                id: 'WEEKLY_ACTIVE',
                name: 'Týdenní návštěvník',
                description: 'Byli jste aktivní 7 dní',
                icon: 'calendar_month',
                points: 30,
                condition: (stats: UserStats) => stats.days_active >= 7
            },
            MONTHLY_ACTIVE: {
                id: 'MONTHLY_ACTIVE',
                name: 'Měsíční návštěvník',
                description: 'Byli jste aktivní 30 dní',
                icon: 'event_available',
                points: 100,
                condition: (stats: UserStats) => stats.days_active >= 30
            },

            // Achievements for stories
            STORYTELLER: {
                id: 'STORYTELLER',
                name: 'Vypravěč',
                description: 'Vygenerovali jste svůj první příběh',
                icon: 'auto_stories',
                points: 20
            },
            STORY_MASTER: {
                id: 'STORY_MASTER',
                name: 'Mistr příběhů',
                description: 'Vygenerovali jste 10 příběhů',
                icon: 'menu_book',
                points: 50,
                condition: (stats: UserStats) => stats.stories_generated >= 10
            },

            // Achievements for images
            FIRST_IMAGE: {
                id: 'FIRST_IMAGE',
                name: 'Fotograf',
                description: 'Nahráli jste svůj první obrázek',
                icon: 'add_photo_alternate',
                points: 10
            },
            IMAGE_COLLECTOR: {
                id: 'IMAGE_COLLECTOR',
                name: 'Sběratel obrázků',
                description: 'Nahráli jste 10 obrázků',
                icon: 'collections',
                points: 30,
                condition: (stats: UserStats) => stats.images_uploaded >= 10
            }
        };
    }

    /**
     * Unlocks an achievement for a user
     */
    public async unlockAchievement (userId: string, achievementId: string): Promise<Achievement | null> {
        const achievementDef = this.achievementDefinitions[achievementId];

        if (!achievementDef)
        {
            throw new Error(`Neplatné ID úspěchu: ${achievementId}`);
        }

        return new Promise((resolve, reject) => {
            // Check if already unlocked
            this.db.get<AchievementRow>(
                'SELECT * FROM achievements WHERE user_id = ? AND achievement_id = ?',
                [userId, achievementId],
                (err, row) => {
                    if (err)
                    {
                        logError('Error checking achievement', err);
                        reject(err);
                        return;
                    }

                    if (row)
                    {
                        // Already unlocked
                        resolve(null);
                        return;
                    }

                    const now = Date.now();
                    const id = uuidv4();

                    this.db.run(
                        'INSERT INTO achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)',
                        [id, userId, achievementId, now],
                        (err) => {
                            if (err)
                            {
                                logError('Error unlocking achievement', err);
                                reject(err);
                                return;
                            }

                            logInfo('Achievement unlocked', { userId, achievementId });

                            resolve({
                                id,
                                userId,
                                achievementId,
                                name: achievementDef.name,
                                description: achievementDef.description,
                                icon: achievementDef.icon,
                                points: achievementDef.points,
                                unlockedAt: now
                            });
                        }
                    );
                }
            );
        });
    }

    /**
     * Gets all user achievements
     */
    public async getUserAchievements (userId: string): Promise<Achievement[]> {
        return new Promise((resolve, reject) => {
            this.db.all<AchievementRow>(
                'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC',
                [userId],
                (err, rows) => {
                    if (err)
                    {
                        reject(err);
                        return;
                    }

                    const achievements = (rows || []).map(row => {
                        const achievementDef = this.achievementDefinitions[row.achievement_id] || {
                            id: row.achievement_id,
                            name: 'Neznámý úspěch',
                            description: 'Tento úspěch již není dostupný',
                            icon: 'help',
                            points: 0
                        };

                        return {
                            id: row.id,
                            userId: row.user_id,
                            achievementId: row.achievement_id,
                            name: achievementDef.name,
                            description: achievementDef.description,
                            icon: achievementDef.icon,
                            points: achievementDef.points,
                            unlockedAt: row.unlocked_at
                        };
                    });

                    resolve(achievements);
                }
            );
        });
    }

    /**
     * Updates user stats
     */
    public async updateUserStats (userId: string, statsUpdate: StatsUpdate): Promise<UserStats> {
        return new Promise((resolve, reject) => {
            // Check existing stats
            this.db.get<UserStatsRow>(
                'SELECT * FROM user_stats WHERE user_id = ?',
                [userId],
                (err, row) => {
                    if (err)
                    {
                        reject(err);
                        return;
                    }

                    const now = new Date().toISOString().split('T')[0];
                    const pendingUpdates: string[] = [];
                    const params: (string | number)[] = [];

                    // Create update statements
                    Object.entries(statsUpdate).forEach(([key, value]) => {
                        // Ensure key is valid using strict check or just cast as keyof UserStats
                        // For simplicity in SQL construction:
                        pendingUpdates.push(`${key} = ${key} + ?`);
                        params.push(value as number);
                    });

                    // Update last active date
                    pendingUpdates.push('last_active_date = ?');
                    params.push(now);

                    // Update days active
                    if (row && row.last_active_date !== now)
                    {
                        pendingUpdates.push('days_active = days_active + 1');
                    } else if (!row)
                    {
                        pendingUpdates.push('days_active = 1');
                    }

                    params.push(userId);

                    if (row)
                    {
                        // Update existing
                        this.db.run(
                            `UPDATE user_stats SET ${pendingUpdates.join(', ')} WHERE user_id = ?`,
                            params,
                            (err) => {
                                if (err)
                                {
                                    reject(err);
                                    return;
                                }

                                this.getUserStats(userId).then(resolve).catch(reject);
                            }
                        );
                    } else
                    {
                        // Create new
                        const initialStats: UserStats = {
                            user_id: userId,
                            messages_sent: 0,
                            conversations_started: 0,
                            characters_created: 0,
                            days_active: 1,
                            last_active_date: now,
                            stories_generated: 0,
                            images_uploaded: 0
                        };

                        // Apply updates to initial stats
                        Object.entries(statsUpdate).forEach(([key, value]) => {
                            const k = key as keyof UserStats;
                            if (k in initialStats && typeof initialStats[k] === 'number')
                            {
                                (initialStats[k] as number) = (value as number);
                            }
                        });

                        const columns = Object.keys(initialStats).join(', ');
                        const placeholders = Object.keys(initialStats).map(() => '?').join(', ');
                        const values = Object.values(initialStats);

                        this.db.run(
                            `INSERT INTO user_stats (${columns}) VALUES (${placeholders})`,
                            values,
                            (err) => {
                                if (err)
                                {
                                    reject(err);
                                    return;
                                }
                                resolve(initialStats);
                            }
                        );
                    }
                }
            );
        });
    }

    /**
     * Gets user stats
     */
    public async getUserStats (userId: string): Promise<UserStats> {
        return new Promise((resolve, reject) => {
            this.db.get<UserStatsRow>('SELECT * FROM user_stats WHERE user_id = ?', [userId], (err, row) => {
                if (err)
                {
                    reject(err);
                    return;
                }

                if (!row)
                {
                    const initialStats: UserStats = {
                        user_id: userId,
                        messages_sent: 0,
                        conversations_started: 0,
                        characters_created: 0,
                        days_active: 0,
                        last_active_date: null,
                        stories_generated: 0,
                        images_uploaded: 0
                    };
                    resolve(initialStats);
                    return;
                }

                resolve(row);
            });
        });
    }

    /**
     * Checks and unlocks new achievements based on stats
     */
    public async checkForNewAchievements (userId: string): Promise<Achievement[]> {
        try
        {
            const stats = await this.getUserStats(userId);
            const existingAchievements = await this.getUserAchievements(userId);
            const unlockedIds = existingAchievements.map(a => a.achievementId);
            const newAchievements: Achievement[] = [];

            for (const [achievementId, achievement] of Object.entries(this.achievementDefinitions))
            {
                if (unlockedIds.includes(achievementId))
                {
                    continue;
                }

                if (!achievement.condition || achievement.condition(stats))
                {
                    const unlocked = await this.unlockAchievement(userId, achievementId);
                    if (unlocked)
                    {
                        newAchievements.push(unlocked);
                    }
                }
            }

            return newAchievements;
        } catch (error)
        {
            logError('Error checking for new achievements', error as Error);
            return [];
        }
    }

    /**
     * Closes database connection
     */
    public close (): void {
        this.db.close();
    }
}

export default AchievementService;
