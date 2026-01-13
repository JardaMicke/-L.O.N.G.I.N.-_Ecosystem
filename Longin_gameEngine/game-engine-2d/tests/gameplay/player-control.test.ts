import { Entity } from '../../src/ecs/entity';
import { PlayerType } from '../../src/game/core/interfaces';
import { PlayerControlSystem } from '../../src/gameplay/player-control-system';
import { PlayerComponent } from '../../src/network/components';
import { NetworkManager } from '../../src/network/network-manager';
import { PhysicsComponent } from '../../src/physics/components';
import { InputHandler } from '../../src/ui/input-handler';

// Mocks
const mockInputHandler = {
  isKeyDown: jest.fn(),
} as unknown as InputHandler;

const mockNetworkManager = {
  getSocket: jest.fn().mockReturnValue({ id: 'local_player' }),
  isConnected: jest.fn().mockReturnValue(true),
  send: jest.fn(),
} as unknown as NetworkManager;

describe('PlayerControlSystem', () => {
  let system: PlayerControlSystem;
  let entity: Entity;

  beforeEach(() => {
    jest.clearAllMocks();
    system = new PlayerControlSystem(mockInputHandler, mockNetworkManager);

    entity = new Entity();
    entity.addComponent(new PlayerComponent('local_player', 'Test', '#fff', PlayerType.HUMAN));
    entity.addComponent(new PhysicsComponent());
  });

  test('should update velocity based on input', () => {
    (mockInputHandler.isKeyDown as jest.Mock).mockImplementation((key) => key === 'w');

    system.update([entity], 0.016);

    const physics = entity.getComponent<PhysicsComponent>('Physics');
    expect(physics?.velocity.y).toBeLessThan(0); // Moving up
    expect(physics?.velocity.x).toBe(0);
  });

  test('should not control remote players', () => {
    const remoteEntity = new Entity();
    remoteEntity.addComponent(
      new PlayerComponent('remote_player', 'Remote', '#fff', PlayerType.HUMAN),
    );
    remoteEntity.addComponent(new PhysicsComponent());

    (mockInputHandler.isKeyDown as jest.Mock).mockReturnValue(true);

    system.update([remoteEntity], 0.016);

    const physics = remoteEntity.getComponent<PhysicsComponent>('Physics');
    expect(physics?.velocity.x).toBe(0);
    expect(physics?.velocity.y).toBe(0);
  });
});
