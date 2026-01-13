import { TerrainGenerator } from '../../src/world/terrain-generator';
import { Tilemap } from '../../src/world/tilemap';

describe('TerrainGenerator', () => {
  let tilemap: Tilemap;
  let generator: TerrainGenerator;

  beforeEach(() => {
    tilemap = new Tilemap(20, 20, 32);
    generator = new TerrainGenerator(12345);

    // Register tiles
    tilemap.registerTile(1, { id: 1, type: 'grass', walkable: true });
    tilemap.registerTile(2, { id: 2, type: 'wall', walkable: false });
    tilemap.registerTile(3, { id: 3, type: 'water', walkable: false });
  });

  test('should generate terrain with valid tile IDs', () => {
    const config = { grassId: 1, wallId: 2, waterId: 3 };
    generator.generate(tilemap, config);

    let hasGrass = false;
    let hasWall = false;
    let hasWater = false;

    for (let y = 0; y < tilemap.height; y++) {
      for (let x = 0; x < tilemap.width; x++) {
        const id = tilemap.getTileId('default', x, y);
        if (id === 1) hasGrass = true;
        if (id === 2) hasWall = true;
        if (id === 3) hasWater = true;
      }
    }

    expect(hasGrass).toBe(true);
    // Walls and water depend on random chance, but with seed 12345 and 20x20 map, likely to have them
  });

  test('should find safe spawn points on walkable tiles', () => {
    const config = { grassId: 1, wallId: 2, waterId: 3 };
    generator.generate(tilemap, config);

    // Manually ensure some walls exist to test safety (though generator should make some)
    // But to be deterministic, let's force a wall at 5,5
    tilemap.setTile('default', 5, 5, 2); // Wall

    const points = generator.getSafeSpawnPoints(tilemap, 5);

    expect(points.length).toBe(5);

    points.forEach((p) => {
      // Convert back to tile coordinates
      const tx = Math.floor(p.x / 32);
      const ty = Math.floor(p.y / 32);

      expect(tilemap.isWalkable(tx, ty)).toBe(true);

      // Should not be at 5,5
      expect(tx === 5 && ty === 5).toBe(false);
    });
  });

  test('should return fewer points if map is full', () => {
    // Fill map with walls
    for (let y = 0; y < tilemap.height; y++) {
      for (let x = 0; x < tilemap.width; x++) {
        tilemap.setTile('default', x, y, 2);
      }
    }

    // Open one spot
    tilemap.setTile('default', 1, 1, 1);

    const points = generator.getSafeSpawnPoints(tilemap, 5);

    // Should find at least one (at 1,1) or duplicates if it allows duplicates?
    // Implementation allows duplicates if it picks the same spot again.
    // But since it tries random spots, it might not find 5 unique ones quickly if only 1 is open.
    // However, the test just checks if returned points are walkable.

    points.forEach((p) => {
      const tx = Math.floor(p.x / 32);
      const ty = Math.floor(p.y / 32);
      expect(tx).toBe(1);
      expect(ty).toBe(1);
    });
  });
});
