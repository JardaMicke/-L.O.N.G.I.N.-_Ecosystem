import { Entity } from './entity';

/**
 * Abstract base class for all ECS Systems.
 * A System contains the logic to process entities that possess a specific set of components.
 */
export abstract class System {
  /**
   * Updates the system logic.
   * Called every frame/tick by the SystemRegistry.
   *
   * @param {Entity[]} entities - List of all entities in the game world.
   * @param {number} deltaTime - Time elapsed since the last update in seconds.
   */
  public abstract update(entities: Entity[], deltaTime: number): void;

  /**
   * Execution priority. Lower numbers run first.
   * Default is 0.
   */
  public priority: number = 0;

  /**
   * List of component names that an entity must have to be processed by this system.
   * Used for optimization (filtering entities).
   */
  public requiredComponents: string[] = [];
}
