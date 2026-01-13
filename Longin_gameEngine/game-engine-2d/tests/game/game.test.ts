import { Game } from '../../src/game/core/game';
import { PlayerType, Difficulty } from '../../src/game/core/interfaces';

describe('Game Core', () => {
  let game: Game;

  beforeEach(() => {
    game = Game.getInstance();
    game.reset();
  });

  test('should be a singleton', () => {
    const game2 = Game.getInstance();
    expect(game).toBe(game2);
  });

  test('should add and remove players', () => {
    const player = {
      id: 'p1',
      name: 'Test Player',
      color: '#FF0000',
      type: PlayerType.HUMAN,
      isReady: true,
    };

    game.addPlayer(player);
    expect(game.getPlayers()).toHaveLength(1);
    expect(game.getPlayers()[0]).toEqual(player);

    game.removePlayer('p1');
    expect(game.getPlayers()).toHaveLength(0);
  });

  test('should prevent duplicate players', () => {
    const player = {
      id: 'p1',
      name: 'Test Player',
      color: '#FF0000',
      type: PlayerType.HUMAN,
      isReady: true,
    };

    game.addPlayer(player);
    game.addPlayer(player); // Should be ignored
    expect(game.getPlayers()).toHaveLength(1);
  });

  test('should handle AI players with difficulty', () => {
    const ai = {
      id: 'ai1',
      name: 'Bot',
      color: '#00FF00',
      type: PlayerType.AI,
      difficulty: Difficulty.HARD,
      isReady: true,
    };

    game.addPlayer(ai);
    const savedAi = game.getPlayers()[0];
    expect(savedAi.type).toBe(PlayerType.AI);
    expect(savedAi.difficulty).toBe(Difficulty.HARD);
  });
});
