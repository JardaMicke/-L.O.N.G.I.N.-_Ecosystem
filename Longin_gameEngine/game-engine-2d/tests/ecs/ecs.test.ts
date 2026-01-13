import { Component } from '../../src/ecs/component';
import { Entity } from '../../src/ecs/entity';
import { EntityManager } from '../../src/ecs/entity-manager';
import { System } from '../../src/ecs/system';
import { SystemRegistry } from '../../src/ecs/system-registry';

// Mock Component
class PositionComponent extends Component {
  public readonly name = 'Position';
  constructor(
    public x: number,
    public y: number,
  ) {
    super();
  }
}

// Mock System
class MovementSystem extends System {
  public requiredComponents = ['Position'];

  public update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const pos = entity.getComponent<PositionComponent>(PositionComponent);
      if (pos) {
        pos.x += 1 * deltaTime;
      }
    }
  }
}

describe('ECS System', () => {
  let entityManager: EntityManager;
  let systemRegistry: SystemRegistry;

  beforeEach(() => {
    entityManager = new EntityManager();
    systemRegistry = new SystemRegistry(entityManager);
  });

  test('should register system and update entity', () => {
    const system = new MovementSystem();
    systemRegistry.registerSystem(system);

    const entity = entityManager.createEntity();
    entity.addComponent(new PositionComponent(0, 0));

    // Update with delta time 1
    systemRegistry.update(1);

    const pos = entity.getComponent<PositionComponent>(PositionComponent);
    expect(pos).toBeDefined();
    expect(pos!.x).toBe(1);
  });

  test('should ignore entities without required components', () => {
    const system = new MovementSystem();
    systemRegistry.registerSystem(system);

    const entity = entityManager.createEntity();
    // No PositionComponent

    systemRegistry.update(1);

    // Pass if no error and logic holds (nothing to assert really except no crash)
    expect(entity.getComponent('Position')).toBeUndefined();
  });
});
