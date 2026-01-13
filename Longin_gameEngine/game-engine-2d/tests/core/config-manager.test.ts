import { ConfigManager } from '../../src/core/config-manager';
import { EventSystem } from '../../src/core/event-system';

// Polyfill for winston logger in Jest environment
if (!global.setImmediate) {
  (global as any).setImmediate = (callback: (...args: any[]) => void, ...args: any[]) => {
    return global.setTimeout(callback, 0, ...args);
  };
}

describe('ConfigManager', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    // Reset singleton if possible, or just get instance
    // Since it's a singleton, state persists. We should reset it.
    manager = ConfigManager.getInstance();
    manager.resetToDefaults();
  });

  test('should load default configuration', () => {
    const config = manager.getConfig();
    expect(config.engine.tickRate).toBeDefined();
    expect(config.graphics.width).toBeDefined();
  });

  test('should get nested values via string path', () => {
    expect(manager.get<number>('engine.tickRate')).toBe(60); // Assuming default is 60
    expect(manager.get<boolean>('engine.debug')).toBeDefined();
  });

  test('should set nested values', () => {
    manager.set('engine.tickRate', 120);
    expect(manager.get<number>('engine.tickRate')).toBe(120);
    expect(manager.getConfig().engine.tickRate).toBe(120);
  });

  test('should emit event on change', (done) => {
    const eventSystem = EventSystem.getInstance();
    eventSystem.on('config:changed', (data: any) => {
      expect(data.path).toBe('engine.maxEntities');
      expect(data.value).toBe(500);
      done();
    });

    manager.set('engine.maxEntities', 500);
  });

  test('should reset to defaults', () => {
    const initialRate = manager.get<number>('engine.tickRate');
    manager.set('engine.tickRate', 999);
    expect(manager.get<number>('engine.tickRate')).toBe(999);
    
    manager.resetToDefaults();
    expect(manager.get<number>('engine.tickRate')).toBe(initialRate);
  });
});
