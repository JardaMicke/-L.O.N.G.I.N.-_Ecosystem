/**
 * @fileoverview Comprehensive test suite for error-handler module
 * 
 * This test suite validates the functionality of the error handling system
 * including custom error classes, error logging, recovery mechanisms, and
 * Express middleware integration.
 * 
 * @module error-handler.test
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

const path = require('path');
const fs = require('fs').promises;
const {
  ErrorHandler, 
  ApplicationError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  errorHandler
} = require('../backend/error-handler');

// Mock dependencies
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      appendFile: jest.fn().mockResolvedValue(undefined),
      stat: jest.fn().mockResolvedValue({ size: 1000 }),
      rename: jest.fn().mockResolvedValue(undefined)
    }
  };
});

// Mock Express response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Error Handler Module', () => {
  let consoleSpy;
  
  beforeAll(() => {
    // Spy on console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation()
    };
  });

  afterAll(() => {
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('Custom Error Classes', () => {
    test('ApplicationError should initialize with correct properties', () => {
      const error = new ApplicationError('Test error', 400, 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApplicationError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
      expect(error.stack).toBeDefined();
    });

    test('ValidationError should extend ApplicationError', () => {
      const details = [{ field: 'username', message: 'Required' }];
      const error = new ValidationError('Validation failed', details);
      
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(details);
    });

    test('DatabaseError should include query information', () => {
      const query = 'SELECT * FROM users WHERE id = ?';
      const params = ['user123'];
      const error = new DatabaseError('Database error', query, params);
      
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('DatabaseError');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.query).toBe(query);
      expect(error.params).toEqual(params);
    });

    test('ExternalServiceError should capture service information', () => {
      const error = new ExternalServiceError('Service unavailable', 'API', 503);
      
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('ExternalServiceError');
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.service).toBe('API');
      expect(error.originalStatusCode).toBe(503);
    });
  });

  describe('ErrorHandler Class', () => {
    let handler;

    beforeEach(() => {
      // Create a new instance for each test
      handler = new ErrorHandler({
        logDir: '/tmp/logs',
        enableReporting: false,
        maxLogSize: 5000
      });
    });

    test('should initialize with correct options', () => {
      expect(handler.logDir).toBe('/tmp/logs');
      expect(handler.enableReporting).toBe(false);
      expect(handler.maxLogSize).toBe(5000);
      expect(fs.promises.mkdir).toHaveBeenCalledWith('/tmp/logs', { recursive: true });
    });

    test('should use default options when not provided', () => {
      const defaultHandler = new ErrorHandler();
      expect(defaultHandler.logDir).toEqual(expect.stringContaining('logs'));
      expect(defaultHandler.enableReporting).toBe(true);
      expect(defaultHandler.maxLogSize).toBe(10 * 1024 * 1024); // 10MB
    });

    test('should normalize different error types', async () => {
      // String error
      let normalized = handler.normalizeError('String error');
      expect(normalized).toBeInstanceOf(ApplicationError);
      expect(normalized.message).toBe('String error');
      
      // Object error
      normalized = handler.normalizeError({ message: 'Object error', statusCode: 404 });
      expect(normalized).toBeInstanceOf(ApplicationError);
      expect(normalized.message).toBe('Object error');
      expect(normalized.statusCode).toBe(404);
      
      // Native Error
      const nativeError = new Error('Native error');
      normalized = handler.normalizeError(nativeError);
      expect(normalized).toBeInstanceOf(ApplicationError);
      expect(normalized.message).toBe('Native error');
    });
    
    test('should log errors', async () => {
      const error = new ApplicationError('Test error');
      await handler.logError(error, { user: 'test' });
      
      expect(fs.promises.appendFile).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
      
      // Check log file rotation
      expect(fs.promises.stat).toHaveBeenCalled();
    });
    
    test('should update error statistics', () => {
      const error = new ApplicationError('Test error', 500, 'TEST_ERROR');
      handler.updateErrorStats(error);
      
      const stats = handler.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorCounts).toHaveProperty('ApplicationError:TEST_ERROR');
    });

    test('should attempt recovery using registered strategies', async () => {
      // Add a test recovery strategy
      handler.recoveryStrategies.set('TEST_ERROR', async () => {
        return { action: 'retry', delay: 1000 };
      });
      
      const error = new ApplicationError('Test error', 500, 'TEST_ERROR');
      const recovery = await handler.attemptRecovery(error);
      
      expect(recovery).toEqual({ action: 'retry', delay: 1000 });
    });
    
    test('should format error responses appropriately', () => {
      const error = new ApplicationError('Test error', 400, 'TEST_ERROR');
      const response = handler.formatErrorResponse(error);
      
      expect(response).toEqual({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
          timestamp: expect.any(String)
        }
      });
    });

    test('should include recovery information in response when available', () => {
      const error = new ApplicationError('Test error');
      const recoveryAction = { action: 'retry', delay: 1000 };
      const response = handler.formatErrorResponse(error, recoveryAction);
      
      expect(response).toHaveProperty('recovery', recoveryAction);
    });

    test('Express middleware should handle errors', async () => {
      const err = new ApplicationError('Test error', 400, 'TEST_ERROR');
      const req = {
        url: '/test',
        method: 'GET',
        headers: {},
        body: {},
        params: {},
        query: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test Agent')
      };
      const res = mockResponse();
      const next = jest.fn();
      
      await handler.expressMiddleware(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TEST_ERROR'
        })
      }));
    });
  });

  describe('Error Handler Singleton', () => {
    test('should export a singleton instance', () => {
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
    });
  });
});

// Test global error handlers setup
describe('Global Error Handlers', () => {
  let processOn;
  let processExit;
  let handler;
  
  beforeAll(() => {
    // Save original process methods
    processOn = process.on;
    processExit = process.exit;
    
    // Mock process methods
    process.on = jest.fn();
    process.exit = jest.fn();
  });
  
  afterAll(() => {
    // Restore original process methods
    process.on = processOn;
    process.exit = processExit;
  });
  
  test('should set up global handlers for uncaught errors', () => {
    handler = new ErrorHandler({ enableReporting: false });
    
    expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });
});