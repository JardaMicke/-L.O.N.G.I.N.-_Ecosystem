import { TerrainGenerator } from '../../src/world/terrain-generator';
import { Tilemap } from '../../src/world/tilemap';

describe('Tilemap', () => {
  let tilemap: Tilemap;

  beforeEach(() => {
    tilemap = new Tilemap(10, 10, 32);
    tilemap.registerTile(1, { id: 1, type: 'grass', walkable: true });
    tilemap.registerTile(2, { id: 2, type: 'wall', walkable: false });
  });

  test('should initialize correctly', () => {
    expect(tilemap.width).toBe(10);
    expect(tilemap.height).toBe(10);
    expect(tilemap.tileSize).toBe(32);
  });

  test('should set and get tiles', () => {
    tilemap.setTile('default', 5, 5, 1);
    expect(tilemap.getTileId('default', 5, 5)).toBe(1);

    const tile = tilemap.getTile('default', 5, 5);
    expect(tile).toBeDefined();
    expect(tile?.type).toBe('grass');
  });

  test('should check walkability', () => {
    tilemap.setTile('default', 0, 0, 1); // Grass
    tilemap.setTile('default', 0, 1, 2); // Wall

    expect(tilemap.isWalkable(0, 0)).toBe(true);
    expect(tilemap.isWalkable(0, 1)).toBe(false);
    expect(tilemap.isWalkable(99, 99)).toBe(false); // Out of bounds
  });
});

describe('TerrainGenerator', () => {
  test('should generate terrain', () => {
    const tilemap = new Tilemap(20, 20, 32);
    const generator = new TerrainGenerator(12345);

    generator.generate(tilemap, { grassId: 1, wallId: 2, waterId: 3 });

    // Check if some tiles are set (not all 0)
    let setTiles = 0;
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        if (tilemap.getTileId('default', x, y) !== 0) {
          setTiles++;
        }
      }
    }
    expect(setTiles).toBe(400); // Should fill all
  });
});
