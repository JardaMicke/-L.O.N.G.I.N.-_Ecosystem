import { Logger } from '../utils/logger';

import { DeviceManager, DeviceType } from './device-manager';
import { InputHandler } from './input-handler';

/**
 * Class for on-screen mobile controls (Virtual Joystick and Buttons).
 * Automatically handles visibility based on device type.
 */
export class MobileControls {
  private inputHandler: InputHandler;
  private container: HTMLElement | null = null;
  private joystickBase: HTMLElement | null = null;
  private joystickStick: HTMLElement | null = null;
  private actionBtn: HTMLElement | null = null;
  private menuBtn: HTMLElement | null = null;

  // Joystick state
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private maxRadius: number = 50;

  /**
   * Creates a new MobileControls instance.
   * 
   * @param {InputHandler} inputHandler - The input handler to feed events into.
   */
  constructor(inputHandler: InputHandler) {
    this.inputHandler = inputHandler;
  }

  /**
   * Initializes DOM elements, styles, and event listeners.
   * Should be called after the DOM is ready.
   */
  public initialize(): void {
    if (typeof document === 'undefined') return;

    this.injectCSS();
    this.createDOM();
    this.setupListeners();

    // Listen to device changes
    DeviceManager.getInstance().onResize((device, screen) => {
      this.updateVisibility(device);
    });

    // Initial check
    this.updateVisibility(DeviceManager.getInstance().deviceType);

    Logger.info('Mobile controls initialized');
  }

  /**
   * Updates visibility of controls based on device type.
   * Shows controls only on MOBILE and TABLET devices.
   * 
   * @param {DeviceType} device - The current device type.
   */
  private updateVisibility(device: DeviceType): void {
    if (!this.container) return;

    if (device === DeviceType.MOBILE || device === DeviceType.TABLET) {
      this.container.style.display = 'block';
    } else {
      this.container.style.display = 'none';
    }
  }

  /**
   * Injects necessary CSS styles into the document head.
   */
  private injectCSS(): void {
    const style = document.createElement('style');
    style.textContent = `
            #mobile-controls-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
                display: none; /* Controlled by JS now */
            }

            /* Responsive Scaling */
            @media (min-width: 768px) {
                #joystick-zone {
                    bottom: 40px !important;
                    left: 40px !important;
                    transform: scale(1.2);
                    transform-origin: bottom left;
                }
                #action-zone {
                    bottom: 60px !important;
                    right: 60px !important;
                    transform: scale(1.2);
                    transform-origin: bottom right;
                }
            }

            .control-zone {
                pointer-events: auto;
                position: absolute;
            }

            /* Joystick */
            #joystick-zone {
                bottom: 20px;
                left: 20px;
                width: 150px;
                height: 150px;
            }

            #joystick-base {
                width: 100px;
                height: 100px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                position: relative;
                top: 25px;
                left: 25px;
            }

            #joystick-stick {
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                position: absolute;
                top: 25px;
                left: 25px;
                transition: transform 0.1s ease-out;
            }

            /* Action Buttons */
            #action-zone {
                bottom: 40px;
                right: 40px;
                display: flex;
                gap: 20px;
            }

            .mobile-btn {
                width: 60px;
                height: 60px;
                background: rgba(255, 0, 0, 0.4);
                border: 2px solid rgba(255, 0, 0, 0.6);
                border-radius: 50%;
                color: white;
                font-family: Arial, sans-serif;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
            }

            .mobile-btn:active {
                background: rgba(255, 0, 0, 0.6);
                transform: scale(0.95);
            }

            /* Secondary Controls (Top) */
            #secondary-zone {
                top: 20px;
                right: 20px;
                position: absolute;
            }

            .secondary-btn {
                width: 40px;
                height: 40px;
                background: rgba(50, 50, 50, 0.6);
                border: 1px solid rgba(100, 100, 100, 0.8);
                border-radius: 5px;
                color: white;
                font-size: 12px;
            }
        `;
    document.head.appendChild(style);
  }

  private createDOM(): void {
    this.container = document.createElement('div');
    this.container.id = 'mobile-controls-container';

    // Joystick
    const joystickZone = document.createElement('div');
    joystickZone.id = 'joystick-zone';
    joystickZone.className = 'control-zone';

    this.joystickBase = document.createElement('div');
    this.joystickBase.id = 'joystick-base';

    this.joystickStick = document.createElement('div');
    this.joystickStick.id = 'joystick-stick';

    this.joystickBase.appendChild(this.joystickStick);
    joystickZone.appendChild(this.joystickBase);

    // Action Buttons (Bottom Right)
    const actionZone = document.createElement('div');
    actionZone.id = 'action-zone';
    actionZone.className = 'control-zone';

    this.actionBtn = document.createElement('div');
    this.actionBtn.className = 'mobile-btn';
    this.actionBtn.textContent = 'A';
    actionZone.appendChild(this.actionBtn);

    // Secondary Controls (Top Right)
    const secondaryZone = document.createElement('div');
    secondaryZone.id = 'secondary-zone';
    secondaryZone.className = 'control-zone';

    this.menuBtn = document.createElement('div');
    this.menuBtn.className = 'mobile-btn secondary-btn';
    this.menuBtn.textContent = 'MENU';
    secondaryZone.appendChild(this.menuBtn);

    this.container.appendChild(joystickZone);
    this.container.appendChild(actionZone);
    this.container.appendChild(secondaryZone);

    document.body.appendChild(this.container);
  }

  private setupListeners(): void {
    if (!this.joystickBase || !this.joystickStick || !this.actionBtn || !this.menuBtn) return;

    // Joystick Touch Logic
    this.joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isDragging = true;
      const touch = e.touches[0];
      const rect = this.joystickBase!.getBoundingClientRect();
      this.startX = rect.left + rect.width / 2;
      this.startY = rect.top + rect.height / 2;
      this.updateJoystick(touch.clientX, touch.clientY);
    });

    this.joystickBase.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.isDragging) {
        const touch = e.touches[0];
        this.updateJoystick(touch.clientX, touch.clientY);
      }
    });

    const resetJoystick = () => {
      this.isDragging = false;
      if (this.joystickStick) {
        this.joystickStick.style.transform = `translate(0px, 0px)`;
      }
      this.inputHandler.simulateKey('ArrowUp', false);
      this.inputHandler.simulateKey('ArrowDown', false);
      this.inputHandler.simulateKey('ArrowLeft', false);
      this.inputHandler.simulateKey('ArrowRight', false);
    };

    this.joystickBase.addEventListener('touchend', resetJoystick);
    this.joystickBase.addEventListener('touchcancel', resetJoystick);

    // Action Button
    this.actionBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputHandler.simulateKey('Space', true); // Map A to Space
    });

    this.actionBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputHandler.simulateKey('Space', false);
    });

    // Menu Button
    this.menuBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputHandler.simulateKey('Escape', true); // Map Menu to Esc
    });
  }

  private updateJoystick(x: number, y: number): void {
    if (!this.joystickStick) return;

    const dx = x - this.startX;
    const dy = y - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.atan2(dy, dx);
    const cappedDist = Math.min(distance, this.maxRadius);

    const moveX = Math.cos(angle) * cappedDist;
    const moveY = Math.sin(angle) * cappedDist;

    this.joystickStick.style.transform = `translate(${moveX}px, ${moveY}px)`;

    // Map to Inputs
    // Threshold for activation
    const threshold = 10;

    if (moveY < -threshold) this.inputHandler.simulateKey('ArrowUp', true);
    else this.inputHandler.simulateKey('ArrowUp', false);

    if (moveY > threshold) this.inputHandler.simulateKey('ArrowDown', true);
    else this.inputHandler.simulateKey('ArrowDown', false);

    if (moveX < -threshold) this.inputHandler.simulateKey('ArrowLeft', true);
    else this.inputHandler.simulateKey('ArrowLeft', false);

    if (moveX > threshold) this.inputHandler.simulateKey('ArrowRight', true);
    else this.inputHandler.simulateKey('ArrowRight', false);
  }
}
