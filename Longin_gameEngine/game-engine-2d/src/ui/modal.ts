import { Button } from './button';
import { Text } from './text';
import { UIElement } from './ui-element';
import { UIManager } from './ui-manager';

/**
 * A modal dialog UI element.
 * Displays a title, message, and a close button.
 * Supports scrolling and custom content.
 */
export class Modal extends UIElement {
  private uiManager: UIManager;
  private content: UIElement[] = [];
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private title: string;
  private message: string;
  private closeBtn: Button;
  private titleText: Text;
  private messageText: Text;

  // Config
  private padding: number = 20;
  private headerHeight: number = 50;

  /**
   * Creates a new Modal dialog.
   * 
   * @param {string} id - Unique identifier.
   * @param {UIManager} uiManager - Reference to the UI manager.
   * @param {string} title - Dialog title.
   * @param {string} message - Dialog message content.
   * @param {number} width - Modal width (default: 400).
   * @param {number} height - Modal height (default: 300).
   */
  constructor(
    id: string,
    uiManager: UIManager,
    title: string,
    message: string,
    width: number = 400,
    height: number = 300,
  ) {
    super(id, 0, 0, width, height, {
      backgroundColor: 'rgba(0,0,0,0.9)',
      borderColor: '#FFF',
      borderWidth: 2,
    });
    this.uiManager = uiManager;
    this.title = title;
    this.message = message;

    // Setup internal elements
    this.titleText = new Text(`${id}-title`, 0, 0, title, { fontSize: 24, color: '#FFF' });
    this.messageText = new Text(`${id}-msg`, 0, 0, message, { fontSize: 16, color: '#CCC' });

    this.closeBtn = new Button(`${id}-close`, 0, 0, 40, 40, 'X', {
      backgroundColor: '#8B0000',
      color: '#FFF',
    });
    this.closeBtn.onClick = () => this.close();

    // Add to children for rendering
    this.addChild(this.titleText);
    this.addChild(this.messageText);
    this.addChild(this.closeBtn);
  }

  /**
   * Shows the modal by adding it to the UIManager.
   * Centers the modal on screen.
   */
  public show(): void {
    this.uiManager.addElement(this, { anchor: 'center' });
    this.recalculateLayout();
  }

  /**
   * Closes the modal by removing it from the UIManager.
   */
  public close(): void {
    this.uiManager.removeElement(this.id);
  }

  /**
   * Updates the modal state.
   * Recalculates layout to handle screen resizing.
   * 
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);
    this.recalculateLayout(); // Keep layout updated if window resizes (via parent LayoutSystem)
  }

  /**
   * Recalculates positions of internal elements.
   * Handles relative positioning and scrolling.
   */
  private recalculateLayout(): void {
    // Position children relative to this modal (0,0 is top-left of modal)

    // Close Button (Top-Right)
    this.closeBtn.x = this.width - 40 - 10;
    this.closeBtn.y = 10;

    // Title (Top-Left)
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;

    // Message (Body)
    // Simple word wrap simulation could go here, for now just positioning
    this.messageText.x = this.padding;
    this.messageText.y = this.headerHeight + this.padding - this.scrollY;

    // Clip content if needed (Renderer logic usually, but here we just hide if out of bounds)
    // In a real engine, we'd use a Scissor test in renderer.
    // For this simple UI, we assume text fits or we need scroll logic (not fully implemented in renderer)
  }

  /**
   * Handles scroll events.
   * 
   * @param {number} delta - Scroll delta amount.
   */
  public onScroll(delta: number): void {
    this.scrollY += delta;
    if (this.scrollY < 0) this.scrollY = 0;
    // Calculate max scroll based on content height
    // this.maxScroll = ...
  }

  /**
   * Renders the modal and its children.
   * Applies translation for child elements relative to the modal.
   * 
   * @param {CanvasRenderingContext2D} ctx - Rendering context.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Render background
    ctx.fillStyle = this.style.backgroundColor || 'rgba(0,0,0,0.8)';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Render border
    if (this.style.borderWidth && this.style.borderColor) {
      ctx.lineWidth = this.style.borderWidth;
      ctx.strokeStyle = this.style.borderColor;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    // Render children
    for (const child of this.children) {
      // Adjust child position relative to modal for rendering
      // The child.x/y are relative to parent (modal)
      // But renderCtx usually assumes global coordinates or parent transform.
      // If UIElement.render handles local->global, we are fine.
      // If we manually call render on children:
      ctx.save();
      ctx.translate(this.x, this.y);
      child.render(ctx);
      ctx.restore();
    }
  }
}
