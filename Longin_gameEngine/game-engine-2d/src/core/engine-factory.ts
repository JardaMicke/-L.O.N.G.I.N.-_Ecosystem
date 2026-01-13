import { Engine, EngineDependencies } from './engine';
import { ConfigManager } from './config-manager';
import { EventSystem } from './event-system';
import { AudioManager } from '../audio/audio-manager';
import { EntityManager } from '../ecs/entity-manager';
import { SystemRegistry } from '../ecs/system-registry';
import { GameLoop } from './game-loop';
import { ResourceManager } from './resource-manager';
import { GameStateManager } from './game-state';
import { Renderer } from '../graphics/renderer';
import { InputHandler } from '../ui/input-handler';
import { TouchHandler } from '../ui/touch-handler';
import { MobileControls } from '../ui/mobile-controls';
import { DeviceManager } from '../ui/device-manager';
import { NetworkManager } from '../network/network-manager';
import { UIManager } from '../ui/ui-manager';
import { SpriteManager } from '../graphics/sprite-manager';
import { Serializer } from './serialization';
import { ToolManager } from '../tools/tool-manager';
import { ConfigEditor } from '../tools/config-editor';
import { BTDebugger } from '../tools/bt-debugger';
import { ServiceContainer } from './di/service-container';
import { Logger } from '../utils/logger';

/**
 * Factory class for creating Engine instances with all dependencies injected.
 * Promotes loose coupling and easier testing by centralizing dependency creation.
 */
export class EngineFactory {
  /**
   * Creates a fully initialized Engine instance with default dependencies.
   * 
   * @param canvasId The ID of the HTML canvas element.
   * @returns A new Engine instance.
   */
  public static createEngine(): Engine {
    Logger.info('EngineFactory: Creating new Engine instance...');

    // 1. Initialize Core Singletons / Managers
    const configManager = ConfigManager.getInstance();
    const eventSystem = EventSystem.getInstance();
    const deviceManager = DeviceManager.getInstance();
    const container = ServiceContainer.getInstance();

    // 2. Create Instances
    const entityManager = new EntityManager();
    const systemRegistry = new SystemRegistry(entityManager);
    const audioManager = AudioManager.getInstance();
    const resourceManager = new ResourceManager();
    const serializer = new Serializer();
    const networkManager = new NetworkManager();
    const inputHandler = new InputHandler();
    const touchHandler = new TouchHandler();
    
    // Dependencies requiring other dependencies
    const spriteManager = new SpriteManager(resourceManager);
    const toolManager = new ToolManager(spriteManager);
    const configEditor = new ConfigEditor();
    const btDebugger = new BTDebugger();
    
    // Renderer needs config
    const renderer = new Renderer(configManager.getConfig().graphics);

    // Mobile controls need input handler
    const mobileControls = new MobileControls(inputHandler);

    // 3. Register services in Container (Optional, but good for global access if needed)
    container.register('ConfigManager', configManager);
    container.register('EventSystem', eventSystem);
    container.register('EntityManager', entityManager);
    container.register('SystemRegistry', systemRegistry);
    container.register('AudioManager', audioManager);
    container.register('ResourceManager', resourceManager);
    container.register('Renderer', renderer);
    container.register('InputHandler', inputHandler);
    
    // 4. Construct Dependencies Object
    const dependencies: EngineDependencies = {
      configManager,
      eventSystem,
      audioManager,
      entityManager,
      systemRegistry,
      resourceManager,
      renderer,
      inputHandler,
      touchHandler,
      mobileControls,
      deviceManager,
      networkManager,
      spriteManager,
      serializer,
      toolManager,
      configEditor,
      btDebugger,
      // GameStateManager and GameLoop are usually created inside Engine 
      // or we can create them here if we want full inversion of control.
      // For now, let's let Engine create GameStateManager as it needs circular ref to Engine usually,
      // or we pass a partial engine. 
      // The Engine constructor handles GameStateManager creation if not provided.
    };

    // 5. Create Engine
    const engine = new Engine(dependencies);

    Logger.info('EngineFactory: Engine instance created successfully.');
    return engine;
  }
}
