/**
 * @fileoverview Test Helper Utilities
 * 
 * This module provides utility functions to facilitate testing across the application.
 * It includes mocking tools, test data generators, and validation helpers.
 * 
 * @module TestHelper
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

/**
 * Creates a mock Express response object for testing
 * @param {Object} [options={}] - Options for customizing the mock
 * @param {boolean} [options.includeJsonFunction=true] - Whether to include json function
 * @param {boolean} [options.includeStatusFunction=true] - Whether to include status function
 * @param {boolean} [options.includeSendFunction=true] - Whether to include send function
 * @returns {Object} Mock response object
 */
function createMockResponse(options = {}) {
  const includeJsonFunction = options.includeJsonFunction !== false;
  const includeStatusFunction = options.includeStatusFunction !== false;
  const includeSendFunction = options.includeSendFunction !== false;
  
  const res = {
    // Store all calls and arguments for verification
    calls: {
      status: [],
      json: [],
      send: [],
      end: [],
      headers: {},
      cookies: {}
    }
  };
  
  if (includeStatusFunction) {
    res.status = function(code) {
      this.calls.status.push(code);
      this.statusCode = code;
      return this;
    };
  }
  
  if (includeJsonFunction) {
    res.json = function(data) {
      this.calls.json.push(data);
      this.body = data;
      return this;
    };
  }
  
  if (includeSendFunction) {
    res.send = function(data) {
      this.calls.send.push(data);
      this.body = data;
      return this;
    };
  }
  
  res.end = function(data) {
    this.calls.end.push(data);
    return this;
  };
  
  res.set = function(name, value) {
    this.calls.headers[name] = value;
    return this;
  };
  
  res.cookie = function(name, value, options) {
    this.calls.cookies[name] = { value, options };
    return this;
  };
  
  return res;
}

/**
 * Creates a mock Express request object for testing
 * @param {Object} [options={}] - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {string} [options.url='/'] - Request URL
 * @param {Object} [options.params={}] - Route parameters
 * @param {Object} [options.query={}] - Query parameters
 * @param {Object} [options.body={}] - Request body
 * @param {Object} [options.headers={}] - Request headers
 * @param {Object} [options.cookies={}] - Request cookies
 * @returns {Object} Mock request object
 */
function createMockRequest(options = {}) {
  return {
    method: options.method || 'GET',
    url: options.url || '/',
    path: options.path || '/',
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    ip: options.ip || '127.0.0.1',
    protocol: options.protocol || 'http',
    secure: options.secure || false,
    get: function(name) {
      return this.headers[name.toLowerCase()];
    }
  };
}

/**
 * Creates mock database functions for testing
 * @param {Object} [mockResults={}] - Mock results for different operations
 * @param {Array|Error} [mockResults.all=[]] - Result for db.all()
 * @param {Object|Error} [mockResults.get=null] - Result for db.get()
 * @param {Object|Error} [mockResults.run={}] - Result for db.run()
 * @returns {Object} Mock database object
 */
function createMockDatabase(mockResults = {}) {
  const all = jest.fn().mockImplementation((query, params, callback) => {
    if (mockResults.all instanceof Error) {
      callback(mockResults.all);
    } else {
      callback(null, mockResults.all || []);
    }
  });
  
  const get = jest.fn().mockImplementation((query, params, callback) => {
    if (mockResults.get instanceof Error) {
      callback(mockResults.get);
    } else {
      callback(null, mockResults.get || null);
    }
  });
  
  const run = jest.fn().mockImplementation(function(query, params, callback) {
    if (mockResults.run instanceof Error) {
      callback(mockResults.run);
    } else {
      callback.call({ lastID: 1, changes: 1 });
    }
  });
  
  const prepare = jest.fn().mockReturnValue({
    run: jest.fn(),
    finalize: jest.fn()
  });
  
  return {
    all,
    get,
    run,
    prepare,
    exec: jest.fn(),
    close: jest.fn()
  };
}

/**
 * Generates mock user data for testing
 * @param {Object} [overrides={}] - Properties to override in the default mock user
 * @returns {Object} Mock user object
 */
function generateMockUser(overrides = {}) {
  const defaultUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date().toISOString(),
    preferences: {
      theme: 'light',
      language: 'en'
    }
  };
  
  return { ...defaultUser, ...overrides };
}

/**
 * Generates mock character data for testing
 * @param {Object} [overrides={}] - Properties to override in the default mock character
 * @returns {Object} Mock character object
 */
function generateMockCharacter(overrides = {}) {
  const defaultCharacter = {
    id: 'char-123',
    name: 'Test Character',
    personality: 'Friendly and helpful',
    background: 'Created for testing purposes',
    avatar: '/uploads/test-avatar.jpg',
    greeting: 'Hello, I am a test character!',
    traits: ['helpful', 'friendly', 'creative'],
    created_at: new Date().toISOString()
  };
  
  return { ...defaultCharacter, ...overrides };
}

/**
 * Generates mock conversation data for testing
 * @param {Object} [overrides={}] - Properties to override in the default mock conversation
 * @returns {Object} Mock conversation object
 */
function generateMockConversation(overrides = {}) {
  const defaultConversation = {
    id: 'conv-123',
    character_id: 'char-123',
    title: 'Test Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return { ...defaultConversation, ...overrides };
}

/**
 * Generates mock message data for testing
 * @param {Object} [overrides={}] - Properties to override in the default mock message
 * @returns {Object} Mock message object
 */
function generateMockMessage(overrides = {}) {
  const defaultMessage = {
    id: 'msg-123',
    conversation_id: 'conv-123',
    character_id: 'char-123',
    sender: 'user',
    content: 'This is a test message',
    timestamp: new Date().toISOString()
  };
  
  return { ...defaultMessage, ...overrides };
}

/**
 * Waits for promises to settle and executes any pending timers
 * Useful for testing async code with timers
 * @param {number} [ms=0] - Additional milliseconds to advance timers
 * @returns {Promise<void>} Promise that resolves when timers are advanced
 */
async function flushPromisesAndTimers(ms = 0) {
  // Wait for all promises to resolve
  await Promise.resolve();
  
  // Advance timers
  jest.advanceTimersByTime(ms);
  
  // Wait for any promises triggered by timers
  return Promise.resolve();
}

/**
 * Creates a mock WebSocket connection for testing Socket.IO
 * @returns {Object} Mock socket object
 */
function createMockSocket() {
  return {
    id: 'socket-123',
    handshake: {
      address: '127.0.0.1',
      headers: {}
    },
    rooms: new Set(['socket-123']),
    data: {},
    emit: jest.fn(),
    join: jest.fn(room => {
      this.rooms.add(room);
      return this;
    }),
    leave: jest.fn(room => {
      this.rooms.delete(room);
      return this;
    }),
    on: jest.fn(),
    once: jest.fn(),
    disconnect: jest.fn()
  };
}

/**
 * Verifies that all required environment variables are set
 * @param {Array<string>} requiredVars - List of required environment variable names
 * @returns {boolean} True if all required variables are set
 * @throws {Error} If any required variables are missing
 */
function checkRequiredEnvVars(requiredVars) {
  const missing = requiredVars.filter(name => !process.env[name]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// Export utility functions
module.exports = {
  createMockResponse,
  createMockRequest,
  createMockDatabase,
  createMockSocket,
  generateMockUser,
  generateMockCharacter,
  generateMockConversation,
  generateMockMessage,
  flushPromisesAndTimers,
  checkRequiredEnvVars
};