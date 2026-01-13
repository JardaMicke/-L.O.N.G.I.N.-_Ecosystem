import { DeviceManager } from '../../src/ui/device-manager';
import { LayoutSystem, LayoutConfig } from '../../src/ui/layout-system';
import { UIElement } from '../../src/ui/ui-element';
import { UIManager } from '../../src/ui/ui-manager';

// Mock UIElement concrete class for testing
class TestElement extends UIElement {
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, x, y, width, height);
  }
  render(ctx: CanvasRenderingContext2D): void {}
}

describe('Responsive Layout System', () => {
  let layoutSystem: LayoutSystem;
  let uiManager: UIManager;
  let deviceManager: DeviceManager;
  let testElement: TestElement;
  let originalWindow: any;

  beforeAll(() => {
    originalWindow = global.window;
  });

  afterAll(() => {
    global.window = originalWindow;
  });

  beforeEach(() => {
    // Mock Window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      ontouchstart: undefined,
    } as any;

    // Mock Navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        maxTouchPoints: 0,
      },
      writable: true,
    });

    // Reset DeviceManager singleton
    (DeviceManager as any).instance = null;

    // Mock DeviceManager
    deviceManager = DeviceManager.getInstance();

    // UIManager creates its own LayoutSystem which binds to DeviceManager
    uiManager = new UIManager();
    layoutSystem = uiManager.layoutSystem;

    // Setup a test element
    testElement = new TestElement('test-btn', 0, 0, 100, 30);
    uiManager.addElement(testElement);
  });

  test('should position element at bottom-right on Desktop (1920x1080)', () => {
    // Ensure Desktop state
    global.window.innerWidth = 1920;
    global.window.innerHeight = 1080;
    (deviceManager as any).handleResize(); // Trigger update

    const config: LayoutConfig = {
      anchor: 'bottom-right',
      offsetX: 20,
      offsetY: 20,
    };

    layoutSystem.registerElement(testElement, config);

    // Expected X: 1920 - 100 - 20 = 1800
    // Expected Y: 1080 - 30 - 20 = 1030
    expect(testElement.x).toBe(1800);
    expect(testElement.y).toBe(1030);
  });

  test('should position element at bottom-center on Mobile (375x667)', () => {
    // Setup Mobile Environment
    global.window.innerWidth = 375;
    global.window.innerHeight = 667;
    (deviceManager as any).handleResize();

    const config: LayoutConfig = {
      anchor: 'bottom-center',
      offsetY: 50,
    };

    layoutSystem.registerElement(testElement, config);

    // NOTE: On mobile, minimum height of 48px is enforced!
    // Original Height: 30 -> Enforced: 48
    // Original Width: 100 ( > 48, so stays 100)

    // Expected X: (375 / 2) - (100 / 2) = 187.5 - 50 = 137.5
    // Expected Y: 667 - 48 - 50 = 569
    expect(testElement.x).toBe(137.5);
    expect(testElement.y).toBe(569);
  });

  test('should enforce minimum touch target size (48px) on Mobile', () => {
    // Setup Mobile Environment
    global.window.innerWidth = 375;
    global.window.innerHeight = 667;
    (deviceManager as any).handleResize();

    // Element smaller than 48x48
    const smallBtn = new TestElement('small-btn', 0, 0, 30, 20);
    uiManager.addElement(smallBtn);

    layoutSystem.registerElement(smallBtn, { anchor: 'top-left' });

    expect(smallBtn.width).toBe(48);
    expect(smallBtn.height).toBe(48);
  });

  test('should NOT enforce minimum touch target size on Desktop', () => {
    // Setup Desktop Environment
    global.window.innerWidth = 1920;
    global.window.innerHeight = 1080;
    (deviceManager as any).handleResize();

    // Element smaller than 48x48
    const smallBtn = new TestElement('small-btn', 0, 0, 30, 20);
    uiManager.addElement(smallBtn);

    layoutSystem.registerElement(smallBtn, { anchor: 'top-left' });

    expect(smallBtn.width).toBe(30);
    expect(smallBtn.height).toBe(20);
  });

  test('should handle screen resize updates', () => {
    // Start as Desktop
    global.window.innerWidth = 1920;
    global.window.innerHeight = 1080;
    (deviceManager as any).handleResize();

    const config: LayoutConfig = {
      anchor: 'center',
      relativeWidth: 0.5, // 50% width
    };

    layoutSystem.registerElement(testElement, config);

    // Desktop check
    // Width: 1920 * 0.5 = 960
    // X: (1920/2) - (960/2) = 960 - 480 = 480
    expect(testElement.width).toBe(960);
    expect(testElement.x).toBe(480);

    // Simulate Resize to Mobile
    global.window.innerWidth = 400;
    global.window.innerHeight = 800;
    (deviceManager as any).handleResize();

    // LayoutSystem should auto-update because it listens to onResize

    // Mobile check
    // Width: 400 * 0.5 = 200
    // X: (400/2) - (200/2) = 200 - 100 = 100
    expect(testElement.width).toBe(200);
    expect(testElement.x).toBe(100);
  });
});
