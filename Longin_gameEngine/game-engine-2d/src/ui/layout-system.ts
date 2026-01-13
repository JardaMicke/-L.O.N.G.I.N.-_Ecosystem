import { DeviceManager, DeviceType, ScreenDimensions } from './device-manager';
import { UIElement } from './ui-element';
import { UIManager } from './ui-manager';

/**
 * Anchor type for positioning elements relative to screen edges or center.
 */
export type Anchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Layout configuration for a UI element.
 * Defines anchoring, offsets, and responsive sizing.
 */
export interface LayoutConfig {
  /** Anchor position */
  anchor?: Anchor;
  /** X offset from anchor point */
  offsetX?: number;
  /** Y offset from anchor point */
  offsetY?: number;
  /** Minimum width (e.g., for touch targets) */
  minWidth?: number;
  /** Minimum height */
  minHeight?: number;
  /** Width as a fraction of screen width (0.0 - 1.0) */
  relativeWidth?: number;
  /** Height as a fraction of screen height (0.0 - 1.0) */
  relativeHeight?: number;
}

/**
 * System for managing UI element layout.
 * Ensures responsive design and anchor-based positioning across different screen sizes.
 */
export class LayoutSystem {
  private deviceManager: DeviceManager;
  private uiManager: UIManager;
  private layoutConfigs: Map<string, LayoutConfig> = new Map();

  /**
   * Creates a new LayoutSystem.
   * 
   * @param {UIManager} uiManager - The UI manager instance.
   */
  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
    this.deviceManager = DeviceManager.getInstance();

    this.deviceManager.onResize((device, screen) => {
      this.updateLayout(screen);
    });
  }

  /**
   * Registers an element for automatic layout management.
   * 
   * @param {UIElement} element - The UI element.
   * @param {LayoutConfig} config - Layout configuration.
   */
  public registerElement(element: UIElement, config: LayoutConfig): void {
    this.layoutConfigs.set(element.id, config);
    this.applyLayout(element, config, this.deviceManager.screen);
  }

  /**
   * Updates the layout of all registered elements based on screen dimensions.
   * 
   * @param {ScreenDimensions} screen - Current screen dimensions.
   */
  public updateLayout(screen: ScreenDimensions): void {
    const elements = (this.uiManager as any).elements as UIElement[]; // Access private if needed, or assume getter

    for (const element of elements) {
      const config = this.layoutConfigs.get(element.id);
      if (config) {
        this.applyLayout(element, config, screen);
      }
    }
  }

  /**
   * Applies layout rules to a specific element.
   * Calculates position and size based on configuration and screen size.
   * 
   * @param {UIElement} element - The element to update.
   * @param {LayoutConfig} config - The layout configuration.
   * @param {ScreenDimensions} screen - The screen dimensions.
   */
  private applyLayout(element: UIElement, config: LayoutConfig, screen: ScreenDimensions): void {
    let x = 0;
    let y = 0;

    // Size Constraints (Responsive)
    if (config.relativeWidth) {
      element.width = screen.width * config.relativeWidth;
    }
    if (config.relativeHeight) {
      element.height = screen.height * config.relativeHeight;
    }

    // Min Size for Touch (Accessibility)
    const isTouch = this.deviceManager.deviceType !== DeviceType.DESKTOP;
    if (isTouch) {
      if (element.width < 48) element.width = 48;
      if (element.height < 48) element.height = 48;
    }
    if (config.minWidth && element.width < config.minWidth) element.width = config.minWidth;
    if (config.minHeight && element.height < config.minHeight) element.height = config.minHeight;

    // Anchoring
    const anchor = config.anchor || 'top-left';
    const offsetX = config.offsetX || 0;
    const offsetY = config.offsetY || 0;

    switch (anchor) {
      case 'top-left':
        x = offsetX;
        y = offsetY;
        break;
      case 'top-center':
        x = screen.width / 2 - element.width / 2 + offsetX;
        y = offsetY;
        break;
      case 'top-right':
        x = screen.width - element.width - offsetX;
        y = offsetY;
        break;
      case 'center-left':
        x = offsetX;
        y = screen.height / 2 - element.height / 2 + offsetY;
        break;
      case 'center':
        x = screen.width / 2 - element.width / 2 + offsetX;
        y = screen.height / 2 - element.height / 2 + offsetY;
        break;
      case 'center-right':
        x = screen.width - element.width - offsetX;
        y = screen.height / 2 - element.height / 2 + offsetY;
        break;
      case 'bottom-left':
        x = offsetX;
        y = screen.height - element.height - offsetY;
        break;
      case 'bottom-center':
        x = screen.width / 2 - element.width / 2 + offsetX;
        y = screen.height - element.height - offsetY;
        break;
      case 'bottom-right':
        x = screen.width - element.width - offsetX;
        y = screen.height - element.height - offsetY;
        break;
    }

    element.x = x;
    element.y = y;
  }
}
