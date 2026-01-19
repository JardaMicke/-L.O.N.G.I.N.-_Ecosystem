/**
 * API Tests
 * 
 * Tests for the backend API endpoints and functionality.
 * Run with: npm test
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Mock dependencies
jest.mock('sqlite3');
jest.mock('../memory-service');
jest.mock('../achievement-service');
jest.mock('../voice-service');
jest.mock('../model-service');
jest.mock('socket.io');

// Mock the database
const mockDb = {
  run: jest.fn((query, params, callback) => {
    if (callback) callback.call({ lastID: 1, changes: 1 });
    return mockDb;
  }),
  get: jest.fn((query, params, callback) => {
    if (callback) callback(null, { id: 'test-id', name: 'Test' });
    return mockDb;
  }),
  all: jest.fn((query, params, callback) => {
    if (callback) callback(null, [{ id: 'test-id', name: 'Test' }]);
    return mockDb;
  }),
  prepare: jest.fn(() => ({
    run: jest.fn(),
    finalize: jest.fn()
  })),
  serialize: jest.fn(cb => cb()),
  close: jest.fn()
};

// Mock services
const mockMemoryService = {
  getMemories: jest.fn().mockResolvedValue([]),
  addMemory: jest.fn().mockResolvedValue({ id: 'memory-1', content: 'Test memory' }),
  getRelevantMemories: jest.fn().mockResolvedValue([])
};

const mockAchievementService = {
  getAchievements: jest.fn().mockResolvedValue([]),
  getUserStats: jest.fn().mockResolvedValue({}),
  updateStat: jest.fn().mockResolvedValue({}),
  recordFeatureUsed: jest.fn().mockResolvedValue({}),
  registerListener: jest.fn()
};

const mockVoiceService = {
  textToSpeech: jest.fn().mockResolvedValue(Buffer.from('test audio'))
};

const mockModelService = {
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
  })
};

// Mock Socket.io
const mockIo = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn()
  }),
  on: jest.fn(),
  emit: jest.fn()
};

// Mocked server setup
let app;
let server;

// Setup before tests
beforeAll(() => {
  // Create temporary upload directory for tests
  const uploadDir = path.join(__dirname, 'temp-uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Mock environment
  process.env.NODE_ENV = 'test';
  
  // Mock require modules
  jest.mock('sqlite3', () => ({
    verbose: () => ({ Database: jest.fn(() => mockDb) })
  }));
  
  jest.mock('../memory-service', () => ({
    MemoryService: jest.fn(() => mockMemoryService)
  }));
  
  jest.mock('../achievement-service', () => ({
    AchievementService: jest.fn(() => mockAchievementService)
  }));
  
  jest.mock('../voice-service', () => jest.fn(() => mockVoiceService));
  
  jest.mock('../model-service', () => mockModelService);
  
  jest.mock('socket.io', () => jest.fn(() => mockIo));
  
  // Import the server (this will use the mocked dependencies)
  server = require('../server');
  app = server;
});

// Cleanup after tests
afterAll(() => {
  // Remove temporary upload directory
  const uploadDir = path.join(__dirname, 'temp-uploads');
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }
  
  // Restore all mocks
  jest.restoreAllMocks();
});

describe('API Endpoints', () => {
  describe('GET /api/characters', () => {
    it('should return a list of characters', async () => {
      const response = await request(app).get('/api/characters');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/characters/:id', () => {
    it('should return a character by ID', async () => {
      const response = await request(app).get('/api/characters/test-id');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(mockDb.get).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/characters', () => {
    it('should create a new character', async () => {
      const response = await request(app)
        .post('/api/characters')
        .field('name', 'Test Character')
        .field('personality', 'Friendly')
        .field('background', 'Test background')
        .field('greeting', 'Hello!')
        .field('traits', JSON.stringify(['friendly', 'smart']));
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Character');
      expect(mockDb.run).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/conversations', () => {
    it('should return a list of conversations', async () => {
      const response = await request(app).get('/api/conversations');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/messages/:conversationId', () => {
    it('should return messages for a conversation', async () => {
      const response = await request(app).get('/api/messages/test-conversation');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/models', () => {
    it('should return a list of available models', async () => {
      const response = await request(app).get('/api/models');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockModelService.getSupportedModels).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/models/active', () => {
    it('should return the active model', async () => {
      const response = await request(app).get('/api/models/active');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('options');
      expect(mockModelService.getActiveModel).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/models/switch', () => {
    it('should switch to a different model', async () => {
      const response = await request(app)
        .post('/api/models/switch')
        .send({ modelId: 'model-1' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(mockModelService.switchModel).toHaveBeenCalledWith('model-1');
    });
  });
  
  describe('GET /api/memories/:characterId', () => {
    it('should return memories for a character', async () => {
      const response = await request(app).get('/api/memories/test-character');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockMemoryService.getMemories).toHaveBeenCalledWith('test-character');
    });
  });
  
  describe('POST /api/memories', () => {
    it('should add a new memory for a character', async () => {
      const response = await request(app)
        .post('/api/memories')
        .send({
          characterId: 'test-character',
          content: 'Test memory content',
          importance: 5
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(mockMemoryService.addMemory).toHaveBeenCalledWith(
        'test-character', 'Test memory content', 5
      );
    });
  });
  
  describe('GET /api/achievements', () => {
    it('should return user achievements', async () => {
      const response = await request(app).get('/api/achievements');
      
      expect(response.status).toBe(200);
      expect(mockAchievementService.getAchievements).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/stats', () => {
    it('should return user stats', async () => {
      const response = await request(app).get('/api/stats');
      
      expect(response.status).toBe(200);
      expect(mockAchievementService.getUserStats).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/settings', () => {
    it('should return user settings', async () => {
      const response = await request(app).get('/api/settings');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('activeModel');
      expect(mockDb.get).toHaveBeenCalled();
    });
  });
});