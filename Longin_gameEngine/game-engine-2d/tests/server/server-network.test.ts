import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';

import { ConfigManager } from '../../src/core/config-manager';
import { PlayerRepository } from '../../src/server/database/repositories/player-repository';
import { GameServer } from '../../src/server/server';

// Mock ConfigManager
jest.mock('../../src/core/config-manager');
// Mock PlayerRepository
jest.mock('../../src/server/database/repositories/player-repository');

describe('Server Network System', () => {
  let server: GameServer;
  let clientSocket: ClientSocket;
  const port = 3002;

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

    // Setup PlayerRepository Mock
    (PlayerRepository as any).mockImplementation(() => ({
      findByUsername: jest.fn().mockResolvedValue({ x: 50, y: 50, username: 'TestPlayer' }),
      save: jest.fn().mockResolvedValue(undefined),
      createTable: jest.fn().mockResolvedValue(undefined),
    }));

    server = new GameServer();
    await server.start();
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    await server.stop();
    jest.restoreAllMocks();
  });

  test('should create player entity on join', (done) => {
    clientSocket = ClientIO(`http://localhost:${port}`, { transports: ['websocket'] });

    clientSocket.on('connect', () => {
      clientSocket.emit('join', { username: 'TestPlayer' });
    });

    clientSocket.on('game:joined', (data: any) => {
      try {
        expect(data.entityId).toBeDefined();
        expect(data.x).toBe(50);
        expect(data.y).toBe(50);
        done();
      } catch (e) {
        done(e);
      }
    });
  }, 5000);

  test('should broadcast game state', (done) => {
    // We assume client is already joined from previous test

    clientSocket.on('game:state', (data: any) => {
      try {
        expect(data.time).toBeDefined();
        expect(data.entities).toBeInstanceOf(Array);
        expect(data.entities.length).toBeGreaterThan(0);
        const player = data.entities[0];
        expect(player.socketId).toBe(clientSocket.id);
        expect(player.x).toBeDefined();
        expect(player.y).toBeDefined();
        clientSocket.off('game:state'); // Stop listening to avoid multiple done calls
        done();
      } catch (e) {
        done(e);
      }
    });
  }, 5000);
});
