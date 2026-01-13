import { Pool } from 'pg';

import { Logger } from '../../utils/logger';

import { DatabaseConnector } from './database-interface';

export class PostgresConnector implements DatabaseConnector {
  private pool: Pool;
  private connected: boolean = false;

  constructor(config: any) {
    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      Logger.error('Unexpected error on idle client', err);
      this.connected = false;
    });
  }

  public async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      this.connected = true;
      client.release();
      Logger.info('Connected to PostgreSQL');
    } catch (err) {
      Logger.error('Failed to connect to PostgreSQL', err as Error);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
    this.connected = false;
    Logger.info('Disconnected from PostgreSQL');
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async query(sql: string, params?: any[]): Promise<any> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return this.pool.query(sql, params);
  }
}
