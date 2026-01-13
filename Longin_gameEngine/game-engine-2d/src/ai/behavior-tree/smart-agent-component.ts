import { Component } from '../../ecs/component';
import { BehaviorNode } from './node';

/**
 * Rule for selecting a behavior tree.
 */
interface TreeSelectionRule {
  /** ID of the target behavior tree. */
  targetTreeId: string;
  /** Function that evaluates the context to determine if this rule matches. */
  condition: (context: any) => boolean;
  /** Priority of the rule (higher is checked first). */
  priority: number;
}

/**
 * Component that manages switching between different behavior trees based on conditions.
 * Allows agents to adapt their behavior dynamically (e.g., switching from 'patrol' to 'combat').
 */
export class SmartAgentComponent extends Component {
  public readonly name: string = 'SmartAgentComponent';
  
  /** Map of available behavior trees by ID. */
  public availableTrees: Map<string, BehaviorNode> = new Map();
  
  /** List of rules for selecting trees. */
  public rules: TreeSelectionRule[] = [];
  
  /** ID of the currently active behavior tree. */
  public currentTreeId: string | null = null;
  
  /** Timestamp of the last rule check. */
  public lastCheckTime: number = 0;
  
  /** Interval in milliseconds between rule checks. */
  public checkInterval: number = 1000; // Check every 1s

  /**
   * Adds a rule for switching behavior trees.
   * 
   * @param {string} targetTreeId - The ID of the tree to switch to.
   * @param {(context: any) => boolean} condition - The condition function.
   * @param {number} priority - The priority of the rule.
   */
  public addRule(targetTreeId: string, condition: (context: any) => boolean, priority: number): void {
    this.rules.push({ targetTreeId, condition, priority });
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Registers a behavior tree with the component.
   * 
   * @param {string} id - The unique ID for the tree.
   * @param {BehaviorNode} root - The root node of the behavior tree.
   */
  public registerTree(id: string, root: BehaviorNode): void {
    this.availableTrees.set(id, root);
  }
}
