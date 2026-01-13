import { ResourceManager } from '../../src/core/resource-manager';
import { Entity } from '../../src/ecs/entity';
import { Camera } from '../../src/graphics/camera';
import { LayerManager } from '../../src/graphics/layer-system';
import { SpriteManager } from '../../src/graphics/sprite-manager';

describe('Graphics System', () => {
  describe('Camera', () => {
    test('should transform coordinates correctly', () => {
      const camera = new Camera(800, 600);
      camera.x = 100;
      camera.y = 100;
      camera.zoom = 2;

      // World (150, 150) -> Relative (50, 50) * 2 = Screen (100, 100)
      const screen = camera.worldToScreen(150, 150);
      expect(screen.x).toBe(100);
      expect(screen.y).toBe(100);

      // Screen (200, 200) -> / 2 = (100, 100) + Cam(100, 100) = World (200, 200)
      const world = camera.screenToWorld(200, 200);
      expect(world.x).toBe(200);
      expect(world.y).toBe(200);
    });

    test('should follow entity', () => {
      const camera = new Camera(800, 600);
      const entity = new Entity('player');
      // Mock component
      (entity as any).getComponent = () => ({ x: 500, y: 500 });

      camera.follow(entity);
      camera.update(1);

      // Camera should center on 500,500
      // x = 500 - 400 = 100
      expect(camera.x).toBe(100);
      expect(camera.y).toBe(200); // 500 - 300 = 200
    });
  });

  describe('LayerManager', () => {
    test('should sort layers by zIndex', () => {
      const manager = new LayerManager();
      manager.addLayer('foreground', 100);
      manager.addLayer('background', -100);

      const layers = manager.getLayers();
      expect(layers[0].name).toBe('background');
      expect(layers[layers.length - 1].name).toBe('foreground');
    });
  });

  describe('SpriteManager', () => {
    test('should calculate frames correctly', async () => {
      const rm = new ResourceManager();
      // Mock loadImage
      rm.loadImage = jest.fn().mockImplementation(async () => ({ width: 100, height: 100 }));
      rm.getImage = jest.fn().mockReturnValue({ width: 100, height: 100 });

      const sm = new SpriteManager(rm);
      sm.registerSpriteSheet('hero', 'hero.png', 32, 32); // 3x3 grid approx

      // Force load or just assume image is "loaded" by mock

      const rect = sm.getFrameRect('hero', 4); // 2nd row, 2nd col (indices: 0,1,2 | 3,4,5)
      // 100 / 32 = 3 cols (0, 1, 2)
      // index 4: row 1, col 1

      expect(rect).toBeDefined();
      expect(rect!.x).toBe(32);
      expect(rect!.y).toBe(32);
    });
  });
});
