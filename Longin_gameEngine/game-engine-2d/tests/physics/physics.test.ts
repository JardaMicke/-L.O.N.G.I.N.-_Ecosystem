import { TransformComponent } from '../../src/core/components';
import { EventSystem } from '../../src/core/event-system';
import { Entity } from '../../src/ecs/entity';
import { EntityManager } from '../../src/ecs/entity-manager';
import { CollisionSystem } from '../../src/physics/collision-system';
import { PhysicsComponent, ColliderComponent } from '../../src/physics/components';
import { PhysicsSystem } from '../../src/physics/physics-system';

describe('Physics System', () => {
  let entityManager: EntityManager;
  let physicsSystem: PhysicsSystem;
  let collisionSystem: CollisionSystem;

  beforeEach(() => {
    entityManager = new EntityManager();
    physicsSystem = new PhysicsSystem();
    collisionSystem = new CollisionSystem();
    // Manually inject entityManager since Systems usually get it via SystemRegistry or similar,
    // but here I instantiated them directly.
    // Wait, Base System class might not have public entityManager setter if it's protected.
    // Let's check System class.
    (physicsSystem as any).entityManager = entityManager;
    (collisionSystem as any).entityManager = entityManager;
  });

  test('should move entity based on velocity', () => {
    const entity = new Entity();
    entity.addComponent(new TransformComponent(0, 0));
    entity.addComponent(new PhysicsComponent({ velocity: { x: 100, y: 0 } }));
    entityManager.addEntity(entity);

    physicsSystem.update([entity], 1.0); // 1 second

    const transform = entity.getComponent<TransformComponent>('Transform');
    expect(transform?.x).toBe(100);
    expect(transform?.y).toBe(0);
  });

  test('should detect collision and emit event', () => {
    const emitSpy = jest.spyOn(EventSystem.getInstance(), 'emit');

    const e1 = new Entity('e1');
    e1.addComponent(new TransformComponent(0, 0));
    e1.addComponent(new ColliderComponent({ width: 10, height: 10 }));
    entityManager.addEntity(e1);

    const e2 = new Entity('e2');
    e2.addComponent(new TransformComponent(5, 5)); // Overlap (0,0 10x10 vs 5,5 10x10)
    e2.addComponent(new ColliderComponent({ width: 10, height: 10 }));
    entityManager.addEntity(e2);

    collisionSystem.update([e1, e2], 0.1);

    expect(emitSpy).toHaveBeenCalledWith(
      'collision',
      expect.objectContaining({
        entityA: expect.any(Entity),
        entityB: expect.any(Entity),
      }),
    );
  });

  test('should resolve collision (static vs dynamic)', () => {
    const wall = new Entity('wall');
    wall.addComponent(new TransformComponent(100, 0));
    wall.addComponent(new ColliderComponent({ width: 10, height: 100 }));
    // No physics component = static
    entityManager.addEntity(wall);

    const player = new Entity('player');
    player.addComponent(new TransformComponent(95, 0)); // Overlapping wall at 100 (width 10, so wall is 100-110)
    player.addComponent(new ColliderComponent({ width: 10, height: 10 }));
    player.addComponent(new PhysicsComponent({ velocity: { x: 10, y: 0 } }));
    entityManager.addEntity(player);

    collisionSystem.update([wall, player], 0.1);

    const pTrans = player.getComponent<TransformComponent>('Transform');
    expect(pTrans?.x).toBe(90);

    // Check velocity stop
    const pPhys = player.getComponent<PhysicsComponent>('Physics');
    expect(pPhys?.velocity.x).toBe(0);
  });
});
