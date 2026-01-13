export class Profiler {
  private static instance: Profiler;

  public fps: number = 0;
  public frameTime: number = 0;

  private lastTime: number = 0;
  private frames: number = 0;
  private lastFpsUpdate: number = 0;

  // Metrics
  public updateTime: number = 0;
  public renderTime: number = 0;

  private updateStartTime: number = 0;
  private renderStartTime: number = 0;

  private constructor() {
    this.lastFpsUpdate = performance.now();
  }

  public static getInstance(): Profiler {
    if (!Profiler.instance) {
      Profiler.instance = new Profiler();
    }
    return Profiler.instance;
  }

  public startFrame(): void {
    this.lastTime = performance.now();
  }

  public endFrame(): void {
    const now = performance.now();
    this.frameTime = now - this.lastTime;

    this.frames++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastFpsUpdate = now;
    }
  }

  public startUpdate(): void {
    this.updateStartTime = performance.now();
  }

  public endUpdate(): void {
    this.updateTime = performance.now() - this.updateStartTime;
  }

  public startRender(): void {
    this.renderStartTime = performance.now();
  }

  public endRender(): void {
    this.renderTime = performance.now() - this.renderStartTime;
  }
}
