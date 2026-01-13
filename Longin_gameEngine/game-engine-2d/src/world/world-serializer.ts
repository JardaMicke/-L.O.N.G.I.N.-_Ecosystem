import { ChunkManager } from './chunk-manager';
import { Chunk } from './chunk';
import { Logger } from '../utils/logger';

export class WorldSerializer {
    public static serialize(chunkManager: ChunkManager): string {
        Logger.info('Serializing world...');

        // We can't access private chunks map directly unless we add a getter or use 'any'.
        // Better to add a 'getAllChunks()' method to ChunkManager.
        // For now, let's assume we iterate known keys or if we can access internal state.

        // Let's modify ChunkManager to expose chunks or just implement it there.
        // But since this is a separate service, let's coerce for now or assume public access was added.
        // To keep it clean, let's assume valid public API:

        // ACTUALLY: Let's treat ChunkManager as the data source.
        // Since we don't want to modify ChunkManager too much right now, let's cast to any to access private map
        // just for this prototype phase. Ideally: add public iterator.

        const mgr = chunkManager as any;
        const chunksData = [];

        if (mgr.chunks) { // accessing private map via JS dynamic nature
            for (const [key, chunk] of mgr.chunks.entries()) {
                chunksData.push(chunk.serialize());
            }
        }

        return JSON.stringify({
            version: 1,
            timestamp: Date.now(),
            chunks: chunksData
        });
    }

    public static deserialize(json: string, chunkManager: ChunkManager): void {
        Logger.info('Deserializing world...');
        try {
            const data = JSON.parse(json);
            // Clear existing?
            // (chunkManager as any).chunks.clear();

            if (data.chunks && Array.isArray(data.chunks)) {
                for (const chunkData of data.chunks) {
                    const chunk = Chunk.deserialize(chunkData);
                    // Manually inject into manager
                    (chunkManager as any).chunks.set(chunkManager.getChunkKey(chunk.x, chunk.y), chunk);
                }
            }
        } catch (e) {
            Logger.error('Failed to deserialize world', e as Error);
        }
    }
}
