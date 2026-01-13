import { BehaviorNode } from './node';

type NodeConstructor = new (...args: any[]) => BehaviorNode;

/**
 * Registry for behavior tree node types.
 * Allows nodes to be registered by name and instantiated dynamically.
 * Essential for the BehaviorTreeBuilder.
 */
export class NodeRegistry {
  private static nodes: Map<string, NodeConstructor> = new Map();

  /**
   * Registers a node type.
   * 
   * @param {string} name - The name/type of the node.
   * @param {NodeConstructor} constructor - The class constructor.
   */
  public static register(name: string, constructor: NodeConstructor): void {
    if (this.nodes.has(name)) {
      console.warn(`Node type '${name}' is already registered. Overwriting.`);
    }
    this.nodes.set(name, constructor);
  }

  /**
   * Retrieves a node constructor by name.
   * 
   * @param {string} name - The name of the node type.
   * @returns {NodeConstructor | undefined} The constructor or undefined if not found.
   */
  public static get(name: string): NodeConstructor | undefined {
    return this.nodes.get(name);
  }

  /**
   * Gets all registered node names.
   * 
   * @returns {string[]} Array of registered node names.
   */
  public static getAllNames(): string[] {
    return Array.from(this.nodes.keys());
  }
}
