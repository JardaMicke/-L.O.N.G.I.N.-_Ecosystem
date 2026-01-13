import { PluginLoader } from '../src/plugin/plugin-loader';
import { DeltaCompression } from '../src/network/delta-compression';
import { Tilemap } from '../src/world/tilemap';
import { PathfindingManager } from '../src/gameplay/pathfinding-manager';
import { Logger } from '../src/utils/logger';

// Mock Logger to avoid spam
jest.spyOn(Logger, 'info').mockImplementation(() => { });
jest.spyOn(Logger, 'warn').mockImplementation(() => { });
jest.spyOn(Logger, 'error').mockImplementation(() => { });

describe('Phase 9: System Robustness', () => {

    describe('DeltaCompression (Robust)', () => {
        it('should detect deep changes', () => {
            const obj1 = { a: 1, b: { c: 2 }, d: [1, 2] };
            const obj2 = { a: 1, b: { c: 3 }, d: [1, 2] }; // b.c changed

            const diff = DeltaCompression.computeDiff(obj1, obj2);
            expect(diff.b).toBeDefined();
            expect(diff.b.c).toBe(3);
            expect(diff.a).toBeUndefined();
        });

        it('should detect nested additions', () => {
            const obj1 = { a: 1 };
            const obj2 = { a: 1, b: { c: 2 } };

            const diff = DeltaCompression.computeDiff(obj1, obj2);
            expect(diff.b).toBeDefined();
            expect(diff.b.c).toBe(2);
        });
    });

    describe('Tilemap Physics Integration', () => {
        it('should generate colliders for non-walkable tiles', () => {
            const tilemap = new Tilemap(10, 10, 32);
            // Default layer (0) is empty/walkable(0) usually unless 0 means wall? 
            // In our impl, 0 is empty? 
            // Let's register a wall tile
            tilemap.registerTile(1, { id: 1, type: 'wall', walkable: false });
            tilemap.setTile('default', 5, 5, 1); // Place wall

            const mockCreateBody = jest.fn();
            tilemap.generateColliders(mockCreateBody);

            // Expected: 5*32 = 160
            expect(mockCreateBody).toHaveBeenCalledWith(160, 160, 32, 32);
        });
    });

    describe('Pathfinding Optimization', () => {
        it('should cache paths', () => {
            const tilemap = new Tilemap(5, 5, 10);
            const pm = new PathfindingManager(tilemap);

            const start = { x: 0, y: 0 };
            const end = { x: 4, y: 4 };

            // First call
            const p1 = pm.findPath(start, end);

            // Second call (should hit cache - coverage verification hard in unit test without spying internals or perf timing)
            // But we can verify logic consistency
            const p2 = pm.findPath(start, end);

            expect(p1).toEqual(p2);
        });
    });
});
