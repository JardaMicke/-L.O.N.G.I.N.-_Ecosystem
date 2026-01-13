import { Engine } from '../../src/core/engine';
import { State } from '../../src/core/game-state';
import { Renderer } from '../../src/graphics/renderer';
import { TransformComponent } from '../../src/core/components';
import { PhysicsComponent, Vector2 } from '../../src/physics/components';
import { Entity } from '../../src/ecs/entity';
import { DeviceManager } from '../../src/ui/device-manager';

// Mocks
jest.mock('../../src/graphics/renderer');
jest.mock('../../src/audio/audio-manager');
jest.mock('../../src/ui/input-handler');
jest.mock('../../src/ui/touch-handler');
jest.mock('../../src/ui/mobile-controls');
jest.mock('../../src/ui/device-manager');

class TestPlayState implements State {
  public name = 'test';
  public testEntity: Entity | null = null;
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  onEnter(engine: Engine): void {
    // Create a test entity
    this.testEntity = this.engine.entityManager.createEntity();
    
    // Add Transform
    const transform = new TransformComponent(0, 0, 0);
    this.testEntity.addComponent(transform);
    
    // Add Physics with velocity
    const physics = new PhysicsComponent();
    physics.velocity = { x: 10, y: 0 }; // Moving right at 10 units/sec
    this.testEntity.addComponent(physics);
  }

  onExit(engine: Engine): void {
    if (this.testEntity) {
        this.engine.entityManager.removeEntity(this.testEntity.id);
    }
  }

  onUpdate(engine: Engine, deltaTime: number): void {
      // Custom update logic if needed
  }
  
  onRender(engine: Engine, interpolation: number): void {
      // Custom render logic
  }
}

describe('Gameplay Integration', () => {
  let engine: Engine;
  let testState: TestPlayState;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Setup DeviceManager mock
    const mockDeviceManagerInstance = {
        onResize: jest.fn(),
        getScreenDimensions: jest.fn().mockReturnValue({ width: 800, height: 600 }),
    };
    (DeviceManager.getInstance as jest.Mock).mockReturnValue(mockDeviceManagerInstance);

    // Setup Engine with mocks
    const mockAudioManager = {
      init: jest.fn(),
      play: jest.fn(),
      stop: jest.fn(),
      // Add other methods if needed
    };

    engine = new Engine({
      renderer: new Renderer(null as any),
      audioManager: mockAudioManager as any,
      deviceManager: mockDeviceManagerInstance as any,
      // Other dependencies will be mocked automatically or use default instances
    });

    // Disable actual game loop starting to manually control updates
    jest.spyOn(engine.gameLoop, 'start').mockImplementation(() => {}); 
    
    testState = new TestPlayState(engine);
    engine.gameStateManager.registerState(testState);
  });

  test('should initialize engine and systems', () => {
    expect(engine).toBeDefined();
    // Access private property for testing
    expect((engine.systemRegistry as any).systems.length).toBeGreaterThan(0);
  });

  test('should update entity position via physics system', () => {
    // Switch to test state
    engine.gameStateManager.switchState('test');
    
    // Verify entity creation
    expect(testState.testEntity).toBeDefined();
    const entity = testState.testEntity!;
    const transform = entity.getComponent(TransformComponent);
    const physics = entity.getComponent(PhysicsComponent);
    
    expect(transform).toBeDefined();
    expect(physics).toBeDefined();
    expect(transform?.x).toBe(0);
    
    // Simulate one second of updates
    // Update for 1 second total (e.g. 60 frames of 1/60s)
    const dt = 1/60;
    for (let i = 0; i < 60; i++) {
        (engine as any).update(dt);
    }
    
    // Expected position: start (0) + velocity (10) * time (1) = 10
    expect(transform?.x).toBeCloseTo(10, 1);
  });
});
