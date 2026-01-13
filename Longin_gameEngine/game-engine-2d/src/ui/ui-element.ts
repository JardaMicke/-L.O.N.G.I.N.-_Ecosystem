/**
 * Interface defining the visual style of a UI element.
 */
export interface UIStyle {
  /** Background color (CSS string) */
  backgroundColor?: string;
  /** Border color (CSS string) */
  borderColor?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Text color (CSS string) */
  color?: string;
  /** Font family */
  font?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Padding in pixels (not fully implemented in all elements) */
  padding?: number;
}

/**
 * Abstract base class for all user interface elements.
 * Handles positioning, hierarchy, and event callbacks.
 */
export abstract class UIElement {
  /** Unique identifier for the element */
  public id: string;
  
  /** X position relative to parent */
  public x: number;
  
  /** Y position relative to parent */
  public y: number;
  
  /** Element width */
  public width: number;
  
  /** Element height */
  public height: number;
  
  /** Visual style configuration */
  public style: UIStyle;
  
  /** Whether the element is rendered and interactive */
  public visible: boolean = true;
  
  /** Parent element */
  public parent: UIElement | null = null;
  
  /** Child elements */
  public children: UIElement[] = [];

  // Events
  /** Callback fired when clicked */
  public onClick?: () => void;
  
  /** Callback fired when hovered */
  public onHover?: () => void;

  /**
   * Creates a new UIElement.
   * 
   * @param {string} id - Unique ID.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {number} width - Width.
   * @param {number} height - Height.
   * @param {UIStyle} [style={}] - Visual style.
   */
  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    style: UIStyle = {},
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.style = style;
  }

  /**
   * Renders the element to the canvas.
   * Must be implemented by subclasses.
   * 
   * @param {CanvasRenderingContext2D} ctx - The rendering context.
   */
  public abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Updates the element and its children.
   * 
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(deltaTime: number): void {
    for (const child of this.children) {
      child.update(deltaTime);
    }
  }

  /**
   * Adds a child element to this element.
   * 
   * @param {UIElement} element - The child element to add.
   */
  public addChild(element: UIElement): void {
    element.parent = this;
    this.children.push(element);
  }

  /**
   * Calculates the absolute position of the element on screen.
   * Recurses up the parent hierarchy.
   * 
   * @returns {{x: number, y: number}} Absolute X and Y coordinates.
   */
  public getAbsolutePosition(): { x: number; y: number } {
    if (this.parent) {
      const parentPos = this.parent.getAbsolutePosition();
      return { x: parentPos.x + this.x, y: parentPos.y + this.y };
    }
    return { x: this.x, y: this.y };
  }

  /**
   * Checks if a point is inside the element's bounding box.
   * 
   * @param {number} x - X coordinate to check.
   * @param {number} y - Y coordinate to check.
   * @returns {boolean} True if inside.
   */
  public isPointInside(x: number, y: number): boolean {
    const pos = this.getAbsolutePosition();
    return x >= pos.x && x <= pos.x + this.width && y >= pos.y && y <= pos.y + this.height;
  }
}
