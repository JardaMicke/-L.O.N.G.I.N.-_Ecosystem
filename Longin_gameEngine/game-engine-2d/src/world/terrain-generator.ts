import { Tilemap } from './tilemap';
import { Chunk } from './chunk';
import { BiomeGenerator, BiomeType } from './biome-generator';
import { ResourceSpawner } from './resource-spawner';

/**
 * Configuration for terrain generation.
 * Specifies tile IDs for different terrain types.
 */
export interface GenerationConfig {
  /** Tile ID for grass (default ground) */
  grassId: number;
  /** Tile ID for walls (obstacles) */
  wallId: number;
  /** Tile ID for water (liquid) */
  waterId: number;
  sandId?: number;
  snowId?: number;
  forestId?: number;
}

/**
 * Procedural terrain generator.
 * Uses a seed-based random number generator to create world maps.
 */
export class TerrainGenerator {
  private seed: number;
  private biomeGenerator: BiomeGenerator;
  private resourceSpawner: ResourceSpawner;

  /**
   * Creates a new TerrainGenerator.
   * 
   * @param {number} seed - The seed for random generation (default: current time).
   */
  constructor(seed: number = Date.now()) {
    this.seed = seed;
    this.biomeGenerator = new BiomeGenerator(seed);
    this.resourceSpawner = new ResourceSpawner(this.biomeGenerator);
  }

  /**
   * Generates terrain on the provided tilemap based on configuration.
   * 
   * @param {Tilemap} tilemap - The target tilemap to populate.
   * @param {GenerationConfig} config - The terrain configuration (tile IDs).
   */
  public generate(tilemap: Tilemap, config: GenerationConfig): void {
    const width = tilemap.width;
    const height = tilemap.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const biome = this.biomeGenerator.getBiome(x, y);
        let tileId = config.grassId;

        switch (biome) {
          case BiomeType.OCEAN: tileId = config.waterId; break;
          case BiomeType.DESERT: tileId = config.sandId || config.grassId; break;
          case BiomeType.SNOW: tileId = config.snowId || config.grassId; break;
          case BiomeType.FOREST: tileId = config.forestId || config.grassId; break;
          default: tileId = config.grassId; break;
        }

        tilemap.setTile('default', x, y, tileId);
      }
    }
  }

  public generateChunk(chunk: Chunk, config: GenerationConfig): void {
    for (let y = 0; y < Chunk.SIZE; y++) {
      for (let x = 0; x < Chunk.SIZE; x++) {
        const worldX = chunk.x * Chunk.SIZE + x;
        const worldY = chunk.y * Chunk.SIZE + y;

        const biome = this.biomeGenerator.getBiome(worldX, worldY);
        let tileId = config.grassId;

        switch (biome) {
          case BiomeType.OCEAN: tileId = config.waterId; break;
          case BiomeType.DESERT: tileId = config.sandId || config.grassId; break;
          case BiomeType.SNOW: tileId = config.snowId || config.grassId; break;
          case BiomeType.FOREST: tileId = config.forestId || config.grassId; break;
          default: tileId = config.grassId; break;
        }

        chunk.setTile(0, x, y, tileId); // Ground layer
      }
    }

    this.resourceSpawner.populateChunk(chunk);
  }

  /**
   * Finds safe spawn points on the map.
   * Avoids walls and non-walkable tiles.
   * 
   * @param {Tilemap} tilemap - The tilemap to check against.
   * @param {number} count - Number of spawn points to find.
   * @returns {{ x: number; y: number }[]} Array of world coordinates (center of tiles).
   */
  public getSafeSpawnPoints(tilemap: Tilemap, count: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const width = tilemap.width;
    const height = tilemap.height;
    const maxAttempts = 1000;

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let found = false;
      while (attempts < maxAttempts && !found) {
        // Random coordinates within bounds (avoid edges)
        const tx = Math.floor(this.random() * (width - 2)) + 1;
        const ty = Math.floor(this.random() * (height - 2)) + 1;

        if (tilemap.isWalkable(tx, ty)) {
          // Convert tile coords to world pixel coords (center of tile)
          points.push({
            x: tx * tilemap.tileSize + tilemap.tileSize / 2,
            y: ty * tilemap.tileSize + tilemap.tileSize / 2,
          });
          found = true;
        }
        attempts++;
      }
    }
    return points;
  }

  /**
   * Generates a pseudo-random number between 0 and 1.
   * Updates the internal seed state.
   * 
   * @returns {number} A random number [0, 1).
   */
  private random(): number {
    // Simple LCG
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}
