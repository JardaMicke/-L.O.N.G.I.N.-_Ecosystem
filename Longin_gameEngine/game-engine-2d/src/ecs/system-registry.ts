import { Logger } from '../utils/logger';

import { EntityManager } from './entity-manager';
import { System } from './system';

export class SystemRegistry {
  private systems: System[];
  private entityManager: EntityManager;

  constructor(entityManager: EntityManager) {
    this.systems = [];
    this.entityManager = entityManager;
  }

  public registerSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
    Logger.info(`System registered: ${system.constructor.name} (Priority: ${system.priority})`);
  }

  public removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index > -1) {
      this.systems.splice(index, 1);
      Logger.info(`System removed: ${system.constructor.name}`);
    }
  }

  public update(deltaTime: number): void {
    for (const system of this.systems) {
      try {
        // Optimization: Filter entities if requiredComponents is set
        let entitiesToUpdate = this.entityManager.getEntities();

        if (system.requiredComponents.length > 0) {
          entitiesToUpdate = this.entityManager.getEntitiesWithComponents(
            system.requiredComponents,
          );
        }

        system.update(entitiesToUpdate, deltaTime);
      } catch (error) {
        Logger.error(`Error in system ${system.constructor.name}`, error as Error);
      }
    }
  }
}
