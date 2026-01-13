import { Entity } from '../src/ecs/entity';
import { TaskManager } from '../src/ai/task-system/task-manager';
import { TaskComponent } from '../src/ai/task-system/task-component';
import { CampaignManager } from '../src/ai/campaign/campaign-manager';
import { SmartAgentSystem } from '../src/ai/behavior-tree/smart-agent-system';
import { SmartAgentComponent } from '../src/ai/behavior-tree/smart-agent-component';
import { BehaviorTreeComponent } from '../src/ai/behavior-tree/behavior-tree-component';
import { TaskType, TaskPriority } from '../src/ai/ai-enums';
import { EventSystem } from '../src/core/event-system';
import { BehaviorTree } from '../src/ai/behavior-tree/behavior-tree';
import { BehaviorNode } from '../src/ai/behavior-tree/node';
import { NodeStatus } from '../src/ai/behavior-tree/enums';
import { Blackboard } from '../src/ai/behavior-tree/blackboard';
import { ResourceNodeComponent } from '../src/ai/campaign/components';

// Mock Node
class MockActionNode extends BehaviorNode {
  public executeCalled = false;
  constructor(public name: string) { super(); }
  public tick(blackboard: Blackboard): NodeStatus {
    this.executeCalled = true;
    return NodeStatus.SUCCESS;
  }
}

describe('AI System Integration', () => {
  let taskManager: TaskManager;
  let campaignManager: CampaignManager;
  let smartAgentSystem: SmartAgentSystem;
  let agent: Entity;
  let resource: Entity;

  beforeEach(() => {
    EventSystem.getInstance().clear();
    
    // Initialize Systems
    taskManager = new TaskManager();
    campaignManager = new CampaignManager();
    smartAgentSystem = new SmartAgentSystem();
    
    // Create Agent
    agent = new Entity();
    agent.addComponent(new TaskComponent());
    agent.addComponent(new SmartAgentComponent());
    agent.addComponent(new BehaviorTreeComponent(new MockActionNode('DefaultRoot')));
    
    // Create Resource
    resource = new Entity();
    resource.addComponent(new ResourceNodeComponent('GOLD', 100, 100));
  });

  test('Task System assigns tasks to agent', () => {
    // 1. Create Task
    taskManager.addTask({
      id: 'task-1',
      type: TaskType.GATHER,
      priority: TaskPriority.HIGH,
      creationTime: Date.now(),
      status: 'PENDING' as any
    });

    // 2. Update Task Manager
    taskManager.update([agent], 0.016);

    // 3. Verify Assignment
    const taskComp = agent.getComponent<TaskComponent>('TaskComponent');
    expect(taskComp).toBeDefined();
    expect(taskComp!.currentTask).toBeDefined();
    expect(taskComp!.currentTask!.id).toBe('task-1');
  });

  test('Campaign Manager updates world state', () => {
    campaignManager.update([resource], 0.016);
    expect(campaignManager.worldState.resourceNodes).toContain(resource.id);
  });

  test('Smart Agent switches tree based on condition', () => {
    const smartComp = agent.getComponent<SmartAgentComponent>('SmartAgentComponent');
    const btComp = agent.getComponent<BehaviorTreeComponent>('BehaviorTree');
    
    // Setup Trees
    const combatRoot = new MockActionNode('CombatRoot');
    smartComp!.registerTree('COMBAT_TREE', combatRoot);
    
    // Setup Rule: Switch to Combat if Threat > 50
    smartComp!.addRule('COMBAT_TREE', (ctx) => {
      // Mock condition: assume global threat is high
      return ctx.worldState.globalThreatLevel > 50;
    }, 1);

    // Initial State: Threat 0
    campaignManager.worldState.globalThreatLevel = 0;
    smartAgentSystem.update([agent], 0.016);
    expect(btComp!.getRoot()).not.toBe(combatRoot);

    // Change State: Threat 100
    campaignManager.worldState.globalThreatLevel = 100;
    
    // Force update (bypass throttle)
    smartComp!.lastCheckTime = 0;
    
    smartAgentSystem.update([agent], 0.016);
    
    expect(btComp!.getRoot()).toBe(combatRoot);
  });
});
