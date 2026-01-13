import { System } from '../../ecs/system';
import { Entity } from '../../ecs/entity';
import { BehaviorTreeComponent } from './behavior-tree-component';
import { NodeStatus } from './enums';

/**
 * System responsible for executing Behavior Trees.
 * Updates all entities with a BehaviorTreeComponent.
 */
export class BehaviorTreeSystem extends System {
  /**
   * Components required for this system to process an entity.
   */
  public requiredComponents = ['BehaviorTree'];

  /**
   * Updates the behavior trees for all relevant entities.
   * Handles update intervals and blackboard context injection.
   * 
   * @param {Entity[]} entities - List of entities to update.
   * @param {number} deltaTime - Time elapsed since last frame in seconds.
   */
  public update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const btComponent = entity.getComponent<BehaviorTreeComponent>('BehaviorTree');
      if (!btComponent || !btComponent.enabled || !btComponent.root) {
        continue;
      }

      // Handle update interval
      if (btComponent.updateInterval > 0) {
        btComponent.timeSinceLastUpdate += deltaTime;
        if (btComponent.timeSinceLastUpdate < btComponent.updateInterval) {
          continue;
        }
        btComponent.timeSinceLastUpdate = 0;
      }

      // Update the blackboard with entity context and delta time
      if (!btComponent.blackboard.has('entity')) {
        btComponent.blackboard.set('entity', entity);
      }
      btComponent.blackboard.set('deltaTime', deltaTime);

      // Tick the tree
      const status = btComponent.root.tick(btComponent.blackboard);
      
      // Optional: React to status (e.g. log failure)
      if (status === NodeStatus.FAILURE) {
        // Handle failure if needed
      }
    }
  }
}
