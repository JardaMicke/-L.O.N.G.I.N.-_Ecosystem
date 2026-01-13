import { Logger } from '../../../utils/logger';
import { DatabaseManager } from '../db-manager';

export interface PlayerData {
  id?: number;
  username: string;
  x: number;
  y: number;
  last_login?: Date;
}

export class PlayerRepository {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public async findByUsername(username: string): Promise<PlayerData | null> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) {
      Logger.warn('PlayerRepository: Postgres not connected, returning null');
      return null;
    }

    try {
      const result = await postgres.query('SELECT * FROM players WHERE username = $1', [username]);
      if (result.rows.length > 0) {
        return result.rows[0] as PlayerData;
      }
    } catch (error) {
      Logger.error('PlayerRepository: Error finding player', error as Error);
    }
    return null;
  }

  public async save(player: PlayerData): Promise<void> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) {
      Logger.warn('PlayerRepository: Postgres not connected, cannot save');
      return;
    }

    try {
      // Upsert (Postgres 9.5+)
      const query = `
                INSERT INTO players (username, x, y, last_login)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (username) 
                DO UPDATE SET x = $2, y = $3, last_login = NOW();
            `;
      await postgres.query(query, [player.username, player.x, player.y]);
      Logger.info(`PlayerRepository: Saved player ${player.username}`);
    } catch (error) {
      Logger.error('PlayerRepository: Error saving player', error as Error);
    }
  }

  public async createTable(): Promise<void> {
    const postgres = this.dbManager.getPostgres();
    if (!postgres || !postgres.isConnected()) return;

    const query = `
            CREATE TABLE IF NOT EXISTS players (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                x FLOAT NOT NULL DEFAULT 0,
                y FLOAT NOT NULL DEFAULT 0,
                last_login TIMESTAMP DEFAULT NOW()
            );
        `;
    try {
      await postgres.query(query);
      Logger.info('PlayerRepository: Table players ensured');
    } catch (error) {
      Logger.error('PlayerRepository: Error creating table', error as Error);
    }
  }
}
