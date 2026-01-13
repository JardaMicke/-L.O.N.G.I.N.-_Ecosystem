import { Logger } from '../utils/logger';

/**
 * Enumeration of supported device types.
 */
export enum DeviceType {
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  MOBILE = 'MOBILE',
}

/**
 * Interface defining screen dimensions and orientation.
 */
export interface ScreenDimensions {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

/**
 * Singleton class for managing device detection and screen dimensions.
 * Provides event listeners for screen resize and device type changes.
 */
export class DeviceManager {
  private static instance: DeviceManager;
  
  /** Current device type */
  public deviceType: DeviceType = DeviceType.DESKTOP;
  
  /** Current screen dimensions */
  public screen: ScreenDimensions = { width: 0, height: 0, orientation: 'landscape' };
  
  private listeners: ((device: DeviceType, screen: ScreenDimensions) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.detectDevice();
      window.addEventListener('resize', () => this.handleResize());
      this.handleResize(); // Initial check
    }
  }

  /**
   * Gets the singleton instance of DeviceManager.
   * 
   * @returns {DeviceManager} The singleton instance.
   */
  public static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  /**
   * Registers a callback for window resize events.
   * 
   * @param {Function} callback - Function to be called on resize.
   * @param {DeviceType} callback.device - The detected device type.
   * @param {ScreenDimensions} callback.screen - The new screen dimensions.
   */
  public onResize(callback: (device: DeviceType, screen: ScreenDimensions) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Handles window resize event.
   * Updates screen dimensions and re-detects device type.
   */
  private handleResize(): void {
    if (typeof window === 'undefined') return;

    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
    this.screen.orientation = this.screen.width > this.screen.height ? 'landscape' : 'portrait';

    const prevDevice = this.deviceType;
    this.detectDevice();

    // Always emit resize
    this.notifyListeners();
  }

  /**
   * Detects device type based on User Agent and screen properties.
   * Updates the public deviceType property.
   */
  private detectDevice(): void {
    if (typeof navigator === 'undefined') return;

    const ua = navigator.userAgent;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      this.deviceType = DeviceType.TABLET;
    } else if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua,
      )
    ) {
      this.deviceType = DeviceType.MOBILE;
    } else if (isTouch && width < 1024) {
      // Touch laptop or unidentified tablet
      this.deviceType = DeviceType.TABLET;
    } else {
      this.deviceType = DeviceType.DESKTOP;
    }

    // Screen width overrides
    if (width < 768) {
      this.deviceType = DeviceType.MOBILE;
    } else if (width >= 768 && width < 1024 && isTouch) {
      this.deviceType = DeviceType.TABLET;
    }

    Logger.info(`Device detected: ${this.deviceType} (${width}x${window.innerHeight})`);
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.deviceType, this.screen));
  }
}
