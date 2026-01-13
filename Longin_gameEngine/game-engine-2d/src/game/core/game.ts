import { Logger } from '../../utils/logger';

import { AbstractGame } from './abstract-game';
import { IPlayer } from './interfaces';

export class Game extends AbstractGame {
  private static instance: Game;

  private constructor() {
    super();
  }

  public static getInstance(): Game {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }

  protected onStart(): void {
    Logger.info('Game Logic Started');
    // Initialize game rules, spawn points, etc.
  }

  protected onStop(): void {
    Logger.info('Game Logic Stopped');
    this.players.clear();
  }

  protected onUpdate(deltaTime: number): void {
    // Game loop logic (e.g., timer, score, zone shrinking)
  }

  protected onPlayerAdded(player: IPlayer): void {
    Logger.info(`Game: Preparing spawn for ${player.name}`);
  }

  protected onPlayerRemoved(player: IPlayer): void {
    Logger.info(`Game: Cleaning up after ${player.name}`);
  }

  /**
   * Helper to reset the game instance
   */
  public reset(): void {
    this.stop();
    this.players.clear();
  }
}
