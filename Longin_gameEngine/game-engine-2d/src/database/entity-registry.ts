import { Logger } from '../utils/logger';
import { IDatabaseAdapter } from './database-adapter';

export interface EntityDefinition {
    id: string;
    prefabName: string;
    components: Record<string, any>;
}

export class EntityRegistry {
    private db: IDatabaseAdapter;

    constructor(dbAdapter: IDatabaseAdapter) {
        this.db = dbAdapter;
    }

    async registerEntity(def: EntityDefinition): Promise<void> {
        await this.db.saveRecord('entity_definitions', def.id, def);
        Logger.info(`Registered entity definition: ${def.id}`);
    }

    async getEntityDefinition(id: string): Promise<EntityDefinition | null> {
        return await this.db.getRecord('entity_definitions', id);
    }
}
