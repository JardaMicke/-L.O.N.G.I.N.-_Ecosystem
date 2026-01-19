import request from 'supertest';
import app from '../server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Mock dependencies
jest.mock('socket.io');

// Mock services with inline implementations to avoid hoisting issues
jest.mock('../services/memory-service', () => {
    const mockMemoryServiceInstance = {
        getMemories: jest.fn().mockResolvedValue([]),
        createMemory: jest.fn().mockReturnValue({ id: 'memory-1', content: 'Test memory' }),
        getRelevantMemories: jest.fn().mockResolvedValue([]),
        createConversationMemory: jest.fn(),
        deleteMemory: jest.fn().mockReturnValue(true)
    };
    return {
        __esModule: true,
        default: mockMemoryServiceInstance,
        memoryService: mockMemoryServiceInstance,
        MemoryService: jest.fn(() => mockMemoryServiceInstance)
    };
});

jest.mock('../services/achievement-service', () => {
    const mockAchievementServiceInstance = {
        getUserAchievements: jest.fn().mockResolvedValue([]),
        getUserStats: jest.fn().mockResolvedValue({}),
        updateStat: jest.fn().mockResolvedValue({}),
        recordFeatureUsed: jest.fn().mockResolvedValue({}),
        registerListener: jest.fn()
    };
    return {
        __esModule: true,
        default: mockAchievementServiceInstance,
        achievementService: mockAchievementServiceInstance,
        AchievementService: jest.fn(() => mockAchievementServiceInstance)
    };
});

jest.mock('../services/voice-service', () => {
    const mockVoiceServiceInstance = {
        textToSpeech: jest.fn().mockResolvedValue(Buffer.from('test audio'))
    };
    return {
        __esModule: true,
        default: mockVoiceServiceInstance,
        voiceService: mockVoiceServiceInstance,
        VoiceService: jest.fn(() => mockVoiceServiceInstance)
    };
});

jest.mock('../services/model-service', () => {
    const mockModelServiceInstance = {
        getSupportedModels: jest.fn().mockReturnValue([
            { id: 'model-1', name: 'Test Model', status: { available: true } }
        ]),
        getActiveModel: jest.fn().mockReturnValue({
            id: 'model-1',
            name: 'Test Model',
            options: { temperature: 0.7, topP: 0.9 }
        }),
        switchModel: jest.fn().mockResolvedValue({
            status: 'success',
            model: { id: 'model-1' }
        }),
        setModelOptions: jest.fn().mockReturnValue({ temperature: 0.7, topP: 0.9 }),
        on: jest.fn(),
        streamText: jest.fn().mockImplementation((prompt, callback) => {
            callback('test response');
            return Promise.resolve();
        }),
        generateResponse: jest.fn().mockResolvedValue({ success: true, response: 'Mock response' })
    };
    return {
        __esModule: true,
        default: mockModelServiceInstance,
        modelService: mockModelServiceInstance
    };
});

// Mock DB - Define it inside the factory or use a hoisted variable
jest.mock('sqlite3', () => {
    const internalMockDb: any = {
        run: jest.fn((query, params, callback) => {
            if (callback) callback.call({ lastID: 1, changes: 1 });
            return internalMockDb;
        }),
        get: jest.fn((query, params, callback) => {
            if (callback) callback(null, { id: 'test-id', name: 'Test' });
            return internalMockDb;
        }),
        all: jest.fn((query, params, callback) => {
            if (callback) callback(null, [{ id: 'test-id', name: 'Test' }]);
            return internalMockDb;
        }),
        prepare: jest.fn(() => ({
            run: jest.fn(),
            finalize: jest.fn()
        })),
        serialize: jest.fn(cb => cb()),
        close: jest.fn()
    };

    return {
        verbose: () => ({
            Database: jest.fn(() => internalMockDb)
        })
    };
});

describe('API Endpoints', () => {

    beforeAll(() => {
        process.env.NODE_ENV = 'test';
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('GET /api', () => {
        it('should return health status', async () => {
            const healthRes = await request(app).get('/health');
            expect(healthRes.status).toBe(200);
            expect(healthRes.body.data.status).toBe('healthy');
        });
    });

    // Chat tests (using chat-routes)
    describe('POST /api/chat', () => {
        it('should send a message', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: 'Hello', characterId: 'test-char' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });
});
