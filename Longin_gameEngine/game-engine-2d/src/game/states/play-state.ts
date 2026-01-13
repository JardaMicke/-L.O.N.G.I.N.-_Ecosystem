import { TransformComponent } from '../../core/components';
import { Engine } from '../../core/engine';
import { State } from '../../core/game-state';
import { CombatSystem } from '../../gameplay/combat-system';
import { HealthComponent } from '../../gameplay/components';
import { NetworkSyncSystem } from '../../gameplay/network-sync-system';
import { PlayerControlSystem } from '../../gameplay/player-control-system';
import { Camera } from '../../graphics/camera';
import { SpriteComponent } from '../../graphics/components';
import { TilemapRenderer } from '../../graphics/tilemap-renderer';
import { PlayerComponent } from '../../network/components';
import { ColliderComponent, PhysicsComponent } from '../../physics/components';
import { HUD } from '../../ui/hud';
import { TouchGesture } from '../../ui/touch-handler';
import { Logger } from '../../utils/logger';
import { TerrainGenerator } from '../../world/terrain-generator';
import { Tilemap } from '../../world/tilemap';
import { Game } from '../core/game';
import { PlayerType } from '../core/interfaces';

/**
 * Hlavní herní stav.
 * Zodpovídá za inicializaci herního světa, spouštění systémů a správu herní smyčky.
 *
 * Main game state.
 * Responsible for game world initialization, system execution, and game loop management.
 */
export class PlayState implements State {
  public name: string = 'Play';
  private engine: Engine | null = null;
  private tilemap: Tilemap;
  private tilemapRenderer: TilemapRenderer | null = null;
  private camera: Camera;
  private isInitialized: boolean = false;
  private hud: HUD | null = null;
  private game: Game;
  private playerControlSystem: PlayerControlSystem | null = null;
  private networkSyncSystem: NetworkSyncSystem | null = null;
  private gestureHandler = (gesture: TouchGesture) => this.handleGesture(gesture);
  private resizeHandler = (data: { width: number; height: number }) => this.handleResize(data);
  private keyHandler = (key: string) => this.handleKey(key);
  private initialZoom: number = 1;

  constructor() {
    this.tilemap = new Tilemap(50, 50, 32); // 50x50 map, 32px tiles
    this.camera = new Camera(800, 600); // Default viewport, will be updated
    this.game = Game.getInstance();
  }

  public onEnter(engine: Engine): void {
    Logger.info('Entering PlayState');
    this.engine = engine;

    // Always re-initialize game logic on enter
    this.initialize(engine);
    this.game.start();

    if (this.hud) {
      this.hud.enable();
    }

    // Spawn Players from Game config
    this.spawnPlayers(engine);

    // Ensure we are connected if network is enabled
    if (engine.config.network.enabled && !engine.networkManager.isConnected()) {
      engine.networkManager.connect();
    }

    // Enable Touch Gestures
    engine.eventSystem.on('input:gesture', this.gestureHandler);

    // Handle Resize
    engine.eventSystem.on('engine:resize', this.resizeHandler);

    // Handle Keyboard Input (e.g. Escape for Menu)
    engine.eventSystem.on('input:keydown', this.keyHandler);
  }

  private spawnPoints: { x: number; y: number }[] = [];

  private initialize(engine: Engine): void {
    if (this.isInitialized) return;

    // Register Tiles
    // TODO: Move this to a proper Asset/Tile registry
    this.tilemap.registerTile(1, { id: 1, type: 'grass', walkable: true });
    this.tilemap.registerTile(2, { id: 2, type: 'wall', walkable: false });
    this.tilemap.registerTile(3, { id: 3, type: 'water', walkable: false });

    // Generate Terrain
    const generator = new TerrainGenerator(12345);
    generator.generate(this.tilemap, { grassId: 1, wallId: 2, waterId: 3 });

    // Find safe spawn points
    this.spawnPoints = generator.getSafeSpawnPoints(this.tilemap, 10); // Reserve 10 spots

    // Setup Renderer
    this.tilemapRenderer = new TilemapRenderer(engine.renderer);

    // Setup Camera bounds
    this.camera.setBounds(
      0,
      0,
      this.tilemap.width * this.tilemap.tileSize,
      this.tilemap.height * this.tilemap.tileSize,
    );

    // Setup HUD
    this.hud = new HUD(engine);

    // Setup Player Control System
    this.playerControlSystem = new PlayerControlSystem(engine.inputHandler, engine.networkManager);
    engine.systemRegistry.registerSystem(this.playerControlSystem);

    // Setup Combat System
    const combatSystem = new CombatSystem(engine.inputHandler);
    engine.systemRegistry.registerSystem(combatSystem);

    // Setup Network Sync System
    this.networkSyncSystem = new NetworkSyncSystem(engine.entityManager);
    engine.systemRegistry.registerSystem(this.networkSyncSystem);

    this.isInitialized = true;
  }

  private spawnPlayers(engine: Engine): void {
    // Clear existing players
    const existingPlayers = engine.entityManager.getEntitiesWithComponents(['Player']);
    existingPlayers.forEach((e) => engine.entityManager.removeEntity(e.id));

    const players = this.game.getPlayers();

    players.forEach((playerConfig, index) => {
      const entity = engine.entityManager.createEntity();

      // Use safe spawn point if available, else fallback
      let x = 100 + index * 50;
      let y = 100;

      if (index < this.spawnPoints.length) {
        x = this.spawnPoints[index].x;
        y = this.spawnPoints[index].y;
      } else {
        Logger.warn(`No spawn point found for player ${index}, using default.`);
      }

      entity.addComponent(new TransformComponent(x, y));

      // Identify local player
      // In LobbyState we create 'local_player', but we also fallback to first HUMAN if needed
      const isLocal = playerConfig.id === 'local_player';

      // Pass color and isLocal to PlayerComponent
      entity.addComponent(
        new PlayerComponent(
          playerConfig.id,
          playerConfig.name,
          playerConfig.color,
          playerConfig.type,
          isLocal,
        ),
      );

      // Visuals - using 'player' texture, tinting is not yet supported in SpriteComponent but we store color in PlayerComponent
      // In a real engine we'd modify SpriteComponent to support tint or use different sprites
      entity.addComponent(new SpriteComponent('player', 32, 32));

      entity.addComponent(new ColliderComponent({ width: 32, height: 32 }));
      entity.addComponent(new PhysicsComponent({ maxVelocity: 200 })); // Add Physics for movement
      entity.addComponent(new HealthComponent(100));

      Logger.info(
        `Spawned ${playerConfig.type} player: ${playerConfig.name} at ${x},${y} (Local: ${isLocal})`,
      );
    });

    // Spawn a dummy target for testing combat
    const dummy = engine.entityManager.createEntity();
    dummy.addComponent(new TransformComponent(300, 300));
    dummy.addComponent(new SpriteComponent('player', 32, 32)); // Reusing player sprite for now
    dummy.addComponent(new ColliderComponent({ width: 32, height: 32 }));
    dummy.addComponent(new HealthComponent(50));
    Logger.info('Spawned Dummy Target at 300,300');
  }

  public onExit(engine: Engine): void {
    Logger.info('Exiting PlayState');
    this.game.stop();

    if (this.hud) {
      this.hud.disable();
    }

    engine.eventSystem.off('input:gesture', this.gestureHandler);
    engine.eventSystem.off('engine:resize', this.resizeHandler);
    engine.eventSystem.off('input:keydown', this.keyHandler);

    // Cleanup Systems
    if (this.playerControlSystem) {
      engine.systemRegistry.removeSystem(this.playerControlSystem);
    }
    if (this.networkSyncSystem) {
      engine.systemRegistry.removeSystem(this.networkSyncSystem);
    }

    // Reset initialization so we re-setup on next enter (fresh state)
    this.isInitialized = false;
    this.playerControlSystem = null;
    this.networkSyncSystem = null;
    this.tilemapRenderer = null;
    this.hud = null;
  }

  public onUpdate(engine: Engine, deltaTime: number): void {
    this.game.update(deltaTime);

    // Update Camera to follow local player
    let targetX = this.camera.x;
    let targetY = this.camera.y;

    const entities = engine.entityManager.getEntitiesWithComponents(['Player', 'Transform']);
    for (const entity of entities) {
      const player = entity.getComponent<PlayerComponent>('Player');
      const transform = entity.getComponent<TransformComponent>('Transform');

      if (player && transform) {
        // AI Logic (Simple)
        if (player.type === PlayerType.AI) {
          this.updateAI(transform, deltaTime, player.difficulty);
        }

        // Camera Follow (Local Player)
        if (player.isLocal) {
          targetX = transform.x;
          targetY = transform.y;
        }
      }
    }

    // Manual camera update if not following entity directly
    if (!this.camera.target) {
      this.camera.lookAt(targetX, targetY);
    }
    this.camera.update(deltaTime);

    if (this.tilemapRenderer) {
      // Update visible tiles based on camera
    }
  }

  private handleGesture(gesture: TouchGesture): void {
    switch (gesture.type) {
      case 'pinch-start':
        this.initialZoom = this.camera.zoom;
        break;
      case 'pinch':
        if (gesture.scale) {
          this.camera.zoom = this.initialZoom * gesture.scale;
          // Clamp zoom level
          this.camera.zoom = Math.max(0.5, Math.min(this.camera.zoom, 3.0));
        }
        break;
      case 'double-tap':
        // Reset zoom on double tap
        this.camera.zoom = 1.0;
        break;
      case 'swipe':
        // Handle swipe if needed (e.g. dash or camera pan)
        break;
    }
  }

  private handleResize(data: { width: number; height: number }): void {
    this.camera.resize(data.width, data.height);
    if (this.hud) {
      this.hud.refreshLayout();
    }
    Logger.info(`PlayState camera resized to ${data.width}x${data.height}`);
  }

  private handleKey(key: string): void {
    if (key === 'Escape' && this.engine) {
      Logger.info('Escape pressed, returning to Lobby');
      this.engine.gameStateManager.switchState('Lobby');
    }
  }

  private updateAI(transform: TransformComponent, deltaTime: number, difficulty?: string): void {
    // Very simple random movement
    const speed = 50 * deltaTime;
    if (Math.random() < 0.02) {
      transform.rotation = Math.random() * 360;
    }
    // Move forward logic would go here
    // transform.x += Math.cos(transform.rotation) * speed;
    // transform.y += Math.sin(transform.rotation) * speed;
  }

  public onRender(engine: Engine, interpolation: number): void {
    if (this.tilemapRenderer) {
      this.tilemapRenderer.render(this.tilemap, this.camera);
    }

    // Render entities
    engine.renderSystem.render(this.camera);
  }

  public getCamera(): Camera | null {
    return this.camera;
  }

  public getTilemap(): Tilemap | null {
    return this.tilemap;
  }
}
