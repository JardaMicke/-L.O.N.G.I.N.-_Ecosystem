import { DeviceManager, DeviceType } from '../../src/ui/device-manager';

describe('DeviceManager Handling', () => {
  let originalWindow: any;
  let originalNavigator: any;

  beforeAll(() => {
    originalWindow = global.window;
    originalNavigator = global.navigator;
  });

  afterAll(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  beforeEach(() => {
    // Reset singleton
    (DeviceManager as any).instance = null;

    // Mock Window defaults
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      ontouchstart: undefined,
    } as any;

    // Mock Navigator defaults
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        maxTouchPoints: 0,
      },
      writable: true,
    });
  });

  test('should detect Desktop correctly', () => {
    const deviceManager = DeviceManager.getInstance();
    expect(deviceManager.deviceType).toBe(DeviceType.DESKTOP);
  });

  test('should detect Mobile based on UserAgent', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      writable: true,
    });
    global.window.innerWidth = 375;

    const deviceManager = DeviceManager.getInstance();
    expect(deviceManager.deviceType).toBe(DeviceType.MOBILE);
  });

  test('should detect Tablet based on UserAgent', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1',
      writable: true,
    });
    global.window.innerWidth = 768;

    const deviceManager = DeviceManager.getInstance();
    expect(deviceManager.deviceType).toBe(DeviceType.TABLET);
  });

  test('should override to Mobile based on width < 768px', () => {
    global.window.innerWidth = 500;
    // Even with desktop UA
    const deviceManager = DeviceManager.getInstance();
    expect(deviceManager.deviceType).toBe(DeviceType.MOBILE);
  });

  test('should handle resize events', () => {
    const deviceManager = DeviceManager.getInstance();
    const listener = jest.fn();
    deviceManager.onResize(listener);

    // Simulate resize
    global.window.innerWidth = 400;
    global.window.innerHeight = 800;

    // Trigger resize handler manually or via mocked event listener if I could,
    // but easier to access private method or just rely on constructor registration?
    // Actually, DeviceManager registers 'resize' in constructor.
    // I mocked addEventListener, so I need to capture the callback.

    const addEventMock = global.window.addEventListener as jest.Mock;
    const resizeCallback = addEventMock.mock.calls.find((call) => call[0] === 'resize')[1];

    resizeCallback(); // Trigger it

    expect(deviceManager.screen.width).toBe(400);
    expect(deviceManager.screen.orientation).toBe('portrait');
    expect(deviceManager.deviceType).toBe(DeviceType.MOBILE);
    expect(listener).toHaveBeenCalled();
  });
});
