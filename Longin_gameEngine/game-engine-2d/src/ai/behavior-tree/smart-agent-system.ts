import { System } from '../../ecs/system';
import { Entity } from '../../ecs/entity';
import { SmartAgentComponent } from './smart-agent-component';
import { BehaviorTreeComponent } from './behavior-tree-component';
import { CampaignManager } from '../campaign/campaign-manager';
import { Logger } from '../../utils/logger';

export class SmartAgentSystem extends System {
  constructor() {
    super();
    this.requiredComponents = ['SmartAgentComponent', 'BehaviorTree'];
  }

  public update(entities: Entity[], deltaTime: number): void {
    const now = Date.now();
    const campaignManager = CampaignManager.getInstance();

    for (const entity of entities) {
      const smartAgent = entity.getComponent<SmartAgentComponent>('SmartAgentComponent');
      const btComp = entity.getComponent<BehaviorTreeComponent>('BehaviorTree');

      if (!smartAgent || !btComp) continue;

      // Throttle checks
      if (now - smartAgent.lastCheckTime < smartAgent.checkInterval) {
        continue;
      }
      smartAgent.lastCheckTime = now;

      // Context for rules
      const context = {
        entity,
        worldState: campaignManager.worldState,
        // Add more context as needed
      };

      // Evaluate rules
      let bestTreeId: string | null = null;

      for (const rule of smartAgent.rules) {
        try {
          if (rule.condition(context)) {
            bestTreeId = rule.targetTreeId;
            break; // Rules are sorted by priority
          }
        } catch (e) {
          Logger.error(`Error evaluating rule for entity ${entity.id}`, e as Error);
        }
      }

      // Default to current if no rule matches, or handle fallback? 
      // For now, if no rule matches, we don't switch (keep current).
      
      if (bestTreeId && bestTreeId !== smartAgent.currentTreeId) {
        const newRoot = smartAgent.availableTrees.get(bestTreeId);
        if (newRoot) {
          Logger.info(`Entity ${entity.id} switching behavior to ${bestTreeId}`);
          btComp.setRoot(newRoot);
          smartAgent.currentTreeId = bestTreeId;
          
          // Reset blackboard or keep it? Usually keep generic data, maybe reset tree-specific.
          // btComp.blackboard.clear(); // Safe to keep for now
        } else {
          Logger.warn(`SmartAgent: Tree ${bestTreeId} not found in availableTrees`);
        }
      }
    }
  }
}
