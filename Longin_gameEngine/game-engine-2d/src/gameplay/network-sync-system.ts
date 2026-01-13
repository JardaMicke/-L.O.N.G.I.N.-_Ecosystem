import { TransformComponent } from '../core/components';
import { EventSystem } from '../core/event-system';
import { Entity } from '../ecs/entity';
import { EntityManager } from '../ecs/entity-manager';
import { System } from '../ecs/system';
import { PlayerType } from '../game/core/interfaces';
import { SpriteComponent } from '../graphics/components';
import { PlayerComponent } from '../network/components';
import { ColliderComponent } from '../physics/components';
import { Logger } from '../utils/logger';

export class NetworkSyncSystem extends System {
  private eventSystem: EventSystem;
  private entityManager: EntityManager;
  private localSocketId: string | null = null;

  constructor(entityManager: EntityManager) {
    super();
    this.entityManager = entityManager;
    this.eventSystem = EventSystem.getInstance();
    this.requiredComponents = ['Player', 'Transform'];

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.eventSystem.on('network:connected', (id: string) => {
      this.localSocketId = id;
      this.updateLocalPlayerSocketId(id);
    });

    this.eventSystem.on('network:game:state', (payload: any) => {
      this.handleGameState(payload);
    });
  }

  private updateLocalPlayerSocketId(socketId: string): void {
    // Find the local player (assumed to be the first HUMAN player spawned by Game)
    // or identified by some other means.
    const entities = this.entityManager.getEntitiesWithComponents(['Player']);
    for (const entity of entities) {
      const player = entity.getComponent<PlayerComponent>('Player');
      if (player && player.type === PlayerType.HUMAN && player.socketId !== socketId) {
        // Assuming this is the local player if we haven't set socketId yet
        // Or if it matches 'p1' from Lobby
        // Ideally, Lobby should pass this info.
        // For now, we update the first human found.
        player.socketId = socketId;
        Logger.info(`Updated local player socketId to ${socketId}`);
        break;
      }
    }
  }

  private handleGameState(payload: any): void {
    const remoteEntities = payload.entities || [];
    const activeSocketIds = new Set<string>();

    for (const remote of remoteEntities) {
      activeSocketIds.add(remote.socketId);

      // Skip local player to avoid jitter (Client-Side Prediction)
      if (this.localSocketId && remote.socketId === this.localSocketId) {
        continue;
      }

      // Find local entity for this remote player
      const entities = this.entityManager.getEntitiesWithComponents(['Player']);
      const localEntity = entities.find((e) => {
        const pc = e.getComponent<PlayerComponent>('Player');
        return pc && pc.socketId === remote.socketId;
      });

      if (localEntity) {
        // Update position
        const transform = localEntity.getComponent<TransformComponent>('Transform');
        if (transform) {
          // TODO: Interpolation
          transform.x = remote.x;
          transform.y = remote.y;
        }
      } else {
        // Create new entity for remote player
        this.spawnRemotePlayer(remote);
      }
    }

    // Cleanup disconnected players
    this.cleanupStalePlayers(activeSocketIds);
  }

  private cleanupStalePlayers(activeSocketIds: Set<string>): void {
    const entities = this.entityManager.getEntitiesWithComponents(['Player']);
    for (const entity of entities) {
      const player = entity.getComponent<PlayerComponent>('Player');

      // If player is remote (not local) AND not in active list -> Remove
      // Only remove HUMAN players that are expected to be on server
      // AI players are currently local-only
      if (
        player &&
        player.type === PlayerType.HUMAN &&
        player.socketId !== this.localSocketId &&
        !activeSocketIds.has(player.socketId)
      ) {
        Logger.info(`Removing disconnected player ${player.socketId}`);
        this.entityManager.removeEntity(entity.id);
      }
    }
  }

  private spawnRemotePlayer(remote: any): void {
    const entity = this.entityManager.createEntity();
    entity.addComponent(new TransformComponent(remote.x, remote.y));
    // Use a default color or sync it
    entity.addComponent(
      new PlayerComponent(remote.socketId, 'Remote', '#cccccc', PlayerType.HUMAN),
    );
    entity.addComponent(new SpriteComponent('player', 32, 32));
    entity.addComponent(new ColliderComponent({ width: 32, height: 32 }));
    Logger.info(`Spawned remote player ${remote.socketId}`);
  }

  public update(entities: Entity[], deltaTime: number): void {
    // Send local player state to server
    if (!this.localSocketId) return;

    for (const entity of entities) {
      const player = entity.getComponent<PlayerComponent>('Player');
      const transform = entity.getComponent<TransformComponent>('Transform');

      // Only sync local player
      if (player && transform && player.socketId === 'local_player') {
        // Note: We might want to use real socketId if available,
        // but currently PlayState spawns with 'local_player' or 'p1' ID.
        // If we updated it in updateLocalPlayerSocketId, use that.

        // If we have a connected socketId, we should prefer that.
        // But PlayState sets id='local_player' initially.
        // The updateLocalPlayerSocketId updates player.socketId.

        if (player.socketId === this.localSocketId || player.socketId === 'local_player') {
          this.eventSystem.emit('network:send:update', {
            x: transform.x,
            y: transform.y,
            rotation: transform.rotation,
          });
        }
      }
    }
  }
}
