import { BehaviorTreeBuilder, TreeDefinition } from '../../../src/ai/behavior-tree/builder';
import { registerStandardNodes } from '../../../src/ai/behavior-tree/setup';
import { NodeRegistry } from '../../../src/ai/behavior-tree/node-registry';
import { Sequence } from '../../../src/ai/behavior-tree/nodes/composite/sequence';
import { Selector } from '../../../src/ai/behavior-tree/nodes/composite/selector';
import { MoveTo } from '../../../src/ai/behavior-tree/nodes/leaf/move-to';

describe('BehaviorTreeBuilder', () => {
  beforeAll(() => {
    registerStandardNodes();
  });

  it('should build a simple tree with one node', () => {
    const def: TreeDefinition = {
      name: 'TestTree',
      root: {
        type: 'Sequence',
      },
    };

    const tree = BehaviorTreeBuilder.build(def);
    expect(tree).toBeDefined();
    expect(tree.name).toBe('TestTree');
    expect(tree.getRoot()).toBeInstanceOf(Sequence);
  });

  it('should build a tree with children', () => {
    const def: TreeDefinition = {
      name: 'ComplexTree',
      root: {
        type: 'Selector',
        children: [
          { type: 'Sequence' },
          { type: 'MoveTo', properties: ['target', 10, 5] },
        ],
      },
    };

    const tree = BehaviorTreeBuilder.build(def);
    const root = tree.getRoot() as any;

    expect(root).toBeInstanceOf(Selector);
    expect(root.children.length).toBe(2);
    expect(root.children[0]).toBeInstanceOf(Sequence);
    expect(root.children[1]).toBeInstanceOf(MoveTo);
  });

  it('should apply properties from array', () => {
    const def: TreeDefinition = {
      name: 'PropTree',
      root: {
        type: 'MoveTo',
        properties: ['enemy', 50, 15],
      },
    };

    const tree = BehaviorTreeBuilder.build(def);
    const root = tree.getRoot() as any; // Cast to access private props for testing if needed, or check behavior

    expect(root).toBeInstanceOf(MoveTo);
    // We can't easily check private props without casting to any
    expect(root.targetKey).toBe('enemy');
    expect(root.speed).toBe(50);
    expect(root.stopDistance).toBe(15);
  });

  it('should apply properties from object', () => {
    const def: TreeDefinition = {
      name: 'ObjPropTree',
      root: {
        type: 'MoveTo',
        properties: { targetKey: 'base', speed: 20, stopDistance: 2 },
      },
    };

    const tree = BehaviorTreeBuilder.build(def);
    const root = tree.getRoot() as any;

    expect(root).toBeInstanceOf(MoveTo);
    expect(root.targetKey).toBe('base');
    expect(root.speed).toBe(20);
    expect(root.stopDistance).toBe(2);
  });

  it('should throw error if root creation fails', () => {
    const def: TreeDefinition = {
      name: 'FailTree',
      root: {
        type: 'NonExistentNode',
      },
    };

    expect(() => BehaviorTreeBuilder.build(def)).toThrow();
  });
});
