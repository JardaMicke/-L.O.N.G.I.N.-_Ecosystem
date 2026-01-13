import { LeafNode } from '../../leaf-node';
import { Blackboard } from '../../blackboard';
import { NodeStatus } from '../../enums';
import { Entity } from '../../../../ecs/entity';
import { TransformComponent } from '../../../../core/components';
import { PhysicsComponent } from '../../../../physics/components';

/**
 * Leaf node that moves an entity towards a target.
 * Requires 'Transform' component. Optionally uses 'Physics' if available.
 * 
 * Target can be an Entity (moves to updated position) or a static point {x, y}.
 * Reads target from blackboard using `targetKey`.
 */
export class MoveTo extends LeafNode {
  /** Blackboard key to retrieve the target from */
  public targetKey: string;
  /** Movement speed in units per second */
  public speed: number;
  /** Distance threshold to consider reached */
  public stopDistance: number;

  /**
   * Creates a new MoveTo node.
   * 
   * @param {string} [targetKey='target'] - Key in blackboard for the target.
   * @param {number} [speed=100] - Movement speed.
   * @param {number} [stopDistance=10] - Stop distance.
   */
  constructor(targetKey: string = 'target', speed: number = 100, stopDistance: number = 10) {
    super(`MoveTo`);
    this.targetKey = targetKey;
    this.speed = speed;
    this.stopDistance = stopDistance;
  }

  /**
   * Executes the move logic.
   * 
   * @param {Blackboard} blackboard - The shared blackboard.
   * @returns {NodeStatus} SUCCESS if reached, RUNNING if moving, FAILURE if invalid.
   */
  public tick(blackboard: Blackboard): NodeStatus {
    const entity = blackboard.get<Entity>('entity');
    const target = blackboard.get<Entity | { x: number, y: number }>(this.targetKey);
    const deltaTime = blackboard.get<number>('deltaTime') || 0.016;

    if (!entity || !target) {
      return NodeStatus.FAILURE;
    }

    const transform = entity.getComponent<TransformComponent>('Transform');
    const physics = entity.getComponent<PhysicsComponent>('Physics');

    if (!transform) {
      return NodeStatus.FAILURE;
    }

    let targetX = 0;
    let targetY = 0;

    if (target instanceof Entity) {
      const targetTransform = target.getComponent<TransformComponent>('Transform');
      if (!targetTransform) return NodeStatus.FAILURE;
      targetX = targetTransform.x;
      targetY = targetTransform.y;
    } else {
      targetX = target.x;
      targetY = target.y;
    }

    const dx = targetX - transform.x;
    const dy = targetY - transform.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq <= this.stopDistance * this.stopDistance) {
      // Reached target
      if (physics) {
        physics.velocity.x = 0;
        physics.velocity.y = 0;
      }
      return NodeStatus.SUCCESS;
    }

    // Move towards target
    const distance = Math.sqrt(distanceSq);
    const dirX = dx / distance;
    const dirY = dy / distance;

    if (physics) {
      physics.velocity.x = dirX * this.speed;
      physics.velocity.y = dirY * this.speed;
    } else {
      // Direct transform update if no physics
      transform.x += dirX * this.speed * deltaTime;
      transform.y += dirY * this.speed * deltaTime;
    }

    return NodeStatus.RUNNING;
  }
}
