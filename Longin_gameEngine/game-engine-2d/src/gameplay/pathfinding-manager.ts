import { Logger } from '../utils/logger';
import { PathfindingUtils, Point } from '../utils/pathfinding-utils';
import { Tilemap } from '../world/tilemap';
import { EntityManager } from '../ecs/entity-manager';
import { SpriteManager } from '../graphics/sprite-manager';
import { TransformComponent } from '../core/components';
import { SpriteComponent } from '../graphics/components';
import { AnimationComponent } from '../graphics/components'; // Assuming this exists or will be used

export class PathfindingManager {
  private tilemap: Tilemap;
  private entityManager?: EntityManager;
  private spriteManager?: SpriteManager;
  private grid: boolean[][] = [];
  private heightMap: number[][] = [];
  private dirty: boolean = true;

  constructor(tilemap: Tilemap, entityManager?: EntityManager, spriteManager?: SpriteManager) {
    this.tilemap = tilemap;
    this.entityManager = entityManager;
    this.spriteManager = spriteManager;
  }

  public getGrid(): boolean[][] {
    if (this.dirty) {
      this.updateGrid();
    }
    return this.grid;
  }

  public updateGrid(): void {
    const width = this.tilemap.width;
    const height = this.tilemap.height;
    const tileSize = this.tilemap.tileSize;

    this.grid = Array(height)
      .fill(false)
      .map(() => Array(width).fill(false));

    this.heightMap = Array(height)
      .fill(0)
      .map(() => Array(width).fill(0));

    // 1. Base Tilemap Walkability and Height
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.grid[y][x] = this.tilemap.isWalkable(x, y);

        // Get base height from default layer (assuming it's ground)
        const tileDef = this.tilemap.getTile('default', x, y);
        if (tileDef && tileDef.properties && tileDef.properties.height) {
          this.heightMap[y][x] = tileDef.properties.height;
        }
      }
    }

    // 2. Entity Overrides (Walkable Zones and Height)
    if (this.entityManager && this.spriteManager) {
      const entities = this.entityManager.getEntitiesWithComponents(['Transform', 'Sprite']);

      // Sort by layer/z-index to ensure top entities override bottom ones
      entities.sort((a, b) => {
        const sa = a.getComponent<SpriteComponent>('Sprite');
        const sb = b.getComponent<SpriteComponent>('Sprite');
        return (sa?.layer || 0) - (sb?.layer || 0);
      });

      for (const entity of entities) {
        const transform = entity.getComponent<TransformComponent>('Transform');
        const sprite = entity.getComponent<SpriteComponent>('Sprite');

        if (!transform || !sprite) continue;

        // Get Metadata
        const sheet = this.spriteManager.getSpriteSheet(sprite.textureId);
        if (!sheet) continue;

        // Try to get animation metadata, fallback to sheet logic if needed
        // For now, iterate all animations or find the 'idle' / current one.
        // Simplified: Check if any animation has metadata that covers this spot.
        // Ideally we check the current animation.
        const animComp = entity.getComponent<AnimationComponent>('Animation');
        const currentAnimName = animComp?.currentAnim || 'default'; // Fallback

        const animation = sheet.animations.get(currentAnimName);

        let zones: Point[][] | undefined;
        let entityHeight = 0;

        if (animation && animation.metadata && animation.metadata.walkableZones) {
          zones = animation.metadata.walkableZones;
        } else {
          // Fallback to Asset Metadata
          const assetMeta = this.spriteManager.getAssetMetadata(sprite.textureId);
          if (assetMeta) {
            if (assetMeta.walkableZones) {
              zones = assetMeta.walkableZones;
            }
            if (assetMeta.accessibleHeight) {
              entityHeight = assetMeta.accessibleHeight;
            }
          }
        }

        if (zones !== undefined) {
          const startX = Math.floor(transform.x / tileSize);
          const endX = Math.ceil((transform.x + sprite.width) / tileSize);
          const startY = Math.floor(transform.y / tileSize);
          const endY = Math.ceil((transform.y + sprite.height) / tileSize);

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              if (y < 0 || y >= height || x < 0 || x >= width) continue;

              const cellCenterX = x * tileSize + tileSize / 2;
              const cellCenterY = y * tileSize + tileSize / 2;

              // Calculate local position relative to sprite (accounting for rotation)
              // Simple translation for now (rotation requires inverse transform)
              // Assuming rotation around center or top-left.
              // If simple:
              let localX = cellCenterX - transform.x;
              let localY = cellCenterY - transform.y;

              // Apply inverse rotation if needed
              if (transform.rotation !== 0) {
                const cos = Math.cos(-transform.rotation);
                const sin = Math.sin(-transform.rotation);
                // Assuming pivot at top-left (0,0) of sprite? Or center?
                // Standard 2D engine usually rotates around center or anchor.
                // But for now, let's assume top-left or use center pivot if implemented.
                // If rotating around center of sprite:
                const centerX = sprite.width / 2;
                const centerY = sprite.height / 2;
                localX -= centerX;
                localY -= centerY;
                const rx = localX * cos - localY * sin;
                const ry = localX * sin + localY * cos;
                localX = rx + centerX;
                localY = ry + centerY;
              }

              let inZone = false;
              for (const zone of zones) {
                if (PathfindingUtils.isPointInPolygon({ x: localX, y: localY }, zone)) {
                  inZone = true;
                  break;
                }
              }

              // STRICT OVERRIDE:
              // If an entity has walkableZones defined (even empty), it dictates walkability for the area it covers.
              // If the point is NOT in a zone, it is blocked (False).
              // If the point IS in a zone, it is walkable (True).

              // Only override if the point is within the sprite's local bounds (0,0 to width,height)
              // Otherwise we might block cells outside the sprite but inside the bounding rect loop
              if (localX >= 0 && localX < sprite.width && localY >= 0 && localY < sprite.height) {
                this.grid[y][x] = inZone;
                if (inZone) {
                  this.heightMap[y][x] += entityHeight;
                }
              }
            }
          }
        }
      }
    }

    this.dirty = false;
    Logger.info('PathfindingManager: Grid updated with Entity Walkability');
  }

  private pathCache: Map<string, Point[]> = new Map();
  private maxCacheSize: number = 100;

  public findPath(start: Point, end: Point): Point[] {
    if (this.dirty) {
      this.updateGrid();
      this.pathCache.clear(); // Invalidate cache if grid changes
    }

    const key = `${start.x},${start.y}-${end.x},${end.y}`;
    if (this.pathCache.has(key)) {
      return this.pathCache.get(key)!;
    }

    const path = PathfindingUtils.findPathAStar(start, end, this.grid);

    // Cache result
    if (this.pathCache.size >= this.maxCacheSize) {
      const firstKey = this.pathCache.keys().next().value;
      if (firstKey) this.pathCache.delete(firstKey);
    }
    this.pathCache.set(key, path);

    return path;
  }

  public invalidate(): void {
    this.dirty = true;
  }

  public isWalkable(x: number, y: number): boolean {
    if (this.dirty) {
      this.updateGrid();
    }
    if (y < 0 || y >= this.grid.length || x < 0 || x >= this.grid[0].length) {
      return false;
    }
    return this.grid[y][x];
  }

  public getAbsoluteHeight(x: number, y: number): number {
    if (this.dirty) {
      this.updateGrid();
    }
    if (y < 0 || y >= this.heightMap.length || x < 0 || x >= this.heightMap[0].length) {
      return 0;
    }
    return this.heightMap[y][x];
  }
}
