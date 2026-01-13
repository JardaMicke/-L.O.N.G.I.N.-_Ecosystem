import { System } from '../ecs/system';
import { Entity } from '../ecs/entity';
import { ScriptComponent } from './script-component';
import { ScriptManager } from './script-manager';
import { Logger } from '../utils/logger';

export class ScriptSystem extends System {
    public requiredComponents = ['Script'];
    private manager: ScriptManager;
    private initializedScripts: Set<string> = new Set(); // entityID + scriptName + index -> initialized

    constructor(manager: ScriptManager) {
        super();
        this.manager = manager;
    }

    public update(entities: Entity[], dt: number): void {
        for (const entity of entities) {
            const scriptComp = entity.getComponent<ScriptComponent>('Script');
            if (!scriptComp) continue;

            scriptComp.scripts.forEach((scriptData, index) => {
                if (!scriptData.active) return;

                const script = this.manager.getScript(scriptData.name);
                if (!script) {
                    // Only warn once per script per entity to avoid spam
                    // (Simplification: just logging debug)
                    // Logger.debug(`ScriptSystem: Script '${scriptData.name}' not found.`);
                    return;
                }

                const instanceId = `${entity.id}_${scriptData.name}_${index}`;

                // Initialize if not already
                if (!this.initializedScripts.has(instanceId)) {
                    if (script.onStart) {
                        try {
                            script.onStart(entity, this.manager);
                        } catch (e: any) {
                            Logger.error(`Error in script ${scriptData.name}.onStart: ${e.message}`);
                            scriptData.active = false; // Disable crashing script
                        }
                    }
                    this.initializedScripts.add(instanceId);
                }

                // Update
                if (script.onUpdate) {
                    try {
                        script.onUpdate(entity, dt, this.manager);
                    } catch (e: any) {
                        Logger.error(`Error in script ${scriptData.name}.onUpdate: ${e.message}`);
                        scriptData.active = false;
                    }
                }
            });
        }
    }
}
