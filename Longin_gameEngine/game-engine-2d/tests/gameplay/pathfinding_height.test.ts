import { PathfindingManager } from '../../src/gameplay/pathfinding-manager';
import { Tilemap } from '../../src/world/tilemap';
import { SpriteManager } from '../../src/graphics/sprite-manager';
import { EntityManager } from '../../src/ecs/entity-manager';
import { Entity } from '../../src/ecs/entity';
import { TransformComponent } from '../../src/core/components';
import { SpriteComponent } from '../../src/graphics/components';

describe('PathfindingManager Height', () => {
  let pf: PathfindingManager;
  let tilemap: Tilemap;
  let spriteManager: SpriteManager;
  let entityManager: EntityManager;

  beforeEach(() => {
    tilemap = new Tilemap(10, 10, 32);
    entityManager = new EntityManager();
    // Mock SpriteManager
    spriteManager = {
        getSpriteSheet: jest.fn(),
        getAssetMetadata: jest.fn(),
    } as any;
    
    pf = new PathfindingManager(tilemap, entityManager, spriteManager);
  });

  it('should return base tile height', () => {
    // Setup tile with height
    const tileDef = { id: 1, type: 'hill', walkable: true, properties: { height: 2 } };
    tilemap.registerTile(1, tileDef);
    tilemap.setTile('default', 0, 0, 1);
    
    pf.updateGrid();
    expect(pf.getAbsoluteHeight(0, 0)).toBe(2);
    expect(pf.getAbsoluteHeight(1, 1)).toBe(0); // Default
  });

  it('should add entity height to base height', () => {
    // Setup tile height = 1
    const tileDef = { id: 1, type: 'ground', walkable: true, properties: { height: 1 } };
    tilemap.registerTile(1, tileDef);
    tilemap.setTile('default', 5, 5, 1);

    // Setup Entity
    const entity = new Entity();
    entity.addComponent(new TransformComponent(5 * 32, 5 * 32));
    entity.addComponent(new SpriteComponent('bridge', 32, 32, 1)); // textureId, w, h, layer
    entityManager.addEntity(entity);

    // Mock Metadata
    (spriteManager.getSpriteSheet as jest.Mock).mockReturnValue({
        animations: new Map() // No animations
    });
    (spriteManager.getAssetMetadata as jest.Mock).mockReturnValue({
        walkableZones: [[{x:0, y:0}, {x:32, y:0}, {x:32, y:32}, {x:0, y:32}]], // Full tile zone
        accessibleHeight: 5
    });

    pf.updateGrid();
    
    // Base 1 + Entity 5 = 6
    expect(pf.getAbsoluteHeight(5, 5)).toBe(6);
  });
});
