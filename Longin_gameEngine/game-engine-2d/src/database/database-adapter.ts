export interface IDatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    saveRecord(collection: string, id: string, data: any): Promise<void>;
    getRecord(collection: string, id: string): Promise<any>;
}

export class MockDatabaseAdapter implements IDatabaseAdapter {
    private memoryDb: Map<string, any> = new Map();

    async connect(): Promise<void> {
        console.log('MockDatabase connected');
    }

    async disconnect(): Promise<void> {
        console.log('MockDatabase disconnected');
    }

    async saveRecord(collection: string, id: string, data: any): Promise<void> {
        const key = `${collection}:${id}`;
        this.memoryDb.set(key, data);
        console.log(`Saved to ${key}`);
    }

    async getRecord(collection: string, id: string): Promise<any> {
        const key = `${collection}:${id}`;
        return this.memoryDb.get(key) || null;
    }
}
