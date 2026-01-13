import { Logger } from '../utils/logger';
import { Profiler } from '../debug/profiler';

/**
 * Callback function type for the update step.
 * @param {number} deltaTime - Time elapsed in seconds (or step size).
 */
export type UpdateCallback = (deltaTime: number) => void;

/**
 * Callback function type for the render step.
 * @param {number} interpolation - Interpolation factor (0.0 - 1.0) for smooth rendering between updates.
 */
export type RenderCallback = (interpolation: number) => void;

/**
 * Implements a fixed-time-step game loop.
 * Ensures consistent game logic execution speed regardless of frame rate.
 * Uses `requestAnimationFrame` for rendering and `performance.now()` for timing.
 */
export class GameLoop {
  private running: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly tickRate: number;
  private readonly step: number;

  private updateCallback: UpdateCallback;
  private renderCallback: RenderCallback;

  /**
   * Creates a new GameLoop instance.
   *
   * @param {number} [tickRate=60] - The target updates per second (Hz).
   * @param {UpdateCallback} update - Function called for game logic updates.
   * @param {RenderCallback} render - Function called for rendering.
   */
  constructor(tickRate: number = 60, update: UpdateCallback, render: RenderCallback) {
    this.tickRate = tickRate;
    this.step = 1 / tickRate;
    this.updateCallback = update;
    this.renderCallback = render;
  }

  /**
   * Starts the game loop.
   * Resets timing accumulators to prevent huge jumps on start.
   */
  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = this.now();
    this.accumulator = 0;
    Logger.info(`GameLoop started at ${this.tickRate} Hz`);

    this.loop();
  }

  /**
   * Stops the game loop.
   */
  public stop(): void {
    this.running = false;
    Logger.info('GameLoop stopped');
  }

  /**
   * Gets the current time in seconds.
   * Uses `performance.now()` if available, otherwise `Date.now()`.
   * @private
   * @returns {number} Current time in seconds.
   */
  private now(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now() / 1000; // Seconds
    }
    return Date.now() / 1000;
  }

  /**
   * The main loop function.
   * Calculates delta time, updates accumulator, performs fixed updates, and triggers render.
   * Handles "spiral of death" by clamping frame time.
   * @private
   */
  private loop = (): void => {
    if (!this.running) return;

    const profiler = Profiler.getInstance();
    profiler.startFrame();

    const currentTime = this.now();
    let frameTime = currentTime - this.lastTime;

    // Prevent spiral of death
    if (frameTime > 0.25) frameTime = 0.25;

    this.lastTime = currentTime;
    this.accumulator += frameTime;

    profiler.startUpdate();
    while (this.accumulator >= this.step) {
      this.updateCallback(this.step);
      this.accumulator -= this.step;
    }
    profiler.endUpdate();

    const interpolation = this.accumulator / this.step;

    profiler.startRender();
    this.renderCallback(interpolation);
    profiler.endRender();

    profiler.endFrame();

    if (typeof globalThis.requestAnimationFrame !== 'undefined') {
      globalThis.requestAnimationFrame(this.loop);
    } else {
      // Fallback for Node.js environment (e.g. tests or server)
      const nextTick = Math.max(0, (this.step - (this.now() - currentTime)) * 1000);
      setTimeout(this.loop, nextTick);
    }
  };
}
