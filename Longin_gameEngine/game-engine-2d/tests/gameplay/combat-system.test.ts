import { TransformComponent } from '../../src/core/components';
import { EventSystem } from '../../src/core/event-system';
import { Entity } from '../../src/ecs/entity';
import { PlayerType } from '../../src/game/core/interfaces';
import { CombatSystem } from '../../src/gameplay/combat-system';
import { HealthComponent } from '../../src/gameplay/components';
import { PlayerComponent } from '../../src/network/components';

// Mock EventSystem
jest.mock('../../src/core/event-system', () => {
  return {
    EventSystem: {
      getInstance: jest.fn().mockReturnValue({
        on: jest.fn(),
        emit: jest.fn(),
      }),
    },
  };
});

describe('CombatSystem', () => {
  let combatSystem: CombatSystem;
  let mockInputHandler: any;
  let mockEventSystem: any;
  let attacker: Entity;
  let target: Entity;

  beforeEach(() => {
    mockInputHandler = {};
    mockEventSystem = EventSystem.getInstance();

    // Reset mocks
    mockEventSystem.on.mockClear();
    mockEventSystem.emit.mockClear();

    combatSystem = new CombatSystem(mockInputHandler);

    // Setup entities
    attacker = new Entity('attacker');
    attacker.addComponent(new TransformComponent(100, 100));
    attacker.addComponent(new HealthComponent(100));
    attacker.addComponent(new PlayerComponent('p1', 'Player', '#fff', PlayerType.HUMAN, true)); // isLocal = true

    target = new Entity('target');
    target.addComponent(new TransformComponent(120, 100)); // Distance 20
    target.addComponent(new HealthComponent(100));

    // Manually set entities for the system (normally SystemRegistry does this)
    (combatSystem as any).entities = [attacker, target];
  });

  test('should register keydown listener', () => {
    expect(mockEventSystem.on).toHaveBeenCalledWith('input:keydown', expect.any(Function));
  });

  test('should damage target when in range and space is pressed', () => {
    // Get the key handler
    const handler = mockEventSystem.on.mock.calls.find(
      (call: any) => call[0] === 'input:keydown',
    )[1];

    // Execute attack
    handler('Space');

    // Check damage
    const targetHealth = target.getComponent<HealthComponent>('Health');
    expect(targetHealth?.current).toBe(75); // 100 - 25
  });

  test('should NOT damage target when out of range', () => {
    // Move target away
    const targetTransform = target.getComponent<TransformComponent>('Transform');
    targetTransform!.x = 300; // Distance 200 > 64

    const handler = mockEventSystem.on.mock.calls.find(
      (call: any) => call[0] === 'input:keydown',
    )[1];
    handler('Space');

    const targetHealth = target.getComponent<HealthComponent>('Health');
    expect(targetHealth?.current).toBe(100);
  });

  test('should respect cooldown', () => {
    const handler = mockEventSystem.on.mock.calls.find(
      (call: any) => call[0] === 'input:keydown',
    )[1];

    // First attack
    handler('Space');
    expect(target.getComponent<HealthComponent>('Health')?.current).toBe(75);

    // Immediate second attack (should fail)
    handler('Space');
    expect(target.getComponent<HealthComponent>('Health')?.current).toBe(75);
  });
});
