/**
 * Status of a Behavior Tree node execution.
 */
export enum NodeStatus {
  /** The node completed successfully. */
  SUCCESS = 'SUCCESS',
  /** The node failed to complete. */
  FAILURE = 'FAILURE',
  /** The node is currently running and needs more time. */
  RUNNING = 'RUNNING',
}
