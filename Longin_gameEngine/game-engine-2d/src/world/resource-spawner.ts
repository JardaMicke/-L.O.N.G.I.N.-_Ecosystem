import { Chunk } from './chunk';
import { BiomeType, BiomeGenerator } from './biome-generator';

export interface SpawnRule {
    resourceId: string; // e.g., 'tree', 'rock', 'gold'
    biome: BiomeType;
    chance: number; // 0-1 per tile
}

export class ResourceSpawner {
    private rules: SpawnRule[] = [
        { resourceId: 'tree', biome: BiomeType.FOREST, chance: 0.1 },
        { resourceId: 'tree', biome: BiomeType.GRASSLAND, chance: 0.01 },
        { resourceId: 'cactus', biome: BiomeType.DESERT, chance: 0.02 },
        { resourceId: 'rock', biome: BiomeType.SNOW, chance: 0.05 },
        { resourceId: 'gold_vein', biome: BiomeType.OCEAN, chance: 0.0 } // None in ocean
    ];

    constructor(private biomeGenerator: BiomeGenerator) { }

    public populateChunk(chunk: Chunk): void {
        const layerIndex = 1; // Decoration layer

        for (let y = 0; y < Chunk.SIZE; y++) {
            for (let x = 0; x < Chunk.SIZE; x++) {
                // Calculate world position
                const worldX = chunk.x * Chunk.SIZE + x;
                const worldY = chunk.y * Chunk.SIZE + y;

                const biome = this.biomeGenerator.getBiome(worldX, worldY);

                for (const rule of this.rules) {
                    if (rule.biome === biome) {
                        if (Math.random() < rule.chance) {
                            // In a real system, we'd map string IDs to numeric Tile IDs
                            // For now, let's assume hash or predefined IDs
                            const tileId = this.getResourceTileId(rule.resourceId);
                            chunk.setTile(layerIndex, x, y, tileId);
                            break; // Spawn only one resource per tile
                        }
                    }
                }
            }
        }
    }

    private getResourceTileId(resourceId: string): number {
        // Placeholder mapping
        switch (resourceId) {
            case 'tree': return 101;
            case 'rock': return 102;
            case 'cactus': return 103;
            case 'gold_vein': return 104;
            default: return 0;
        }
    }
}
