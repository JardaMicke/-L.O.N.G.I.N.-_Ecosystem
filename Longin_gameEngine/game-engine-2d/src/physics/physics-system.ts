import { TransformComponent } from '../core/components';
import { Entity } from '../ecs/entity';
import { System } from '../ecs/system';

import { PhysicsComponent } from './components';

/**
 * System responsible for applying physics forces to entities.
 * Handles velocity integration, acceleration, friction, and position updates.
 */
export class PhysicsSystem extends System {
  /**
   * Creates a new PhysicsSystem instance.
   * Sets priority to 1 (before rendering, after input) and requires 'Physics' and 'Transform' components.
   */
  constructor() {
    super();
    this.priority = 1; // Run before rendering, after input
    this.requiredComponents = ['Physics', 'Transform'];
  }

  /**
   * Updates physics for all entities with required components.
   * Applies acceleration, friction, velocity limiting, and updates position.
   *
   * @param {Entity[]} entities - List of entities to process.
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const physics = entity.getComponent<PhysicsComponent>('Physics');
      const transform = entity.getComponent<TransformComponent>('Transform');

      if (!physics || !transform || physics.isStatic) continue;

      // Apply acceleration
      physics.velocity.x += physics.acceleration.x * deltaTime;
      physics.velocity.y += physics.acceleration.y * deltaTime;

      // Apply friction (simplified damping)
      if (physics.friction > 0) {
        physics.velocity.x *= 1 - physics.friction * deltaTime;
        physics.velocity.y *= 1 - physics.friction * deltaTime;
      }

      // Clamp velocity
      const speedSq =
        physics.velocity.x * physics.velocity.x + physics.velocity.y * physics.velocity.y;
      if (speedSq > physics.maxVelocity * physics.maxVelocity) {
        const scale = physics.maxVelocity / Math.sqrt(speedSq);
        physics.velocity.x *= scale;
        physics.velocity.y *= scale;
      }

      // Apply velocity to position
      transform.x += physics.velocity.x * deltaTime;
      transform.y += physics.velocity.y * deltaTime;
    }
  }
}
