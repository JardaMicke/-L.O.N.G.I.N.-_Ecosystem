import { Component } from '../ecs/component';

/**
 * Interface representing a 2D vector.
 * @interface Vector2
 */
export interface Vector2 {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * Component that adds physics properties to an entity.
 * Handles velocity, acceleration, mass, friction, and static status.
 */
export class PhysicsComponent extends Component {
  public readonly name = 'Physics';
  
  /** Current velocity vector */
  public velocity: Vector2 = { x: 0, y: 0 };
  
  /** Current acceleration vector */
  public acceleration: Vector2 = { x: 0, y: 0 };
  
  /** Mass of the entity in kg (arbitrary units) */
  public mass: number = 1;
  
  /** Friction coefficient (0-1), where 1 is full stop and 0 is no friction */
  public friction: number = 0;
  
  /** Maximum velocity magnitude */
  public maxVelocity: number = 1000;
  
  /** If true, the entity is not affected by physics forces but can still affect others */
  public isStatic: boolean = false;

  /**
   * Creates a new PhysicsComponent.
   * @param {Partial<PhysicsComponent>} [options] - Initial properties.
   */
  constructor(options?: Partial<PhysicsComponent>) {
    super();
    if (options) Object.assign(this, options);
  }
}

/**
 * Type of collider shape.
 */
export type ColliderType = 'box' | 'circle';

/**
 * Component that defines a collision shape for an entity.
 * Used by CollisionSystem to detect and resolve collisions.
 */
export class ColliderComponent extends Component {
  public readonly name = 'Collider';
  
  /** Shape type of the collider */
  public colliderType: ColliderType = 'box';
  
  /** Width of the box collider */
  public width: number = 0; // For box
  
  /** Height of the box collider */
  public height: number = 0; // For box
  
  /** Radius of the circle collider */
  public radius: number = 0; // For circle
  
  /** Offset from the entity's position */
  public offset: Vector2 = { x: 0, y: 0 };
  
  /** If true, only emits events on collision but does not physically resolve it */
  public isTrigger: boolean = false; // If true, only emits events, no physical response
  
  /** Collision layer name */
  public layer: string = 'default';
  
  /** List of layers this collider collides with */
  public mask: string[] = ['default'];

  /**
   * Creates a new ColliderComponent.
   * @param {Partial<ColliderComponent>} [options] - Initial properties.
   */
  constructor(options?: Partial<ColliderComponent>) {
    super();
    if (options) Object.assign(this, options);
  }
}
