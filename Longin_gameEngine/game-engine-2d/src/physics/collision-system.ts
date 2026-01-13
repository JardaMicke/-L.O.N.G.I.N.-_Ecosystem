import { TransformComponent } from '../core/components';
import { EventSystem } from '../core/event-system';
import { Entity } from '../ecs/entity';
import { System } from '../ecs/system';

import { ColliderComponent, PhysicsComponent } from './components';

/**
 * System responsible for detecting and resolving collisions between entities.
 * Supports AABB (Axis-Aligned Bounding Box) collisions.
 */
export class CollisionSystem extends System {
  /**
   * Creates a new CollisionSystem instance.
   * Sets priority to 2 (after physics movement) and requires 'Collider' and 'Transform' components.
   */
  constructor() {
    super();
    this.priority = 2; // Run after physics movement
    this.requiredComponents = ['Collider', 'Transform'];
  }

  /**
   * Updates the collision system.
   * Performs a naive O(N^2) collision check between all entities with required components.
   * Emits 'collision' events and resolves collisions if not triggers.
   *
   * @param {Entity[]} entities - List of entities to process.
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(entities: Entity[], deltaTime: number): void {
    // Naive O(N^2) check
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i];
        const b = entities[j];

        const colA = a.getComponent<ColliderComponent>('Collider');
        const colB = b.getComponent<ColliderComponent>('Collider');
        const transA = a.getComponent<TransformComponent>('Transform');
        const transB = b.getComponent<TransformComponent>('Transform');

        if (!colA || !colB || !transA || !transB) continue;

        if (this.checkCollision(transA, colA, transB, colB)) {
          // Emit event
          EventSystem.getInstance().emit('collision', { entityA: a, entityB: b });

          // Resolve if not trigger
          if (!colA.isTrigger && !colB.isTrigger) {
            this.resolveCollision(a, b, colA, colB, transA, transB);
          }
        }
      }
    }
  }

  /**
   * Checks for AABB collision between two entities.
   *
   * @param {TransformComponent} ta - Transform of entity A.
   * @param {ColliderComponent} ca - Collider of entity A.
   * @param {TransformComponent} tb - Transform of entity B.
   * @param {ColliderComponent} cb - Collider of entity B.
   * @returns {boolean} True if collision occurs, false otherwise.
   */
  private checkCollision(
    ta: TransformComponent,
    ca: ColliderComponent,
    tb: TransformComponent,
    cb: ColliderComponent,
  ): boolean {
    // AABB check
    const leftA = ta.x + ca.offset.x;
    const rightA = leftA + ca.width;
    const topA = ta.y + ca.offset.y;
    const bottomA = topA + ca.height;

    const leftB = tb.x + cb.offset.x;
    const rightB = leftB + cb.width;
    const topB = tb.y + cb.offset.y;
    const bottomB = topB + cb.height;

    return leftA < rightB && rightA > leftB && topA < bottomB && bottomA > topB;
  }

  /**
   * Resolves collision between two entities by separating them.
   * Adjusts position and resets velocity based on static/dynamic properties.
   *
   * @param {Entity} a - Entity A.
   * @param {Entity} b - Entity B.
   * @param {ColliderComponent} ca - Collider of entity A.
   * @param {ColliderComponent} cb - Collider of entity B.
   * @param {TransformComponent} ta - Transform of entity A.
   * @param {TransformComponent} tb - Transform of entity B.
   */
  private resolveCollision(
    a: Entity,
    b: Entity,
    ca: ColliderComponent,
    cb: ColliderComponent,
    ta: TransformComponent,
    tb: TransformComponent,
  ): void {
    // Simple separation logic
    // Determine overlap amount
    const leftA = ta.x + ca.offset.x;
    const rightA = leftA + ca.width;
    const topA = ta.y + ca.offset.y;
    const bottomA = topA + ca.height;

    const leftB = tb.x + cb.offset.x;
    const rightB = leftB + cb.width;
    const topB = tb.y + cb.offset.y;
    const bottomB = topB + cb.height;

    const overlapX = Math.min(rightA - leftB, rightB - leftA);
    const overlapY = Math.min(bottomA - topB, bottomB - topA);

    // Resolve along smallest overlap axis
    if (overlapX < overlapY) {
      // Resolve X
      const dir = ta.x + ca.width / 2 < tb.x + cb.width / 2 ? -1 : 1;
      const separation = overlapX; // * dir handled by logic below

      const physA = a.getComponent<PhysicsComponent>('Physics');
      const physB = b.getComponent<PhysicsComponent>('Physics');

      if (physA && !physA.isStatic && physB && !physB.isStatic) {
        ta.x += separation * -dir * 0.5; // Move A away
        tb.x += separation * dir * 0.5; // Move B away
        physA.velocity.x = 0;
        physB.velocity.x = 0;
      } else if (physA && !physA.isStatic) {
        // Only A moves
        // If A is left of B (dir=-1), we want A to move left (negative).
        // separation is positive.
        // ta.x += separation * -dir?
        // If dir=-1, -dir=1. ta.x += overlap. Moves Right. WRONG.

        // If A is left (dir=-1), we want to push A left.
        // ta.x -= overlap.

        if (leftA < leftB) {
          ta.x -= overlapX;
        } else {
          ta.x += overlapX;
        }
        physA.velocity.x = 0;
      } else if (physB && !physB.isStatic) {
        if (leftB < leftA) {
          tb.x -= overlapX;
        } else {
          tb.x += overlapX;
        }
        physB.velocity.x = 0;
      }
    } else {
      // Resolve Y
      const physA = a.getComponent<PhysicsComponent>('Physics');
      const physB = b.getComponent<PhysicsComponent>('Physics');

      if (physA && !physA.isStatic && physB && !physB.isStatic) {
        // Split
        if (topA < topB) {
          ta.y -= overlapY * 0.5;
          tb.y += overlapY * 0.5;
        } else {
          ta.y += overlapY * 0.5;
          tb.y -= overlapY * 0.5;
        }
        physA.velocity.y = 0;
        physB.velocity.y = 0;
      } else if (physA && !physA.isStatic) {
        if (topA < topB) {
          ta.y -= overlapY;
        } else {
          ta.y += overlapY;
        }
        physA.velocity.y = 0;
      } else if (physB && !physB.isStatic) {
        if (topB < topA) {
          tb.y -= overlapY;
        } else {
          tb.y += overlapY;
        }
        physB.velocity.y = 0;
      }
    }
  }
}
