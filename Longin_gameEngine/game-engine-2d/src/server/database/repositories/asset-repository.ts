import { DatabaseManager } from '../db-manager';
import { Logger } from '../../../utils/logger';

export interface AssetData {
  id?: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  path: string;
  created_at?: Date;
  tags?: string[];
}

export class AssetRepository {
  private dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  public async createTable(): Promise<void> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) return;

    const query = `
      CREATE TABLE IF NOT EXISTS assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        tags TEXT[]
      );
    `;

    try {
      await postgres.query(query);
      Logger.info('AssetRepository: Assets table created/verified');
    } catch (error) {
      Logger.error('AssetRepository: Error creating assets table', error as Error);
    }
  }

  public async save(asset: AssetData): Promise<string | null> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) {
        Logger.warn('AssetRepository: Postgres not connected');
        return null;
    }

    const query = `
      INSERT INTO assets (filename, original_name, mimetype, size, path, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const values = [
      asset.filename,
      asset.original_name,
      asset.mimetype,
      asset.size,
      asset.path,
      asset.tags || []
    ];

    try {
      const result = await postgres.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      Logger.error('AssetRepository: Error saving asset', error as Error);
      return null;
    }
  }

  public async findAll(): Promise<AssetData[]> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) return [];

    try {
      const result = await postgres.query('SELECT * FROM assets ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      Logger.error('AssetRepository: Error fetching assets', error as Error);
      return [];
    }
  }

  public async findById(id: string): Promise<AssetData | null> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) return null;

    try {
      const result = await postgres.query('SELECT * FROM assets WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      Logger.error('AssetRepository: Error fetching asset by ID', error as Error);
      return null;
    }
  }
}
