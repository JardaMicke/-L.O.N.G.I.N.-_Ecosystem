/**
 * @jest-environment jsdom
 */
import { DeviceManager, DeviceType } from '../../src/ui/device-manager';
import { InputHandler } from '../../src/ui/input-handler';
import { MobileControls } from '../../src/ui/mobile-controls';

jest.mock('../../src/ui/input-handler');
jest.mock('../../src/ui/device-manager');
jest.mock('../../src/utils/logger');

describe('MobileControls', () => {
  let mobileControls: MobileControls;
  let mockInputHandler: any;
  let mockDeviceManager: any;

  beforeEach(() => {
    // Setup mocks
    mockInputHandler = {
      simulateKey: jest.fn(),
      initialize: jest.fn(),
    };
    (InputHandler as jest.Mock).mockReturnValue(mockInputHandler);

    mockDeviceManager = {
      deviceType: DeviceType.MOBILE,
      onResize: jest.fn(),
    };
    (DeviceManager.getInstance as jest.Mock).mockReturnValue(mockDeviceManager);

    // Reset DOM
    document.body.innerHTML = '';

    mobileControls = new MobileControls(mockInputHandler);
  });

  test('should initialize and create DOM elements', () => {
    mobileControls.initialize();

    const container = document.getElementById('mobile-controls-container');
    expect(container).not.toBeNull();
    expect(document.getElementById('joystick-zone')).not.toBeNull();
    expect(document.getElementById('action-zone')).not.toBeNull();
  });

  test('should show controls on mobile device', () => {
    mockDeviceManager.deviceType = DeviceType.MOBILE;
    mobileControls.initialize();

    const container = document.getElementById('mobile-controls-container');
    expect(container?.style.display).toBe('block');
  });

  test('should hide controls on desktop device', () => {
    mockDeviceManager.deviceType = DeviceType.DESKTOP;
    mobileControls.initialize();

    const container = document.getElementById('mobile-controls-container');
    expect(container?.style.display).toBe('none');
  });

  test('should simulate key press on action button touch', () => {
    mobileControls.initialize();
    const actionBtn = document.querySelector('.mobile-btn');
    expect(actionBtn).not.toBeNull();

    // Simulate touch start
    const touchStart = new Event('touchstart');
    Object.defineProperty(touchStart, 'preventDefault', { value: jest.fn() });
    actionBtn?.dispatchEvent(touchStart);

    expect(mockInputHandler.simulateKey).toHaveBeenCalledWith('Space', true);

    // Simulate touch end
    const touchEnd = new Event('touchend');
    Object.defineProperty(touchEnd, 'preventDefault', { value: jest.fn() });
    actionBtn?.dispatchEvent(touchEnd);

    expect(mockInputHandler.simulateKey).toHaveBeenCalledWith('Space', false);
  });

  test('should simulate key press on menu button touch', () => {
    mobileControls.initialize();
    const menuBtn = document.querySelector('.secondary-btn');
    expect(menuBtn).not.toBeNull();

    // Simulate touch start
    const touchStart = new Event('touchstart');
    Object.defineProperty(touchStart, 'preventDefault', { value: jest.fn() });
    menuBtn?.dispatchEvent(touchStart);

    expect(mockInputHandler.simulateKey).toHaveBeenCalledWith('Escape', true);
  });

  // Note: Testing joystick drag is complex due to getBoundingClientRect mocking needed
  // We will verify basic existence for now.
});
