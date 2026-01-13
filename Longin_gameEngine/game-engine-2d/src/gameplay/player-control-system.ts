import { EventSystem } from '../core/event-system';
import { Entity } from '../ecs/entity';
import { System } from '../ecs/system';
import { PlayerType } from '../game/core/interfaces';
import { PlayerComponent } from '../network/components';
import { NetworkManager } from '../network/network-manager';
import { PhysicsComponent } from '../physics/components';
import { InputHandler } from '../ui/input-handler';

export class PlayerControlSystem extends System {
  private inputHandler: InputHandler;
  private networkManager: NetworkManager;
  private eventSystem: EventSystem;
  private speed: number = 200;

  constructor(inputHandler: InputHandler, networkManager: NetworkManager) {
    super();
    this.inputHandler = inputHandler;
    this.networkManager = networkManager;
    this.eventSystem = EventSystem.getInstance();
    this.requiredComponents = ['Player', 'Physics'];

    this.setupNetworkInput();
  }

  private setupNetworkInput(): void {
    this.eventSystem.on('input:keydown', (key: string) => {
      if (this.networkManager.isConnected()) {
        this.networkManager.send('input', { type: 'keydown', key });
      }
    });

    this.eventSystem.on('input:keyup', (key: string) => {
      if (this.networkManager.isConnected()) {
        this.networkManager.send('input', { type: 'keyup', key });
      }
    });
  }

  public update(entities: Entity[], deltaTime: number): void {
    const socket = this.networkManager.getSocket();
    const localSocketId = socket?.id || 'local_player';

    // Client-side prediction / Local movement
    for (const entity of entities) {
      const player = entity.getComponent<PlayerComponent>('Player');
      const physics = entity.getComponent<PhysicsComponent>('Physics');

      // Only control Human players that match local ID
      if (
        player &&
        physics &&
        player.type === PlayerType.HUMAN &&
        player.socketId === localSocketId
      ) {
        this.handleInput(physics);
      }
    }
  }

  private handleInput(physics: PhysicsComponent): void {
    let dx = 0;
    let dy = 0;

    if (this.inputHandler.isKeyDown('w') || this.inputHandler.isKeyDown('ArrowUp')) {
      dy = -1;
    }
    if (this.inputHandler.isKeyDown('s') || this.inputHandler.isKeyDown('ArrowDown')) {
      dy = 1;
    }
    if (this.inputHandler.isKeyDown('a') || this.inputHandler.isKeyDown('ArrowLeft')) {
      dx = -1;
    }
    if (this.inputHandler.isKeyDown('d') || this.inputHandler.isKeyDown('ArrowRight')) {
      dx = 1;
    }

    // Normalize vector if diagonal
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    // Apply velocity
    physics.velocity.x = dx * this.speed;
    physics.velocity.y = dy * this.speed;
  }
}
