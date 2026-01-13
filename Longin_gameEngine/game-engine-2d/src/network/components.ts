import { Component } from '../ecs/component';
import { PlayerType, Difficulty } from '../game/core/interfaces';

/**
 * Component representing a player entity in the network.
 * Stores identity, connection status, and player configuration.
 */
export class PlayerComponent extends Component {
  public readonly name = 'Player';
  
  /** Socket ID associated with this player */
  public socketId: string;
  /** Display name of the player */
  public username: string;
  /** Player color (hex string) */
  public color: string;
  /** Type of player (Human/AI) */
  public type: PlayerType;
  /** Difficulty level (if AI) */
  public difficulty?: Difficulty;
  /** Whether the player is ready to start the game */
  public isReady: boolean;
  /** Whether this component belongs to the local client's player */
  public isLocal: boolean = false;

  /**
   * Creates a new PlayerComponent.
   * 
   * @param {string} socketId - The socket connection ID.
   * @param {string} username - The player's display name.
   * @param {string} color - The player's color.
   * @param {PlayerType} type - The type of player (Human/AI).
   * @param {boolean} isLocal - True if this is the local player.
   */
  constructor(
    socketId: string,
    username: string = 'Anonymous',
    color: string = '#FFFFFF',
    type: PlayerType = PlayerType.HUMAN,
    isLocal: boolean = false,
  ) {
    super();
    this.socketId = socketId;
    this.username = username;
    this.color = color;
    this.type = type;
    this.isReady = false;
    this.isLocal = isLocal;
  }
}
