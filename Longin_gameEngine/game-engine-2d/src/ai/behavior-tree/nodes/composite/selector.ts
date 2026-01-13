import { CompositeNode } from './composite';
import { Blackboard } from '../../blackboard';
import { NodeStatus } from '../../enums';

/**
 * Selector node (OR logic).
 * Runs children in order.
 * If a child succeeds, the Selector succeeds immediately.
 * If a child fails, it runs the next child.
 * If a child is running, the Selector returns RUNNING.
 * Fails only if ALL children fail.
 */
export class Selector extends CompositeNode {
  /**
   * Creates a new Selector node.
   * 
   * @param {string} [name='Selector'] - The name of the node.
   */
  constructor(name: string = 'Selector') {
    super(name);
  }

  /**
   * Executes the selector logic.
   * 
   * @param {Blackboard} blackboard - The shared blackboard.
   * @returns {NodeStatus} SUCCESS, FAILURE, or RUNNING.
   */
  tick(blackboard: Blackboard): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(blackboard);
      if (status !== NodeStatus.FAILURE) {
        return status;
      }
    }
    return NodeStatus.FAILURE;
  }
}
