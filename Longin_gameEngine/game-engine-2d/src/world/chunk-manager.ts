import { Logger } from '../utils/logger';
import { Chunk, Vector2 } from './chunk';

export class ChunkManager {
    private chunks: Map<string, Chunk> = new Map();
    private activeChunkKeys: Set<string> = new Set();

    // Radius in chunks to keep loaded around the center
    public renderRadius: number = 2;
    public loadRadius: number = 3;

    constructor() { }

    public update(centerPos: Vector2): void {
        const centerChunkX = Math.floor(centerPos.x / Chunk.SIZE);
        const centerChunkY = Math.floor(centerPos.y / Chunk.SIZE);

        const newActiveKeys = new Set<string>();

        // Load chunks in range
        for (let y = centerChunkY - this.loadRadius; y <= centerChunkY + this.loadRadius; y++) {
            for (let x = centerChunkX - this.loadRadius; x <= centerChunkX + this.loadRadius; x++) {
                const key = this.getChunkKey(x, y);
                newActiveKeys.add(key);

                if (!this.chunks.has(key)) {
                    this.loadChunk(x, y);
                }
            }
        }

        // Unload chunks out of range
        for (const key of this.chunks.keys()) {
            if (!newActiveKeys.has(key)) {
                this.unloadChunk(key);
            }
        }

        this.activeChunkKeys = newActiveKeys;
    }

    public getChunkKey(x: number, y: number): string {
        return `${x},${y}`;
    }

    public getChunk(x: number, y: number): Chunk | undefined {
        return this.chunks.get(this.getChunkKey(x, y));
    }

    public getChunkAtWorldPos(x: number, y: number): Chunk | undefined {
        const chunkX = Math.floor(x / Chunk.SIZE);
        const chunkY = Math.floor(y / Chunk.SIZE);
        return this.getChunk(chunkX, chunkY);
    }

    public getTileAt(x: number, y: number, layer: number = 0): number {
        const chunk = this.getChunkAtWorldPos(x, y);
        if (!chunk) return 0; // Return 0 (empty) if chunk not loaded

        // Local coordinates within chunk
        const localX = Math.abs((x % Chunk.SIZE + Chunk.SIZE) % Chunk.SIZE); // Handle negative coords correctly
        const localY = Math.abs((y % Chunk.SIZE + Chunk.SIZE) % Chunk.SIZE);

        return chunk.getTile(layer, localX, localY);
    }

    private loadChunk(x: number, y: number): void {
        // In future: Load from disk/DB. For now, generate empty/default.
        // We will hook up the TerrainGenerator here later.
        const chunk = new Chunk(x, y);
        this.chunks.set(this.getChunkKey(x, y), chunk);
        // Logger.info(`Loaded chunk ${x},${y}`);
    }

    private unloadChunk(key: string): void {
        // In future: Save to disk/DB
        this.chunks.delete(key);
        // Logger.info(`Unloaded chunk ${key}`);
    }

    public getLoadedChunksCount(): number {
        return this.chunks.size;
    }
}
