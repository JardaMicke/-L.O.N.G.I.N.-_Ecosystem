import { Sprite } from '../../src/tools/sprite-editor';
import { ToolManager } from '../../src/tools/tool-manager';
import { Tilemap } from '../../src/world/tilemap';
import { SpriteManager } from '../../src/graphics/sprite-manager';
import { ResourceManager } from '../../src/core/resource-manager';

jest.mock('../../src/graphics/sprite-manager');
jest.mock('../../src/core/resource-manager');

describe('ToolManager', () => {
  let toolManager: ToolManager;
  let tilemap: Tilemap;
  let mockSpriteManager: jest.Mocked<SpriteManager>;
  let mockResourceManager: jest.Mocked<ResourceManager>;

  beforeEach(() => {
    mockResourceManager = new ResourceManager() as jest.Mocked<ResourceManager>;
    mockSpriteManager = new SpriteManager(mockResourceManager) as jest.Mocked<SpriteManager>;
    toolManager = new ToolManager(mockSpriteManager);
    tilemap = new Tilemap(10, 10, 32);
  });

  it('should start map editing', () => {
    const editor = toolManager.startMapEditing(tilemap);
    expect(editor).toBeDefined();
    expect(toolManager.mapEditor).toBe(editor);
    expect(editor.tilemap).toBe(tilemap);
  });

  it('should start sprite editing with dimensions', () => {
    const editor = toolManager.startSpriteEditing(16, 16);
    expect(editor).toBeDefined();
    expect(toolManager.spriteEditor).toBe(editor);
    expect(editor.sprite.width).toBe(16);
  });

  it('should load sprite for editing', () => {
    const sprite = new Sprite(32, 32);
    const editor = toolManager.loadSpriteForEditing(sprite);
    expect(editor).toBeDefined();
    expect(toolManager.spriteEditor).toBe(editor);
    expect(editor.sprite).toBe(sprite);
  });

  it('should stop editing', () => {
    toolManager.startMapEditing(tilemap);
    toolManager.startSpriteEditing(16, 16);

    toolManager.stopEditing();

    expect(toolManager.mapEditor).toBeUndefined();
    expect(toolManager.spriteEditor).toBeUndefined();
  });
});
