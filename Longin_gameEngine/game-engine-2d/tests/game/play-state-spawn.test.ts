import { TransformComponent } from '../../src/core/components';
import { Game } from '../../src/game/core/game';
import { PlayState } from '../../src/game/states/play-state';
import { TerrainGenerator } from '../../src/world/terrain-generator';

jest.mock('../../src/core/engine');
jest.mock('../../src/game/core/game');
jest.mock('../../src/world/terrain-generator');
jest.mock('../../src/graphics/camera');
jest.mock('../../src/graphics/tilemap-renderer');
jest.mock('../../src/ui/hud');
jest.mock('../../src/gameplay/player-control-system');
jest.mock('../../src/gameplay/network-sync-system');

describe('PlayState Spawn', () => {
  let playState: PlayState;
  let mockEngine: any;
  let mockGame: any;
  let mockGenerator: any;

  beforeEach(() => {
    // Mock Generator
    mockGenerator = {
      generate: jest.fn(),
      getSafeSpawnPoints: jest.fn().mockReturnValue([
        { x: 500, y: 600 },
        { x: 700, y: 800 },
      ]),
    };
    (TerrainGenerator as jest.Mock).mockReturnValue(mockGenerator);

    // Mock Game
    mockGame = {
      start: jest.fn(),
      stop: jest.fn(),
      update: jest.fn(),
      getPlayers: jest.fn().mockReturnValue([
        { id: 'p1', name: 'Player 1', type: 'human', color: 'red' },
        { id: 'p2', name: 'Player 2', type: 'ai', color: 'blue' },
      ]),
    };
    (Game.getInstance as jest.Mock).mockReturnValue(mockGame);

    // Mock Engine
    mockEngine = {
      renderer: {},
      inputHandler: {},
      networkManager: { isConnected: jest.fn().mockReturnValue(false), connect: jest.fn() },
      eventSystem: { on: jest.fn(), off: jest.fn() },
      systemRegistry: { registerSystem: jest.fn(), removeSystem: jest.fn() },
      gameStateManager: { getCurrentCamera: jest.fn() },
      uiManager: { addElement: jest.fn(), removeElement: jest.fn(), clear: jest.fn() },
      config: { network: { enabled: false }, graphics: { width: 800, height: 600 } },
      entityManager: {
        getEntitiesWithComponents: jest.fn().mockReturnValue([]),
        removeEntity: jest.fn(),
        createEntity: jest.fn().mockReturnValue({
          id: 'e1',
          addComponent: jest.fn(),
          getComponent: jest.fn(),
        }),
      },
    };

    playState = new PlayState();
    // Inject mock camera
    (playState as any).camera = {
      setBounds: jest.fn(),
      resize: jest.fn(),
      update: jest.fn(),
      lookAt: jest.fn(),
    };
  });

  test('should use generated spawn points for players', () => {
    playState.onEnter(mockEngine);

    // Check generator was called
    expect(mockGenerator.generate).toHaveBeenCalled();
    expect(mockGenerator.getSafeSpawnPoints).toHaveBeenCalledWith(expect.anything(), 10);

    // Check entities created (2 players + 1 dummy)
    expect(mockEngine.entityManager.createEntity).toHaveBeenCalledTimes(3);

    // Check TransformComponent values
    // We need to inspect calls to addComponent on the created entities
    // Since createEntity returns the same mock object 'e1' for both calls in this simple mock setup,
    // we can inspect e1.addComponent calls.

    // However, better to make createEntity return unique mocks if we want to distinguish.
    // But let's check if addComponent was called with TransformComponent containing correct values.

    const createdEntity = mockEngine.entityManager.createEntity.mock.results[0].value;
    const addComponentCalls = createdEntity.addComponent.mock.calls;

    const transformCalls = addComponentCalls.filter(
      (call: any) => call[0] instanceof TransformComponent,
    );

    // Should have at least 2 transform calls (one for each player, assuming same mock entity reused or simple check)
    // Wait, if same mock entity is returned, 'addComponent' is on that same object.
    // It's called for P1 then P2.

    // P1 should be at 500, 600
    const p1Transform = transformCalls.find((call: any) => call[0].x === 500 && call[0].y === 600);
    expect(p1Transform).toBeDefined();

    // P2 should be at 700, 800
    const p2Transform = transformCalls.find((call: any) => call[0].x === 700 && call[0].y === 800);
    expect(p2Transform).toBeDefined();
  });
});
