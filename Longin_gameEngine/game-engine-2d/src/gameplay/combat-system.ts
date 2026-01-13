import { TransformComponent } from '../core/components';
import { EventSystem } from '../core/event-system';
import { Entity } from '../ecs/entity';
import { System } from '../ecs/system';
import { PlayerComponent } from '../network/components';
import { InputHandler } from '../ui/input-handler';
import { Logger } from '../utils/logger';

import { HealthComponent } from './components';

export class CombatSystem extends System {
  private inputHandler: InputHandler;
  private eventSystem: EventSystem;
  private entities: Entity[] = [];
  private attackRange: number = 64; // Pixels
  private attackDamage: number = 25;
  private cooldown: number = 0.5; // Seconds
  private lastAttackTime: number = 0;

  constructor(inputHandler: InputHandler) {
    super();
    this.inputHandler = inputHandler;
    this.eventSystem = EventSystem.getInstance();
    this.requiredComponents = ['Health', 'Transform'];

    this.eventSystem.on('input:keydown', (key: string) => this.handleKey(key));
  }

  private handleKey(key: string): void {
    if (key === ' ' || key === 'Space') {
      // Spacebar
      this.tryAttack();
    }
  }

  private tryAttack(): void {
    const now = Date.now() / 1000;
    if (now - this.lastAttackTime < this.cooldown) {
      return; // Cooldown
    }

    // Find local player
    // Note: System.entities contains entities with Health+Transform.
    // But local player might not be in this list if we iterate differently.
    // However, we need to find the SOURCE of the attack (Local Player).
    // The source needs PlayerComponent, TransformComponent.

    // We can't easily query "Local Player" from `this.entities` efficiently without a tag or filtering.
    // But let's assume we can pass EntityManager or query it.
    // Actually, Systems usually operate on their registered entities.
    // But CombatSystem needs to know WHO is attacking.
    // Let's iterate all entities to find the local player.

    // Optimization: Cache local player entity or ID.

    let localPlayer: Entity | null = null;

    // We need access to all entities, or at least Players.
    // Since `this.entities` only has Health+Transform, it includes Players AND Enemies.

    for (const entity of this.entities) {
      const player = entity.getComponent<PlayerComponent>('Player');
      if (player && player.isLocal) {
        localPlayer = entity;
        break;
      }
    }

    if (!localPlayer) return;

    this.performAttack(localPlayer);
    this.lastAttackTime = now;
  }

  private performAttack(attacker: Entity): void {
    const attackerTransform = attacker.getComponent<TransformComponent>('Transform');
    if (!attackerTransform) return;

    Logger.info(`Player ${attacker.id} attacks!`);

    // Check for hits
    for (const target of this.entities) {
      if (target.id === attacker.id) continue; // Don't hit self

      const targetTransform = target.getComponent<TransformComponent>('Transform');
      const targetHealth = target.getComponent<HealthComponent>('Health');

      if (targetTransform && targetHealth && !targetHealth.isDead) {
        const dx = targetTransform.x - attackerTransform.x;
        const dy = targetTransform.y - attackerTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.attackRange) {
          targetHealth.takeDamage(this.attackDamage);
          Logger.info(
            `Hit entity ${target.id} for ${this.attackDamage} damage! HP: ${targetHealth.current}/${targetHealth.max}`,
          );

          // Visual feedback could be triggered here via EventSystem
          this.eventSystem.emit('combat:hit', {
            x: targetTransform.x,
            y: targetTransform.y,
            damage: this.attackDamage,
          });
        }
      }
    }
  }

  public update(entities: Entity[], deltaTime: number): void {
    // Update logic if needed (e.g. cooldown visuals)
    // System.entities is updated automatically by SystemRegistry
    this.entities = entities; // Update local cache of relevant entities
  }
}
