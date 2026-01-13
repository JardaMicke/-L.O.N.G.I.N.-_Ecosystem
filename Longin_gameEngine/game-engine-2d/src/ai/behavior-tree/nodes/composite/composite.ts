import { BehaviorNode, NodeDefinition } from '../../node';
import { Blackboard } from '../../blackboard';
import { NodeStatus } from '../../enums';

/**
 * Abstract base class for composite nodes.
 * Composite nodes have one or more children and control their execution.
 */
export abstract class CompositeNode extends BehaviorNode {
  /** List of child nodes */
  protected children: BehaviorNode[] = [];

  /**
   * Adds a child node to this composite.
   * 
   * @param {BehaviorNode} node - The child node to add.
   */
  addChild(node: BehaviorNode): void {
    this.children.push(node);
  }

  /**
   * Removes a child node from this composite.
   * 
   * @param {BehaviorNode} node - The child node to remove.
   */
  removeChild(node: BehaviorNode): void {
    const index = this.children.indexOf(node);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  /**
   * Gets all child nodes.
   * 
   * @returns {BehaviorNode[]} Array of child nodes.
   */
  getChildren(): BehaviorNode[] {
    return this.children;
  }

  public serialize(): NodeDefinition {
    const def = super.serialize();
    def.children = this.children.map(c => c.serialize());
    return def;
  }

  /**
   * Executes the composite logic.
   * 
   * @param {Blackboard} blackboard - The shared blackboard.
   * @returns {NodeStatus} The execution status.
   */
  abstract tick(blackboard: Blackboard): NodeStatus;
}
