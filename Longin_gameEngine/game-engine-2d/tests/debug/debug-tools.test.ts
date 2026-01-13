import { TransformComponent } from '../../src/core/components';
import { DebugOverlay } from '../../src/debug/debug-overlay';
import { DebugRenderSystem } from '../../src/debug/debug-render-system';
import { Entity } from '../../src/ecs/entity';
import { EntityManager } from '../../src/ecs/entity-manager';
import { Camera } from '../../src/graphics/camera';
import { Renderer } from '../../src/graphics/renderer';
import { ColliderComponent } from '../../src/physics/components';

// Mock Profiler
jest.mock('../../src/debug/profiler', () => ({
  Profiler: {
    getInstance: jest.fn().mockReturnValue({
      fps: 60,
      frameTime: 16.6,
      updateTime: 5.0,
      renderTime: 10.0,
    }),
  },
}));

describe('Debug Tools', () => {
  let mockRenderer: Renderer;
  let mockEntityManager: EntityManager;
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      fillStyle: '',
      fillRect: jest.fn(),
      fillText: jest.fn(),
      strokeStyle: '',
      lineWidth: 1,
      strokeRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
    };

    mockRenderer = {
      renderRect: jest.fn(),
      renderRectStroke: jest.fn(),
      renderText: jest.fn(),
      getContext: jest.fn().mockReturnValue(mockContext),
      begin: jest.fn(),
      end: jest.fn(),
    } as any;

    mockEntityManager = {
      getEntitiesWithComponents: jest.fn().mockReturnValue([]),
    } as any;
  });

  describe('DebugOverlay', () => {
    let debugOverlay: DebugOverlay;

    beforeEach(() => {
      // Mock getEntities for entity count
      (mockEntityManager as any).getEntities = jest.fn().mockReturnValue([]);
      debugOverlay = new DebugOverlay(mockRenderer, mockEntityManager);
    });

    test('should not render when invisible', () => {
      debugOverlay.render();
      expect(mockRenderer.renderRect).not.toHaveBeenCalled();
    });

    test('should render when visible', () => {
      debugOverlay.toggle();
      debugOverlay.render();
      expect(mockRenderer.renderRect).toHaveBeenCalled();
      // Expect 5 calls: FPS, Frame Time, Update Time, Render Time, Entity Count
      // Memory might be present depending on env, but assuming standard jest without perf hooks: 5
      expect(mockRenderer.renderText).toHaveBeenCalledTimes(5); 
    });
  });

  describe('DebugRenderSystem', () => {
    let debugRenderSystem: DebugRenderSystem;

    beforeEach(() => {
      debugRenderSystem = new DebugRenderSystem(mockRenderer, mockEntityManager);
    });

    test('should render colliders', () => {
      const entity = new Entity('test');
      const transform = new TransformComponent(100, 100);
      const collider = new ColliderComponent({ width: 32, height: 32 });

      entity.addComponent(transform);
      entity.addComponent(collider);

      (mockEntityManager.getEntitiesWithComponents as jest.Mock).mockReturnValue([entity]);

      debugRenderSystem.toggle();
      debugRenderSystem.render();

      expect(mockRenderer.renderRectStroke).toHaveBeenCalledWith(
        100,
        100,
        32,
        32,
        expect.any(String),
        expect.any(Number),
      );
    });

    test('should handle camera transform', () => {
      const camera = new Camera(800, 600);
      debugRenderSystem.toggle();
      debugRenderSystem.render(camera);

      expect(mockRenderer.begin).toHaveBeenCalledWith(camera);
      expect(mockRenderer.end).toHaveBeenCalled();
    });
  });
});
