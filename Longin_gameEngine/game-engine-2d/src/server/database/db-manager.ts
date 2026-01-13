import { ConfigManager } from '../../core/config-manager';
import { Logger } from '../../utils/logger';

import { MongoConnector } from './mongo-connector';
import { PostgresConnector } from './postgres-connector';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private postgres: PostgresConnector | null = null;
  private mongo: MongoConnector | null = null;

  private constructor() {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getConfig().database;

    if (config.postgres) {
      this.postgres = new PostgresConnector(config.postgres);
    }

    if (config.mongodb) {
      this.mongo = new MongoConnector(config.mongodb.uri);
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connectAll(): Promise<void> {
    if (this.postgres) {
      try {
        await this.postgres.connect();
      } catch (error) {
        Logger.warn('Optional Postgres connection failed', error as Error);
      }
    }

    if (this.mongo) {
      try {
        await this.mongo.connect();
      } catch (error) {
        Logger.warn('Optional MongoDB connection failed', error as Error);
      }
    }
  }

  public async disconnectAll(): Promise<void> {
    if (this.postgres && this.postgres.isConnected()) {
      await this.postgres.disconnect();
    }
    if (this.mongo && this.mongo.isConnected()) {
      await this.mongo.disconnect();
    }
  }

  public getPostgres(): PostgresConnector | null {
    return this.postgres;
  }

  public getMongo(): MongoConnector | null {
    return this.mongo;
  }
}
