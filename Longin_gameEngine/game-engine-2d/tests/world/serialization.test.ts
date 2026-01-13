import { WorldSerializer } from '../../src/world/world-serializer';
import { ChunkManager } from '../../src/world/chunk-manager';
import { Chunk } from '../../src/world/chunk';

describe('WorldSerializer', () => {
    it('should serialize and deserialize a world', () => {
        const mgr = new ChunkManager();
        // Use public API or cast to load usage
        // ChunkManager loadChunk is private, but update() loads them.
        // Or we manually inject for testing.
        const chunk = new Chunk(1, 1);
        chunk.setTile(0, 5, 5, 123);

        // Inject
        (mgr as any).chunks.set(mgr.getChunkKey(1, 1), chunk);

        const json = WorldSerializer.serialize(mgr);
        expect(json).toContain('"x":1');
        expect(json).toContain('"y":1');

        // New manager
        const newMgr = new ChunkManager();
        WorldSerializer.deserialize(json, newMgr);

        const loaded = newMgr.getChunk(1, 1);
        expect(loaded).toBeDefined();
        expect(loaded?.getTile(0, 5, 5)).toBe(123);
    });
});
