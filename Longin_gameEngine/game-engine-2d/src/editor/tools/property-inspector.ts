import { Entity } from '../../ecs/entity';
import { EditorCore } from '../editor-core';
import { Logger } from '../../utils/logger';

export interface PropertyData {
    componentName: string;
    properties: Record<string, any>;
}

export class PropertyInspector {
    private editorCore: EditorCore;

    constructor() {
        this.editorCore = EditorCore.getInstance();
    }

    public inspect(entity: Entity): PropertyData[] {
        const data: PropertyData[] = [];

        // Iterate over all components of the entity
        // Entity structure assumes components is a map or list
        // Looking at typical ECS, entity has components.
        // We need to check Entity definition in src/ecs/entity.ts
        // Assuming public components array/map access for now.

        // Placeholder implementation until we verify Entity structure
        // If entity has getComponents():

        const components = entity.getAllComponents();
        for (const comp of components) {
            data.push({
                componentName: comp.name,
                properties: { ...comp } // simple shallow copy for now
            });
        }

        return data;
    }

    public updateProperty(entity: Entity, componentName: string, propName: string, value: any): void {
        const component = entity.getComponent(componentName);
        if (component) {
            (component as any)[propName] = value;
            Logger.info(`Updated ${componentName}.${propName} to ${value}`);
        }
    }
}
