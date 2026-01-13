import { EventSystem } from '../core/event-system';
import { Logger } from '../utils/logger';

/**
 * Handles user input from Keyboard, Mouse, and Gamepad.
 * Emits events via EventSystem and provides polling methods for current state.
 */
export class InputHandler {
  private keys: Set<string>;
  private mousePos: { x: number; y: number };
  private mouseButtons: Set<number>;
  private eventSystem: EventSystem;

  // Gamepad state
  private gamepads: (Gamepad | null)[] = [];
  private prevGamepadButtons: boolean[][] = [];

  /**
   * Creates a new InputHandler instance.
   */
  constructor() {
    this.keys = new Set();
    this.mousePos = { x: 0, y: 0 };
    this.mouseButtons = new Set();
    this.eventSystem = EventSystem.getInstance();
  }

  /**
   * Initializes input listeners on the target element or window.
   * 
   * @param {HTMLElement | Window} target - The target to listen for events on. Defaults to window.
   */
  public initialize(
    target: HTMLElement | Window = typeof window !== 'undefined' ? window : ({} as any),
  ): void {
    if (typeof window === 'undefined') return;

    target.addEventListener('keydown', (e: any) => this.onKeyDown(e));
    target.addEventListener('keyup', (e: any) => this.onKeyUp(e));
    target.addEventListener('mousemove', (e: any) => this.onMouseMove(e));
    target.addEventListener('mousedown', (e: any) => this.onMouseDown(e));
    target.addEventListener('mouseup', (e: any) => this.onMouseUp(e));

    // Prevent context menu
    target.addEventListener('contextmenu', (e: any) => e.preventDefault());

    // Gamepad events (connection)
    window.addEventListener('gamepadconnected', (e: any) => {
      Logger.info(
        `Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}. ${e.gamepad.buttons.length} buttons, ${e.gamepad.axes.length} axes.`,
      );
    });
    window.addEventListener('gamepaddisconnected', (e: any) => {
      Logger.info(`Gamepad disconnected from index ${e.gamepad.index}: ${e.gamepad.id}`);
    });

    Logger.info('InputHandler initialized');
  }

  /**
   * Updates internal state, specifically polling gamepads.
   * Should be called every frame.
   */
  public update(): void {
    this.pollGamepads();
  }

  /**
   * Checks if a specific key is currently held down.
   * 
   * @param {string} key - The key code (e.g., 'ArrowUp', 'w').
   * @returns {boolean} True if the key is down.
   */
  public isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  /**
   * Checks if a specific mouse button is currently held down.
   * 
   * @param {number} button - The button index (0 = Left, 1 = Middle, 2 = Right).
   * @returns {boolean} True if the button is down.
   */
  public isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  /**
   * Returns the current mouse position relative to the target element.
   * 
   * @returns {{x: number, y: number}} The x and y coordinates.
   */
  public getMousePosition(): { x: number; y: number } {
    return { ...this.mousePos };
  }

  /**
   * Checks if a specific gamepad button is currently pressed.
   * 
   * @param {number} index - The gamepad index (0-3).
   * @param {number} button - The button index.
   * @returns {boolean} True if the button is pressed.
   */
  public isGamepadButtonDown(index: number, button: number): boolean {
    if (!this.gamepads[index]) return false;
    const gp = this.gamepads[index];
    if (gp && gp.buttons[button]) {
      return gp.buttons[button].pressed;
    }
    return false;
  }

  /**
   * Returns the value of a specific gamepad axis.
   * 
   * @param {number} index - The gamepad index (0-3).
   * @param {number} axis - The axis index.
   * @returns {number} The axis value (usually -1.0 to 1.0).
   */
  public getGamepadAxis(index: number, axis: number): number {
    if (!this.gamepads[index]) return 0;
    const gp = this.gamepads[index];
    if (gp && gp.axes[axis]) {
      return gp.axes[axis];
    }
    return 0;
  }

  /**
   * Simulates a key press or release.
   * Useful for on-screen controls (virtual keyboard/joystick).
   * 
   * @param {string} key - The key code.
   * @param {boolean} isDown - True for press, false for release.
   */
  public simulateKey(key: string, isDown: boolean): void {
    if (isDown) {
      if (!this.keys.has(key)) {
        this.keys.add(key);
        this.eventSystem.emit('input:keydown', key);
      }
    } else {
      if (this.keys.has(key)) {
        this.keys.delete(key);
        this.eventSystem.emit('input:keyup', key);
      }
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.key);
    this.eventSystem.emit('input:keydown', event.key);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key);
    this.eventSystem.emit('input:keyup', event.key);
  }

  private onMouseMove(event: MouseEvent): void {
    // If target is canvas, we might need to adjust coordinates relative to it
    // For now assuming global or correctly offset events
    // In a real engine, we'd subtract canvas offset
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect
      ? target.getBoundingClientRect()
      : { left: 0, top: 0 };

    this.mousePos.x = event.clientX - rect.left;
    this.mousePos.y = event.clientY - rect.top;

    this.eventSystem.emit('input:mousemove', this.mousePos);
  }

  private onMouseDown(event: MouseEvent): void {
    this.mouseButtons.add(event.button);
    this.eventSystem.emit('input:mousedown', {
      button: event.button,
      x: this.mousePos.x,
      y: this.mousePos.y,
    });
  }

  private onMouseUp(event: MouseEvent): void {
    this.mouseButtons.delete(event.button);
    this.eventSystem.emit('input:mouseup', {
      button: event.button,
      x: this.mousePos.x,
      y: this.mousePos.y,
    });
  }

  private pollGamepads(): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    this.gamepads = [];

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        this.gamepads[i] = gp;

        // Check button presses for events
        if (!this.prevGamepadButtons[i]) {
          this.prevGamepadButtons[i] = new Array(gp.buttons.length).fill(false);
        }

        gp.buttons.forEach((btn, btnIndex) => {
          const pressed = btn.pressed;
          if (pressed && !this.prevGamepadButtons[i][btnIndex]) {
            this.eventSystem.emit('input:gamepad_down', { index: i, button: btnIndex });
          } else if (!pressed && this.prevGamepadButtons[i][btnIndex]) {
            this.eventSystem.emit('input:gamepad_up', { index: i, button: btnIndex });
          }
          this.prevGamepadButtons[i][btnIndex] = pressed;
        });
      } else {
        this.gamepads[i] = null;
      }
    }
  }
}
