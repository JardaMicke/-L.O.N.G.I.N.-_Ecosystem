import { EventSystem } from '../core/event-system';

import { Button } from './button';
import { LayoutSystem, LayoutConfig } from './layout-system';
import { UIElement } from './ui-element';

/**
 * Manages all UI elements, their rendering, and interaction events.
 * Handles mouse/touch input propagation to UI elements.
 */
export class UIManager {
  /** List of all managed UI elements */
  public elements: UIElement[] = []; // Changed to public for LayoutSystem
  
  private eventSystem: EventSystem;
  private hoveredElement: UIElement | null = null;
  
  /** System responsible for layout management */
  public layoutSystem: LayoutSystem;

  /**
   * Creates a new UIManager.
   * Initializes event listeners and layout system.
   */
  constructor() {
    this.eventSystem = EventSystem.getInstance();
    this.layoutSystem = new LayoutSystem(this);
    this.setupEventListeners();
  }

  /**
   * Adds a UI element to the manager.
   * Optionally registers it with the layout system.
   * 
   * @param {UIElement} element - The element to add.
   * @param {LayoutConfig} [layoutConfig] - Optional layout configuration.
   */
  public addElement(element: UIElement, layoutConfig?: LayoutConfig): void {
    this.elements.push(element);
    if (layoutConfig) {
      this.layoutSystem.registerElement(element, layoutConfig);
    }
  }

  /**
   * Removes a UI element by its ID.
   * 
   * @param {string} id - The ID of the element to remove.
   */
  public removeElement(id: string): void {
    this.elements = this.elements.filter((e) => e.id !== id);
  }

  /**
   * Retrieves a UI element by its ID.
   * 
   * @param {string} id - The ID of the element.
   * @returns {UIElement | undefined} The element or undefined.
   */
  public getElement(id: string): UIElement | undefined {
    return this.elements.find((e) => e.id === id);
  }

  /**
   * Clears all UI elements.
   */
  public clear(): void {
    this.elements = [];
  }

  /**
   * Updates all UI elements.
   * 
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(deltaTime: number): void {
    for (const element of this.elements) {
      element.update(deltaTime);
    }
  }

  /**
   * Renders all UI elements.
   * 
   * @param {CanvasRenderingContext2D} ctx - Rendering context.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const element of this.elements) {
      element.render(ctx);
    }
  }

  private setupEventListeners(): void {
    this.eventSystem.on('input:mousemove', (pos: { x: number; y: number }) => {
      this.handleMouseMove(pos.x, pos.y);
    });

    this.eventSystem.on('input:mousedown', (data: { button: number; x: number; y: number }) => {
      if (data.button === 0) {
        // Left click
        this.handleClick(data.x, data.y);
      }
    });
  }

  private handleMouseMove(x: number, y: number): void {
    let found = false;
    // Check in reverse order (top to bottom)
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i];
      if (element.visible && element.isPointInside(x, y)) {
        if (this.hoveredElement !== element) {
          if (this.hoveredElement && this.hoveredElement instanceof Button) {
            this.hoveredElement.isHovered = false;
          }
          this.hoveredElement = element;
          if (element instanceof Button) {
            element.isHovered = true;
          }
          if (element.onHover) element.onHover();
        }
        found = true;
        break; // Only hover top element
      }
    }

    if (!found && this.hoveredElement) {
      if (this.hoveredElement instanceof Button) {
        this.hoveredElement.isHovered = false;
      }
      this.hoveredElement = null;
    }
  }

  private handleClick(x: number, y: number): void {
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i];
      if (element.visible && element.isPointInside(x, y)) {
        if (element.onClick) {
          element.onClick();
        }
        return; // Consume click
      }
    }
  }
}
