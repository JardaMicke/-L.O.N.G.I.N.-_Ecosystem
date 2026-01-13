import { Logger } from '../../utils/logger';

import { IGame, IPlayer } from './interfaces';

export abstract class AbstractGame implements IGame {
  protected players: Map<string, IPlayer>;
  protected isRunning: boolean;

  constructor() {
    this.players = new Map();
    this.isRunning = false;
  }

  public start(): void {
    Logger.info('Starting game...');
    this.isRunning = true;
    this.onStart();
  }

  public stop(): void {
    Logger.info('Stopping game...');
    this.isRunning = false;
    this.onStop();
  }

  public update(deltaTime: number): void {
    if (!this.isRunning) return;
    this.onUpdate(deltaTime);
  }

  public addPlayer(player: IPlayer): void {
    if (this.players.has(player.id)) {
      Logger.warn(`Player ${player.id} already exists.`);
      return;
    }
    this.players.set(player.id, player);
    Logger.info(`Player ${player.name} (${player.type}) added.`);
    this.onPlayerAdded(player);
  }

  public removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      Logger.info(`Player ${player.name} removed.`);
      this.onPlayerRemoved(player);
    }
  }

  public getPlayers(): IPlayer[] {
    return Array.from(this.players.values());
  }

  // Abstract methods for specific game logic
  protected abstract onStart(): void;
  protected abstract onStop(): void;
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onPlayerAdded(player: IPlayer): void;
  protected abstract onPlayerRemoved(player: IPlayer): void;
}
