import { DebugOverlay } from '../../src/debug/debug-overlay';
import { Renderer } from '../../src/graphics/renderer';
import { EntityManager } from '../../src/ecs/entity-manager';
import { Profiler } from '../../src/debug/profiler';

jest.mock('../../src/graphics/renderer');
jest.mock('../../src/ecs/entity-manager');
jest.mock('../../src/debug/profiler');

describe('DebugOverlay Integration', () => {
  let renderer: jest.Mocked<Renderer>;
  let entityManager: jest.Mocked<EntityManager>;
  let debugOverlay: DebugOverlay;
  let mockProfiler: any;

  beforeEach(() => {
    // Setup Renderer mock
    const MockRenderer = Renderer as jest.MockedClass<typeof Renderer>;
    renderer = new MockRenderer(null as any) as jest.Mocked<Renderer>;
    renderer.renderText = jest.fn();
    renderer.renderRect = jest.fn();

    // Setup EntityManager mock
    const MockEntityManager = EntityManager as jest.MockedClass<typeof EntityManager>;
    entityManager = new MockEntityManager() as jest.Mocked<EntityManager>;
    entityManager.getEntities = jest.fn().mockReturnValue([]);

    // Setup Profiler mock
    mockProfiler = {
      fps: 60,
      frameTime: 16.66,
      updateTime: 5.0,
      renderTime: 10.0,
    };
    (Profiler.getInstance as jest.Mock).mockReturnValue(mockProfiler);

    debugOverlay = new DebugOverlay(renderer, entityManager);
  });

  test('should instantiate correctly', () => {
    expect(debugOverlay).toBeDefined();
    expect(Profiler.getInstance).toHaveBeenCalled();
  });

  test('should not render when not visible', () => {
    debugOverlay.render();
    expect(renderer.renderText).not.toHaveBeenCalled();
    expect(renderer.renderRect).not.toHaveBeenCalled();
  });

  test('should render stats when visible', () => {
    debugOverlay.toggle(); // Make visible
    expect(debugOverlay.isVisible()).toBe(true);

    debugOverlay.render();

    // Check background rendering
    expect(renderer.renderRect).toHaveBeenCalledWith(0, 0, 220, 130, expect.any(String));

    // Check stats rendering
    expect(renderer.renderText).toHaveBeenCalledWith(
      expect.stringContaining('FPS: 60'),
      expect.any(Number),
      expect.any(Number),
      'white'
    );
    expect(renderer.renderText).toHaveBeenCalledWith(
      expect.stringContaining('Frame Time: 16.66ms'),
      expect.any(Number),
      expect.any(Number),
      'white'
    );
    expect(renderer.renderText).toHaveBeenCalledWith(
      expect.stringContaining('Update Time: 5.00ms'),
      expect.any(Number),
      expect.any(Number),
      'white'
    );
    expect(renderer.renderText).toHaveBeenCalledWith(
      expect.stringContaining('Render Time: 10.00ms'),
      expect.any(Number),
      expect.any(Number),
      'white'
    );
    expect(renderer.renderText).toHaveBeenCalledWith(
      expect.stringContaining('Entities: 0'),
      expect.any(Number),
      expect.any(Number),
      'white'
    );
  });
});
