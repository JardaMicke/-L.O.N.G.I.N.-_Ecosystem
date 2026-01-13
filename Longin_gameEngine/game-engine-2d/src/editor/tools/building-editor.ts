import { Logger } from '../../utils/logger';

export interface BuildingDefinition {
    id: string;
    name: string;
    width: number;
    height: number;
    cost: Record<string, number>; // Resource ID -> Amount
    buildTime: number; // Seconds
    textureId: string;
    colliders?: any[]; // Simple rects
}

export class BuildingEditor {
    private buildings: Map<string, BuildingDefinition> = new Map();

    public createBuilding(id: string, name: string): BuildingDefinition {
        if (this.buildings.has(id)) {
            throw new Error(`Building ${id} already exists`);
        }

        const newBuilding: BuildingDefinition = {
            id,
            name,
            width: 1,
            height: 1,
            cost: {},
            buildTime: 10,
            textureId: 'default_building'
        };

        this.buildings.set(id, newBuilding);
        Logger.info(`Created building definition: ${name}`);
        return newBuilding;
    }

    public updateBuilding(id: string, updates: Partial<BuildingDefinition>): void {
        const building = this.buildings.get(id);
        if (!building) {
            throw new Error(`Building ${id} not found`);
        }

        Object.assign(building, updates);
        Logger.info(`Updated building definition: ${id}`);
    }

    public getBuilding(id: string): BuildingDefinition | undefined {
        return this.buildings.get(id);
    }

    public deleteBuilding(id: string): void {
        this.buildings.delete(id);
        Logger.info(`Deleted building definition: ${id}`);
    }

    public getAllBuildings(): BuildingDefinition[] {
        return Array.from(this.buildings.values());
    }

    public serialize(): string {
        return JSON.stringify(Array.from(this.buildings.entries()));
    }

    public deserialize(json: string): void {
        try {
            const entries = JSON.parse(json);
            this.buildings = new Map(entries);
        } catch (e) {
            Logger.error('Failed to deserialize buildings', e as Error);
        }
    }
}
