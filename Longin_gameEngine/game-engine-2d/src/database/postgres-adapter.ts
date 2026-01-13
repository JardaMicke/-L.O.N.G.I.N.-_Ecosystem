import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { IDatabaseAdapter } from './database-adapter';

export class PostgresAdapter implements IDatabaseAdapter {
    private pool: Pool;
    private isConnected: boolean = false;

    constructor(connectionString: string = 'postgresql://user:password@localhost:5432/game_db') {
        this.pool = new Pool({
            connectionString,
        });

        this.pool.on('error', (err) => {
            Logger.error('Unexpected error on idle client', err);
            this.isConnected = false;
        });
    }

    async connect(): Promise<void> {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()'); // Test query
            client.release();
            this.isConnected = true;
            Logger.info('Connected to PostgreSQL');
        } catch (e) {
            Logger.error('Failed to connect to PostgreSQL', e as Error);
            throw e;
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.pool.end();
            this.isConnected = false;
            Logger.info('Disconnected from PostgreSQL');
        }
    }

    async saveRecord(collection: string, id: string, data: any): Promise<void> {
        // Basic Key-Value simulation for now, typically would use specific tables
        const query = `
        INSERT INTO ${collection} (id, data) 
        VALUES ($1, $2) 
        ON CONFLICT (id) 
        DO UPDATE SET data = $2
      `;
        try {
            await this.pool.query(query, [id, data]);
        } catch (e) {
            // If table doesn't exist, might need to create it (simplified for this adapter)
            Logger.error(`Failed to save record to ${collection}`, e as Error);
        }
    }

    async getRecord(collection: string, id: string): Promise<any> {
        const query = `SELECT data FROM ${collection} WHERE id = $1`;
        try {
            const res = await this.pool.query(query, [id]);
            if (res.rows.length > 0) {
                return res.rows[0].data;
            }
            return null;
        } catch (e) {
            Logger.error(`Failed to get record from ${collection}`, e as Error);
            return null;
        }
    }
}
