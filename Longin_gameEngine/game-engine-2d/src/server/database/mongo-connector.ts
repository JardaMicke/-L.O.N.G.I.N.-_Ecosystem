import { MongoClient, Db } from 'mongodb';

import { Logger } from '../../utils/logger';

import { DatabaseConnector } from './database-interface';

export class MongoConnector implements DatabaseConnector {
  private client: MongoClient;
  private db: Db | null = null;
  private connected: boolean = false;

  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.connected = true;
      Logger.info('Connected to MongoDB');
    } catch (err) {
      Logger.error('Failed to connect to MongoDB', err as Error);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    await this.client.close();
    this.connected = false;
    Logger.info('Disconnected from MongoDB');
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async query(collectionName: string, query?: any): Promise<any> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }
    // This is a simplified wrapper, usually we'd expose the db or collection
    return this.db
      .collection(collectionName)
      .find(query || {})
      .toArray();
  }

  public getDb(): Db | null {
    return this.db;
  }
}
