import { CompositeNode } from './composite';
import { Blackboard } from '../../blackboard';
import { NodeStatus } from '../../enums';

/**
 * Parallel node.
 * Runs all children simultaneously (in the same tick).
 * Success/Failure depends on the configuration (requireAllSuccess, requireAllFailure).
 */
export class Parallel extends CompositeNode {
  private requireAllSuccess: boolean;
  private requireAllFailure: boolean;

  /**
   * Creates a new Parallel node.
   * 
   * @param {string} [name='Parallel'] - The name of the node.
   * @param {boolean} [requireAllSuccess=true] - If true, all children must succeed for the node to succeed.
   * @param {boolean} [requireAllFailure=true] - If true, all children must fail for the node to fail.
   */
  constructor(name: string = 'Parallel', requireAllSuccess: boolean = true, requireAllFailure: boolean = true) {
    super(name);
    this.requireAllSuccess = requireAllSuccess;
    this.requireAllFailure = requireAllFailure;
  }

  /**
   * Executes the parallel logic.
   * 
   * @param {Blackboard} blackboard - The shared blackboard.
   * @returns {NodeStatus} SUCCESS, FAILURE, or RUNNING.
   */
  tick(blackboard: Blackboard): NodeStatus {
    let successCount = 0;
    let failureCount = 0;

    for (const child of this.children) {
      const status = child.tick(blackboard);
      if (status === NodeStatus.SUCCESS) {
        successCount++;
      } else if (status === NodeStatus.FAILURE) {
        failureCount++;
      }
    }

    if (this.requireAllSuccess && successCount === this.children.length) {
      return NodeStatus.SUCCESS;
    }
    if (!this.requireAllSuccess && successCount > 0) {
      return NodeStatus.SUCCESS;
    }

    if (this.requireAllFailure && failureCount === this.children.length) {
      return NodeStatus.FAILURE;
    }
    if (!this.requireAllFailure && failureCount > 0) {
      return NodeStatus.FAILURE;
    }

    return NodeStatus.RUNNING;
  }
}
