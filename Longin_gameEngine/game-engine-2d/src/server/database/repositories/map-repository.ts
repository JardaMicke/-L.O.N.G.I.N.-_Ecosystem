import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../utils/logger';
import { DatabaseManager } from '../db-manager';

export interface MapLayerData {
  name: string;
  data: number[][]; // 2D array of tile IDs
  visible: boolean;
}

export interface MapData {
  id?: string; // UUID
  name: string;
  author: string;
  width: number;
  height: number;
  tileSize: number;
  layers: MapLayerData[];
  version: number;
  created_at?: Date;
  updated_at?: Date;
}

export class MapRepository {
  private dbManager: DatabaseManager;
  private readonly dataDir: string;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.dataDir = path.join(process.cwd(), 'data', 'maps');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (e) {
        Logger.error('MapRepository: Failed to create data directory', e as Error);
      }
    }
  }

  public async createTable(): Promise<void> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) return;

    const query = `
      CREATE TABLE IF NOT EXISTS maps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        tile_size INTEGER NOT NULL,
        layers JSONB NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    try {
      await postgres.query(query);
      Logger.info('MapRepository: Table maps ensured');
    } catch (error) {
      Logger.error('MapRepository: Error creating table', error as Error);
    }
  }

  public async save(map: MapData): Promise<string | null> {
    const postgres = this.dbManager.getPostgres();
    if (postgres && postgres.isConnected()) {
      return this.saveToPostgres(map);
    } else {
      return this.saveToFile(map);
    }
  }

  private async saveToPostgres(map: MapData): Promise<string | null> {
      try {
        const postgres = this.dbManager.getPostgres()!;
        if (map.id) {
          // Update existing
          const query = `
            UPDATE maps 
            SET name = $1, author = $2, width = $3, height = $4, tile_size = $5, layers = $6, version = $7, updated_at = NOW()
            WHERE id = $8
            RETURNING id;
          `;
          const result = await postgres.query(query, [
            map.name,
            map.author,
            map.width,
            map.height,
            map.tileSize,
            JSON.stringify(map.layers),
            map.version,
            map.id
          ]);
          return result.rows[0]?.id;
        } else {
          // Insert new
          const query = `
            INSERT INTO maps (name, author, width, height, tile_size, layers, version)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
          `;
          const result = await postgres.query(query, [
            map.name,
            map.author,
            map.width,
            map.height,
            map.tileSize,
            JSON.stringify(map.layers),
            map.version
          ]);
          return result.rows[0]?.id;
        }
      } catch (error) {
        Logger.error('MapRepository: Error saving map to DB', error as Error);
        return null;
      }
  }

  private async saveToFile(map: MapData): Promise<string | null> {
      try {
          const id = map.id || uuidv4();
          map.id = id;
          map.updated_at = new Date();
          if (!map.created_at) map.created_at = new Date();

          const filePath = path.join(this.dataDir, `${id}.json`);
          await fs.promises.writeFile(filePath, JSON.stringify(map, null, 2));
          Logger.info(`MapRepository: Saved map to file ${id}`);
          return id;
      } catch (error) {
          Logger.error('MapRepository: Error saving map to file', error as Error);
          return null;
      }
  }

  public async findById(id: string): Promise<MapData | null> {
    const postgres = this.dbManager.getPostgres();
    if (postgres && postgres.isConnected()) {
        try {
            const result = await postgres.query('SELECT * FROM maps WHERE id = $1', [id]);
            if (result.rows.length > 0) {
              const row = result.rows[0];
              return {
                id: row.id,
                name: row.name,
                author: row.author,
                width: row.width,
                height: row.height,
                tileSize: row.tile_size,
                layers: row.layers,
                version: row.version,
                created_at: row.created_at,
                updated_at: row.updated_at
              };
            }
          } catch (error) {
            Logger.error(`MapRepository: Error finding map ${id} in DB`, error as Error);
          }
    } else {
        // File fallback
        const filePath = path.join(this.dataDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const data = await fs.promises.readFile(filePath, 'utf-8');
                return JSON.parse(data) as MapData;
            } catch (error) {
                Logger.error(`MapRepository: Error reading map file ${id}`, error as Error);
            }
        }
    }
    return null;
  }

  public async findAll(): Promise<Partial<MapData>[]> {
    const postgres = this.dbManager.getPostgres();
    if (postgres && postgres.isConnected()) {
        try {
            const result = await postgres.query('SELECT id, name, author, updated_at FROM maps ORDER BY updated_at DESC');
            return result.rows;
        } catch (error) {
            Logger.error('MapRepository: Error listing maps from DB', error as Error);
            return [];
        }
    } else {
        // File fallback
        try {
            const files = await fs.promises.readdir(this.dataDir);
            const maps: Partial<MapData>[] = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.promises.readFile(path.join(this.dataDir, file), 'utf-8');
                    const map = JSON.parse(data) as MapData;
                    maps.push({
                        id: map.id,
                        name: map.name,
                        author: map.author,
                        updated_at: map.updated_at
                    });
                }
            }
            return maps.sort((a, b) => (new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime()));
        } catch (error) {
            Logger.error('MapRepository: Error listing map files', error as Error);
            return [];
        }
    }
  }
}
