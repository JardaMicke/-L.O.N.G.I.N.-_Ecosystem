/**
 * @jest-environment node
 */

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock database drivers to avoid ESM/connection issues
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('mongodb', () => {
  return {
    MongoClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      db: jest.fn().mockReturnValue({
        collection: jest.fn(),
      }),
      close: jest.fn(),
    })),
    ObjectId: jest.fn(),
  };
});

import { ConfigManager } from '../../src/core/config-manager';
import { Engine } from '../../src/core/engine';
import { GameServer } from '../../src/server/server';

// Mock canvas for headless environment
class MockCanvas {
  getContext(type: string) {
    return {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 10 }),
      setTransform: jest.fn(),
      createRadialGradient: jest.fn().mockReturnValue({
        addColorStop: jest.fn(),
      }),
    };
  }
  width = 800;
  height = 600;
  style = {};
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 800, height: 600 };
  }
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

// Mock window and document if not present
if (typeof window === 'undefined') {
  (global as any).window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    innerWidth: 1024,
    innerHeight: 768,
  };
}

// Force document mock to ensure createElement exists
(global as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') return new MockCanvas();
    return {
      style: {},
      appendChild: jest.fn(),
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  },
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  getElementById: jest.fn(),
  head: {
    appendChild: jest.fn(),
  },
};

// Mock ConfigManager to ensure network is enabled and port is consistent
jest.mock('../../src/core/config-manager');

describe('Network Input Integration', () => {
  let server: GameServer;
  let clientEngine: Engine;
  const port = 3001; // Use different port for testing

  beforeAll(async () => {
    // Setup Config Mock
    (ConfigManager as any).mockImplementation(() => ({
      getConfig: () => ({
        engine: { tickRate: 60, debug: false },
        graphics: { width: 800, height: 600, fullscreen: false },
        network: { enabled: true, host: 'localhost', port: port },
        database: {
          postgres: undefined,
          mongo: undefined,
          redis: undefined,
        },
      }),
    }));

    // Start Server
    server = new GameServer();
    await server.start();
  });

  afterAll(async () => {
    if (clientEngine) {
      clientEngine.stop();
      if (clientEngine.networkManager) {
        clientEngine.networkManager.disconnect();
      }
    }
    await server.stop();
    jest.restoreAllMocks();
  });

  test('should transmit input events from client to server', (done) => {
    // Start Client
    clientEngine = new Engine();
    // Mock document/window for InputHandler
    const existingDoc = (global as any).document;
    (global as any).document = {
      ...existingDoc,
      getElementById: jest.fn().mockReturnValue({
        addEventListener: jest.fn(),
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
        getContext: jest.fn().mockReturnValue({
          clearRect: jest.fn(),
          save: jest.fn(),
          restore: jest.fn(),
          translate: jest.fn(),
          scale: jest.fn(),
          beginPath: jest.fn(),
          rect: jest.fn(),
          fill: jest.fn(),
          stroke: jest.fn(),
          drawImage: jest.fn(),
        }),
        width: 800,
        height: 600,
      }),
    };

    clientEngine.initialize('game-canvas');

    // Listen for network input on server engine's event system
    // Accessing private engine from server for testing purposes
    const serverEngine = (server as any).engine as Engine;

    serverEngine.eventSystem.on('network:input', (payload: any) => {
      try {
        expect(payload.data.type).toBe('keydown');
        expect(payload.data.key).toBe('Space');
        done();
      } catch (error) {
        done(error);
      }
    });

    // Wait for connection then emit input
    setTimeout(() => {
      // Simulate input on client
      clientEngine.eventSystem.emit('input:keydown', 'Space');
    }, 500);
  }, 5000);
});
