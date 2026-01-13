import { BehaviorTree } from './behavior-tree';
import { BehaviorNode, NodeDefinition } from './node';
import { CompositeNode } from './nodes/composite/composite';
import { NodeRegistry } from './node-registry';
import { Logger } from '../../utils/logger';

/**
 * Definition structure for a complete Behavior Tree.
 */
export interface TreeDefinition {
  /** Name of the tree */
  name: string;
  /** Root node definition */
  root: NodeDefinition;
}

/**
 * Builder class for creating Behavior Trees from data definitions.
 * Useful for loading trees from JSON or configuration files.
 */
export class BehaviorTreeBuilder {
  /**
   * Builds a BehaviorTree from a definition.
   * 
   * @param {TreeDefinition} definition - The tree definition.
   * @returns {BehaviorTree} The constructed behavior tree.
   * @throws {Error} If the root node cannot be created.
   */
  public static build(definition: TreeDefinition): BehaviorTree {
    const root = this.buildNode(definition.root);
    if (!root) {
      throw new Error(`Failed to build tree '${definition.name}': Root node could not be created.`);
    }
    return new BehaviorTree(definition.name, root);
  }

  /**
   * Recursively builds a node and its children.
   * 
   * @param {NodeDefinition} def - The node definition.
   * @returns {BehaviorNode | null} The constructed node or null if failed.
   */
  public static buildNode(def: NodeDefinition): BehaviorNode | null {
    const NodeClass = NodeRegistry.get(def.type);
    if (!NodeClass) {
      Logger.error(`BehaviorTreeBuilder: Unknown node type '${def.type}'`);
      return null;
    }

    // Instantiate node. We assume constructor takes name or properties.
    // Ideally, nodes should have a uniform constructor or a method to apply properties.
    // For now, let's assume standard nodes take (name, children) or similar.
    // But leaf nodes take specific args.
    
    // Strategy: Instantiate with empty/default args, then apply properties if possible.
    // Or pass properties to constructor if it accepts an object.
    
    // Let's assume we can pass the properties values as arguments in order, 
    // OR the node class is designed to take an options object.
    
    // For this engine, let's enforce that registered nodes should accept an options object 
    // OR we map properties to constructor arguments.
    // Since existing nodes like Sequence/Selector just take children (via add), 
    // and leaf nodes like MoveTo take (targetKey, speed, etc).
    
    // To support generic building, it's best if nodes support an `init(props)` method or take a config object.
    // Let's try to pass values of properties as spread args if properties is an array, 
    // or assume the constructor matches properties keys.
    
    // Current MoveTo: constructor(targetKey: string, speed: number, stopDistance: number)
    // Definition: properties: { targetKey: 'player', speed: 10, stopDistance: 5 }
    
    // We can't easily map object to positional args without metadata.
    // Refactoring nodes to accept an options object is cleaner.
    
    // Temporary solution: Pass properties values in a specific order if defined? No, unreliable.
    // Better: Update LeafNode to accept `options: any` in constructor?
    
    // Let's try to instantiate.
    let node: BehaviorNode;
    
    try {
        // If properties is an array, treat as positional args
        if (Array.isArray(def.properties)) {
            node = new NodeClass(...def.properties);
        } else if (def.properties) {
             // If it's an object, we can't easily pass it to a constructor expecting positional args
             // unless we modify the nodes.
             // But for now, let's assume the node handles it or we use a smart factory.
             
             // Check if constructor length is 1 and it expects object?
             if (NodeClass.length === 1) {
                 node = new NodeClass(def.properties);
             } else {
                 // Fallback: Create with default/no args, then assign properties
                 node = new NodeClass();
                 Object.assign(node, def.properties);
             }
        } else {
            node = new NodeClass();
        }
    } catch (e) {
        Logger.error(`BehaviorTreeBuilder: Error instantiating '${def.type}':`, e as Error);
        return null;
    }

    if (def.name) {
        // override name if needed, though usually type is name
    }

    // Process children
    if (def.children && def.children.length > 0) {
      if (node instanceof CompositeNode) {
        for (const childDef of def.children) {
          const child = this.buildNode(childDef);
          if (child) {
            node.addChild(child);
          }
        }
      } else {
        Logger.warn(`BehaviorTreeBuilder: Node '${def.type}' has children but is not a CompositeNode.`);
      }
    }

    return node;
  }
}
