import { TransformComponent } from '../core/components';
import { Engine } from '../core/engine';
import { Profiler } from '../debug/profiler';
import { HealthComponent } from '../gameplay/components';
import { PlayerComponent } from '../network/components';

import { Button } from './button';
import { DeviceManager, DeviceType } from './device-manager';
import { Text } from './text';
import { UIManager } from './ui-manager';

/**
 * Heads-Up Display (HUD) manager.
 * Displays FPS, player position, health, and status information.
 * Adapts layout for mobile and desktop devices.
 */
export class HUD {
  private engine: Engine;
  private uiManager: UIManager;

  // UI Elements
  private fpsText: Text;
  private posText: Text;
  private statusText: Text;
  private healthText: Text;
  private menuButton: Button;

  /**
   * Creates a new HUD instance.
   * Initializes text elements and buttons.
   * 
   * @param {Engine} engine - The game engine instance.
   */
  constructor(engine: Engine) {
    this.engine = engine;
    this.uiManager = engine.uiManager;

    // Initialize Elements with default values (will be updated in refresh)
    this.fpsText = new Text('hud-fps', 10, 10, 'FPS: 0', { color: 'yellow', fontSize: 14 });
    this.posText = new Text('hud-pos', 10, 30, 'Pos: 0, 0', { color: 'white', fontSize: 14 });
    this.statusText = new Text('hud-status', 10, 50, 'Status: Connected', {
      color: 'green',
      fontSize: 14,
    });
    this.healthText = new Text('hud-health', 10, 70, 'HP: 100/100', { color: 'red', fontSize: 14 });

    this.menuButton = new Button('hud-menu', 0, 0, 80, 30, 'MENU', {
      backgroundColor: 'rgba(50, 50, 50, 0.8)',
      color: '#FFF',
      fontSize: 14,
    });
    this.menuButton.onClick = () => {
      this.engine.gameStateManager.switchState('Lobby');
    };

    this.refreshLayout();
  }

  /**
   * Refreshes the HUD layout based on device type (Mobile/Desktop).
   * Adjusts font sizes and positioning.
   */
  public refreshLayout(): void {
    const isMobile = DeviceManager.getInstance().deviceType === DeviceType.MOBILE;
    const fontSize = isMobile ? 18 : 14;
    const spacing = isMobile ? 25 : 20;

    // Update Text Styles
    this.fpsText.style.fontSize = fontSize;
    this.posText.style.fontSize = fontSize;
    this.statusText.style.fontSize = fontSize;
    this.healthText.style.fontSize = fontSize;

    // Update positions (logically, visual update happens via UIManager anchors)
    // We re-add them in enable() or just update properties if already added.
    // If they are already in UIManager, updating style property is enough if UIManager renders every frame referencing it.
    // However, we might need to update offsets.

    // We will store spacing for use in enable/resize
    // But UIManager uses offsets stored in the element wrapper?
    // No, UIManager.addElement takes options.
    // We might need to remove and re-add if we want to change offsets.
    // Or simply, we assume enable() is called after resize/creation.

    // If already enabled, we should re-register to update offsets
    if (this.uiManager.getElement(this.fpsText.id)) {
      this.enable();
    }
  }

  /**
   * Enables the HUD by adding elements to the UIManager.
   * Sets up anchors and offsets.
   */
  public enable(): void {
    const isMobile = DeviceManager.getInstance().deviceType === DeviceType.MOBILE;
    const spacing = isMobile ? 25 : 20;
    const startY = 10;

    this.uiManager.addElement(this.fpsText, { anchor: 'top-left', offsetX: 10, offsetY: startY });
    this.uiManager.addElement(this.posText, {
      anchor: 'top-left',
      offsetX: 10,
      offsetY: startY + spacing,
    });
    this.uiManager.addElement(this.statusText, {
      anchor: 'top-left',
      offsetX: 10,
      offsetY: startY + spacing * 2,
    });
    this.uiManager.addElement(this.healthText, {
      anchor: 'top-left',
      offsetX: 10,
      offsetY: startY + spacing * 3,
    });

    // Hide Menu Button on Mobile (MobileControls has its own)
    if (!isMobile) {
      this.uiManager.addElement(this.menuButton, { anchor: 'top-right', offsetX: 10, offsetY: 10 });
    } else {
      this.uiManager.removeElement(this.menuButton.id);
    }
  }

  /**
   * Disables the HUD by removing elements from the UIManager.
   */
  public disable(): void {
    this.uiManager.removeElement(this.fpsText.id);
    this.uiManager.removeElement(this.posText.id);
    this.uiManager.removeElement(this.statusText.id);
    this.uiManager.removeElement(this.healthText.id);
    this.uiManager.removeElement(this.menuButton.id);
  }

  /**
   * Updates HUD data (FPS, Position, Health).
   * Called every frame.
   * 
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(deltaTime: number): void {
    // Update FPS
    this.fpsText.text = `FPS: ${Profiler.getInstance().fps}`;

    // Update Player Position
    const entities = this.engine.entityManager.getEntitiesWithComponents(['Player', 'Transform']);
    let found = false;
    for (const entity of entities) {
      const player = entity.getComponent<PlayerComponent>('Player');
      // Use isLocal flag or fallback to socket match if network is active
      if (player && player.isLocal) {
        const transform = entity.getComponent<TransformComponent>('Transform');
        if (transform) {
          this.posText.text = `Pos: ${Math.round(transform.x)}, ${Math.round(transform.y)}`;
          found = true;
        }

        const health = entity.getComponent<HealthComponent>('Health');
        if (health) {
          this.healthText.text = `HP: ${Math.ceil(health.current)}/${health.max}`;
          // Update color based on health percentage
          const pct = health.current / health.max;
          if (pct > 0.5) this.healthText.style.color = 'green';
          else if (pct > 0.2) this.healthText.style.color = 'yellow';
          else this.healthText.style.color = 'red';
        }
        break;
      }
    }
    if (!found) {
      this.posText.text = 'Pos: (Spectating)';
    }

    // Update Connection Status
    if (this.engine.config.network.enabled) {
      const connected = this.engine.networkManager.isConnected();
      this.statusText.text = connected ? 'Status: Online' : 'Status: Offline';
      this.statusText.style.color = connected ? 'green' : 'red';
    } else {
      this.statusText.text = 'Status: Singleplayer';
      this.statusText.style.color = 'cyan';
    }
  }
}
