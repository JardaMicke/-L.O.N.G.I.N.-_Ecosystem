import { BehaviorNode } from './node';
import { Blackboard } from './blackboard';
import { NodeStatus } from './enums';

/**
 * Abstract base class for leaf nodes.
 * Leaf nodes perform actual actions or checks (e.g., MoveTo, IsEnemyVisible).
 * They do not have children.
 */
export abstract class LeafNode extends BehaviorNode {
  /**
   * Creates a new LeafNode.
   * 
   * @param {string} name - The name of the node.
   */
  constructor(name: string) {
    super(name);
  }

  /**
   * Executes the leaf node logic.
   * 
   * @param {Blackboard} blackboard - The shared blackboard.
   * @returns {NodeStatus} The execution status.
   */
  abstract tick(blackboard: Blackboard): NodeStatus;
}
