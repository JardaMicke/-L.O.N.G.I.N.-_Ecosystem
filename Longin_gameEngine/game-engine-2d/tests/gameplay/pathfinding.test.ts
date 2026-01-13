import { PathfindingManager } from '../../src/gameplay/pathfinding-manager';
import { Tilemap } from '../../src/world/tilemap';

// Mock Tilemap
jest.mock('../../src/world/tilemap');

describe('PathfindingManager', () => {
  let pathfindingManager: PathfindingManager;
  let mockTilemap: jest.Mocked<Tilemap>;

  beforeEach(() => {
    // Setup mock tilemap
    mockTilemap = new Tilemap(10, 10, 32) as jest.Mocked<Tilemap>;
    (mockTilemap as any).width = 10;
    (mockTilemap as any).height = 10;

    // Default isWalkable to true
    mockTilemap.isWalkable.mockReturnValue(true);

    pathfindingManager = new PathfindingManager(mockTilemap);
  });

  test('should find a simple path', () => {
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 0 };

    const path = pathfindingManager.findPath(start, end);

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(end);
  });

  test('should avoid obstacles', () => {
    // Block (1, 0)
    mockTilemap.isWalkable.mockImplementation((x, y) => {
      if (x === 1 && y === 0) return false;
      return true;
    });

    // Force update because we changed mock implementation behavior but manager might cache?
    // Actually manager caches grid on updateGrid.
    // We need to invalidate or just let it update on first call if dirty.
    // But here we are reusing the instance, so if it was initialized/updated before, it has old grid.
    // The constructor doesn't call updateGrid. findPath does.
    // So first call to findPath updates grid.

    // Let's create new manager to be safe or invalidate
    pathfindingManager.invalidate();

    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 0 };

    const path = pathfindingManager.findPath(start, end);

    // Should go around (1, 0) -> e.g., (0,0) -> (0,1) -> (1,1) -> (2,1) -> (2,0)
    // Or (0,0) -> (0,1) -> (1,1) -> (2,1) -> (2,0)

    const obstacle = { x: 1, y: 0 };
    const hitsObstacle = path.some((p) => p.x === obstacle.x && p.y === obstacle.y);

    expect(hitsObstacle).toBe(false);
    expect(path[path.length - 1]).toEqual(end);
  });

  test('should return empty path if unreachable', () => {
    mockTilemap.isWalkable.mockReturnValue(false); // All blocked
    // Except start? Start needs to be walkable? usually yes but logic might allow starting on blocked.
    // The algorithm checks neighbors.
    // Let's make start walkable but surrounding blocked.

    mockTilemap.isWalkable.mockImplementation((x, y) => {
      if (x === 0 && y === 0) return true;
      return false;
    });

    pathfindingManager.invalidate();

    const start = { x: 0, y: 0 };
    const end = { x: 5, y: 5 };

    const path = pathfindingManager.findPath(start, end);

    expect(path).toEqual([]);
  });
});
