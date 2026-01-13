import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { EventSystem } from './event-system';

/**
 * Configuration structure for the engine.
 * Defines settings for all subsystems including graphics, network, and audio.
 */
export interface EngineConfig {
  /** Engine core settings */
  engine: {
    /** Logic updates per second */
    tickRate: number;
    /** Maximum number of entities allowed */
    maxEntities: number;
    /** Whether debug mode is enabled */
    debug: boolean;
  };
  /** Graphics and rendering settings */
  graphics: {
    /** Rendering backend type */
    type: 'canvas' | 'webgl';
    /** Screen width in pixels */
    width: number;
    /** Screen height in pixels */
    height: number;
    /** Whether vertical sync is enabled */
    vsync: boolean;
  };
  /** Pathfinding settings */
  pathfinding: {
    /** Algorithm to use */
    algorithm: 'A*' | 'HPA*' | 'JPS';
    /** Grid cell size in pixels */
    gridSize: number;
    /** Size of the path cache */
    cacheSize: number;
  };
  /** Networking settings */
  network: {
    /** Whether networking is enabled */
    enabled: boolean;
    /** Server port */
    port: number;
    /** Server host address */
    host: string;
    /** Network updates per second */
    tickRate: number;
  };
  /** Audio settings */
  audio: {
    /** Master volume multiplier (0.0 to 1.0) */
    masterVolume: number;
    /** Sound effects volume multiplier */
    sfxVolume: number;
    /** Music volume multiplier */
    musicVolume: number;
    /** Whether audio is globally muted */
    muted: boolean;
  };
  /** Database connection settings */
  database: {
    postgres?: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
    mongodb?: {
      uri: string;
    };
    redis?: {
      host: string;
      port: number;
    };
  };
}

/**
 * Manager for engine configuration.
 * Handles loading configuration from environment variables (.env) and providing typed access to settings.
 * Implements the Singleton pattern.
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: EngineConfig;
  private defaultConfig: EngineConfig;
  private envVars: Record<string, string> = {};
  private eventSystem: EventSystem;

  /**
   * Private constructor to enforce Singleton pattern.
   * 
   * @param {string} [envPath='.env'] - Path to the .env file.
   */
  private constructor(envPath: string = '.env') {
    this.eventSystem = EventSystem.getInstance();
    this.loadEnv(envPath);
    this.defaultConfig = this.buildConfig();
    this.config = JSON.parse(JSON.stringify(this.defaultConfig));
  }

  /**
   * Gets the singleton instance of the ConfigManager.
   * 
   * @returns {ConfigManager} The singleton instance.
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Gets the full engine configuration object.
   * 
   * @returns {EngineConfig} The configuration object.
   */
  public getConfig(): EngineConfig {
    return this.config;
  }

  /**
   * Retrieves a specific configuration value by path.
   * 
   * @template T - The expected type of the value.
   * @param {string} path - Dot-notation path to the setting (e.g., 'graphics.width').
   * @returns {T} The value at the specified path.
   */
  public get<T>(path: string): T {
    const parts = path.split('.');
    let current: any = this.config;
    for (const part of parts) {
      if (current === undefined) return undefined as any;
      current = current[part];
    }
    return current as T;
  }

  /**
   * Sets a configuration value by path.
   * Emits 'config:changed' and 'config:changed:{path}' events.
   * 
   * @param {string} path - Dot-notation path to the setting.
   * @param {any} value - The new value.
   */
  public set(path: string, value: any): void {
    const parts = path.split('.');
    let current: any = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    const key = parts[parts.length - 1];
    const oldValue = current[key];

    if (oldValue !== value) {
      current[key] = value;
      this.eventSystem.emit('config:changed', { path, value, oldValue });
      this.eventSystem.emit(`config:changed:${path}`, { value, oldValue });
    }
  }

  /**
   * Resets the configuration to the defaults loaded from environment variables.
   * Emits 'config:reset' event.
   */
  public resetToDefaults(): void {
    this.config = JSON.parse(JSON.stringify(this.defaultConfig));
    this.eventSystem.emit('config:reset', this.config);
  }

  /**
   * Validates required environment variables.
   * Throws an error if any required variable is missing.
   * @param {string[]} requiredVars - List of required environment variable names.
   * @throws {Error} If any required variable is missing.
   */
  public validateEnv(requiredVars: string[]): void {
    const missing: string[] = [];

    for (const v of requiredVars) {
      // Check both local envVars (from .env) and process.env (system/docker)
      const value = this.envVars[v] || (typeof process !== 'undefined' ? process.env[v] : undefined);
      if (!value) {
        missing.push(v);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Loads environment variables from a file.
   * 
   * @param {string} envPath - Path to the .env file.
   */
  private loadEnv(envPath: string): void {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath });
        if (result.error) {
          console.warn(`Warning: Could not load ${envPath}`);
        } else {
          this.envVars = result.parsed || {};
        }
      }
    }
  }

  /**
   * Gets an environment variable value.
   * Prioritizes process.env (Docker/system) over .env file.
   * @param {string} key - Environment variable name.
   * @param {string} defaultValue - Default value if not found.
   * @returns {string} The environment variable value.
   */
  private getEnv(key: string, defaultValue: string = ''): string {
    // Priority: process.env (Docker) > .env file > default
    if (typeof process !== 'undefined' && process.env[key]) {
      return process.env[key]!;
    }
    return this.envVars[key] || defaultValue;
  }

  private buildConfig(): EngineConfig {
    return {
      engine: {
        tickRate: parseInt(this.getEnv('ENGINE_TICK_RATE', '60')),
        maxEntities: parseInt(this.getEnv('ENGINE_MAX_ENTITIES', '10000')),
        debug: this.getEnv('ENGINE_DEBUG') === 'true',
      },
      graphics: {
        type: (this.getEnv('GRAPHICS_TYPE', 'canvas') as any),
        width: parseInt(this.getEnv('GRAPHICS_WIDTH', '1920')),
        height: parseInt(this.getEnv('GRAPHICS_HEIGHT', '1080')),
        vsync: this.getEnv('GRAPHICS_VSYNC') === 'true',
      },
      pathfinding: {
        algorithm: (this.getEnv('PATHFINDING_ALGORITHM', 'HPA*') as any),
        gridSize: parseInt(this.getEnv('PATHFINDING_GRID_SIZE', '16')),
        cacheSize: parseInt(this.getEnv('PATHFINDING_CACHE_SIZE', '1000')),
      },
      network: {
        enabled: this.getEnv('NETWORK_ENABLED') === 'true',
        port: parseInt(this.getEnv('NETWORK_PORT', '3000')),
        host: this.getEnv('NETWORK_HOST', '0.0.0.0'),
        tickRate: parseInt(this.getEnv('NETWORK_TICK_RATE', '20')),
      },
      audio: {
        masterVolume: parseFloat(this.getEnv('AUDIO_MASTER_VOLUME', '1.0')),
        sfxVolume: parseFloat(this.getEnv('AUDIO_SFX_VOLUME', '0.8')),
        musicVolume: parseFloat(this.getEnv('AUDIO_MUSIC_VOLUME', '0.5')),
        muted: this.getEnv('AUDIO_MUTED') === 'true',
      },
      database: {
        postgres: {
          host: this.getEnv('POSTGRES_HOST', 'localhost'),
          port: parseInt(this.getEnv('POSTGRES_PORT', '5432')),
          database: this.getEnv('POSTGRES_DATABASE', 'game_db'),
          user: this.getEnv('POSTGRES_USER', 'admin'),
          password: this.getEnv('POSTGRES_PASSWORD', 'secret'),
        },
        mongodb: {
          uri: this.getEnv('MONGO_URI', 'mongodb://localhost:27017/game_db'),
        },
        redis: {
          host: this.getEnv('REDIS_HOST', 'localhost'),
          port: parseInt(this.getEnv('REDIS_PORT', '6379')),
        },
      },
    };
  }
}
