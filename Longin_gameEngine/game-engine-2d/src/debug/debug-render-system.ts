import { TransformComponent } from '../core/components';
import { EntityManager } from '../ecs/entity-manager';
import { Camera } from '../graphics/camera';
import { Renderer } from '../graphics/renderer';
import { ColliderComponent } from '../physics/components';

export class DebugRenderSystem {
  private renderer: Renderer;
  private entityManager: EntityManager;
  private visible: boolean = false;

  constructor(renderer: Renderer, entityManager: EntityManager) {
    this.renderer = renderer;
    this.entityManager = entityManager;
  }

  public toggle(): void {
    this.visible = !this.visible;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public render(camera?: Camera): void {
    if (!this.visible) return;

    // If we are drawing world objects, we need the camera transform
    if (camera) {
      this.renderer.begin(camera);
    }

    const entities = this.entityManager.getEntitiesWithComponents(['Transform', 'Collider']);

    entities.forEach((entity) => {
      const transform = entity.getComponent<TransformComponent>('Transform');
      const collider = entity.getComponent<ColliderComponent>('Collider');

      if (transform && collider) {
        this.renderer.renderRectStroke(
          transform.x + collider.offset.x,
          transform.y + collider.offset.y,
          collider.width,
          collider.height,
          'rgba(255, 0, 0, 0.5)',
          1,
        );

        // Draw pivot/center
        this.renderer.renderRect(transform.x - 2, transform.y - 2, 4, 4, 'yellow');
      }
    });

    if (camera) {
      this.renderer.end();
    }
  }
}
