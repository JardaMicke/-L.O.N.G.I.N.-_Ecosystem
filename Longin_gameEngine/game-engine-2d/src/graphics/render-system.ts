import { TransformComponent } from '../core/components';
import { ResourceManager } from '../core/resource-manager';
import { Entity } from '../ecs/entity';
import { System } from '../ecs/system';

import { Camera } from './camera';
import { SpriteComponent, AnimationComponent } from './components';
import { Renderer } from './renderer';
import { SpriteManager } from './sprite-manager';

/**
 * System responsible for rendering sprites and handling animations.
 * Sorts entities by layer and renders them using the Renderer.
 */
export class RenderSystem extends System {
  private renderer: Renderer;
  private resourceManager: ResourceManager;
  private spriteManager: SpriteManager;

  /**
   * Creates a new RenderSystem.
   * 
   * @param {Renderer} renderer - The renderer instance.
   * @param {ResourceManager} resourceManager - The resource manager for textures.
   * @param {SpriteManager} spriteManager - The sprite manager for variants/animations.
   */
  constructor(renderer: Renderer, resourceManager: ResourceManager, spriteManager: SpriteManager) {
    super();
    this.renderer = renderer;
    this.resourceManager = resourceManager;
    this.spriteManager = spriteManager;
    this.requiredComponents = ['Transform', 'Sprite'];
  }

  private visibleEntities: Entity[] = [];

  /**
   * Updates animations for entities.
   * Advances frame timers and updates sprite source coordinates.
   * 
   * @param {Entity[]} entities - List of entities.
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(entities: Entity[], deltaTime: number): void {
    this.visibleEntities = entities;

    // Handle Animations
    for (const entity of entities) {
      const animation = entity.getComponent<AnimationComponent>('Animation');
      const sprite = entity.getComponent<SpriteComponent>('Sprite');

      if (animation && sprite && animation.playing) {
        const animData = animation.animations.get(animation.currentAnim);
        if (animData) {
          animation.timer += deltaTime;
          if (animation.timer >= animData.speed) {
            animation.timer = 0;
            animation.frameIndex++;

            if (animation.frameIndex >= animData.frames.length) {
              if (animData.loop) {
                animation.frameIndex = 0;
              } else {
                animation.frameIndex = animData.frames.length - 1;
                animation.playing = false;
              }
            }

            // Update sprite srcX based on frame index
            const frameIdx = animData.frames[animation.frameIndex];
            sprite.srcX = frameIdx * sprite.srcWidth;
          }
        }
      }
    }
  }

  /**
   * Renders all visible entities sorted by layer.
   * Applies camera transformations if provided.
   * Draws sprites using the SpriteManager for variant resolution.
   * 
   * @param {Camera} [camera] - The active camera for the scene.
   * @returns {void}
   */
  public render(camera?: Camera): void {
    const entities = Array.from(this.visibleEntities);

    // Sort by layer
    entities.sort((a, b) => {
      const spriteA = a.getComponent<SpriteComponent>('Sprite');
      const spriteB = b.getComponent<SpriteComponent>('Sprite');
      if (spriteA && spriteB) {
        return spriteA.layer - spriteB.layer;
      }
      return 0;
    });

    // Begin batch/camera transform
    if (camera) {
      this.renderer.begin(camera);
    }

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform');
      const sprite = entity.getComponent<SpriteComponent>('Sprite');

      if (transform && sprite && sprite.visible) {
        const seed = this.stringToHash(entity.id);
        const textureId = this.spriteManager.resolveVariant(sprite.textureId, seed);
        const texture = this.resourceManager.getImage(textureId);
        
        if (texture) {
          this.renderer.renderSprite(
            texture,
            transform.x,
            transform.y,
            sprite.width * transform.scaleX,
            sprite.height * transform.scaleY,
            transform.rotation,
            sprite.srcWidth > 0 ? sprite.srcX : undefined,
            sprite.srcHeight > 0 ? sprite.srcY : undefined,
            sprite.srcWidth > 0 ? sprite.srcWidth : undefined,
            sprite.srcHeight > 0 ? sprite.srcHeight : undefined,
          );
        } else {
          // Draw placeholder if texture not found
          this.renderer.renderRect(
            transform.x,
            transform.y,
            sprite.width,
            sprite.height,
            'magenta',
          );
        }
      }
    }

    if (camera) {
      this.renderer.end();
    }
  }

  /**
   * Generates a numeric hash from a string.
   * Used for deterministic variant selection.
   * 
   * @param {string} s - Input string.
   * @returns {number} Numeric hash.
   */
  private stringToHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h;
  }
}
