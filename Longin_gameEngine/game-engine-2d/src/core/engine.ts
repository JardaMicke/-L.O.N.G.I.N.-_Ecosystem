import { AudioManager } from '../audio/audio-manager';
import { AudioSystem } from '../audio/audio-system';
import { DebugOverlay } from '../debug/debug-overlay';
import { DebugRenderSystem } from '../debug/debug-render-system';
import { Profiler } from '../debug/profiler';
import { EntityManager } from '../ecs/entity-manager';
import { SystemRegistry } from '../ecs/system-registry';
import { InventoryComponent } from '../gameplay/inventory';
import {
  AnimationComponent,
  LightComponent,
  ParticleEmitterComponent,
  SpriteComponent,
} from '../graphics/components';
import { LightingSystem } from '../graphics/lighting-system';
import { ParticleSystem } from '../graphics/particle-system';
import { RenderSystem } from '../graphics/render-system';
import { Renderer } from '../graphics/renderer';
import { SpriteManager } from '../graphics/sprite-manager';
import { NetworkManager } from '../network/network-manager';
import { CollisionSystem } from '../physics/collision-system';
import { ColliderComponent, PhysicsComponent } from '../physics/components';
import { PhysicsSystem } from '../physics/physics-system';
import { ToolManager } from '../tools/tool-manager';
import { DeviceManager } from '../ui/device-manager';
import { DevToolbar } from '../ui/dev-toolbar';
import { DialogueUI } from '../ui/dialogue-ui';
import { InputHandler } from '../ui/input-handler';
import { MobileControls } from '../ui/mobile-controls';
import { TouchHandler } from '../ui/touch-handler';
import { UIManager } from '../ui/ui-manager';
import { Logger } from '../utils/logger';

import { TransformComponent } from './components';
import { ConfigManager, EngineConfig } from './config-manager';
import { EventSystem } from './event-system';
import { GameLoop } from './game-loop';
import { GameStateManager } from './game-state';
import { ResourceManager } from './resource-manager';
import { Serializer } from './serialization';
import { BehaviorTreeComponent } from '../ai/behavior-tree/behavior-tree-component';
import { BehaviorTreeSystem } from '../ai/behavior-tree/behavior-tree-system';
import { TaskManager } from '../ai/task-system/task-manager';
import { TaskComponent } from '../ai/task-system/task-component';
import { CampaignManager } from '../ai/campaign/campaign-manager';
import { FactionComponent, ResourceNodeComponent, StrategicValueComponent, ThreatComponent } from '../ai/campaign/components';
import { SmartAgentComponent } from '../ai/behavior-tree/smart-agent-component';
import { SmartAgentSystem } from '../ai/behavior-tree/smart-agent-system';
import { QuestManager } from '../gameplay/quest-manager';
import { DialogueManager } from '../gameplay/dialogue-manager';
import { PlayerCampaignManager } from '../gameplay/player-campaign-manager';
import { TriggerSystem } from './trigger-system';
import { ConfigEditor } from '../tools/config-editor';
import { BTDebugger } from '../tools/bt-debugger';
import { AudioSourceComponent, AudioListenerComponent } from '../audio/components';
import { ScriptManager, ScriptSystem, ScriptComponent } from '../scripting';

/**
 * Dependencies for the Engine class.
 * Allows for Dependency Injection and loose coupling.
 */
export interface EngineDependencies {
  configManager?: ConfigManager;
  eventSystem?: EventSystem;
  audioManager?: AudioManager;
  entityManager?: EntityManager;
  systemRegistry?: SystemRegistry;
  gameLoop?: GameLoop;
  resourceManager?: ResourceManager;
  gameStateManager?: GameStateManager;
  renderer?: Renderer;
  inputHandler?: InputHandler;
  touchHandler?: TouchHandler;
  mobileControls?: MobileControls;
  deviceManager?: DeviceManager;
  networkManager?: NetworkManager;
  uiManager?: UIManager;
  spriteManager?: SpriteManager;
  serializer?: Serializer;
  toolManager?: ToolManager;
  configEditor?: ConfigEditor;
  btDebugger?: BTDebugger;
  questManager?: QuestManager;
  triggerSystem?: TriggerSystem;
  dialogueManager?: DialogueManager;
  playerCampaignManager?: PlayerCampaignManager;
}

/**
 * Core Engine class responsible for managing the game loop, systems, and global state.
 * Acts as the central hub for the 2D game engine.
 *
 * @class Engine
 */
export class Engine {
  /** Configuration manager instance */
  public configManager: ConfigManager;
  /** Global event system for communication between components */
  public eventSystem: EventSystem;
  /** Audio manager for handling sound and music */
  public audioManager: AudioManager;
  /** Entity Component System manager */
  public entityManager: EntityManager;
  /** Registry for ECS systems */
  public systemRegistry: SystemRegistry;
  /** Game loop handler (Update/Render cycle) */
  public gameLoop: GameLoop;
  /** Current engine configuration */
  public config: EngineConfig;

  /** Resource manager for assets (images, audio, etc.) */
  public resourceManager: ResourceManager;
  /** Game State Manager (Scenes, transitions) */
  public gameStateManager: GameStateManager;
  /** Core renderer instance */
  public renderer: Renderer;
  /** Input handler for keyboard/mouse */
  public inputHandler: InputHandler;
  /** Touch input handler */
  public touchHandler: TouchHandler;
  /** Mobile controls overlay */
  public mobileControls: MobileControls;
  /** Device manager for screen resizing and detection */
  public deviceManager: DeviceManager;
  /** Network manager for multiplayer functionality */
  public networkManager: NetworkManager;
  /** UI Manager for HUD and interface elements */
  public uiManager: UIManager;

  /** Sprite manager for handling visual assets */
  public spriteManager: SpriteManager;

  /** Main rendering system */
  public renderSystem: RenderSystem;
  /** Lighting system */
  public lightingSystem: LightingSystem;
  /** Particle system */
  public particleSystem: ParticleSystem;
  /** Behavior tree system for AI */
  public behaviorTreeSystem: BehaviorTreeSystem;
  /** Debug information overlay */
  public debugOverlay: DebugOverlay;
  /** Debug rendering system (colliders, paths) */
  public debugRenderSystem: DebugRenderSystem;

  /** Serialization system for saving/loading */
  public serializer: Serializer;
  /** In-game tool manager */
  public toolManager: ToolManager;
  /** Configuration editor tool */
  public configEditor: ConfigEditor;
  /** Behavior Tree debugger */
  public btDebugger: BTDebugger;

  /** Scripting manager for custom logic */
  public scriptManager: ScriptManager;

  /** Quest manager for tracking player progress */
  public questManager: QuestManager;

  /** Trigger system for world events */
  public triggerSystem: TriggerSystem;

  /** Dialogue manager for conversations */
  public dialogueManager: DialogueManager;

  /** UI component for dialogues */
  public dialogueUI: DialogueUI;

  /** Developer toolbar for tool access */
  public devToolbar: DevToolbar;

  /** Player campaign manager for persistent progress */
  public playerCampaignManager: PlayerCampaignManager;

  /**
   * Initializes the Engine, setting up all core systems, managers, and configurations.
   * Registers default systems and components.
   * 
   * @param dependencies Optional dependencies to inject (DI/Loose Coupling)
   */
  constructor(dependencies: EngineDependencies = {}) {
    Logger.initialize();
    Logger.info('Engine initializing...');

    this.configManager = dependencies.configManager || ConfigManager.getInstance();
    this.config = this.configManager.getConfig();

    this.configEditor = dependencies.configEditor || new ConfigEditor();
    this.btDebugger = dependencies.btDebugger || new BTDebugger();

    this.eventSystem = dependencies.eventSystem || EventSystem.getInstance();
    this.questManager = dependencies.questManager || new QuestManager(this.eventSystem);
    this.triggerSystem = dependencies.triggerSystem || new TriggerSystem(this.eventSystem);
    this.dialogueManager = dependencies.dialogueManager || new DialogueManager(this.eventSystem);
    this.playerCampaignManager = dependencies.playerCampaignManager || new PlayerCampaignManager(this.eventSystem);

    this.audioManager = dependencies.audioManager || AudioManager.getInstance();
    this.audioManager.init(this.config.audio);

    this.entityManager = dependencies.entityManager || new EntityManager();
    this.systemRegistry = dependencies.systemRegistry || new SystemRegistry(this.entityManager);

    // Serialization
    this.serializer = dependencies.serializer || new Serializer();
    this.registerComponents();

    // Register Core Systems
    this.systemRegistry.registerSystem(new PhysicsSystem());
    this.systemRegistry.registerSystem(new CollisionSystem());
    this.behaviorTreeSystem = new BehaviorTreeSystem();
    this.systemRegistry.registerSystem(this.behaviorTreeSystem);

    // AI Systems
    this.systemRegistry.registerSystem(new CampaignManager());
    this.systemRegistry.registerSystem(new TaskManager());
    this.systemRegistry.registerSystem(new SmartAgentSystem());

    // Scripting System
    this.scriptManager = new ScriptManager(this);
    this.systemRegistry.registerSystem(new ScriptSystem(this.scriptManager));

    this.systemRegistry.registerSystem(new AudioSystem());

    this.resourceManager = dependencies.resourceManager || new ResourceManager();
    this.spriteManager = dependencies.spriteManager || new SpriteManager(this.resourceManager);
    this.toolManager = dependencies.toolManager || new ToolManager(this.spriteManager);
    this.gameStateManager = dependencies.gameStateManager || new GameStateManager(this);
    this.renderer = dependencies.renderer || new Renderer(this.config.graphics);
    this.inputHandler = dependencies.inputHandler || new InputHandler();
    this.touchHandler = dependencies.touchHandler || new TouchHandler();
    this.mobileControls = dependencies.mobileControls || new MobileControls(this.inputHandler);
    this.deviceManager = dependencies.deviceManager || DeviceManager.getInstance();

    // Handle Device Resize
    this.deviceManager.onResize((device, screen) => {
      this.renderer.resize(screen.width, screen.height);
      this.eventSystem.emit('engine:resize', { width: screen.width, height: screen.height });
    });

    this.networkManager = dependencies.networkManager || new NetworkManager();
    this.uiManager = dependencies.uiManager || new UIManager();
    this.dialogueUI = new DialogueUI(this.dialogueManager, this.eventSystem);
    this.devToolbar = new DevToolbar(this);

    // Render Systems
    this.renderSystem = new RenderSystem(this.renderer, this.resourceManager, this.spriteManager);
    this.lightingSystem = new LightingSystem(this.renderer);
    this.particleSystem = new ParticleSystem(this.renderer);

    this.systemRegistry.registerSystem(this.renderSystem); // For update()
    this.systemRegistry.registerSystem(this.lightingSystem); // For update()
    this.systemRegistry.registerSystem(this.particleSystem); // For update()

    // Debug Tools
    this.debugOverlay = new DebugOverlay(this.renderer, this.entityManager);
    this.debugRenderSystem = new DebugRenderSystem(this.renderer, this.entityManager);

    if (this.config.engine.debug) {
      this.debugOverlay.toggle();
      this.debugRenderSystem.toggle();
    }

    this.eventSystem.on('input:keydown', (key: string) => {
      if (key === 'F3') {
        this.debugOverlay.toggle();
        this.debugRenderSystem.toggle();
      }
    });

    this.gameLoop = dependencies.gameLoop || new GameLoop(
      this.config.engine.tickRate,
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
    );
  }

  /**
   * Registers all core ECS components to the serializer.
   * This ensures they can be saved and loaded correctly.
   * @private
   */
  private registerComponents(): void {
    this.serializer.registerComponent('Transform', TransformComponent);
    this.serializer.registerComponent('Physics', PhysicsComponent);
    this.serializer.registerComponent('Collider', ColliderComponent);
    this.serializer.registerComponent('Sprite', SpriteComponent);
    this.serializer.registerComponent('Animation', AnimationComponent);
    this.serializer.registerComponent('Light', LightComponent);
    this.serializer.registerComponent('ParticleEmitter', ParticleEmitterComponent);
    this.serializer.registerComponent('Inventory', InventoryComponent);
    this.serializer.registerComponent('BehaviorTree', BehaviorTreeComponent);
    this.serializer.registerComponent('TaskComponent', TaskComponent);
    this.serializer.registerComponent('FactionComponent', FactionComponent);
    this.serializer.registerComponent('ResourceNodeComponent', ResourceNodeComponent);
    this.serializer.registerComponent('StrategicValueComponent', StrategicValueComponent);
    this.serializer.registerComponent('ThreatComponent', ThreatComponent);
    this.serializer.registerComponent('SmartAgentComponent', SmartAgentComponent);
    this.serializer.registerComponent('AudioSource', AudioSourceComponent);
    this.serializer.registerComponent('AudioListener', AudioListenerComponent);
    this.serializer.registerComponent('Script', ScriptComponent);
  }

  /**
   * Saves the current game state to local storage.
   * @param {string} slot - The slot name/ID to save to (e.g., 'slot1', 'quicksave').
   */
  public saveGame(slot: string): void {
    const tilemap = this.gameStateManager.getCurrentTilemap();
    const json = this.serializer.serializeWorld(
      this.entityManager.getEntities(),
      tilemap || undefined,
    );
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`save_${slot}`, json);
      Logger.info(`Game saved to slot ${slot}`);
    } else {
      Logger.warn('Cannot save game: localStorage is not available');
    }
  }

  /**
   * Loads a game state from local storage.
   * Clears current entities and loads the saved world state.
   * @param {string} slot - The slot name/ID to load from.
   */
  public loadGame(slot: string): void {
    if (typeof localStorage === 'undefined') return;

    const json = localStorage.getItem(`save_${slot}`);
    if (!json) {
      Logger.warn(`No save found in slot ${slot}`);
      return;
    }

    const { entities, tilemap } = this.serializer.deserializeWorld(json);

    this.entityManager.clear();
    for (const entity of entities) {
      this.entityManager.addEntity(entity);
    }

    if (tilemap) {
      this.gameStateManager.setTilemap(tilemap);
    }

    Logger.info(`Game loaded from slot ${slot}`);
  }

  /**
   * Initializes the rendering context and input listeners.
   * Should be called after the DOM is ready.
   *
   * @param {string} canvasId - The HTML ID of the canvas element to use.
   */
  public initialize(canvasId: string): void {
    this.renderer.initialize(canvasId);

    if (typeof document !== 'undefined') {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        this.inputHandler.initialize(canvas);
        this.touchHandler.initialize(canvas);
      } else {
        this.inputHandler.initialize(window);
      }

      this.mobileControls.initialize();
    }

    if (this.config.network.enabled) {
      this.networkManager.connect();
      this.setupNetworkInputBridge();
    }
  }

  /**
   * Sets up the bridge between local input events and the network manager.
   * Used for sending input actions to the server in multiplayer modes.
   * @private
   */
  private setupNetworkInputBridge(): void {
    // Forward input events to network
    this.eventSystem.on('input:keydown', (key: any) =>
      this.networkManager.send('input', { type: 'keydown', key }),
    );
    this.eventSystem.on('input:keyup', (key: any) =>
      this.networkManager.send('input', { type: 'keyup', key }),
    );
    this.eventSystem.on('input:mousedown', (data: any) =>
      this.networkManager.send('input', { type: 'mousedown', ...data }),
    );
    this.eventSystem.on('input:mouseup', (data: any) =>
      this.networkManager.send('input', { type: 'mouseup', ...data }),
    );
    // Mouse move might be too frequent, maybe only send if needed or throttled
    // this.eventSystem.on('input:mousemove', (data: any) => this.networkManager.send('input', { type: 'mousemove', ...data }));
  }

  /**
   * Starts the game loop.
   * Emits 'engine-started' event.
   */
  public start(): void {
    Logger.info('Engine starting...');
    this.gameLoop.start();
    this.eventSystem.emit('engine-started');
  }

  /**
   * Stops the game loop.
   * Emits 'engine-stopped' event.
   */
  public stop(): void {
    this.gameLoop.stop();
    this.eventSystem.emit('engine-stopped');
  }

  private update(deltaTime: number): void {
    this.inputHandler.getMousePosition(); // Refresh if needed

    this.gameStateManager.update(deltaTime);
    this.uiManager.update(deltaTime);
    this.systemRegistry.update(deltaTime);

    this.eventSystem.emit('update', deltaTime);
  }

  /**
   * Core render loop called every frame.
   * Handles clearing the screen, rendering the scene, entities, UI, and debug info.
   *
   * @param {number} interpolation - Interpolation factor (0.0 to 1.0) for smoothing between ticks.
   * @private
   */
  private render(interpolation: number): void {
    this.renderer.clear();

    // Render Game State (Scene)
    // GameState usually handles tilemap, but we can also inject entity rendering here
    this.gameStateManager.render(interpolation);

    // Render Entities via RenderSystem
    // We pass the camera from the current state
    const camera = this.gameStateManager.getCurrentCamera();
    this.renderSystem.render(camera || undefined);
    this.particleSystem.render(this.entityManager.getEntities(), camera || undefined);
    this.lightingSystem.render(this.entityManager.getEntities(), camera || undefined);

    const ctx = this.renderer.getContext();
    if (ctx) {
      this.uiManager.render(ctx);
    }

    // Debug Rendering
    if (this.config.engine.debug || this.debugOverlay.isVisible()) {
      const camera = this.gameStateManager.getCurrentCamera();
      // If no camera from state, pass undefined (DebugRenderSystem might assume identity or require handling)
      // Note: DebugRenderSystem takes "Camera | undefined"
      this.debugRenderSystem.render(camera || undefined);
      this.debugOverlay.render();
    }

    // Systems might also render, but usually we prefer explicit render pipeline
    // For ECS, we might have RenderSystems that listen to 'render' event or are called here
    this.eventSystem.emit('render', interpolation);
  }
}

// Entry point support
if (require.main === module) {
  const engine = new Engine();
  // Mocking DOM for headless run if needed
  engine.start();
}
