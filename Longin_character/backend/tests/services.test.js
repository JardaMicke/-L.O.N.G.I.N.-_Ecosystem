/**
 * Services Tests
 * 
 * Tests for the backend services.
 * Run with: npm test
 */

const { v4: uuidv4 } = require('uuid');
const { EventEmitter } = require('events');

// Mock dependencies
jest.mock('sqlite3');
jest.mock('axios');
jest.mock('fs');
jest.mock('socket.io');

// Memory Service Tests
describe('MemoryService', () => {
  let MemoryService;
  let memoryService;
  let mockDb;
  
  beforeEach(() => {
    // Reset modules
    jest.resetModules();
    
    // Mock database
    mockDb = {
      run: jest.fn((query, params, callback) => {
        if (callback) callback.call({ lastID: 1 });
        return mockDb;
      }),
      get: jest.fn((query, params, callback) => {
        if (callback) callback(null, { id: 'memory-1', content: 'Test memory', importance: 5 });
        return mockDb;
      }),
      all: jest.fn((query, params, callback) => {
        if (callback) callback(null, [
          { id: 'memory-1', content: 'Test memory 1', importance: 5 },
          { id: 'memory-2', content: 'Test memory 2', importance: 3 }
        ]);
        return mockDb;
      }),
      serialize: jest.fn(cb => cb()),
      prepare: jest.fn(() => ({
        run: jest.fn(),
        finalize: jest.fn()
      }))
    };
    
    // Mock sqlite3
    jest.mock('sqlite3', () => ({
      verbose: () => ({ Database: jest.fn(() => mockDb) })
    }));
    
    // Import the service
    MemoryService = require('../memory-service').MemoryService;
    memoryService = new MemoryService(':memory:');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getMemories', () => {
    it('should return memories for a character', async () => {
      const memories = await memoryService.getMemories('character-1');
      
      expect(Array.isArray(memories)).toBe(true);
      expect(memories.length).toBe(2);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
  
  describe('addMemory', () => {
    it('should add a new memory', async () => {
      const memory = await memoryService.addMemory('character-1', 'New memory', 4);
      
      expect(memory).toHaveProperty('id');
      expect(memory.content).toBe('New memory');
      expect(mockDb.run).toHaveBeenCalled();
    });
    
    it('should handle errors when adding memory', async () => {
      mockDb.run.mockImplementationOnce((query, params, callback) => {
        callback(new Error('Database error'));
        return mockDb;
      });
      
      await expect(memoryService.addMemory('character-1', 'New memory', 4))
        .rejects.toThrow();
    });
  });
  
  describe('updateMemory', () => {
    it('should update an existing memory', async () => {
      const memory = await memoryService.updateMemory('memory-1', 'Updated memory', 3);
      
      expect(memory).toHaveProperty('id', 'memory-1');
      expect(memory.content).toBe('Updated memory');
      expect(mockDb.run).toHaveBeenCalled();
    });
  });
  
  describe('deleteMemory', () => {
    it('should delete a memory', async () => {
      mockDb.run.mockImplementationOnce((query, params, callback) => {
        callback.call({ changes: 1 });
        return mockDb;
      });
      
      const result = await memoryService.deleteMemory('memory-1');
      
      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });
    
    it('should return false if memory not found', async () => {
      mockDb.run.mockImplementationOnce((query, params, callback) => {
        callback.call({ changes: 0 });
        return mockDb;
      });
      
      const result = await memoryService.deleteMemory('non-existent');
      
      expect(result).toBe(false);
    });
  });
  
  describe('getRelevantMemories', () => {
    it('should return relevant memories based on content', async () => {
      const memories = await memoryService.getRelevantMemories('character-1', 'test query');
      
      expect(Array.isArray(memories)).toBe(true);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
});

// Achievement Service Tests
describe('AchievementService', () => {
  let AchievementService;
  let achievementService;
  let mockDb;
  
  beforeEach(() => {
    // Reset modules
    jest.resetModules();
    
    // Mock database
    mockDb = {
      run: jest.fn((query, params, callback) => {
        if (callback) callback.call({ lastID: 1, changes: 1 });
        return mockDb;
      }),
      get: jest.fn((query, params, callback) => {
        if (callback) callback(null, { stat_value: '10' });
        return mockDb;
      }),
      all: jest.fn((query, params, callback) => {
        if (callback) {
          if (query.includes('user_achievements')) {
            callback(null, [{ achievement_id: 'achievement-1' }]);
          } else if (query.includes('user_stats')) {
            callback(null, [
              { stat_name: 'messages', stat_value: '10' },
              { stat_name: 'characters_created', stat_value: '2' }
            ]);
          } else {
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
      }))
    };
    
    // Mock sqlite3
    jest.mock('sqlite3', () => ({
      verbose: () => ({ Database: jest.fn(() => mockDb) })
    }));
    
    // Import the service
    AchievementService = require('../achievement-service').AchievementService;
    achievementService = new AchievementService(':memory:');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getAchievements', () => {
    it('should return achievements for a user', async () => {
      const achievements = await achievementService.getAchievements('user-1');
      
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBe(2);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
  
  describe('updateStat', () => {
    it('should increment an existing stat', async () => {
      const result = await achievementService.updateStat('user-1', 'messages', 1, true);
      
      expect(result).toHaveProperty('statName', 'messages');
      expect(mockDb.get).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalled();
    });
    
    it('should set a stat directly', async () => {
      const result = await achievementService.updateStat('user-1', 'messages', 5, false);
      
      expect(result).toHaveProperty('statName', 'messages');
      expect(result).toHaveProperty('value', 5);
      expect(mockDb.run).toHaveBeenCalled();
    });
  });
  
  describe('getUserStats', () => {
    it('should return stats for a user', async () => {
      const stats = await achievementService.getUserStats('user-1');
      
      expect(stats).toHaveProperty('messages');
      expect(stats).toHaveProperty('characters_created');
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
  
  describe('recordFeatureUsed', () => {
    it('should record a feature being used', async () => {
      mockDb.get.mockImplementationOnce((query, params, callback) => {
        callback(null, { stat_value: '["chat"]' });
        return mockDb;
      });
      
      const result = await achievementService.recordFeatureUsed('user-1', 'memory');
      
      expect(result).toHaveProperty('feature', 'memory');
      expect(result.featuresUsed).toContain('memory');
      expect(mockDb.run).toHaveBeenCalled();
    });
  });
  
  describe('unlockAchievement', () => {
    it('should unlock an achievement', async () => {
      mockDb.get.mockImplementationOnce((query, params, callback) => {
        callback(null, null); // No existing unlock
        return mockDb;
      }).mockImplementationOnce((query, params, callback) => {
        callback(null, { id: 'achievement-1', name: 'Test Achievement' });
        return mockDb;
      });
      
      const result = await achievementService.unlockAchievement('user-1', 'achievement-1');
      
      expect(result).toHaveProperty('unlocked', true);
      expect(result).toHaveProperty('achievement');
      expect(mockDb.run).toHaveBeenCalled();
    });
    
    it('should not unlock already unlocked achievements', async () => {
      mockDb.get.mockImplementationOnce((query, params, callback) => {
        callback(null, { id: 'achievement-1' }); // Already unlocked
        return mockDb;
      });
      
      const result = await achievementService.unlockAchievement('user-1', 'achievement-1');
      
      expect(result).toHaveProperty('alreadyUnlocked', true);
    });
  });
});

// Model Service Tests
describe('ModelService', () => {
  let modelService;
  let axiosMock;
  
  beforeEach(() => {
    // Reset modules
    jest.resetModules();
    
    // Mock axios
    axiosMock = {
      get: jest.fn().mockResolvedValue({
        data: {
          models: [
            { name: 'dolphin-mistral' },
            { name: 'wizardlm-uncensored' }
          ]
        }
      }),
      post: jest.fn().mockResolvedValue({
        data: { response: 'Test response' }
      })
    };
    
    jest.mock('axios', () => axiosMock);
    
    // Mock memory-cache
    jest.mock('memory-cache', () => ({
      get: jest.fn(),
      put: jest.fn(),
      del: jest.fn()
    }));
    
    // Import the service
    modelService = require('../model-service');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getSupportedModels', () => {
    it('should return a list of models', () => {
      const models = modelService.getSupportedModels();
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
    });
  });
  
  describe('getActiveModel', () => {
    it('should return the active model', () => {
      const model = modelService.getActiveModel();
      
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('options');
    });
  });
  
  describe('setModelOptions', () => {
    it('should set model options', () => {
      const options = modelService.setModelOptions({ temperature: 0.8 });
      
      expect(options).toHaveProperty('temperature', 0.8);
    });
  });
  
  describe('checkModelsStatus', () => {
    it('should check models availability', async () => {
      const status = await modelService.checkModelsStatus();
      
      expect(status).toBeDefined();
      expect(axiosMock.get).toHaveBeenCalled();
    });
  });
  
  describe('generateText', () => {
    it('should generate text using the active model', async () => {
      // Mock model status
      modelService.modelStatus = {
        'dolphin-mistral': { available: true }
      };
      modelService.activeModel = 'dolphin-mistral';
      
      const result = await modelService.generateText('Test prompt');
      
      expect(result).toHaveProperty('text');
      expect(axiosMock.post).toHaveBeenCalled();
    });
    
    it('should throw error if model not available', async () => {
      // Mock model status
      modelService.modelStatus = {
        'dolphin-mistral': { available: false }
      };
      modelService.activeModel = 'dolphin-mistral';
      
      await expect(modelService.generateText('Test prompt'))
        .rejects.toThrow();
    });
  });
});

// Voice Service Tests
describe('VoiceService', () => {
  let VoiceService;
  let voiceService;
  let axiosMock;
  
  beforeEach(() => {
    // Reset modules
    jest.resetModules();
    
    // Mock axios
    axiosMock = {
      post: jest.fn().mockResolvedValue({
        data: { audio: 'base64audio' }
      })
    };
    
    jest.mock('axios', () => axiosMock);
    
    // Import the service
    VoiceService = require('../voice-service');
    voiceService = new VoiceService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('textToSpeech', () => {
    it('should convert text to speech', async () => {
      const buffer = await voiceService.textToSpeech('Hello world', 'en_female_1');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(axiosMock.post).toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('API error'));
      
      await expect(voiceService.textToSpeech('Hello world', 'en_female_1'))
        .rejects.toThrow();
    });
  });
});