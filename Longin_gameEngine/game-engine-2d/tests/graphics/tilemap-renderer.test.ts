import { Camera } from '../../src/graphics/camera';
import { Renderer } from '../../src/graphics/renderer';
import { TilemapRenderer } from '../../src/graphics/tilemap-renderer';
import { Tilemap } from '../../src/world/tilemap';

// Mock Canvas and Context
const mockContext = {
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  fillStyle: '',
  fillRect: jest.fn(),
} as unknown as CanvasRenderingContext2D;

const mockRenderer = {
  getContext: jest.fn().mockReturnValue(mockContext),
  renderRect: jest.fn((x, y, w, h, color) => {
    mockContext.fillStyle = color;
    mockContext.fillRect(x, y, w, h);
  }),
} as unknown as Renderer;

describe('TilemapRenderer', () => {
  let tilemapRenderer: TilemapRenderer;
  let tilemap: Tilemap;

  beforeEach(() => {
    tilemapRenderer = new TilemapRenderer(mockRenderer);
    tilemap = new Tilemap(10, 10, 32);
    tilemap.registerTile(1, { id: 1, type: 'grass', walkable: true });
    tilemap.setTile('default', 0, 0, 1);
    jest.clearAllMocks();
  });

  test('should render visible tiles', () => {
    const camera = new Camera(800, 600); // Covers whole map (10*32 = 320)

    tilemapRenderer.render(tilemap, camera);

    expect(mockRenderer.getContext).toHaveBeenCalled();
    expect(mockContext.save).toHaveBeenCalled();
    expect(mockContext.restore).toHaveBeenCalled();

    // One tile set at 0,0
    expect(mockRenderer.renderRect).toHaveBeenCalledWith(0, 0, 32, 32, expect.any(String));
  });

  test('should respect camera culling', () => {
    // Tile at 9,9 (coords 288, 288)
    tilemap.setTile('default', 9, 9, 1);

    // Camera looking at 0,0 with size 100x100
    const camera = new Camera(100, 100);

    tilemapRenderer.render(tilemap, camera);

    // Should render 0,0
    expect(mockRenderer.renderRect).toHaveBeenCalledWith(0, 0, 32, 32, expect.any(String));

    // Should NOT render 9,9 (288, 288)
    expect(mockRenderer.renderRect).not.toHaveBeenCalledWith(288, 288, 32, 32, expect.any(String));
  });
});
