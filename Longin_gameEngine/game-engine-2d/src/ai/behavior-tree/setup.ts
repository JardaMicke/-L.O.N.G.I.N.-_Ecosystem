import { NodeRegistry } from './node-registry';
import { Sequence } from './nodes/composite/sequence';
import { Selector } from './nodes/composite/selector';
import { Parallel } from './nodes/composite/parallel';
import { MoveTo } from './nodes/leaf/move-to';
import { IsTargetInRange } from './nodes/leaf/is-target-in-range';

/**
 * Registers standard behavior tree nodes to the NodeRegistry.
 * Should be called at engine startup.
 */
export function registerStandardNodes(): void {
  NodeRegistry.register('Sequence', Sequence);
  NodeRegistry.register('Selector', Selector);
  NodeRegistry.register('Parallel', Parallel);
  NodeRegistry.register('MoveTo', MoveTo);
  NodeRegistry.register('IsTargetInRange', IsTargetInRange);
}
