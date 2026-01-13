import { Server as SocketIOServer } from 'socket.io';

import { TransformComponent } from '../core/components';
import { EventSystem } from '../core/event-system';
import { Entity } from '../ecs/entity';
import { EntityManager } from '../ecs/entity-manager';
import { System } from '../ecs/system';
import { PlayerComponent } from '../network/components';
import { PhysicsComponent, ColliderComponent } from '../physics/components';
import { Logger } from '../utils/logger';

import { PlayerRepository } from './database/repositories/player-repository';

export class ServerNetworkSystem extends System {
  private io: SocketIOServer;
  private entityManager: EntityManager;
  private eventSystem: EventSystem;
  private socketToEntityId: Map<string, string> = new Map();
  private playerRepo: PlayerRepository;

  // Broadcast rate limiting
  private lastBroadcast: number = 0;
  private broadcastRate: number = 1000 / 20; // 20 Hz

  constructor(io: SocketIOServer, entityManager: EntityManager) {
    super();
    this.io = io;
    this.entityManager = entityManager;
    this.eventSystem = EventSystem.getInstance();
    this.playerRepo = new PlayerRepository();
    this.requiredComponents = ['Player', 'Transform', 'Physics'];

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventSystem.on('network:join', async (payload: { socketId: string; data: any }) => {
      await this.createPlayerEntity(payload.socketId, payload.data?.username || 'Anonymous');
    });

    this.eventSystem.on('network:disconnect', async (socketId: string) => {
      await this.removePlayerEntity(socketId);
    });

    this.eventSystem.on('network:input', (payload: { socketId: string; data: any }) => {
      this.handleInput(payload.socketId, payload.data);
    });
  }

  private async createPlayerEntity(socketId: string, username: string): Promise<void> {
    if (this.socketToEntityId.has(socketId)) return;

    let x = 100;
    let y = 100;

    // Try to load from DB
    const playerData = await this.playerRepo.findByUsername(username);
    if (playerData) {
      x = playerData.x;
      y = playerData.y;
      Logger.info(`Loaded player ${username} from DB at ${x},${y}`);
    } else {
      Logger.info(`New player ${username}, spawning at ${x},${y}`);
    }

    const entity = this.entityManager.createEntity();
    entity.addComponent(new PlayerComponent(socketId, username));
    entity.addComponent(new TransformComponent(x, y)); // Spawn point
    entity.addComponent(new PhysicsComponent({ maxVelocity: 200 }));
    entity.addComponent(new ColliderComponent({ width: 32, height: 32 }));

    this.socketToEntityId.set(socketId, entity.id);
    Logger.info(`Created player entity ${entity.id} for socket ${socketId}`);

    // Notify client of their entity ID
    this.io.to(socketId).emit('game:joined', { entityId: entity.id, x, y });
  }

  private async removePlayerEntity(socketId: string): Promise<void> {
    const entityId = this.socketToEntityId.get(socketId);
    if (entityId) {
      // Save state before removing
      const entity = this.entityManager.getEntity(entityId);
      if (entity) {
        const transform = entity.getComponent<TransformComponent>('Transform');
        const player = entity.getComponent<PlayerComponent>('Player');
        if (transform && player) {
          await this.playerRepo.save({
            username: player.username,
            x: transform.x,
            y: transform.y,
          });
        }
      }

      this.entityManager.removeEntity(entityId);
      this.socketToEntityId.delete(socketId);
      Logger.info(`Removed player entity ${entityId} for socket ${socketId}`);
    }
  }

  private handleInput(socketId: string, input: any): void {
    const entityId = this.socketToEntityId.get(socketId);
    if (!entityId) return;

    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    const physics = entity.getComponent<PhysicsComponent>('Physics');
    if (!physics) return;

    // Simple movement logic
    const speed = 200;

    if (input.type === 'keydown') {
      switch (input.key) {
        case 'ArrowUp':
        case 'w':
          physics.velocity.y = -speed;
          break;
        case 'ArrowDown':
        case 's':
          physics.velocity.y = speed;
          break;
        case 'ArrowLeft':
        case 'a':
          physics.velocity.x = -speed;
          break;
        case 'ArrowRight':
        case 'd':
          physics.velocity.x = speed;
          break;
      }
    } else if (input.type === 'keyup') {
      switch (input.key) {
        case 'ArrowUp':
        case 'w':
          if (physics.velocity.y < 0) physics.velocity.y = 0;
          break;
        case 'ArrowDown':
        case 's':
          if (physics.velocity.y > 0) physics.velocity.y = 0;
          break;
        case 'ArrowLeft':
        case 'a':
          if (physics.velocity.x < 0) physics.velocity.x = 0;
          break;
        case 'ArrowRight':
        case 'd':
          if (physics.velocity.x > 0) physics.velocity.x = 0;
          break;
      }
    }
  }

  public update(entities: Entity[], deltaTime: number): void {
    const now = Date.now();
    if (now - this.lastBroadcast >= this.broadcastRate) {
      this.broadcastState(entities);
      this.lastBroadcast = now;
    }
  }

  private broadcastState(entities: Entity[]): void {
    const snapshot: any[] = [];

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform');
      const player = entity.getComponent<PlayerComponent>('Player');

      if (transform && player) {
        snapshot.push({
          id: entity.id,
          socketId: player.socketId,
          x: transform.x,
          y: transform.y,
          // Add other state data
        });
      }
    }

    if (snapshot.length > 0) {
      this.io.emit('game:state', { time: Date.now(), entities: snapshot });
    }
  }
}
