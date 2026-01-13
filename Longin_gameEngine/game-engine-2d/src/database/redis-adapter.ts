import { createClient } from 'redis';
import { Logger } from '../utils/logger';
import { IDatabaseAdapter } from './database-adapter';

export class RedisAdapter implements IDatabaseAdapter {
    private client: ReturnType<typeof createClient>;
    private isConnected: boolean = false;

    constructor(url: string = 'redis://localhost:6379') {
        this.client = createClient({ url });

        this.client.on('error', (err) => {
            Logger.error('Redis Client Error', err);
        });
    }

    async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect();
            this.isConnected = true;
            Logger.info('Connected to Redis');
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
            Logger.info('Disconnected from Redis');
        }
    }

    async saveRecord(collection: string, id: string, data: any): Promise<void> {
        const key = `${collection}:${id}`;
        await this.client.set(key, JSON.stringify(data));
    }

    async getRecord(collection: string, id: string): Promise<any> {
        const key = `${collection}:${id}`;
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
    }
}
