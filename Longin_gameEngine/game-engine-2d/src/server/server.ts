import { createServer, Server as HttpServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';

import express from 'express';
import multer from 'multer';
import { Server as SocketIOServer, Socket } from 'socket.io';

import { ConfigManager } from '../core/config-manager';
import { Engine } from '../core/engine';
import { Logger } from '../utils/logger';

import { DatabaseManager } from './database/db-manager';
import { PlayerRepository } from './database/repositories/player-repository';
import { MapRepository, MapData } from './database/repositories/map-repository';
import { AssetRepository } from './database/repositories/asset-repository';
import { BTTemplateRepository, BTTemplateData } from './database/repositories/bt-template-repository';
import { ServerNetworkSystem } from './server-network-system';

export class GameServer {
  private app: express.Application;
  private httpServer: HttpServer;
  private io: SocketIOServer;
  private engine: Engine;
  private port: number;
  private dbManager: DatabaseManager;
  private mapRepository: MapRepository;
  private assetRepository: AssetRepository;
  private btTemplateRepository: BTTemplateRepository;

  constructor() {
    this.app = express();
    // Enable JSON parsing for API requests
    this.app.use(express.json());

    // Serve uploaded assets
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    this.app.use('/uploads', express.static(uploadDir));

    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Initialize Engine with DI
    const configManager = ConfigManager.getInstance();

    // Validate critical environment variables at startup
    try {
      configManager.validateEnv(['PORT', 'HOST']);
    } catch (error) {
      Logger.error('Environment validation failed:', error as Error);
      process.exit(1);
    }

    this.engine = new Engine({
      configManager,
      // Inject other server-specific overrides if needed here
    });

    this.engine.systemRegistry.registerSystem(
      new ServerNetworkSystem(this.io, this.engine.entityManager),
    );

    this.port = configManager.getConfig().network.port;

    this.dbManager = DatabaseManager.getInstance();
    this.mapRepository = new MapRepository();
    this.assetRepository = new AssetRepository(this.dbManager);
    this.btTemplateRepository = new BTTemplateRepository();

    // Initialize tables
    this.initTables();

    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private async initTables(): Promise<void> {
    await this.mapRepository.createTable();
    await this.assetRepository.createTable();
    await this.btTemplateRepository.createTable();
  }

  private setupRoutes(): void {
    // Multer Config
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads');
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // Safe filename: timestamp + original name (sanitized)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });

    const upload = multer({
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/json'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'));
        }
      }
    });

    // API Routes for Assets
    this.app.post('/api/assets/upload', upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }

        const assetData = {
          filename: req.file.filename,
          original_name: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: `/uploads/${req.file.filename}`,
          tags: req.body.tags ? JSON.parse(req.body.tags) : []
        };

        const id = await this.assetRepository.save(assetData);

        if (id) {
          res.status(201).json({
            id,
            message: 'Asset uploaded successfully',
            url: assetData.path
          });
        } else {
          // Cleanup file if DB save fails
          fs.unlink(req.file.path, (err) => {
            if (err) Logger.error('Error deleting orphaned file', err);
          });
          res.status(500).json({ error: 'Failed to save asset metadata' });
        }
      } catch (error) {
        Logger.error('Error uploading asset', error as Error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/assets', async (req, res) => {
      try {
        const assets = await this.assetRepository.findAll();
        res.json(assets);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assets' });
      }
    });

    // API Routes for Maps
    this.app.post('/api/maps', async (req, res) => {
      try {
        const mapData: MapData = req.body;
        // Basic validation
        if (!mapData.name || !mapData.width || !mapData.height || !mapData.layers) {
          res.status(400).json({ error: 'Missing required map fields' });
          return;
        }

        const id = await this.mapRepository.save(mapData);
        if (id) {
          res.status(201).json({ id, message: 'Map saved successfully' });
        } else {
          res.status(500).json({ error: 'Failed to save map' });
        }
      } catch (error) {
        Logger.error('Error saving map via API', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/maps', async (req, res) => {
      try {
        const maps = await this.mapRepository.findAll();
        res.json(maps);
      } catch (error) {
        res.status(500).json({ error: 'Failed to list maps' });
      }
    });

    this.app.get('/api/maps/:id', async (req, res) => {
      try {
        const map = await this.mapRepository.findById(req.params.id);
        if (map) {
          res.json(map);
        } else {
          res.status(404).json({ error: 'Map not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve map' });
      }
    });

    this.app.patch('/api/maps/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updates: Partial<MapData> = req.body;

        // We need to fetch the existing map first to ensure it exists and merge updates if necessary
        // However, MapRepository.save performs a full update/replace. 
        // For a true PATCH, we should fetch -> merge -> save.

        const existingMap = await this.mapRepository.findById(id);
        if (!existingMap) {
          res.status(404).json({ error: 'Map not found' });
          return;
        }

        const updatedMap: MapData = {
          ...existingMap,
          ...updates,
          id: existingMap.id, // Ensure ID doesn't change
          updated_at: new Date()
        };

        const resultId = await this.mapRepository.save(updatedMap);
        if (resultId) {
          res.json({ id: resultId, message: 'Map updated successfully' });
        } else {
          res.status(500).json({ error: 'Failed to update map' });
        }
      } catch (error) {
        Logger.error('Error updating map via API', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // API Routes for Behavior Tree Templates
    this.app.post('/api/bt-templates', async (req, res) => {
      try {
        const templateData: BTTemplateData = req.body;
        if (!templateData.name || !templateData.tree_json) {
          res.status(400).json({ error: 'Missing required template fields' });
          return;
        }

        const id = await this.btTemplateRepository.save(templateData);
        if (id) {
          res.status(201).json({ id, message: 'BT Template saved successfully' });
        } else {
          res.status(500).json({ error: 'Failed to save BT Template' });
        }
      } catch (error) {
        Logger.error('Error saving BT Template via API', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/bt-templates', async (req, res) => {
      try {
        const templates = await this.btTemplateRepository.findAll();
        res.json(templates);
      } catch (error) {
        res.status(500).json({ error: 'Failed to list BT Templates' });
      }
    });

    this.app.get('/api/bt-templates/:id', async (req, res) => {
      try {
        const template = await this.btTemplateRepository.findById(req.params.id);
        if (template) {
          res.json(template);
        } else {
          res.status(404).json({ error: 'BT Template not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve BT Template' });
      }
    });

    this.app.delete('/api/bt-templates/:id', async (req, res) => {
      try {
        const success = await this.btTemplateRepository.delete(req.params.id);
        if (success) {
          res.json({ message: 'BT Template deleted successfully' });
        } else {
          res.status(404).json({ error: 'BT Template not found or delete failed' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete BT Template' });
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        fps: 60, // TODO: Hook up real FPS
        db: {
          postgres: this.dbManager.getPostgres()?.isConnected() || false,
          mongo: this.dbManager.getMongo()?.isConnected() || false,
        },
      });
    });

    // Liveness probe - checks if the app is running
    this.app.get('/health/live', (req, res) => {
      res.status(200).json({ status: 'alive' });
    });

    // Readiness probe - checks if the app is ready to serve traffic (DBs connected)
    this.app.get('/health/ready', (req, res) => {
      const postgresConnected = this.dbManager.getPostgres()?.isConnected() ?? true; // If not configured, assume true or handle otherwise
      const mongoConnected = this.dbManager.getMongo()?.isConnected() ?? true;

      // Check only configured databases. If dbManager returns null, it means it wasn't configured.
      // However, dbManager logic is: if config exists, create connector.
      // So if getPostgres() is not null, we must be connected.

      const isPostgresHealthy = this.dbManager.getPostgres()
        ? this.dbManager.getPostgres()!.isConnected()
        : true;
      const isMongoHealthy = this.dbManager.getMongo()
        ? this.dbManager.getMongo()!.isConnected()
        : true;

      if (isPostgresHealthy && isMongoHealthy) {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({
          status: 'not ready',
          details: {
            postgres: isPostgresHealthy,
            mongo: isMongoHealthy,
          },
        });
      }
    });

    const distPublicPath = path.join(process.cwd(), 'dist/public');

    Logger.info(`Serving static files from: ${distPublicPath}`);

    this.app.use(express.static(distPublicPath));
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      Logger.info(`Player connected: ${socket.id}`);
      this.engine.eventSystem.emit('network:connect', socket.id);

      socket.on('disconnect', () => {
        Logger.info(`Player disconnected: ${socket.id}`);
        this.engine.eventSystem.emit('network:disconnect', socket.id);
      });

      socket.on('input', (data: any) => {
        // Handle input from client
        // Logger.info(`Received input from ${socket.id}: ${JSON.stringify(data)}`); // Verbose
        this.engine.eventSystem.emit('network:input', { socketId: socket.id, data });
      });

      socket.on('join', (data: any) => {
        this.engine.eventSystem.emit('network:join', { socketId: socket.id, data });
      });
    });
  }

  public async start(): Promise<void> {
    await this.dbManager.connectAll();

    // Ensure DB schemas exist
    const playerRepo = new PlayerRepository();
    await playerRepo.createTable();

    this.engine.start();

    this.httpServer.listen(this.port, () => {
      Logger.info(`Game Server listening on port ${this.port}`);
    });
  }

  public async stop(): Promise<void> {
    this.engine.stop();
    await this.dbManager.disconnectAll();
    this.httpServer.close();
  }
}

// Entry point
if (require.main === module) {
  const server = new GameServer();
  server.start();
}
