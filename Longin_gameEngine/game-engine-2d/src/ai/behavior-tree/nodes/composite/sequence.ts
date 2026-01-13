import { CompositeNode } from './composite';
import { Blackboard } from '../../blackboard';
import { NodeStatus } from '../../enums';

/**
 * Sequence node (AND logic).
 * Runs children in order. 
 * If a child succeeds, it runs the next child.
 * If a child fails, the Sequence fails immediately.
 * If a child is running, the Sequence returns RUNNING.
 * Succeeds only if ALL children succeed.
 */
export class Sequence extends CompositeNode {
  /**
   * Creates a new Sequence node.
   * 
   * @param {string} [name='Sequence'] - The name of the node.
   */
  constructor(name: string = 'Sequence') {
    super(name);
  }

  /**
   * Executes the sequence logic.
   * 
   * @param {Blackboard} blackboard - The shared blackboard.
   * @returns {NodeStatus} SUCCESS, FAILURE, or RUNNING.
   */
  tick(blackboard: Blackboard): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(blackboard);
      if (status !== NodeStatus.SUCCESS) {
        return status;
      }
    }
    return NodeStatus.SUCCESS;
  }
}
