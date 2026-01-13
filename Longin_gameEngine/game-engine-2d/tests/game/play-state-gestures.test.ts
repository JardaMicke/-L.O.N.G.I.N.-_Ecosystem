import { EventSystem } from '../../src/core/event-system';
import { Game } from '../../src/game/core/game';
import { PlayState } from '../../src/game/states/play-state';

// Mock dependencies
jest.mock('../../src/core/engine');
jest.mock('../../src/core/event-system');
jest.mock('../../src/graphics/camera');
jest.mock('../../src/game/core/game');

describe('PlayState Gestures', () => {
  let playState: PlayState;
  let mockEngine: any;
  let mockEventSystem: any;
  let mockCamera: any;
  let mockGame: any;

  beforeEach(() => {
    // Setup Mocks
    mockEventSystem = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    };
    (EventSystem.getInstance as jest.Mock).mockReturnValue(mockEventSystem);

    mockGame = {
      start: jest.fn(),
      stop: jest.fn(),
      getPlayers: jest.fn().mockReturnValue([]),
    };
    (Game.getInstance as jest.Mock).mockReturnValue(mockGame);

    mockCamera = {
      zoom: 1.0,
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      resize: jest.fn(),
      update: jest.fn(),
      setBounds: jest.fn(),
      lookAt: jest.fn(),
    };

    mockEngine = {
      eventSystem: mockEventSystem,
      gameStateManager: {
        getCurrentCamera: () => mockCamera,
      },
      config: {
        network: { enabled: false },
        graphics: { width: 800, height: 600 },
      },
      networkManager: {
        isConnected: () => false,
        connect: jest.fn(),
        send: jest.fn(),
        on: jest.fn(),
      },
      entityManager: {
        getEntitiesWithComponents: () => [],
        removeEntity: jest.fn(),
        createEntity: jest.fn().mockReturnValue({
          id: 'e1',
          addComponent: jest.fn(),
          getComponent: jest.fn(),
        }),
      },
      systemRegistry: {
        registerSystem: jest.fn(),
        removeSystem: jest.fn(),
      },
      renderer: {
        getCanvas: jest.fn().mockReturnValue({}),
        getContext: jest.fn(),
      },
      inputHandler: {
        isKeyDown: jest.fn(),
      },
      uiManager: {
        addElement: jest.fn(),
        removeElement: jest.fn(),
        clear: jest.fn(),
        getElement: jest.fn(),
      },
    };

    playState = new PlayState();
    // Inject camera mock (private property)
    (playState as any).camera = mockCamera;
  });

  test('should register gesture handler on enter', () => {
    playState.onEnter(mockEngine);
    expect(mockEventSystem.on).toHaveBeenCalledWith('input:gesture', expect.any(Function));
  });

  test('should unregister gesture handler on exit', () => {
    playState.onEnter(mockEngine);
    playState.onExit(mockEngine);
    expect(mockEventSystem.off).toHaveBeenCalledWith('input:gesture', expect.any(Function));
  });

  test('should handle pinch gesture to zoom', () => {
    playState.onEnter(mockEngine);

    // Get the registered handler
    const handler = mockEventSystem.on.mock.calls.find(
      (call: any) => call[0] === 'input:gesture',
    )[1];

    // 1. Pinch Start
    handler({ type: 'pinch-start', scale: 1 });
    expect((playState as any).initialZoom).toBe(1.0);

    // 2. Pinch Zoom In (2x)
    handler({ type: 'pinch', scale: 2.0 });
    expect(mockCamera.zoom).toBe(2.0);

    // 3. Pinch Zoom Out (0.5x)
    handler({ type: 'pinch-start', scale: 1 }); // Reset start
    (playState as any).camera.zoom = 2.0; // Assume current is 2.0

    // Wait, logic is: initialZoom = camera.zoom on start.
    // So if current is 2.0, initial becomes 2.0.
    // If scale is 0.5, result is 1.0.
    handler({ type: 'pinch-start', scale: 1 });
    expect((playState as any).initialZoom).toBe(2.0);

    handler({ type: 'pinch', scale: 0.5 });
    expect(mockCamera.zoom).toBe(1.0);
  });

  test('should clamp zoom levels', () => {
    playState.onEnter(mockEngine);
    const handler = mockEventSystem.on.mock.calls.find(
      (call: any) => call[0] === 'input:gesture',
    )[1];

    // Start
    handler({ type: 'pinch-start', scale: 1 });

    // Try huge zoom
    handler({ type: 'pinch', scale: 10.0 });
    expect(mockCamera.zoom).toBe(3.0); // Max

    // Try tiny zoom
    handler({ type: 'pinch', scale: 0.01 });
    expect(mockCamera.zoom).toBe(0.5); // Min
  });

  test('should reset zoom on double-tap', () => {
    playState.onEnter(mockEngine);
    const handler = mockEventSystem.on.mock.calls.find(
      (call: any) => call[0] === 'input:gesture',
    )[1];

    mockCamera.zoom = 2.5;
    handler({ type: 'double-tap' });
    expect(mockCamera.zoom).toBe(1.0);
  });

  test('should handle resize event', () => {
    playState.onEnter(mockEngine);
    // Find resize handler
    const handler = mockEventSystem.on.mock.calls.find(
      (call: any) => call[0] === 'engine:resize',
    )[1];
    expect(handler).toBeDefined();

    handler({ width: 1024, height: 768 });
    expect(mockCamera.resize).toHaveBeenCalledWith(1024, 768);
  });
});
