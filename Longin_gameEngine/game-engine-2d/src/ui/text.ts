import { UIElement, UIStyle } from './ui-element';

/**
 * UI Element for displaying text.
 * Supports coloring, font size, and basic positioning.
 */
export class Text extends UIElement {
  /** The text content to display */
  public text: string;

  /**
   * Creates a new Text element.
   * 
   * @param {string} id - Unique identifier.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {string} text - Initial text content.
   * @param {UIStyle} style - Optional styling.
   */
  constructor(id: string, x: number, y: number, text: string, style: UIStyle = {}) {
    super(id, x, y, 0, 0, style); // Width/Height dynamic
    this.text = text;
    this.style.color = style.color || '#fff';
    this.style.fontSize = style.fontSize || 16;
    this.style.font = style.font || 'Arial';
  }

  /**
   * Renders the text to the canvas.
   * 
   * @param {CanvasRenderingContext2D} ctx - The rendering context.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const pos = this.getAbsolutePosition();

    ctx.fillStyle = this.style.color || '#fff';
    ctx.font = `${this.style.fontSize}px ${this.style.font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.text, pos.x, pos.y);
  }
}
