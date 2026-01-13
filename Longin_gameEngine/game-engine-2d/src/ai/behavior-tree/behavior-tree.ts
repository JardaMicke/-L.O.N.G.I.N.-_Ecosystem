import { BehaviorNode } from './node';
import { Blackboard } from './blackboard';
import { NodeStatus } from './enums';

/**
 * Represents a Behavior Tree instance.
 * Manages the root node and the blackboard.
 */
export class BehaviorTree {
  private root: BehaviorNode;
  private blackboard: Blackboard;
  /** Name of the behavior tree */
  public name: string;
  /** Unique identifier for the tree instance */
  public id: string;

  /**
   * Creates a new BehaviorTree.
   * 
   * @param {string} name - The name of the tree.
   * @param {BehaviorNode} root - The root node of the tree.
   * @param {Blackboard} [blackboard=new Blackboard()] - The blackboard to use.
   */
  constructor(name: string, root: BehaviorNode, blackboard: Blackboard = new Blackboard()) {
    this.name = name;
    this.root = root;
    this.blackboard = blackboard;
    this.id = Math.random().toString(36).substr(2, 9);
    
    BehaviorTreeRegistry.register(this);
  }

  /**
   * Ticks the behavior tree (executes the root node).
   * 
   * @returns {NodeStatus} The result of the root node execution.
   */
  tick(): NodeStatus {
    return this.root.tick(this.blackboard);
  }

  /**
   * Gets the root node of the tree.
   * 
   * @returns {BehaviorNode} The root node.
   */
  getRoot(): BehaviorNode {
    return this.root;
  }

  /**
   * Gets the blackboard used by this tree.
   * 
   * @returns {Blackboard} The blackboard.
   */
  getBlackboard(): Blackboard {
    return this.blackboard;
  }
}

/**
 * Registry for tracking all active Behavior Trees.
 * Useful for debugging and monitoring.
 */
export class BehaviorTreeRegistry {
  private static trees: Map<string, BehaviorTree> = new Map();

  /**
   * Registers a behavior tree.
   * 
   * @param {BehaviorTree} tree - The tree to register.
   */
  static register(tree: BehaviorTree): void {
    this.trees.set(tree.id, tree);
  }

  /**
   * Unregisters a behavior tree.
   * 
   * @param {string} treeId - The ID of the tree to unregister.
   */
  static unregister(treeId: string): void {
    this.trees.delete(treeId);
  }

  /**
   * Gets all registered behavior trees.
   * 
   * @returns {BehaviorTree[]} Array of registered trees.
   */
  static getAll(): BehaviorTree[] {
    return Array.from(this.trees.values());
  }
}
