/**
 * @fileoverview Test Setup Configuration
 * 
 * This file configures the testing environment before tests run.
 * It sets up global mocks, environment variables, and test utilities.
 * 
 * @module setupTests
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.OLLAMA_API_URL = 'http://localhost:11434/api';
process.env.SD_API_URL = 'http://localhost:7860';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.TTS_API_URL = 'http://localhost:5002';

// Mock console methods to reduce noise in tests (except for errors)
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: originalConsole.error
};

// Global fetch mock for tests that use fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Mock localStorage for browser-like environment
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock File and FileReader for file upload tests
global.File = class File {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
    this.type = properties?.type || '';
    this.lastModified = Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.readyState = 0;
    this.onload = null;
    this.onerror = null;
  }
  
  readAsText(file) {
    this.readyState = 2;
    this.result = file.parts.join('');
    if (this.onload) {
      this.onload({ target: this });
    }
  }
  
  readAsDataURL(file) {
    this.readyState = 2;
    this.result = `data:${file.type};base64,${Buffer.from(file.parts.join('')).toString('base64')}`;
    if (this.onload) {
      this.onload({ target: this });
    }
  }
};

// Mock WebSocket for Socket.IO tests
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen();
      }
    }, 0);
  }
  
  send(data) {
    if (this.readyState === MockWebSocket.OPEN) {
      // Simulate echo for testing
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data });
        }
      }, 0);
    }
  }
  
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }
}

MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

global.WebSocket = MockWebSocket;

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-object-url'),
  revokeObjectURL: jest.fn()
};

// Mock Image constructor for image loading tests
global.Image = class Image {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.width = 0;
    this.height = 0;
  }
  
  set src(value) {
    this._src = value;
    // Simulate successful image load
    setTimeout(() => {
      this.width = 800;
      this.height = 600;
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
  
  get src() {
    return this._src;
  }
};

// Mock Blob constructor
global.Blob = class Blob {
  constructor(parts = [], options = {}) {
    this.parts = parts;
    this.size = parts.reduce((acc, part) => {
      return acc + (typeof part === 'string' ? part.length : part.byteLength || 0);
    }, 0);
    this.type = options.type || '';
  }
  
  slice(start = 0, end = this.size, contentType = '') {
    return new Blob(this.parts.slice(start, end), { type: contentType });
  }
  
  text() {
    return Promise.resolve(this.parts.join(''));
  }
  
  arrayBuffer() {
    const text = this.parts.join('');
    const buffer = new ArrayBuffer(text.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < text.length; i++) {
      view[i] = text.charCodeAt(i);
    }
    return Promise.resolve(buffer);
  }
};

// Global test utilities
global.testUtils = {
  // Create a promise that resolves after a delay
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Wait for next tick
  nextTick: () => new Promise(resolve => process.nextTick(resolve)),
  
  // Create mock function with implementation
  mockImplementation: (implementation) => jest.fn().mockImplementation(implementation),
  
  // Create resolved promise mock
  mockResolvedValue: (value) => jest.fn().mockResolvedValue(value),
  
  // Create rejected promise mock
  mockRejectedValue: (error) => jest.fn().mockRejectedValue(error)
};

// Increase timeout for async tests
jest.setTimeout(10000);

// Mock performance.now for consistent timing in tests
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock crypto for UUID generation in tests
global.crypto = {
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7))
};