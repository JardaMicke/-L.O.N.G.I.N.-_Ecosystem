import { Entity } from '../ecs/entity';
import { Logger } from '../utils/logger';

/**
 * Camera class for controlling the viewport in a 2D world.
 * Supports following entities, zooming, and clamping to world bounds.
 */
export class Camera {
  /** X coordinate of the camera's top-left corner in world space */
  public x: number = 0;
  
  /** Y coordinate of the camera's top-left corner in world space */
  public y: number = 0;
  
  /** Width of the viewport in screen pixels */
  public width: number;
  
  /** Height of the viewport in screen pixels */
  public height: number;
  
  /** Zoom level (scale factor). 1 is default, >1 zooms in, <1 zooms out */
  public zoom: number = 1;
  
  /** Entity being followed by the camera */
  public target: Entity | null = null;

  // Bounds to limit camera movement (e.g. map size)
  /** Bounds rectangle to limit camera movement, or null if unbounded */
  public bounds: { x: number; y: number; width: number; height: number } | null = null;

  /**
   * Creates a new Camera instance.
   * 
   * @param {number} width - Viewport width.
   * @param {number} height - Viewport height.
   */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Resizes the camera viewport.
   * 
   * @param {number} width - New width.
   * @param {number} height - New height.
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Sets the camera to follow a specific entity.
   * 
   * @param {Entity} target - The entity to follow.
   */
  public follow(target: Entity): void {
    this.target = target;
    Logger.info(`Camera following entity ${target.id}`);
  }

  /**
   * Stops following any entity.
   */
  public unfollow(): void {
    this.target = null;
  }

  /**
   * Sets the boundaries for camera movement.
   * The camera will not show anything outside these bounds.
   * 
   * @param {number} x - Min X world coordinate.
   * @param {number} y - Min Y world coordinate.
   * @param {number} width - Width of the bounded area.
   * @param {number} height - Height of the bounded area.
   */
  public setBounds(x: number, y: number, width: number, height: number): void {
    this.bounds = { x, y, width, height };
  }

  /**
   * Centers the camera on a specific world position.
   * 
   * @param {number} x - World X coordinate to look at.
   * @param {number} y - World Y coordinate to look at.
   */
  public lookAt(x: number, y: number): void {
    this.x = x - this.width / 2 / this.zoom;
    this.y = y - this.height / 2 / this.zoom;
  }

  /**
   * Updates the camera position.
   * If following a target, smoothly moves towards it (currently snap).
   * Clamps position to bounds if set.
   * 
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(deltaTime: number): void {
    if (this.target) {
      // Assuming target has a Position component or we can access its position
      // For now, let's assume we fetch position from a known component or property
      // In a real ECS, we'd query the PositionComponent.
      // Since Entity is generic, we'll need a way to get position.
      // Let's assume we can pass a position getter or the entity has x/y properties injected/mixin

      // HACK: For now, I'll assume Entity has a 'getPosition' method or similar if we cast it,
      // OR we just use a placeholder.
      // Ideally, the System handles the movement, and the Camera just holds the data.
      // BUT, usually Camera has a "follow" logic update.

      // Let's use a "Position" component convention.
      const posComponent = this.target.getComponent('Position') as any; // any for now
      if (posComponent) {
        // Center the camera on the target
        this.x = posComponent.x - this.width / 2 / this.zoom;
        this.y = posComponent.y - this.height / 2 / this.zoom;
      }
    }

    // Clamp to bounds
    if (this.bounds) {
      this.x = Math.max(
        this.bounds.x,
        Math.min(this.x, this.bounds.x + this.bounds.width - this.width / this.zoom),
      );
      this.y = Math.max(
        this.bounds.y,
        Math.min(this.y, this.bounds.y + this.bounds.height - this.height / this.zoom),
      );
    }
  }

  /**
   * Converts world coordinates to screen coordinates.
   * 
   * @param {number} worldX - World X coordinate.
   * @param {number} worldY - World Y coordinate.
   * @returns {{x: number, y: number}} Screen coordinates.
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom,
    };
  }

  /**
   * Converts screen coordinates to world coordinates.
   * 
   * @param {number} screenX - Screen X coordinate.
   * @param {number} screenY - Screen Y coordinate.
   * @returns {{x: number, y: number}} World coordinates.
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.zoom + this.x,
      y: screenY / this.zoom + this.y,
    };
  }
}
