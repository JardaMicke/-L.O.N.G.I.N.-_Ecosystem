import { EventSystem } from '../../src/core/event-system';
import { Game } from '../../src/game/core/game';
import { PlayerType } from '../../src/game/core/interfaces';
import { LobbyState } from '../../src/game/states/lobby-state';

// Mock dependencies
jest.mock('../../src/core/engine');
jest.mock('../../src/game/core/game');
jest.mock('../../src/core/event-system');
jest.mock('../../src/ui/button');
jest.mock('../../src/ui/text');

describe('LobbyState', () => {
  let lobbyState: LobbyState;
  let mockEngine: any;
  let mockGame: any;
  let mockEventSystem: any;

  beforeEach(() => {
    // Setup Mocks
    mockEventSystem = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    };
    (EventSystem.getInstance as jest.Mock).mockReturnValue(mockEventSystem);

    mockGame = {
      getPlayers: jest.fn().mockReturnValue([]),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      getInstance: jest.fn(),
    };
    (Game.getInstance as jest.Mock).mockReturnValue(mockGame);

    mockEngine = {
      uiManager: {
        clear: jest.fn(),
        addElement: jest.fn(),
        removeElement: jest.fn(),
      },
      eventSystem: mockEventSystem,
      deviceManager: {
        deviceType: 'desktop',
      },
      gameStateManager: {
        switchState: jest.fn(),
      },
    };

    lobbyState = new LobbyState();
  });

  test('should initialize local player if none exist on enter', () => {
    mockGame.getPlayers.mockReturnValue([]);

    lobbyState.onEnter(mockEngine);

    expect(mockGame.addPlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'local_player',
        type: PlayerType.HUMAN,
      }),
    );
  });

  test('should populate UI with player list', () => {
    const players = [
      { id: 'p1', name: 'Player 1', type: PlayerType.HUMAN, color: '#F00' },
      { id: 'p2', name: 'Bot 1', type: PlayerType.AI, color: '#0F0' },
    ];
    mockGame.getPlayers.mockReturnValue(players);

    lobbyState.onEnter(mockEngine);

    // Check if UI elements are added
    expect(mockEngine.uiManager.addElement).toHaveBeenCalled();

    // Calculation:
    // Title (1)
    // Back Button (1)
    // Player 1 (Human): Name, Color, TypeText (3)
    // Player 2 (AI): Name, Color, Diff, Remove (4)
    // AddAI (1)
    // Start (1)
    // Total = 11
    expect(mockEngine.uiManager.addElement).toHaveBeenCalledTimes(11);
  });

  test('should clear UI on exit', () => {
    lobbyState.onExit(mockEngine);
    expect(mockEngine.uiManager.clear).toHaveBeenCalled();
  });
});
