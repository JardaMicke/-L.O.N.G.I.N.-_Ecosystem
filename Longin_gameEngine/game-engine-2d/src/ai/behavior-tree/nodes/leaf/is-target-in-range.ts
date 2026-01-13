import { LeafNode } from '../../leaf-node';
import { Blackboard } from '../../blackboard';
import { NodeStatus } from '../../enums';
import { Entity } from '../../../../ecs/entity';
import { TransformComponent } from '../../../../core/components';

/**
 * Leaf node that checks if a target is within a certain range.
 * Requires 'Transform' component on both entity and target (if target is Entity).
 */
export class IsTargetInRange extends LeafNode {
  /** Blackboard key for the target */
  public targetKey: string;
  /** Range threshold */
  public range: number;

  /**
   * Creates a new IsTargetInRange node.
   * 
   * @param {string} [targetKey='target'] - Key in blackboard for the target.
   * @param {number} [range=100] - Range threshold.
   */
  constructor(targetKey: string = 'target', range: number = 100) {
    super(`IsTargetInRange(${range})`);
    this.targetKey = targetKey;
    this.range = range;
  }

  /**
   * Checks the distance.
   * 
   * @param {Blackboard} blackboard - The shared blackboard.
   * @returns {NodeStatus} SUCCESS if in range, FAILURE otherwise.
   */
  public tick(blackboard: Blackboard): NodeStatus {
    const entity = blackboard.get<Entity>('entity');
    const target = blackboard.get<Entity | { x: number, y: number }>(this.targetKey);

    if (!entity || !target) {
      return NodeStatus.FAILURE;
    }

    const transform = entity.getComponent<TransformComponent>('Transform');
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

    if (distanceSq <= this.range * this.range) {
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.FAILURE;
  }
}
