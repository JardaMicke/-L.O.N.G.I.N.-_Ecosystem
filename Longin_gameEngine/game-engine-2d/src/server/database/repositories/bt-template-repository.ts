import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../utils/logger';
import { DatabaseManager } from '../db-manager';

/**
 * Data structure for a Behavior Tree template.
 */
export interface BTTemplateData {
    id?: string;
    name: string;
    description: string;
    category: string;
    tree_json: any; // The full tree definition { name, root: {...} }
    author: string;
    version: number;
    created_at?: Date;
    updated_at?: Date;
}

/**
 * Repository for managing Behavior Tree templates in database/file storage.
 */
export class BTTemplateRepository {
    private dbManager: DatabaseManager;
    private readonly dataDir: string;

    constructor() {
        this.dbManager = DatabaseManager.getInstance();
        this.dataDir = path.join(process.cwd(), 'data', 'bt-templates');
        this.ensureDataDir();
    }

    private ensureDataDir(): void {
        if (!fs.existsSync(this.dataDir)) {
            try {
                fs.mkdirSync(this.dataDir, { recursive: true });
            } catch (e) {
                Logger.error('BTTemplateRepository: Failed to create data directory', e as Error);
            }
        }
    }

    public async createTable(): Promise<void> {
        const postgres = this.dbManager.getPostgres();
        if (!postgres || !postgres.isConnected()) return;

        const query = `
      CREATE TABLE IF NOT EXISTS bt_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT 'General',
        tree_json JSONB NOT NULL,
        author VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

        try {
            await postgres.query(query);
            Logger.info('BTTemplateRepository: Table bt_templates ensured');
        } catch (error) {
            Logger.error('BTTemplateRepository: Error creating table', error as Error);
        }
    }

    public async save(template: BTTemplateData): Promise<string | null> {
        const postgres = this.dbManager.getPostgres();
        if (postgres && postgres.isConnected()) {
            return this.saveToPostgres(template);
        } else {
            return this.saveToFile(template);
        }
    }

    private async saveToPostgres(template: BTTemplateData): Promise<string | null> {
        try {
            const postgres = this.dbManager.getPostgres()!;
            if (template.id) {
                // Update existing
                const query = `
          UPDATE bt_templates 
          SET name = $1, description = $2, category = $3, tree_json = $4, author = $5, version = $6, updated_at = NOW()
          WHERE id = $7
          RETURNING id;
        `;
                const result = await postgres.query(query, [
                    template.name,
                    template.description,
                    template.category,
                    JSON.stringify(template.tree_json),
                    template.author,
                    template.version,
                    template.id
                ]);
                return result.rows[0]?.id;
            } else {
                // Insert new
                const query = `
          INSERT INTO bt_templates (name, description, category, tree_json, author, version)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id;
        `;
                const result = await postgres.query(query, [
                    template.name,
                    template.description,
                    template.category,
                    JSON.stringify(template.tree_json),
                    template.author,
                    template.version
                ]);
                return result.rows[0]?.id;
            }
        } catch (error) {
            Logger.error('BTTemplateRepository: Error saving template to DB', error as Error);
            return null;
        }
    }

    private async saveToFile(template: BTTemplateData): Promise<string | null> {
        try {
            const id = template.id || uuidv4();
            template.id = id;
            template.updated_at = new Date();
            if (!template.created_at) template.created_at = new Date();

            const filePath = path.join(this.dataDir, `${id}.json`);
            await fs.promises.writeFile(filePath, JSON.stringify(template, null, 2));
            Logger.info(`BTTemplateRepository: Saved template to file ${id}`);
            return id;
        } catch (error) {
            Logger.error('BTTemplateRepository: Error saving template to file', error as Error);
            return null;
        }
    }

    public async findById(id: string): Promise<BTTemplateData | null> {
        const postgres = this.dbManager.getPostgres();
        if (postgres && postgres.isConnected()) {
            try {
                const result = await postgres.query('SELECT * FROM bt_templates WHERE id = $1', [id]);
                if (result.rows.length > 0) {
                    const row = result.rows[0];
                    return {
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        category: row.category,
                        tree_json: row.tree_json,
                        author: row.author,
                        version: row.version,
                        created_at: row.created_at,
                        updated_at: row.updated_at
                    };
                }
            } catch (error) {
                Logger.error(`BTTemplateRepository: Error finding template ${id} in DB`, error as Error);
            }
        } else {
            // File fallback
            const filePath = path.join(this.dataDir, `${id}.json`);
            if (fs.existsSync(filePath)) {
                try {
                    const data = await fs.promises.readFile(filePath, 'utf-8');
                    return JSON.parse(data) as BTTemplateData;
                } catch (error) {
                    Logger.error(`BTTemplateRepository: Error reading template file ${id}`, error as Error);
                }
            }
        }
        return null;
    }

    public async findAll(): Promise<Partial<BTTemplateData>[]> {
        const postgres = this.dbManager.getPostgres();
        if (postgres && postgres.isConnected()) {
            try {
                const result = await postgres.query(
                    'SELECT id, name, description, category, author, version, updated_at FROM bt_templates ORDER BY updated_at DESC'
                );
                return result.rows;
            } catch (error) {
                Logger.error('BTTemplateRepository: Error listing templates from DB', error as Error);
                return [];
            }
        } else {
            // File fallback
            try {
                const files = await fs.promises.readdir(this.dataDir);
                const templates: Partial<BTTemplateData>[] = [];
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const data = await fs.promises.readFile(path.join(this.dataDir, file), 'utf-8');
                        const template = JSON.parse(data) as BTTemplateData;
                        templates.push({
                            id: template.id,
                            name: template.name,
                            description: template.description,
                            category: template.category,
                            author: template.author,
                            version: template.version,
                            updated_at: template.updated_at
                        });
                    }
                }
                return templates.sort((a, b) => (new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime()));
            } catch (error) {
                Logger.error('BTTemplateRepository: Error listing template files', error as Error);
                return [];
            }
        }
    }

    public async findByCategory(category: string): Promise<Partial<BTTemplateData>[]> {
        const postgres = this.dbManager.getPostgres();
        if (postgres && postgres.isConnected()) {
            try {
                const result = await postgres.query(
                    'SELECT id, name, description, category, author, version, updated_at FROM bt_templates WHERE category = $1 ORDER BY name',
                    [category]
                );
                return result.rows;
            } catch (error) {
                Logger.error('BTTemplateRepository: Error finding templates by category', error as Error);
                return [];
            }
        } else {
            // File fallback - filter in memory
            const all = await this.findAll();
            return all.filter(t => t.category === category);
        }
    }

    public async delete(id: string): Promise<boolean> {
        const postgres = this.dbManager.getPostgres();
        if (postgres && postgres.isConnected()) {
            try {
                await postgres.query('DELETE FROM bt_templates WHERE id = $1', [id]);
                return true;
            } catch (error) {
                Logger.error('BTTemplateRepository: Error deleting template', error as Error);
                return false;
            }
        } else {
            // File fallback
            try {
                const filePath = path.join(this.dataDir, `${id}.json`);
                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                    return true;
                }
            } catch (error) {
                Logger.error('BTTemplateRepository: Error deleting template file', error as Error);
            }
            return false;
        }
    }
}
