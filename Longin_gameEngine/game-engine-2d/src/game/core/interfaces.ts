export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface IPlayer {
  id: string;
  name: string;
  color: string;
  type: PlayerType;
  difficulty?: Difficulty; // Only for AI
  isReady: boolean;
}

export interface IGame {
  /**
   * Spustí herní logiku
   */
  start(): void;

  /**
   * Zastaví herní logiku
   */
  stop(): void;

  /**
   * Aktualizační smyčka hry
   * @param deltaTime Čas od posledního snímku v sekundách
   */
  update(deltaTime: number): void;

  /**
   * Přidá hráče do hry
   * @param player Hráč k přidání
   */
  addPlayer(player: IPlayer): void;

  /**
   * Odebere hráče ze hry
   * @param playerId ID hráče
   */
  removePlayer(playerId: string): void;

  /**
   * Získá seznam všech hráčů
   */
  getPlayers(): IPlayer[];
}
