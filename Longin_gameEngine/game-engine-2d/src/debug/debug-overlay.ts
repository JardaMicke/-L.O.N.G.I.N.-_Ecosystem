import { Renderer } from '../graphics/renderer';
import { EntityManager } from '../ecs/entity-manager';
import { Profiler } from './profiler';

export class DebugOverlay {
  private profiler: Profiler;
  private renderer: Renderer;
  private entityManager: EntityManager;
  private visible: boolean = false;

  constructor(renderer: Renderer, entityManager: EntityManager) {
    this.renderer = renderer;
    this.entityManager = entityManager;
    this.profiler = Profiler.getInstance();
  }

  public toggle(): void {
    this.visible = !this.visible;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public render(): void {
    if (!this.visible) return;

    // Draw background
    this.renderer.renderRect(0, 0, 220, 130, 'rgba(0, 0, 0, 0.5)');

    // Draw stats
    this.renderer.renderText(`FPS: ${this.profiler.fps}`, 10, 20, 'white');
    this.renderer.renderText(
      `Frame Time: ${this.profiler.frameTime.toFixed(2)}ms`,
      10,
      35,
      'white',
    );
    this.renderer.renderText(
      `Update Time: ${this.profiler.updateTime.toFixed(2)}ms`,
      10,
      50,
      'white',
    );
    this.renderer.renderText(
      `Render Time: ${this.profiler.renderTime.toFixed(2)}ms`,
      10,
      65,
      'white',
    );
    
    // Entity Stats
    const entityCount = this.entityManager.getEntities().length;
    this.renderer.renderText(
      `Entities: ${entityCount}`,
      10,
      80,
      'white',
    );
    
    // Memory (if available)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
        const usedJSHeapSize = (performance as any).memory.usedJSHeapSize / 1048576;
        this.renderer.renderText(
            `Memory: ${usedJSHeapSize.toFixed(2)} MB`,
            10,
            95,
            'white'
        );
    }
  }
}
