import { Component } from '../ecs/component';
import { Entity } from '../ecs/entity';
import { Tilemap } from '../world/tilemap';

/**
 * Interface for serialized component data.
 */
export interface SerializedComponent {
  /** Component name/type */
  name: string;
  /** Component data properties */
  data: any;
}

/**
 * Interface for serialized entity data.
 */
export interface SerializedEntity {
  /** Entity unique ID */
  id: string;
  /** List of serialized components */
  components: SerializedComponent[];
}

/**
 * Interface for a full serialized world state.
 */
export interface SerializedWorld {
  /** List of all entities */
  entities: SerializedEntity[];
  /** Optional tilemap data */
  tilemap?: any;
  /** Timestamp of serialization */
  timestamp: number;
}

/** Constructor type for Components */
export type ComponentConstructor = new (...args: any[]) => Component;

/**
 * System responsible for serializing and deserializing game entities and worlds.
 * Useful for saving/loading games and network synchronization.
 */
export class Serializer {
  private componentRegistry: Map<string, ComponentConstructor> = new Map();

  /**
   * Registers a component class for deserialization.
   * 
   * @param {string} name - The component name (must match component.name).
   * @param {ComponentConstructor} ctor - The component class constructor.
   */
  public registerComponent(name: string, ctor: ComponentConstructor) {
    this.componentRegistry.set(name, ctor);
  }

  /**
   * Serializes a single entity.
   * 
   * @param {Entity} entity - The entity to serialize.
   * @returns {SerializedEntity} The serialized entity object.
   */
  public serializeEntity(entity: Entity): SerializedEntity {
    const serializedComponents: SerializedComponent[] = [];

    for (const component of entity.getAllComponents()) {
      let data: any;
      // Use toJSON if available, otherwise shallow copy
      if ('toJSON' in component && typeof (component as any).toJSON === 'function') {
        data = (component as any).toJSON();
      } else {
        data = { ...component };
      }
      serializedComponents.push({
        name: component.name,
        data,
      });
    }

    return {
      id: entity.id,
      components: serializedComponents,
    };
  }

  /**
   * Deserializes an entity from data.
   * 
   * @param {SerializedEntity} data - The serialized entity data.
   * @returns {Entity} The reconstructed entity.
   */
  public deserializeEntity(data: SerializedEntity): Entity {
    const entity = new Entity(data.id);

    for (const compData of data.components) {
      const Ctor = this.componentRegistry.get(compData.name);
      if (Ctor) {
        const component = new Ctor();
        Object.assign(component, compData.data);
        entity.addComponent(component);
      } else {
        console.warn(`Serializer: Unknown component type ${compData.name}`);
      }
    }

    return entity;
  }

  /**
   * Serializes the entire world (entities and tilemap).
   * 
   * @param {Entity[]} entities - List of entities to serialize.
   * @param {Tilemap} [tilemap] - Optional tilemap to include.
   * @returns {string} JSON string of the world state.
   */
  public serializeWorld(entities: Entity[], tilemap?: Tilemap): string {
    const worldData: SerializedWorld = {
      entities: entities.map((e) => this.serializeEntity(e)),
      timestamp: Date.now(),
      tilemap: tilemap ? tilemap.toJSON() : undefined,
    };
    return JSON.stringify(worldData);
  }

  /**
   * Deserializes a world state from a JSON string.
   * 
   * @param {string} json - JSON string of the world state.
   * @returns {{ entities: Entity[]; tilemap?: Tilemap }} Object containing entities and optional tilemap.
   */
  public deserializeWorld(json: string): { entities: Entity[]; tilemap?: Tilemap } {
    const data: SerializedWorld = JSON.parse(json);
    const entities = data.entities.map((e) => this.deserializeEntity(e));

    let tilemap: Tilemap | undefined;
    if (data.tilemap) {
      tilemap = Tilemap.fromJSON(data.tilemap);
    }

    return { entities, tilemap };
  }
}
