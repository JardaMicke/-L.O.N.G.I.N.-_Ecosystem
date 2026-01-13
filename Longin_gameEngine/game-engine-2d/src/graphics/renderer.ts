import { EngineConfig } from '../core/config-manager';
import { Logger } from '../utils/logger';

import { Camera } from './camera';

/**
 * Handles WebGL/Canvas 2D rendering operations.
 * Manages the HTML Canvas element and provides methods for drawing shapes, images, and text.
 */
export class Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number;
  private height: number;
  private currentCamera: Camera | null = null;

  /**
   * Creates a new Renderer instance.
   * @param {EngineConfig['graphics']} config - Graphics configuration (width, height, etc.).
   */
  constructor(config: EngineConfig['graphics']) {
    this.width = config.width;
    this.height = config.height;
  }

  /**
   * Initializes the renderer by attaching to a DOM canvas element.
   * @param {string} canvasId - The ID of the HTML canvas element.
   */
  public initialize(canvasId: string): void {
    if (typeof document === 'undefined') {
      Logger.warn('Renderer: Document not available (server-side?)');
      return;
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      Logger.error(`Renderer: Canvas with id ${canvasId} not found`);
      return;
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Set size
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Disable smoothing for pixel art if needed
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }

    Logger.info('Renderer initialized');
  }

  /**
   * Resizes the renderer and the underlying canvas.
   * @param {number} width - New width in pixels.
   * @param {number} height - New height in pixels.
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.ctx) {
        this.ctx.imageSmoothingEnabled = false; // Re-apply after resize
      }
    }
    Logger.info(`Renderer resized to ${width}x${height}`);
  }

  /**
   * Returns the 2D rendering context.
   * @returns {CanvasRenderingContext2D | null} The context or null if not initialized.
   */
  public getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * Returns the canvas element.
   * @returns {HTMLCanvasElement | null} The canvas element.
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Clears the entire canvas.
   * Should be called at the start of each frame.
   */
  public clear(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Prepares the renderer for drawing a new frame.
   * Applies camera transformations if a camera is provided.
   *
   * @param {Camera} [camera] - Optional camera to apply view transformations.
   */
  public begin(camera?: Camera): void {
    if (!this.ctx) return;
    this.ctx.save();

    if (camera) {
      this.currentCamera = camera;
      // Apply camera transform:
      // Center screen
      // this.ctx.translate(this.width / 2, this.height / 2);
      // this.ctx.scale(camera.zoom, camera.zoom);
      // this.ctx.translate(-camera.x - camera.width / 2, -camera.y - camera.height / 2); // Camera x/y is usually top-left or center?
      // Camera.x/y in my implementation was "world position of top left" implicitly in update bounds logic?
      // Let's re-verify Camera logic.
      // In Camera.update: this.x = pos.x - (w/2)/zoom
      // So this.x is indeed top-left of the view in world coordinates.
      // So we translate by -this.x, -this.y to move world to (0,0) relative to view.
      // Wait, if we center screen first, we need to be careful.

      // Standard 2D camera transform:
      // 1. Translate to center of screen (optional, if we want zoom around center)
      // 2. Scale
      // 3. Translate world so camera position is at center

      // My Camera.update sets x/y to be the top-left corner of the viewport in world space.
      // So if we just want to map World(x,y) to Screen(0,0) (top-left), we just translate by -camera.x, -camera.y
      // and scale.

      // Let's reset transform to be safe (though save/restore handles it)
      // Simplified transform assuming x,y is top-left:
      this.ctx.setTransform(
        camera.zoom,
        0,
        0,
        camera.zoom,
        -camera.x * camera.zoom,
        -camera.y * camera.zoom,
      );

      // Note: The previous logic with translate/scale is safer for rotation.
      // But setTransform is faster/simpler for just zoom/pan.
      // Let's stick to simple Pan/Zoom for now.
    }
  }

  /**
   * Restores the context state after rendering.
   * Should be called at the end of each frame.
   */
  public end(): void {
    if (!this.ctx) return;
    this.ctx.restore();
    this.currentCamera = null;
  }

  /**
   * Renders a sprite (image) to the canvas.
   *
   * @param {HTMLImageElement} image - The source image.
   * @param {number} x - X coordinate in world space.
   * @param {number} y - Y coordinate in world space.
   * @param {number} w - Width of the sprite.
   * @param {number} h - Height of the sprite.
   * @param {number} [rotation=0] - Rotation in radians.
   * @param {number} [srcX] - Source X coordinate (for spritesheets).
   * @param {number} [srcY] - Source Y coordinate (for spritesheets).
   * @param {number} [srcW] - Source width.
   * @param {number} [srcH] - Source height.
   */
  public renderSprite(
    image: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    rotation: number = 0,
    srcX?: number,
    srcY?: number,
    srcW?: number,
    srcH?: number,
  ): void {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.translate(x + w / 2, y + h / 2);
    this.ctx.rotate(rotation);
    this.ctx.translate(-(x + w / 2), -(y + h / 2));

    if (srcX !== undefined && srcY !== undefined && srcW !== undefined && srcH !== undefined) {
      this.ctx.drawImage(image, srcX, srcY, srcW, srcH, x, y, w, h);
    } else {
      this.ctx.drawImage(image, x, y, w, h);
    }

    this.ctx.restore();
  }

  /**
   * Renders a filled rectangle.
   *
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {number} w - Width.
   * @param {number} h - Height.
   * @param {string} color - CSS color string.
   * @param {boolean} [fill=true] - Whether to fill or stroke (legacy param, kept for compatibility).
   */
  public renderRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    fill: boolean = true,
  ): void {
    if (!this.ctx) return;

    this.ctx.save();
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, w, h);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.strokeRect(x, y, w, h);
    }
    this.ctx.restore();
  }

  /**
   * Renders text to the canvas.
   *
   * @param {string} text - The text to display.
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {string} color - CSS color string.
   * @param {string} [font='16px Arial'] - CSS font string.
   */
  public renderText(
    text: string,
    x: number,
    y: number,
    color: string,
    font: string = '16px Arial',
  ): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  /**
   * Renders a stroked rectangle (outline).
   *
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {number} w - Width.
   * @param {number} h - Height.
   * @param {string} color - CSS color string.
   * @param {number} [lineWidth=1] - Width of the stroke line.
   */
  public renderRectStroke(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    lineWidth: number = 1,
  ): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.lineWidth = lineWidth;
    this.renderRect(x, y, w, h, color, false);
    this.ctx.restore();
  }

  /**
   * Renders a full-screen overlay (color or image).
   * Resets transform to ensure it covers the viewport.
   *
   * @param {string | HTMLCanvasElement} content - Color string or Image/Canvas to draw.
   */
  public renderOverlay(content: string | HTMLCanvasElement): void {
    if (!this.ctx) return;
    this.ctx.save();
    // Reset transform to ensure we cover the screen regardless of camera
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (typeof content === 'string') {
      this.ctx.fillStyle = content;
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      this.ctx.drawImage(content, 0, 0, this.width, this.height);
    }

    this.ctx.restore();
  }
}
