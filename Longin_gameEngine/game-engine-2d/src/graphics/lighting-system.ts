import { TransformComponent } from '../core/components';
import { Entity } from '../ecs/entity';
import { System } from '../ecs/system';

import { Camera } from './camera';
import { LightComponent } from './components';
import { Renderer } from './renderer';

/**
 * System responsible for rendering dynamic 2D lighting.
 * Uses an overlay canvas to draw darkness and cut out holes for lights.
 */
export class LightingSystem extends System {
  private renderer: Renderer;
  private ambientColor: string;
  private lightCanvas: HTMLCanvasElement | null = null;
  private lightCtx: CanvasRenderingContext2D | null = null;

  /**
   * Creates a new LightingSystem.
   * 
   * @param {Renderer} renderer - The main renderer.
   * @param {string} [ambientColor='rgba(0, 0, 0, 0.5)'] - The ambient darkness color.
   */
  constructor(renderer: Renderer, ambientColor: string = 'rgba(0, 0, 0, 0.5)') {
    super();
    this.renderer = renderer;
    this.ambientColor = ambientColor;
    this.requiredComponents = ['Transform', 'Light'];

    if (typeof document !== 'undefined') {
      this.lightCanvas = document.createElement('canvas');
      // Size should match renderer. But renderer size is private.
      // We'll resize in render if needed or assume fixed 800x600 for now or passed in config?
      // Let's assume 800x600 for prototype.
      this.lightCanvas.width = 800;
      this.lightCanvas.height = 600;
      this.lightCtx = this.lightCanvas.getContext('2d');
    }
  }

  /**
   * Updates the lighting system.
   * Currently empty as lights are static in this implementation.
   * 
   * @param {Entity[]} entities - List of entities.
   * @param {number} deltaTime - Time elapsed.
   */
  public update(entities: Entity[], deltaTime: number): void {
    // Lights usually don't need update logic unless they flicker or move
  }

  /**
   * Renders the lighting overlay.
   * 1. Clears the light canvas.
   * 2. Fills it with ambient darkness.
   * 3. Cuts out holes for each light source using 'destination-out' composite operation.
   * 4. Draws the result onto the main renderer.
   * 
   * @param {Entity[]} entities - List of entities with Light components to render.
   * @param {Camera} [camera] - The active camera to apply transformations.
   * @returns {void}
   */
  public render(entities: Entity[], camera?: Camera): void {
    if (!this.lightCanvas || !this.lightCtx) return;

    // 1. Clear light canvas
    this.lightCtx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // 2. Fill with ambient color
    this.lightCtx.fillStyle = this.ambientColor;
    this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // 3. Draw lights to cut holes (destination-out)
    this.lightCtx.globalCompositeOperation = 'destination-out';

    if (camera) {
      this.lightCtx.save();
      // Apply camera transform to light canvas too
      // Center screen
      this.lightCtx.translate(this.lightCanvas.width / 2, this.lightCanvas.height / 2);
      this.lightCtx.scale(camera.zoom, camera.zoom);
      this.lightCtx.translate(-camera.x - camera.width / 2, -camera.y - camera.height / 2);
    }

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform');
      const light = entity.getComponent<LightComponent>('Light');

      if (transform && light) {
        const gradient = this.lightCtx.createRadialGradient(
          transform.x,
          transform.y,
          0,
          transform.x,
          transform.y,
          light.radius,
        );
        // Inner is opaque (removes darkness), outer is transparent (keeps darkness)
        // Actually destination-out:
        // Source alpha = 1 -> Dest alpha = 0 (Full removal)
        // Source alpha = 0 -> Dest alpha = 1 (No removal)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.lightCtx.fillStyle = gradient;
        this.lightCtx.beginPath();
        this.lightCtx.arc(transform.x, transform.y, light.radius, 0, Math.PI * 2);
        this.lightCtx.fill();
      }
    }

    if (camera) {
      this.lightCtx.restore();
    }

    // 4. Draw light canvas onto main renderer
    // We need access to main ctx.
    // Renderer doesn't expose drawImage for generic image/canvas easily without `renderSprite` which transforms.
    // But we want to draw this OVERLAY exactly on top of screen (0,0 in screen space).
    // `renderSprite` applies camera transform if inside `begin/end`.
    // We should draw this AFTER `renderer.end()` usually.
    // Assuming this render method is called after scene render.

    // We can add `renderOverlay` to Renderer.
    // Or access ctx if we mock it/expose it.
    // I added `getContext` back? No.

    // Let's use `renderer.renderSprite` but we need to ensure no camera transform is active?
    // Or we pass `null` camera?
    // But `renderSprite` translates to center...
    // Let's add `drawImage` to Renderer or `renderOverlay`.
    this.renderer.renderOverlay(this.lightCanvas);
  }
}
