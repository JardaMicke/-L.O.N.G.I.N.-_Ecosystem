import { Chunk } from '../../src/world/chunk';
import { ChunkManager } from '../../src/world/chunk-manager';
import { TerrainGenerator, GenerationConfig } from '../../src/world/terrain-generator';

describe('Chunk System', () => {
    let chunkManager: ChunkManager;

    beforeEach(() => {
        chunkManager = new ChunkManager();
    });

    it('should create a chunk with correct coordinates', () => {
        const chunk = new Chunk(1, 2);
        expect(chunk.x).toBe(1);
        expect(chunk.y).toBe(2);
        expect(chunk.layers.length).toBe(3);
    });

    it('should load chunks around player', () => {
        chunkManager.loadRadius = 1;
        chunkManager.update({ x: 0, y: 0 });

        // Center 0,0. Radius 1 means -1 to 1. Total 3x3 = 9 chunks.
        expect(chunkManager.getLoadedChunksCount()).toBe(9);
        expect(chunkManager.getChunk(0, 0)).toBeDefined();
        expect(chunkManager.getChunk(1, 1)).toBeDefined();
        expect(chunkManager.getChunk(2, 2)).toBeUndefined();
    });

    it('should unload distant chunks', () => {
        chunkManager.loadRadius = 1;
        chunkManager.update({ x: 0, y: 0 });
        expect(chunkManager.getChunk(0, 0)).toBeDefined();

        // Move far away
        chunkManager.update({ x: 1000, y: 1000 });
        expect(chunkManager.getChunk(0, 0)).toBeUndefined();
    });
});

describe('Terrain Generator & Biomes', () => {
    it('should generate chunk data', () => {
        const generator = new TerrainGenerator(123);
        const chunk = new Chunk(0, 0);
        const config: GenerationConfig = {
            grassId: 1,
            wallId: 2,
            waterId: 3,
            sandId: 4,
            forestId: 5,
            snowId: 6
        };

        generator.generateChunk(chunk, config);

        // Check if tiles are set
        let hasNonZero = false;
        for (let y = 0; y < Chunk.SIZE; y++) {
            for (let x = 0; x < Chunk.SIZE; x++) {
                if (chunk.getTile(0, x, y) !== 0) {
                    hasNonZero = true;
                    break;
                }
            }
        }
        expect(hasNonZero).toBe(true);
    });
});
