import { EventSystem } from '../core/event-system';

import { Entity } from './entity';

export class EntityManager {
  private entities: Map<string, Entity>;
  private entitiesList: Entity[]; // Cache for faster iteration

  constructor() {
    this.entities = new Map();
    this.entitiesList = [];
  }

  public createEntity(): Entity {
    const entity = new Entity();
    this.addEntity(entity);
    return entity;
  }

  public addEntity(entity: Entity): void {
    if (!this.entities.has(entity.id)) {
      this.entities.set(entity.id, entity);
      this.entitiesList.push(entity);
      EventSystem.getInstance().emit('entity-created', entity);
    }
  }

  public removeEntity(id: string): void {
    if (this.entities.has(id)) {
      const entity = this.entities.get(id);
      entity!.active = false;
      this.entities.delete(id);
      this.entitiesList = this.entitiesList.filter((e) => e.id !== id);
      EventSystem.getInstance().emit('entity-removed', id);
    }
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getEntities(): Entity[] {
    return this.entitiesList;
  }

  public getEntitiesWithComponents(componentNames: string[]): Entity[] {
    return this.entitiesList.filter((entity) =>
      componentNames.every((name) => entity.hasComponent(name)),
    );
  }

  public clear(): void {
    this.entities.clear();
    this.entitiesList = [];
    // Optionally emit event
    // EventSystem.getInstance().emit('entities-cleared');
  }
}
