import { Engine } from '../../core/engine';
import { State } from '../../core/game-state';
import { Button } from '../../ui/button';
import { DeviceType } from '../../ui/device-manager';
import { Text } from '../../ui/text';
import { Logger } from '../../utils/logger';
import { Game } from '../core/game';
import { IPlayer, PlayerType, Difficulty } from '../core/interfaces';

/**
 * Stav lobby, kde se hráči připojují a nastavují hru.
 * Lobby state where players join and setup the game.
 */
export class LobbyState implements State {
  public name: string = 'Lobby';
  private engine: Engine | null = null;
  private game: Game;

  // UI Config
  private rowHeight: number = 60;
  private colors: string[] = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#00FFFF',
    '#FF00FF',
    '#FFFFFF',
    '#FFA500',
  ];
  private resizeHandler = (data: { width: number; height: number }) => this.refreshUI();

  constructor() {
    this.game = Game.getInstance();
  }

  public onEnter(engine: Engine): void {
    Logger.info('Entering LobbyState');
    this.engine = engine;
    this.engine.uiManager.clear();

    // Ensure local player exists
    const players = this.game.getPlayers();
    if (players.length === 0) {
      const localPlayer: IPlayer = {
        id: 'local_player',
        name: 'Player 1',
        color: this.colors[0],
        type: PlayerType.HUMAN,
        isReady: true,
      };
      this.game.addPlayer(localPlayer);
    }

    this.refreshUI();

    // Listen to resize to update UI layout (especially font sizes)
    engine.eventSystem.on('engine:resize', this.resizeHandler);
  }

  public onExit(engine: Engine): void {
    Logger.info('Exiting LobbyState');
    engine.uiManager.clear();
    engine.eventSystem.off('engine:resize', this.resizeHandler);
  }

  public onUpdate(engine: Engine, deltaTime: number): void {
    // Here we could poll for network updates if we had a server lobby
  }

  public onRender(engine: Engine, interpolation: number): void {
    // Draw Lobby Background if needed
  }

  private refreshUI(): void {
    if (!this.engine) return;
    const engine = this.engine;
    engine.uiManager.clear();

    const isMobile = engine.deviceManager.deviceType === DeviceType.MOBILE;

    // Title
    const title = new Text('lobby-title', 0, 0, 'LOBBY', {
      fontSize: isMobile ? 30 : 40,
      color: '#FFFFFF',
      font: 'Arial',
    });
    engine.uiManager.addElement(title, {
      anchor: 'top-center',
      offsetY: isMobile ? 30 : 50,
    });

    // Player List Container (Virtual)
    // We will layout items relative to center

    const players = this.game.getPlayers();
    const startYOffset = -((players.length * this.rowHeight) / 2); // Center vertically

    players.forEach((player, index) => {
      const yOffset = startYOffset + index * this.rowHeight;

      // Player Name Button
      const nameBtn = new Button(
        `p-name-${player.id}`,
        0,
        0,
        isMobile ? 120 : 200,
        40,
        player.name,
        {
          backgroundColor: '#333',
          color: '#FFF',
          fontSize: 18,
        },
      );
      nameBtn.onClick = () => {
        if (player.type === PlayerType.HUMAN) {
          const newName = prompt('Enter name:', player.name);
          if (newName) {
            player.name = newName;
            this.refreshUI();
          }
        }
      };

      engine.uiManager.addElement(nameBtn, {
        anchor: 'center',
        offsetX: isMobile ? -80 : -160,
        offsetY: yOffset,
      });

      // Color Button
      const colorBtn = new Button(
        `p-color-${player.id}`,
        0,
        0,
        isMobile ? 40 : 80,
        40,
        isMobile ? 'C' : 'Color',
        {
          backgroundColor: player.color,
          color: '#000',
          fontSize: 14,
        },
      );
      colorBtn.onClick = () => {
        const currentIndex = this.colors.indexOf(player.color);
        const nextIndex = (currentIndex + 1) % this.colors.length;
        player.color = this.colors[nextIndex];
        this.refreshUI();
      };

      engine.uiManager.addElement(colorBtn, {
        anchor: 'center',
        offsetX: isMobile ? 10 : -10,
        offsetY: yOffset,
      });

      if (player.type === PlayerType.AI) {
        // Difficulty Toggle
        const diffBtn = new Button(
          `p-diff-${player.id}`,
          0,
          0,
          isMobile ? 50 : 80,
          40,
          player.difficulty || 'EASY',
          {
            backgroundColor: '#555',
            color: '#FFF',
            fontSize: 12,
          },
        );
        diffBtn.onClick = () => {
          if (player.difficulty === Difficulty.EASY) player.difficulty = Difficulty.MEDIUM;
          else if (player.difficulty === Difficulty.MEDIUM) player.difficulty = Difficulty.HARD;
          else player.difficulty = Difficulty.EASY;
          this.refreshUI();
        };
        engine.uiManager.addElement(diffBtn, {
          anchor: 'center',
          offsetX: isMobile ? 60 : 80,
          offsetY: yOffset,
        });

        // Remove AI Button
        const removeBtn = new Button(
          `p-remove-${player.id}`,
          0,
          0,
          isMobile ? 30 : 80,
          40,
          isMobile ? 'X' : 'Rem',
          {
            backgroundColor: '#8B0000',
            color: '#FFF',
            fontSize: 14,
          },
        );
        removeBtn.onClick = () => {
          this.game.removePlayer(player.id);
          this.refreshUI();
        };
        engine.uiManager.addElement(removeBtn, {
          anchor: 'center',
          offsetX: isMobile ? 110 : 170,
          offsetY: yOffset,
        });
      } else {
        // Label for Human
        const typeText = new Text(`p-type-${player.id}`, 0, 0, isMobile ? 'P' : 'HUMAN', {
          fontSize: 18,
          color: '#AAA',
        });
        engine.uiManager.addElement(typeText, {
          anchor: 'center',
          offsetX: isMobile ? 60 : 80,
          offsetY: yOffset + 10,
        });
      }
    });

    // Add AI Button
    const addAiBtn = new Button('add-ai', 0, 0, 150, 50, 'Add AI', {
      backgroundColor: '#4682B4',
      color: '#FFF',
      fontSize: 20,
    });
    addAiBtn.onClick = () => {
      const id = `ai_${Date.now()}`;
      const aiPlayer: IPlayer = {
        id: id,
        name: `Bot ${players.length}`,
        color: this.colors[players.length % this.colors.length],
        type: PlayerType.AI,
        difficulty: Difficulty.EASY,
        isReady: true,
      };
      this.game.addPlayer(aiPlayer);
      this.refreshUI();
    };
    engine.uiManager.addElement(addAiBtn, {
      anchor: 'bottom-center',
      offsetX: -100,
      offsetY: 80,
    });

    // Start Game Button
    const startBtn = new Button('start-game', 0, 0, 150, 50, 'START', {
      backgroundColor: '#2E8B57',
      color: '#FFF',
      fontSize: 20,
    });
    startBtn.onClick = () => {
      Logger.info('Starting Game...');
      engine.gameStateManager.switchState('Play');
    };
    engine.uiManager.addElement(startBtn, {
      anchor: 'bottom-center',
      offsetX: 100,
      offsetY: 80,
    });

    // Back Button
    const backBtn = new Button('back-btn', 0, 0, 100, 40, 'Back', {
      backgroundColor: '#8B0000',
      color: '#FFF',
      fontSize: 16,
    });
    backBtn.onClick = () => {
      engine.gameStateManager.switchState('Menu');
    };
    engine.uiManager.addElement(backBtn, {
      anchor: 'top-left',
      offsetX: 20,
      offsetY: 20,
    });
  }
}
