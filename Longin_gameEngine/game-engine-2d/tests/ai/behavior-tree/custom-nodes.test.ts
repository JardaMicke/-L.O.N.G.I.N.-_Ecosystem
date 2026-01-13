import { MoveTo } from '../../../src/ai/behavior-tree/nodes/leaf/move-to';
import { IsTargetInRange } from '../../../src/ai/behavior-tree/nodes/leaf/is-target-in-range';
import { Blackboard } from '../../../src/ai/behavior-tree/blackboard';
import { NodeStatus } from '../../../src/ai/behavior-tree/enums';
import { Entity } from '../../../src/ecs/entity';
import { TransformComponent } from '../../../src/core/components';
import { PhysicsComponent } from '../../../src/physics/components';

describe('Custom Behavior Nodes', () => {
  let blackboard: Blackboard;
  let entity: Entity;
  let targetEntity: Entity;

  beforeEach(() => {
    blackboard = new Blackboard();
    entity = new Entity('npc');
    entity.addComponent(new TransformComponent(0, 0));
    
    targetEntity = new Entity('player');
    targetEntity.addComponent(new TransformComponent(100, 0));

    blackboard.set('entity', entity);
    blackboard.set('target', targetEntity);
    blackboard.set('deltaTime', 1.0); // 1 sec for easy calculation
  });

  describe('IsTargetInRange', () => {
    it('should return SUCCESS when in range', () => {
      const node = new IsTargetInRange('target', 150);
      expect(node.tick(blackboard)).toBe(NodeStatus.SUCCESS);
    });

    it('should return FAILURE when out of range', () => {
      const node = new IsTargetInRange('target', 50);
      expect(node.tick(blackboard)).toBe(NodeStatus.FAILURE);
    });
  });

  describe('MoveTo', () => {
    it('should move entity towards target using transform if no physics', () => {
      const node = new MoveTo('target', 10, 5); // Speed 10
      const status = node.tick(blackboard);
      
      expect(status).toBe(NodeStatus.RUNNING);
      
      const transform = entity.getComponent<TransformComponent>('Transform')!;
      expect(transform.x).toBe(10); // 0 + 10 * 1.0
      expect(transform.y).toBe(0);
    });

    it('should set velocity if physics component exists', () => {
      entity.addComponent(new PhysicsComponent());
      const node = new MoveTo('target', 10, 5);
      
      const status = node.tick(blackboard);
      expect(status).toBe(NodeStatus.RUNNING);

      const physics = entity.getComponent<PhysicsComponent>('Physics')!;
      expect(physics.velocity.x).toBe(10);
      expect(physics.velocity.y).toBe(0);
      
      // Transform shouldn't change immediately in this tick logic (PhysicsSystem handles it usually), 
      // but MoveTo only sets velocity.
    });

    it('should return SUCCESS when reached target', () => {
      const transform = entity.getComponent<TransformComponent>('Transform')!;
      transform.x = 98; // Target is 100. Dist 2.
      
      const node = new MoveTo('target', 10, 5); // Stop distance 5
      const status = node.tick(blackboard);
      
      expect(status).toBe(NodeStatus.SUCCESS);
    });
  });
});
