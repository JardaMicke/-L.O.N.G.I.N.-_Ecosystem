import { MemoryService } from '../services/memory-service';
import { AchievementService } from '../services/achievement-service';
import { ModelService } from '../services/model-service';
import { VoiceService } from '../services/voice-service';

// Mocks
jest.mock('sqlite3');
jest.mock('axios');
jest.mock('socket.io');

// Mock Logger to avoid FS operations
jest.mock('../utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
    logWarn: jest.fn(),
}));

// Mock FS - keep simple for MemoryService persistence if needed, 
// but Logger should be handled by above mock now.
jest.mock('fs', () => ({
    existsSync: jest.fn(() => true),
    readFileSync: jest.fn(() => '[]'),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn(() => ({}))
}));

const mockDb: any = {
    run: jest.fn((query, params, callback) => {
        if (callback) callback.call({ lastID: 1, changes: 1 });
        return mockDb;
    }),
    get: jest.fn((query, params, callback) => {
        if (callback) callback(null, { id: 'memory-1', content: 'Test memory', importance: 5 });
        return mockDb;
    }),
    all: jest.fn((query, params, callback) => {
        if (callback)
        {
            if (query.includes('user_achievements'))
            {
                callback(null, [{ achievement_id: 'achievement-1' }]);
            } else if (query.includes('user_stats'))
            {
                callback(null, [
                    { stat_name: 'messages', stat_value: '10' },
                    { stat_name: 'characters_created', stat_value: '2' }
                ]);
            } else if (query.includes('SELECT * FROM memories'))
            {
                callback(null, [
                    { id: 'memory-1', content: 'Test memory 1', importance: 5 },
                    { id: 'memory-2', content: 'Test memory 2', importance: 3 }
                ]);
            } else
            {
                callback(null, [
                    { id: 'achievement-1', name: 'First Achievement', description: 'Test', unlocked: true },
                    { id: 'achievement-2', name: 'Second Achievement', description: 'Test 2', unlocked: false }
                ]);
            }
        }
        return mockDb;
    }),
    serialize: jest.fn(cb => cb()),
    prepare: jest.fn(() => ({
        run: jest.fn(),
        finalize: jest.fn()
    })),
    close: jest.fn()
};

jest.mock('sqlite3', () => ({
    verbose: () => ({ Database: jest.fn(() => mockDb) })
}));

describe('Services Tests', () => {

    describe('MemoryService', () => {
        let memoryService: MemoryService;

        beforeEach(() => {
            jest.clearAllMocks();
            memoryService = new MemoryService();
        });

        describe('getMemories', () => {
            it('should return memories for a character', async () => {
                const memories = await memoryService.getMemories('character-1');
                expect(Array.isArray(memories)).toBe(true);
            });
        });

        describe('createMemory', () => {
            it('should add a new memory', async () => {
                const memory = await memoryService.createMemory('character-1', { type: 'conversation', content: 'New memory' });
                expect(memory).toHaveProperty('id');
                expect(memory.content).toBe('New memory');
            });
        });
    });

    describe('AchievementService', () => {
        let achievementService: AchievementService;

        beforeEach(() => {
            jest.clearAllMocks();
            achievementService = new AchievementService(':memory:');
        });

        describe('getUserAchievements', () => {
            it('should return achievements for a user', async () => {
                const achievements = await achievementService.getUserAchievements('user-1');
                expect(Array.isArray(achievements)).toBe(true);
                expect(mockDb.all).toHaveBeenCalled();
            });
        });
    });
});
