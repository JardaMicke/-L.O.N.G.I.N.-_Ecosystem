import { EventSystem } from '../core/event-system';
import { Logger } from '../utils/logger';

/**
 * Represents a touch or mouse gesture event.
 */
export interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'pinch-start' | 'pinch-end';
  x?: number;
  y?: number;
  deltaX?: number;
  deltaY?: number;
  scale?: number; // For pinch
  fingers?: number;
}

/**
 * Handles touch and mouse input to detect gestures.
 * Supports tap, double-tap, long-press, swipe, and pinch gestures.
 */
export class TouchHandler {
  private element: HTMLElement | null = null;
  private eventSystem: EventSystem;

  // State
  private lastTapTime: number = 0;
  private touchStartTime: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private longPressTimer: any = null;
  private isSwiping: boolean = false;
  private isPinching: boolean = false;
  private initialPinchDistance: number = 0;

  // Configuration
  private readonly TAP_THRESHOLD = 200; // ms for double tap
  private readonly LONG_PRESS_THRESHOLD = 500; // ms
  private readonly SWIPE_THRESHOLD = 30; // px

  constructor() {
    this.eventSystem = EventSystem.getInstance();
  }

  /**
   * Initializes the touch handler on a specific HTML element.
   * Sets up event listeners for touch and mouse events.
   * 
   * @param {HTMLElement} element - The target element to listen on.
   */
  public initialize(element: HTMLElement): void {
    this.element = element;
    this.setupListeners();
    Logger.info('TouchHandler initialized');
  }

  private setupListeners(): void {
    if (!this.element) return;

    // Touch Events
    this.element.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.element.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.element.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // Mouse Events (for desktop/accessibility)
    this.element.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.element.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.element.addEventListener('mouseleave', (e) => this.onMouseUp(e));
    this.element.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
  }

  // --- Touch Handlers ---

  /**
   * Handles touch start event.
   * Initiates single touch or pinch detection.
   */
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault(); // Prevent scrolling/zooming by browser

    if (e.touches.length === 1) {
      this.handleSingleTouchStart(e.touches[0]);
    } else if (e.touches.length === 2) {
      this.handlePinchStart(e);
    }

    this.eventSystem.emit('input:touchstart', e);
  }

  private handleSingleTouchStart(touch: Touch): void {
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = false;

    // Long Press detection
    this.longPressTimer = setTimeout(() => {
      if (!this.isSwiping) {
        this.emitGesture({
          type: 'long-press',
          x: this.startX,
          y: this.startY,
        });
      }
    }, this.LONG_PRESS_THRESHOLD);
  }

  private handlePinchStart(e: TouchEvent): void {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    this.initialPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY,
    );
    this.isPinching = true;
    this.emitGesture({
      type: 'pinch-start',
      scale: 1,
    });
  }

  /**
   * Handles touch move event.
   * Updates swipe or pinch state.
   */
  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1) {
      this.handleSingleTouchMove(e.touches[0]);
    } else if (e.touches.length === 2) {
      this.handlePinchMove(e);
    }

    this.eventSystem.emit('input:touchmove', e);
  }

  private handleSingleTouchMove(touch: Touch): void {
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD || Math.abs(deltaY) > this.SWIPE_THRESHOLD) {
      this.isSwiping = true;
      if (this.longPressTimer) clearTimeout(this.longPressTimer);

      this.emitGesture({
        type: 'swipe',
        deltaX,
        deltaY,
        x: touch.clientX,
        y: touch.clientY,
      });
    }
  }

  private handlePinchMove(e: TouchEvent): void {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY,
    );

    if (this.initialPinchDistance > 0) {
      const scale = currentDistance / this.initialPinchDistance;
      this.emitGesture({
        type: 'pinch',
        scale,
      });
    }
  }

  /**
   * Handles touch end event.
   * Finalizes gestures like tap or double-tap.
   */
  private onTouchEnd(e: TouchEvent): void {
    if (this.longPressTimer) clearTimeout(this.longPressTimer);

    // Check if pinch ended
    if (this.isPinching && e.touches.length < 2) {
      this.isPinching = false;
      this.emitGesture({ type: 'pinch-end' });
    }

    if (e.changedTouches.length === 1 && !this.isSwiping && !this.isPinching) {
      const currentTime = Date.now();
      const tapDuration = currentTime - this.touchStartTime;

      if (tapDuration < this.LONG_PRESS_THRESHOLD) {
        if (currentTime - this.lastTapTime < this.TAP_THRESHOLD) {
          this.emitGesture({ type: 'double-tap', x: this.startX, y: this.startY });
        } else {
          this.emitGesture({ type: 'tap', x: this.startX, y: this.startY });
        }
        this.lastTapTime = currentTime;
      }
    }

    this.eventSystem.emit('input:touchend', e);
  }

  private emitGesture(gesture: TouchGesture): void {
    this.eventSystem.emit('input:gesture', gesture);
    Logger.info(`Gesture detected: ${gesture.type}`);
  }

  // --- Mouse Handlers ---
  private isMouseDown: boolean = false;

  private onMouseDown(e: MouseEvent): void {
    this.isMouseDown = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = false;

    // Long Press detection
    this.longPressTimer = setTimeout(() => {
      if (this.isMouseDown && !this.isSwiping) {
        this.emitGesture({
          type: 'long-press',
          x: this.startX,
          y: this.startY,
        });
      }
    }, this.LONG_PRESS_THRESHOLD);
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isMouseDown) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD || Math.abs(deltaY) > this.SWIPE_THRESHOLD) {
      this.isSwiping = true;
      if (this.longPressTimer) clearTimeout(this.longPressTimer);

      this.emitGesture({
        type: 'swipe',
        deltaX,
        deltaY,
        x: e.clientX,
        y: e.clientY,
      });
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;

    if (this.longPressTimer) clearTimeout(this.longPressTimer);

    if (!this.isSwiping) {
      const currentTime = Date.now();
      const tapDuration = currentTime - this.touchStartTime;

      if (tapDuration < this.LONG_PRESS_THRESHOLD) {
        if (currentTime - this.lastTapTime < this.TAP_THRESHOLD) {
          this.emitGesture({ type: 'double-tap', x: this.startX, y: this.startY });
        } else {
          this.emitGesture({ type: 'tap', x: this.startX, y: this.startY });
        }
        this.lastTapTime = currentTime;
      }
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    const zoomSpeed = 0.001;
    const scaleChange = 1 - e.deltaY * zoomSpeed;
    const safeScale = Math.max(0.8, Math.min(scaleChange, 1.2));

    this.emitGesture({
      type: 'pinch-start',
      scale: 1,
    });

    this.emitGesture({
      type: 'pinch',
      scale: safeScale,
    });
  }
}
