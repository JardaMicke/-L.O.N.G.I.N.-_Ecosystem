import { TransformComponent } from '../../src/core/components';
import { Entity } from '../../src/ecs/entity';
import { Camera } from '../../src/graphics/camera';
import { LightComponent } from '../../src/graphics/components';
import { LightingSystem } from '../../src/graphics/lighting-system';
import { Renderer } from '../../src/graphics/renderer';

// Mock Canvas and Context
class MockContext {
  fillStyle: string | any = '#000000';
  strokeStyle: string = '#000000';
  globalCompositeOperation: string = 'source-over';

  fillRect = jest.fn();
  clearRect = jest.fn();
  save = jest.fn();
  restore = jest.fn();
  translate = jest.fn();
  scale = jest.fn();
  createRadialGradient = jest.fn().mockReturnValue({
    addColorStop: jest.fn(),
  });
  beginPath = jest.fn();
  arc = jest.fn();
  fill = jest.fn();
  strokeRect = jest.fn();
  drawImage = jest.fn();
}

class MockCanvas {
  width = 800;
  height = 600;
  getContext = jest.fn().mockReturnValue(new MockContext());
}

describe('LightingSystem', () => {
  let lightingSystem: LightingSystem;
  let mockRenderer: jest.Mocked<Renderer>;
  let mockCamera: Camera;
  let entity: Entity;
  let originalDocument: any;

  beforeEach(() => {
    // Mock document for canvas creation
    originalDocument = global.document;
    (global as any).document = {
      createElement: jest.fn().mockReturnValue(new MockCanvas()),
      getElementById: jest.fn().mockReturnValue(new MockCanvas()),
    };

    mockRenderer = new Renderer({
      width: 800,
      height: 600,
      type: 'canvas',
      vsync: false,
    }) as jest.Mocked<Renderer>;
    mockRenderer.renderOverlay = jest.fn();

    lightingSystem = new LightingSystem(mockRenderer);

    entity = new Entity('light-entity');
    entity.addComponent(new TransformComponent(100, 100));
    entity.addComponent(new LightComponent(50, '#ffffff', 1.0));

    // lightingSystem.addEntity(entity); // System doesn't store entities

    mockCamera = new Camera(800, 600);
  });

  afterEach(() => {
    (global as any).document = originalDocument;
  });

  it('should initialize with correct required components', () => {
    expect(lightingSystem['requiredComponents']).toEqual(['Transform', 'Light']);
  });

  it('should create light canvas on initialization', () => {
    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(lightingSystem['lightCanvas']).toBeDefined();
  });

  it('should render light overlay', () => {
    lightingSystem.render([entity], mockCamera);

    const ctx = lightingSystem['lightCtx'] as unknown as MockContext;

    // 1. Clear
    expect(ctx.clearRect).toHaveBeenCalled();

    // 2. Fill ambient
    // expect(ctx.fillStyle).toBe('rgba(0, 0, 0, 0.5)'); // Cannot check this as it's overwritten by gradient later
    expect(ctx.fillRect).toHaveBeenCalled();

    // 3. Draw light
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledWith(100, 100, 50, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalled();

    // 4. Render overlay to main renderer
    expect(mockRenderer.renderOverlay).toHaveBeenCalled();
  });

  it('should apply camera transform during render', () => {
    mockCamera.x = 50;
    mockCamera.y = 50;
    mockCamera.zoom = 2;

    lightingSystem.render([entity], mockCamera);

    const ctx = lightingSystem['lightCtx'] as unknown as MockContext;
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.translate).toHaveBeenCalled();
    expect(ctx.scale).toHaveBeenCalledWith(2, 2);
    expect(ctx.restore).toHaveBeenCalled();
  });
});
