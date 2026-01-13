import { UIElement, UIStyle } from './ui-element';

/**
 * A clickable button UI element with text.
 * Handles hover states and rendering.
 */
export class Button extends UIElement {
  /** Button label text */
  public text: string;
  
  /** Whether the mouse is currently hovering over the button */
  public isHovered: boolean = false;

  /**
   * Creates a new Button.
   * 
   * @param {string} id - Unique ID.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {number} width - Width.
   * @param {number} height - Height.
   * @param {string} text - Label text.
   * @param {UIStyle} [style={}] - Visual style.
   */
  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    style: UIStyle = {},
  ) {
    super(id, x, y, width, height, style);
    this.text = text;
    this.style.backgroundColor = style.backgroundColor || '#444';
    this.style.color = style.color || '#fff';
    this.style.fontSize = style.fontSize || 16;
    this.style.font = style.font || 'Arial';
  }

  /**
   * Renders the button to the canvas.
   * Draws background, border (if any), and centered text.
   * Changes background color on hover.
   * 
   * @param {CanvasRenderingContext2D} ctx - Rendering context.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const pos = this.getAbsolutePosition();

    // Background
    ctx.fillStyle = this.isHovered ? '#666' : this.style.backgroundColor || '#444';
    ctx.fillRect(pos.x, pos.y, this.width, this.height);

    // Border
    if (this.style.borderWidth) {
      ctx.lineWidth = this.style.borderWidth;
      ctx.strokeStyle = this.style.borderColor || '#000';
      ctx.strokeRect(pos.x, pos.y, this.width, this.height);
    }

    // Text
    ctx.fillStyle = this.style.color || '#fff';
    ctx.font = `${this.style.fontSize}px ${this.style.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, pos.x + this.width / 2, pos.y + this.height / 2);

    // Children
    for (const child of this.children) {
      child.render(ctx);
    }
  }
}
