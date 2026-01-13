/**
 * @jest-environment jsdom
 */
import { DeviceManager, DeviceType } from '../../src/ui/device-manager';
import { HUD } from '../../src/ui/hud';

// Mock dependencies
jest.mock('../../src/core/engine');
jest.mock('../../src/ui/ui-manager');
jest.mock('../../src/ui/device-manager');

describe('HUD', () => {
  let hud: HUD;
  let mockEngine: any;
  let mockUIManager: any;
  let mockDeviceManager: any;

  beforeEach(() => {
    // Mock DeviceManager
    mockDeviceManager = {
      deviceType: DeviceType.DESKTOP,
      onResize: jest.fn(),
    };
    (DeviceManager.getInstance as jest.Mock).mockReturnValue(mockDeviceManager);

    // Mock UIManager
    mockUIManager = {
      addElement: jest.fn(),
      removeElement: jest.fn(),
      getElement: jest.fn(),
    };

    // Mock Engine
    mockEngine = {
      uiManager: mockUIManager,
      gameStateManager: {
        switchState: jest.fn(),
      },
      entityManager: {
        getEntitiesWithComponents: jest.fn().mockReturnValue([]),
      },
      config: {
        network: { enabled: false },
      },
      networkManager: {
        isConnected: jest.fn().mockReturnValue(true),
      },
    };

    hud = new HUD(mockEngine);
  });

  test('should initialize with desktop defaults', () => {
    // Check initial font sizes indirectly or via spy
    // Since properties are private, we can inspect what enable() passes to uiManager
    hud.enable();

    // FPS text
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hud-fps', style: expect.objectContaining({ fontSize: 14 }) }),
      expect.objectContaining({ offsetY: 10 }),
    );

    // Menu Button should be present on Desktop
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hud-menu' }),
      expect.anything(),
    );

    // Health text check
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'hud-health',
        style: expect.objectContaining({ fontSize: 14 }),
      }),
      expect.anything(),
    );
  });

  test('should adjust layout for mobile', () => {
    mockDeviceManager.deviceType = DeviceType.MOBILE;

    // Must refresh layout manually as we changed device type after constructor
    hud.refreshLayout();
    hud.enable();

    // FPS text bigger
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hud-fps', style: expect.objectContaining({ fontSize: 18 }) }),
      expect.objectContaining({ offsetY: 10 }),
    );

    // Spacing check: Pos text should be at 10 + 25 = 35
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hud-pos' }),
      expect.objectContaining({ offsetY: 35 }),
    );

    // Health text should be at 10 + 25 * 3 = 85
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hud-health' }),
      expect.objectContaining({ offsetY: 85 }),
    );

    // Menu Button should be REMOVED on Mobile
    expect(mockUIManager.removeElement).toHaveBeenCalledWith('hud-menu');
  });

  test('should refresh layout when called', () => {
    // Start as desktop
    hud.enable();
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hud-fps', style: expect.objectContaining({ fontSize: 14 }) }),
      expect.anything(),
    );

    // Switch to mobile and refresh
    mockDeviceManager.deviceType = DeviceType.MOBILE;
    // Mock getElement to return true so it re-enables
    mockUIManager.getElement.mockReturnValue({});

    hud.refreshLayout();

    // Should call addElement with new sizes
    expect(mockUIManager.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hud-fps', style: expect.objectContaining({ fontSize: 18 }) }),
      expect.anything(),
    );
  });

  test('should update health display', () => {
    const mockHealth = { current: 50, max: 100 };
    const mockPlayer = { isLocal: true };
    const mockEntity = {
      getComponent: jest.fn((name) => {
        if (name === 'Player') return mockPlayer;
        if (name === 'Health') return mockHealth;
        if (name === 'Transform') return { x: 10, y: 20 };
        return null;
      }),
    };

    mockEngine.entityManager.getEntitiesWithComponents.mockReturnValue([mockEntity]);

    hud.update(0.016);

    expect((hud as any).healthText.text).toBe('HP: 50/100');
    expect((hud as any).healthText.style.color).toBe('yellow');

    // Test Green
    mockHealth.current = 80;
    hud.update(0.016);
    expect((hud as any).healthText.style.color).toBe('green');

    // Test Red
    mockHealth.current = 10;
    hud.update(0.016);
    expect((hud as any).healthText.style.color).toBe('red');
  });
});
