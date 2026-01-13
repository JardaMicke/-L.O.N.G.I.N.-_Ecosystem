import { v4 as uuidv4 } from 'uuid';

import { Logger } from '../utils/logger';

import { Component, ComponentClass } from './component';

/**
 * Represents a generic object in the game world (Entity Component System).
 * An Entity is essentially a container for Components and has a unique ID.
 */
export class Entity {
  /** Unique identifier for the entity (UUID). */
  public readonly id: string;
  /** Map of components attached to this entity, keyed by component name. */
  private components: Map<string, Component>;
  /** Whether the entity is active and should be updated/rendered. */
  public active: boolean = true;

  /**
   * Creates a new Entity.
   * @param {string} [id] - Optional custom ID. If not provided, a UUID is generated.
   */
  constructor(id?: string) {
    this.id = id || uuidv4();
    this.components = new Map();
  }

  /**
   * Adds a component to the entity.
   * If a component of the same type already exists, it is overwritten (with a warning).
   *
   * @template T
   * @param {T} component - The component instance to add.
   */
  public addComponent<T extends Component>(component: T): void {
    if (this.components.has(component.name)) {
      Logger.warn(`Entity ${this.id}: Component ${component.name} already exists. Overwriting.`);
    }
    this.components.set(component.name, component);
  }

  /**
   * Removes a component from the entity by name.
   *
   * @param {string} componentName - The name of the component to remove.
   */
  public removeComponent(componentName: string): void {
    this.components.delete(componentName);
  }

  /**
   * Retrieves a component from the entity.
   *
   * @template T
   * @param {ComponentClass<T> | string} componentClass - The component class constructor or its name string.
   * @returns {T | undefined} The component instance or undefined if not found.
   *
   * @example
   * const transform = entity.getComponent(TransformComponent);
   * // or
   * const transform = entity.getComponent('Transform');
   */
  public getComponent<T extends Component>(
    componentClass: ComponentClass<T> | string,
  ): T | undefined {
    const name =
      typeof componentClass === 'string' ? componentClass : (new componentClass() as any).name;
    // Note: The above instantiation is a bit hacky to get the name if it's an instance property.
    // Better approach: Rely on string name passed or ensure static name property.
    // For now, let's assume we pass the string name or the instance has the name property.

    // Correction: Let's assume the user passes the name string for now to be safe, or we enforce a static name.
    // Let's implement a simpler version first where we pass the class and use its prototype or static name if available.

    // Safer implementation for this stage:
    if (typeof componentClass === 'string') {
      return this.components.get(componentClass) as T;
    }

    // If it's a class constructor, we need a way to match it.
    // Usually ECS engines map by Component Type ID or Name.
    // Let's iterate values for now (slow but safe) or require 'name' on the class.

    for (const component of this.components.values()) {
      if (component instanceof componentClass) {
        return component as T;
      }
    }
    return undefined;
  }

  /**
   * Checks if the entity has a specific component.
   *
   * @param {string} componentName - The name of the component.
   * @returns {boolean} True if the component exists.
   */
  public hasComponent(componentName: string): boolean {
    return this.components.has(componentName);
  }

  /**
   * Returns all components attached to this entity.
   * @returns {Component[]} Array of components.
   */
  public getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }
}
