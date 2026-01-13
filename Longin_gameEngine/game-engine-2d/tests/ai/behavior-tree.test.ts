import { BehaviorNode } from '../../src/ai/behavior-tree/node';
import { Blackboard } from '../../src/ai/behavior-tree/blackboard';
import { NodeStatus } from '../../src/ai/behavior-tree/enums';
import { Sequence } from '../../src/ai/behavior-tree/nodes/composite/sequence';
import { Selector } from '../../src/ai/behavior-tree/nodes/composite/selector';
import { Parallel } from '../../src/ai/behavior-tree/nodes/composite/parallel';
import { LogAction } from '../../src/ai/behavior-tree/nodes/leaf/log-action';
import { BehaviorTreeComponent } from '../../src/ai/behavior-tree/behavior-tree-component';
import { BehaviorTreeSystem } from '../../src/ai/behavior-tree/behavior-tree-system';
import { BehaviorTree } from '../../src/ai/behavior-tree/behavior-tree';
import { Entity } from '../../src/ecs/entity';
import { Logger } from '../../src/utils/logger';

// Polyfill for winston logger
if (!global.setImmediate) {
  (global as any).setImmediate = (callback: (...args: any[]) => void, ...args: any[]) => {
    return global.setTimeout(callback, 0, ...args);
  };
}

class MockAction extends BehaviorNode {
  public executeCount = 0;
  public returnStatus: NodeStatus;

  constructor(name: string, status: NodeStatus = NodeStatus.SUCCESS) {
    super(name);
    this.returnStatus = status;
  }

  tick(blackboard: Blackboard): NodeStatus {
    this.executeCount++;
    return this.returnStatus;
  }
}

describe('Behavior Tree System', () => {
  let blackboard: Blackboard;

  beforeEach(() => {
    blackboard = new Blackboard();
    Logger.initialize(); // Ensure logger is initialized
  });

  test('Blackboard should store and retrieve values', () => {
    blackboard.set('health', 100);
    expect(blackboard.get<number>('health')).toBe(100);
    expect(blackboard.has('health')).toBe(true);
    
    blackboard.remove('health');
    expect(blackboard.has('health')).toBe(false);
  });

  test('Sequence should succeed only if all children succeed', () => {
    const sequence = new Sequence('Seq');
    const child1 = new MockAction('C1', NodeStatus.SUCCESS);
    const child2 = new MockAction('C2', NodeStatus.SUCCESS);
    
    sequence.addChild(child1);
    sequence.addChild(child2);

    expect(sequence.tick(blackboard)).toBe(NodeStatus.SUCCESS);
    expect(child1.executeCount).toBe(1);
    expect(child2.executeCount).toBe(1);
  });

  test('Sequence should fail if one child fails', () => {
    const sequence = new Sequence('Seq');
    const child1 = new MockAction('C1', NodeStatus.SUCCESS);
    const child2 = new MockAction('C2', NodeStatus.FAILURE);
    const child3 = new MockAction('C3', NodeStatus.SUCCESS);
    
    sequence.addChild(child1);
    sequence.addChild(child2);
    sequence.addChild(child3);

    expect(sequence.tick(blackboard)).toBe(NodeStatus.FAILURE);
    expect(child1.executeCount).toBe(1);
    expect(child2.executeCount).toBe(1);
    expect(child3.executeCount).toBe(0); // Should not execute
  });

  test('Selector should succeed if one child succeeds', () => {
    const selector = new Selector('Sel');
    const child1 = new MockAction('C1', NodeStatus.FAILURE);
    const child2 = new MockAction('C2', NodeStatus.SUCCESS);
    const child3 = new MockAction('C3', NodeStatus.FAILURE);
    
    selector.addChild(child1);
    selector.addChild(child2);
    selector.addChild(child3);

    expect(selector.tick(blackboard)).toBe(NodeStatus.SUCCESS);
    expect(child1.executeCount).toBe(1);
    expect(child2.executeCount).toBe(1);
    expect(child3.executeCount).toBe(0);
  });

  test('LogAction should execute and return SUCCESS', () => {
    const logAction = new LogAction('Test Message');
    expect(logAction.tick(blackboard)).toBe(NodeStatus.SUCCESS);
  });

  test('BehaviorTreeComponent should accept BehaviorTree wrapper', () => {
    const root = new MockAction('Root', NodeStatus.SUCCESS);
    const tree = new BehaviorTree('WrapperTree', root);
    const component = new BehaviorTreeComponent(tree);
    
    expect(component.root).toBe(root);
    expect(component.treeName).toBe('WrapperTree');
  });

  test('BehaviorTreeSystem should update entities with BT component', () => {
    const system = new BehaviorTreeSystem();
    const entity = new Entity('TestEntity');
    const btComponent = new BehaviorTreeComponent();
    const root = new MockAction('Root');
    
    btComponent.setRoot(root);
    entity.addComponent(btComponent);
    
    system.update([entity], 0.016);
    
    expect(root.executeCount).toBe(1);
    expect(btComponent.blackboard.get('entity')).toBe(entity);
  });
});
