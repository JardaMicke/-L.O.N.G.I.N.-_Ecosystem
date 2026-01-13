import { Engine } from '../../src/core/engine';
import { TransformComponent } from '../../src/core/components';
import { ScriptComponent } from '../../src/scripting/script-component';
import { ScriptSystem } from '../../src/scripting/script-system';
import { Renderer } from '../../src/graphics/renderer';
import { DeviceManager } from '../../src/ui/device-manager';
import { IScript, ScriptContext } from '../../src/scripting/interfaces';
import { Entity } from '../../src/ecs/entity';

// Mocks
jest.mock('../../src/graphics/renderer');
jest.mock('../../src/audio/audio-manager');
jest.mock('../../src/ui/input-handler');
jest.mock('../../src/ui/touch-handler');
jest.mock('../../src/ui/mobile-controls');
jest.mock('../../src/ui/device-manager');

// Define a test script
const testScriptCode = `
    export default class MoverScript {
        onStart(ctx) {
            this.speed = 10;
        }
        
        onUpdate(ctx, dt) {
            const transform = ctx.entity.getComponent('TransformComponent');
            if (transform) {
                transform.x += this.speed * dt;
            }
        }
    }
`;

describe('Scripting Integration', () => {
  let engine: Engine;
  let scriptSystem: ScriptSystem;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DeviceManager mock
    const mockDeviceManagerInstance = {
        onResize: jest.fn(),
        getScreenDimensions: jest.fn().mockReturnValue({ width: 800, height: 600 }),
    };
    (DeviceManager.getInstance as jest.Mock).mockReturnValue(mockDeviceManagerInstance);

    // Setup AudioManager mock
    const mockAudioManager = {
        init: jest.fn(),
        play: jest.fn(),
        stop: jest.fn(),
    };

    engine = new Engine({
      renderer: new Renderer(null as any),
      audioManager: mockAudioManager as any,
      deviceManager: mockDeviceManagerInstance as any,
    });

    // Disable actual game loop
    jest.spyOn(engine.gameLoop, 'start').mockImplementation(() => {});
    
    // Get ScriptSystem from registry
    // The engine initializes systems in constructor. We need to find the ScriptSystem.
    // However, engine.systemRegistry is private. But we can access it via 'any' for testing
    // OR we can trust the engine initialized it.
  });

  test('should execute script lifecycle methods', () => {
    const entity = engine.entityManager.createEntity();
    const transform = new TransformComponent(0, 0, 0);
    entity.addComponent(transform);

    const scriptComponent = new ScriptComponent();
    // We need to manually register the script in the ScriptSystem or mock the loading process.
    // Since ScriptSystem uses ScriptManager which might use dynamic imports or eval,
    // for this integration test, we might need to bypass the file loading part 
    // and inject the script class directly if possible, OR rely on a mock ScriptManager.
    
    // BUT, the real ScriptSystem relies on ScriptManager.loadScript which does dynamic import.
    // Dynamic import of string content is hard in Jest without special setup.
    // Ideally we should mock ScriptManager.loadScript to return our class.
    
    // Let's spy on ScriptManager.loadScript
    // Accessing scriptManager via scriptSystem via engine is hard due to private props.
    // Let's try to get the ScriptSystem instance from the engine.
    
    const systems = (engine as any).systemRegistry.systems;
    scriptSystem = systems.find((s: any) => s.constructor.name === 'ScriptSystem');
    
    expect(scriptSystem).toBeDefined();

    // Register script directly
    const mockScriptInstance = new class TestScript implements IScript {
        speed: number = 0;
        onStart(entity: Entity, ctx: ScriptContext) {
            this.speed = 10;
        }
        onUpdate(entity: Entity, dt: number, ctx: ScriptContext) {
            const t = entity.getComponent(TransformComponent);
            if (t) {
                t.x += this.speed * dt;
            }
        }
    }();

    engine.scriptManager.registerScript('test-script.js', mockScriptInstance);

    // Add script to component
    scriptComponent.addScript('test-script.js');
    entity.addComponent(scriptComponent);

    // Run one update to trigger onStart (ScriptSystem handles this)
    // The ScriptSystem needs to be updated.
    
    // 1st Frame: Script loaded (async), onStart called?
    // ScriptManager.loadScript is async. ScriptSystem.update calls initializeScripts which calls loadScript.
    
    // We need to wait for the promise to resolve.
    
    // Let's run engine update
    (engine as any).update(1/60);
    
    // Wait for async operations
    return new Promise<void>(resolve => setImmediate(resolve)).then(() => {
        // Now script should be loaded and onStart called? 
        // Actually, ScriptSystem calls loadScript then sets instance.
        
        // Run another update to trigger onUpdate (2nd frame)
        (engine as any).update(1/60);
        
        // Check transform (2 frames of movement)
        expect(transform.x).toBeCloseTo(10 * (1/60) * 2, 1);
    });
  });
});
