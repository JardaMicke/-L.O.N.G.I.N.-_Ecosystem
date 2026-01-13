/**
 * @fileoverview Comprehensive test suite for model-service module
 * 
 * This test suite validates all functionality of the ModelService class
 * including model management, generation capabilities, error handling,
 * and network fault tolerance.
 * 
 * @module model-service.test
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

const axios = require('axios');
const EventEmitter = require('events');
const memoryCache = require('memory-cache');

// Mock external dependencies
jest.mock('axios');
jest.mock('memory-cache', () => ({
  get: jest.fn(),
  put: jest.fn(),
  del: jest.fn()
}));

// Import module under test
const {
  ModelService,
  ModelNotFoundError,
  ModelBusyError,
  SUPPORTED_MODELS,
  Constants
} = require('../backend/model-service');

describe('ModelService', () => {
  let service;
  let mockAxiosResponse;
  let streamSource;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up axios mock responses
    mockAxiosResponse = {
      data: {
        models: [
          { name: 'dolphin-mistral' },
          { name: 'wizardlm-uncensored' }
        ]
      }
    };
    
    axios.mockImplementation(() => Promise.resolve(mockAxiosResponse));
    
    // Mock Stream source for streaming responses
    streamSource = new EventEmitter();
    streamSource.on = jest.fn((event, callback) => {
      // Store callbacks for testing
      streamSource[`${event}Callback`] = callback;
      return streamSource;
    });
    
    // Create fresh instance for each test
    service = new ModelService({
      enableMetrics: true
    });
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(service.activeModel).toBe('dolphin-mistral');
      expect(service.modelOptions).toEqual({
        temperature: 0.7,
        topP: 0.9,
        maxTokens: Constants.MAX_TOKENS
      });
      expect(service.enableMetrics).toBe(true);
    });

    test('should accept custom configuration', () => {
      const customService = new ModelService({
        defaultModel: 'wizardlm-uncensored',
        cacheTimeout: 60000,
        enableMetrics: false
      });
      
      expect(customService.activeModel).toBe('wizardlm-uncensored');
      expect(customService.cacheTimeout).toBe(60000);
      expect(customService.enableMetrics).toBe(false);
    });
  });

  describe('Model Information Methods', () => {
    test('getSupportedModels should return all models with status', () => {
      const models = service.getSupportedModels();
      
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('dolphin-mistral');
      expect(models[1].id).toBe('wizardlm-uncensored');
      expect(models[0].status).toBeDefined();
    });

    test('getModelDetails should return details for a specific model', () => {
      const model = service.getModelDetails('dolphin-mistral');
      
      expect(model.id).toBe('dolphin-mistral');
      expect(model.name).toBe('Dolphin-Mistral');
      expect(model.parameters).toBe('7B');
      expect(model.status).toBeDefined();
    });

    test('getModelDetails should throw for non-existent models', () => {
      expect(() => {
        service.getModelDetails('non-existent-model');
      }).toThrow(ModelNotFoundError);
    });

    test('getActiveModel should return the active model details', () => {
      const model = service.getActiveModel();
      
      expect(model.id).toBe('dolphin-mistral');
      expect(model.options).toEqual(service.modelOptions);
    });
  });

  describe('Model Option Management', () => {
    test('setModelOptions should update options correctly', () => {
      const newOptions = {
        temperature: 0.8,
        topP: 0.95
      };
      
      const result = service.setModelOptions(newOptions);
      
      expect(result.temperature).toBe(0.8);
      expect(result.topP).toBe(0.95);
      expect(service.modelOptions).toEqual({
        temperature: 0.8,
        topP: 0.95,
        maxTokens: Constants.MAX_TOKENS
      });
    });

    test('should emit event when options are changed', () => {
      const listener = jest.fn();
      service.on('model-options-changed', listener);
      
      service.setModelOptions({ temperature: 0.5 });
      
      expect(listener).toHaveBeenCalledWith({
        temperature: 0.5,
        topP: 0.9,
        maxTokens: Constants.MAX_TOKENS
      });
    });

    test('should validate temperature range', () => {
      expect(() => {
        service.setModelOptions({ temperature: 1.5 });
      }).toThrow(/Temperature must be between 0 and 1/);
      
      expect(() => {
        service.setModelOptions({ temperature: -0.5 });
      }).toThrow(/Temperature must be between 0 and 1/);
    });

    test('should validate top-p range', () => {
      expect(() => {
        service.setModelOptions({ topP: 1.5 });
      }).toThrow(/Top-P must be between 0 and 1/);
      
      expect(() => {
        service.setModelOptions({ topP: -0.5 });
      }).toThrow(/Top-P must be between 0 and 1/);
    });

    test('should validate max tokens range', () => {
      expect(() => {
        service.setModelOptions({ maxTokens: 0 });
      }).toThrow(/Max tokens must be between 1 and 32768/);
      
      expect(() => {
        service.setModelOptions({ maxTokens: 50000 });
      }).toThrow(/Max tokens must be between 1 and 32768/);
    });
  });

  describe('Model Status Management', () => {
    test('checkModelsStatus should update model status from API', async () => {
      const status = await service.checkModelsStatus();
      
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${Constants.OLLAMA_API_BASE}/tags`,
        timeout: Constants.REQUEST_TIMEOUT
      });
      
      expect(status.dolphinMistral).toBeDefined();
      expect(status['dolphin-mistral'].available).toBe(true);
    });

    test('should use cached status when available', async () => {
      const cachedStatus = {
        'dolphin-mistral': { available: true, loading: false }
      };
      
      memoryCache.get.mockReturnValueOnce(cachedStatus);
      
      await service.checkModelsStatus();
      
      expect(axios).not.toHaveBeenCalled();
      expect(service.modelStatus['dolphin-mistral']).toEqual(cachedStatus['dolphin-mistral']);
    });

    test('should handle API errors gracefully', async () => {
      axios.mockRejectedValueOnce(new Error('API error'));
      
      await expect(service.checkModelsStatus()).rejects.toThrow(/Failed to check model status/);
    });

    test('should emit status update event', async () => {
      const listener = jest.fn();
      service.on('models-status-updated', listener);
      
      await service.checkModelsStatus();
      
      expect(listener).toHaveBeenCalledWith(service.modelStatus);
    });
  });

  describe('Model Pulling', () => {
    test('pullModel should download model from API', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: false, loading: false };
      
      const result = await service.pullModel('wizardlm-uncensored');
      
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${Constants.OLLAMA_API_BASE}/pull`,
        data: { name: 'wizardlm-uncensored' },
        timeout: Constants.REQUEST_TIMEOUT
      });
      
      expect(result.status).toBe('success');
      expect(service.modelStatus['wizardlm-uncensored'].available).toBe(true);
    });

    test('should throw for unsupported models', async () => {
      await expect(service.pullModel('non-existent-model'))
        .rejects.toThrow(ModelNotFoundError);
    });

    test('should skip download if model is already available', async () => {
      service.modelStatus['dolphin-mistral'] = { available: true, loading: false };
      
      const result = await service.pullModel('dolphin-mistral');
      
      expect(axios).not.toHaveBeenCalled();
      expect(result.status).toBe('available');
    });

    test('should return loading status if model is being downloaded', async () => {
      service.modelStatus['dolphin-mistral'] = { available: false, loading: true };
      
      const result = await service.pullModel('dolphin-mistral');
      
      expect(axios).not.toHaveBeenCalled();
      expect(result.status).toBe('loading');
    });

    test('should handle API errors', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: false, loading: false };
      axios.mockRejectedValueOnce(new Error('Download failed'));
      
      await expect(service.pullModel('wizardlm-uncensored'))
        .rejects.toThrow(/Failed to pull model/);
      
      expect(service.modelStatus['wizardlm-uncensored'].loading).toBe(false);
      expect(service.modelStatus['wizardlm-uncensored'].available).toBe(false);
    });

    test('should emit events during pull lifecycle', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: false, loading: false };
      
      const loadingListener = jest.fn();
      const readyListener = jest.fn();
      
      service.on('model-loading', loadingListener);
      service.on('model-ready', readyListener);
      
      await service.pullModel('wizardlm-uncensored');
      
      expect(loadingListener).toHaveBeenCalledWith('wizardlm-uncensored');
      expect(readyListener).toHaveBeenCalledWith('wizardlm-uncensored');
    });
  });

  describe('Model Switching', () => {
    test('switchModel should change the active model', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: true, loading: false };
      
      const result = await service.switchModel('wizardlm-uncensored');
      
      expect(service.activeModel).toBe('wizardlm-uncensored');
      expect(result.status).toBe('success');
    });

    test('should pull unavailable models before switching', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: false, loading: false };
      service.pullModel = jest.fn().mockResolvedValue({ status: 'success' });
      
      await service.switchModel('wizardlm-uncensored');
      
      expect(service.pullModel).toHaveBeenCalledWith('wizardlm-uncensored');
      expect(service.activeModel).toBe('wizardlm-uncensored');
    });

    test('should reset options to model defaults', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: true, loading: false };
      service.modelOptions = { temperature: 0.5, topP: 0.8, maxTokens: 2000 };
      
      await service.switchModel('wizardlm-uncensored');
      
      expect(service.modelOptions).toEqual({
        temperature: SUPPORTED_MODELS['wizardlm-uncensored'].defaultTemperature,
        topP: SUPPORTED_MODELS['wizardlm-uncensored'].defaultTopP,
        maxTokens: Constants.MAX_TOKENS
      });
    });

    test('should emit model-switched event', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: true, loading: false };
      const listener = jest.fn();
      
      service.on('model-switched', listener);
      await service.switchModel('wizardlm-uncensored');
      
      expect(listener).toHaveBeenCalledWith({
        modelId: 'wizardlm-uncensored',
        options: service.modelOptions
      });
    });

    test('should throw for unsupported models', async () => {
      await expect(service.switchModel('non-existent-model'))
        .rejects.toThrow(ModelNotFoundError);
    });

    test('should handle pull failures', async () => {
      service.modelStatus['wizardlm-uncensored'] = { available: false, loading: false };
      service.pullModel = jest.fn().mockRejectedValue(new Error('Pull failed'));
      
      await expect(service.switchModel('wizardlm-uncensored'))
        .rejects.toThrow(/Failed to switch to model/);
    });
  });

  describe('Text Generation', () => {
    beforeEach(() => {
      // Mock generation response
      mockAxiosResponse = {
        data: {
          response: 'Generated text response',
          eval_count: 42,
          done: true
        }
      };
      
      axios.mockResolvedValue(mockAxiosResponse);
      
      // Set active model as available
      service.modelStatus['dolphin-mistral'] = { available: true, loading: false };
    });

    test('generateText should call API with correct parameters', async () => {
      const result = await service.generateText('Test prompt');
      
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${Constants.OLLAMA_API_BASE}/generate`,
        data: expect.objectContaining({
          model: 'dolphin-mistral',
          prompt: 'Test prompt',
          stream: false
        }),
        timeout: Constants.REQUEST_TIMEOUT
      });
      
      expect(result.text).toBe('Generated text response');
      expect(result.tokensUsed).toBe(42);
      expect(result.modelId).toBe('dolphin-mistral');
    });

    test('should throw if active model is unavailable', async () => {
      service.modelStatus['dolphin-mistral'] = { available: false, loading: false };
      
      await expect(service.generateText('Test prompt'))
        .rejects.toThrow(ModelNotFoundError);
    });

    test('should pass custom generation options', async () => {
      await service.generateText('Test prompt', {
        temperature: 0.5,
        topP: 0.8,
        maxTokens: 100,
        stopSequences: ['END']
      });
      
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${Constants.OLLAMA_API_BASE}/generate`,
        data: expect.objectContaining({
          options: expect.objectContaining({
            temperature: 0.5,
            top_p: 0.8,
            num_predict: 100,
            stop: ['END']
          })
        }),
        timeout: Constants.REQUEST_TIMEOUT
      });
    });

    test('should update metrics when generation completes', async () => {
      await service.generateText('Test prompt');
      
      const metrics = service.getMetrics();
      expect(metrics.requestCount).toBe(1);
      expect(metrics.tokenCount).toBe(42);
      expect(metrics.modelUsage).toHaveProperty('dolphin-mistral', 1);
    });

    test('should handle API errors', async () => {
      axios.mockRejectedValueOnce({
        response: {
          status: 500,
          statusText: 'Server Error'
        }
      });
      
      await expect(service.generateText('Test prompt'))
        .rejects.toThrow(/Text generation failed/);
    });
  });

  describe('Streaming Text Generation', () => {
    beforeEach(() => {
      // Mock streaming response
      mockAxiosResponse = {
        data: streamSource
      };
      
      axios.mockResolvedValue(mockAxiosResponse);
      
      // Set active model as available
      service.modelStatus['dolphin-mistral'] = { available: true, loading: false };
    });

    test('streamText should process streaming chunks correctly', async () => {
      const onChunk = jest.fn();
      
      // Start streaming
      const streamPromise = service.streamText('Test prompt', onChunk);
      
      // Emit data events
      streamSource.dataCallback('{"response": "First", "eval_count": 10}\n');
      streamSource.dataCallback('{"response": " chunk"}\n{"response": " response"}\n');
      
      // Emit end event
      streamSource.endCallback();
      
      // Wait for streaming to complete
      const result = await streamPromise;
      
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'First');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' chunk');
      expect(onChunk).toHaveBeenNthCalledWith(3, ' response');
      
      expect(result.text).toBe('First chunk response');
      expect(result.tokensUsed).toBe(10);
      expect(result.modelId).toBe('dolphin-mistral');
    });

    test('should handle streaming errors', async () => {
      const onChunk = jest.fn();
      const streamPromise = service.streamText('Test prompt', onChunk);
      
      // Emit error event
      streamSource.errorCallback(new Error('Stream failed'));
      
      await expect(streamPromise).rejects.toThrow(/Streaming error/);
    });

    test('should update metrics after streaming completes', async () => {
      const onChunk = jest.fn();
      const streamPromise = service.streamText('Test prompt', onChunk);
      
      streamSource.dataCallback('{"response": "Text", "eval_count": 5}\n');
      streamSource.endCallback();
      
      await streamPromise;
      
      const metrics = service.getMetrics();
      expect(metrics.requestCount).toBe(1);
      expect(metrics.tokenCount).toBe(5);
    });
  });

  describe('Error Handling and Retries', () => {
    test('should retry failed requests', async () => {
      // First call fails, second succeeds
      axios.mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockAxiosResponse);
      
      service.modelStatus['dolphin-mistral'] = { available: true, loading: false };
      
      // Mock delay to speed up test
      jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb());
      
      await service.generateText('Test prompt');
      
      // Should have been called twice
      expect(axios).toHaveBeenCalledTimes(2);
    });

    test('should respect maximum retry count', async () => {
      // All calls fail
      axios.mockRejectedValue(new Error('Network error'));
      
      service.modelStatus['dolphin-mistral'] = { available: true, loading: false };
      
      // Mock delay to speed up test
      jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb());
      
      await expect(service.generateText('Test prompt'))
        .rejects.toThrow();
      
      // Should have been called MAX_RETRIES + 1 times
      expect(axios).toHaveBeenCalledTimes(Constants.MAX_RETRIES + 1);
    });
    
    test('should not retry client errors', async () => {
      axios.mockRejectedValueOnce({
        response: {
          status: 400,
          statusText: 'Bad Request'
        }
      });
      
      service.modelStatus['dolphin-mistral'] = { available: true, loading: false };
      
      await expect(service.generateText('Test prompt'))
        .rejects.toThrow();
      
      // Should have been called only once
      expect(axios).toHaveBeenCalledTimes(1);
    });
  });

  describe('Metrics', () => {
    test('getMetrics should return current metrics', () => {
      const metrics = service.getMetrics();
      
      expect(metrics.requestCount).toBe(0);
      expect(metrics.tokenCount).toBe(0);
      expect(metrics.modelUsage).toEqual({});
      expect(metrics.uptime).toBeGreaterThan(0);
      expect(metrics.activeModel).toBe('dolphin-mistral');
    });

    test('resetMetrics should reset all metrics', () => {
      service.metrics.requestCount = 10;
      service.metrics.tokenCount = 500;
      service.metrics.modelUsage = { 'dolphin-mistral': 10 };
      
      service.resetMetrics();
      
      const metrics = service.getMetrics();
      expect(metrics.requestCount).toBe(0);
      expect(metrics.tokenCount).toBe(0);
      expect(metrics.modelUsage).toEqual({});
    });

    test('should not collect metrics when disabled', () => {
      service.enableMetrics = false;
      
      const metrics = service.getMetrics();
      expect(metrics).toEqual({ metricsDisabled: true });
    });
  });
});