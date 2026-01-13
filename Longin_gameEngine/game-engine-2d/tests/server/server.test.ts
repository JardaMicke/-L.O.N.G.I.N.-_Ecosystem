import { Engine } from '../../src/core/engine';
import { GameServer } from '../../src/server/server';

jest.mock('../../src/server/database/repositories/player-repository');

jest.mock('express', () => {
  const mockApp = {
    get: jest.fn(),
    use: jest.fn(),
    listen: jest.fn((port, cb) => cb && cb()),
  };
  const mockExpress = () => mockApp;
  mockExpress.static = jest.fn();
  return mockExpress;
});

jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, cb) => cb && cb()),
    close: jest.fn(),
    on: jest.fn(),
  })),
}));

jest.mock('socket.io', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
  };
});

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockRegisterSystem = jest.fn();

jest.mock('../../src/core/engine', () => {
  return {
    Engine: jest.fn().mockImplementation(() => ({
      systemRegistry: {
        registerSystem: mockRegisterSystem,
      },
      entityManager: {},
      eventSystem: {
        emit: jest.fn(),
      },
      start: mockStart,
      stop: mockStop,
    })),
  };
});

describe('GameServer', () => {
  let server: GameServer;

  beforeEach(() => {
    jest.clearAllMocks();
    server = new GameServer();
  });

  test('should initialize correctly', () => {
    expect(Engine).toHaveBeenCalled();
    expect(mockRegisterSystem).toHaveBeenCalled();
  });

  test('should start engine and server', async () => {
    await server.start();
    expect(mockStart).toHaveBeenCalled();
  });

  test('should stop engine and server', async () => {
    await server.stop();
    expect(mockStop).toHaveBeenCalled();
  });
});
