import { IScript, ScriptContext, ScriptError } from './interfaces';
import { Logger } from '../utils/logger';
import { Entity } from '../ecs/entity';
import { Engine } from '../core/engine';

export class ScriptManager implements ScriptContext {
    private scripts: Map<string, IScript> = new Map();
    private engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    public registerScript(name: string, script: IScript): void {
        if (this.scripts.has(name)) {
            Logger.warn(`ScriptManager: Overwriting script '${name}'`);
        }
        this.scripts.set(name, script);
        Logger.info(`ScriptManager: Registered script '${name}'`);
    }

    public getScript(name: string): IScript | undefined {
        return this.scripts.get(name);
    }

    // --- ScriptContext Implementation ---

    public log(message: string): void {
        Logger.info(`[SCRIPT] ${message}`);
    }

    public getEntityById(id: string): Entity | undefined {
        // Assuming Engine exposes EntityManager or access to entities
        // Currently Engine.entities is likely managed by EntityManager
        return this.engine.entityManager.getEntity(id);
    }

    public getEntitiesWithComponent(componentName: string): Entity[] {
        return this.engine.entityManager.getEntitiesWithComponents([componentName]);
    }

    public createEntity(): Entity {
        return this.engine.entityManager.createEntity();
    }

    public destroyEntity(entity: Entity): void {
        this.engine.entityManager.removeEntity(entity.id);
    }

    public isKeyDown(key: string): boolean {
        return this.engine.inputHandler.isKeyDown(key);
    }

    public playSound(soundId: string): void {
        // this.engine.audioSystem.play(soundId);
        Logger.info(`[SCRIPT] Play sound: ${soundId} (Not fully implemented)`);
    }
}
