import { Entity } from '../ecs/entity';

/**
 * Interface defining the structure of a game script.
 * Users implement this interface to create custom behaviors.
 */
export interface IScript {
    /**
     * Called when the script is initialized (e.g., entity creation or script attachment).
     * @param entity The entity this script is attached to.
     * @param context The scripting context providing access to game systems.
     */
    onStart?(entity: Entity, context: ScriptContext): void;

    /**
     * Called every frame.
     * @param entity The entity this script is attached to.
     * @param dt Delta time in seconds.
     * @param context The scripting context providing access to game systems.
     */
    onUpdate?(entity: Entity, dt: number, context: ScriptContext): void;

    /**
     * Called when the entity or script is destroyed.
     * @param entity The entity this script is attached to.
     * @param context The scripting context.
     */
    onDestroy?(entity: Entity, context: ScriptContext): void;
}

/**
 * Provides a safe interface for scripts to interact with the game engine.
 * Abstracts away complex subsystems.
 */
export interface ScriptContext {
    /** Log a message to the debug console */
    log(message: string): void;
    
    /** Get an entity by ID */
    getEntityById(id: string): Entity | undefined;
    
    /** Find entities by component type (name) */
    getEntitiesWithComponent(componentName: string): Entity[];
    
    /** Create a new entity */
    createEntity(): Entity;
    
    /** Destroy an entity */
    destroyEntity(entity: Entity): void;
    
    /** Check if a key is currently pressed */
    isKeyDown(key: string): boolean;

    /** Play a sound effect */
    playSound(soundId: string): void;

    // Add more helpers as needed (e.g., Math, Physics)
}

/**
 * Represents a script execution error.
 */
export class ScriptError extends Error {
    constructor(public scriptName: string, message: string, public originalError?: any) {
        super(`[Script: ${scriptName}] ${message}`);
        this.name = 'ScriptError';
    }
}
