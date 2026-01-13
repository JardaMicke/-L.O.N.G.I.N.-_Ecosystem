import { NodeStatus } from './enums';
import { Blackboard } from './blackboard';

export interface NodeDefinition {
  type: string;
  name?: string;
  properties?: Record<string, any>;
  children?: NodeDefinition[];
}

/**
 * Abstract base class for all Behavior Tree nodes.
 */
export abstract class BehaviorNode {
  /** The current status of the node */
  protected status: NodeStatus = NodeStatus.SUCCESS;

  /**
   * Creates a new BehaviorNode.
   * 
   * @param {string} [name='Node'] - The name of the node (for debugging).
   */
  constructor(public name: string = 'Node') {}

  /**
   * Executes the node's logic.
   * 
   * @param {Blackboard} blackboard - The shared blackboard for data access.
   * @returns {NodeStatus} The result of the execution (SUCCESS, FAILURE, or RUNNING).
   */
  abstract tick(blackboard: Blackboard): NodeStatus;

  /**
   * Gets the last status of the node.
   * 
   * @returns {NodeStatus} The current status.
   */
  getStatus(): NodeStatus {
    return this.status;
  }

  /**
   * Serializes the node configuration.
   */
  public serialize(): NodeDefinition {
    const def: NodeDefinition = {
        type: this.constructor.name,
        name: this.name,
        properties: {}
    };
    
    // Reflect on properties to save state
    Object.keys(this).forEach(key => {
        if (key === 'name' || key === 'id' || key === 'children' || key === 'status' || key === 'blackboard') return;
         const val = (this as any)[key];
         if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
             def.properties![key] = val;
         }
    });
    
    return def;
  }
}
