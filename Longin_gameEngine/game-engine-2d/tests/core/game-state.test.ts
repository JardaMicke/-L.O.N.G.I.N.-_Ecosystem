import { Engine } from '../../src/core/engine';
import { GameStateManager, State } from '../../src/core/game-state';

// Mock Logger
jest.mock('../../src/utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    initialize: jest.fn(),
  },
}));

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;
  let mockEngine: Engine;

  beforeEach(() => {
    mockEngine = {} as Engine;
    gameStateManager = new GameStateManager(mockEngine);
  });

  test('should register states', () => {
    const state: State = {
      name: 'menu',
      onEnter: jest.fn(),
      onExit: jest.fn(),
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    };

    gameStateManager.registerState(state);
    // Access private member for testing or try to switch to check if it works
    gameStateManager.switchState('menu');
    expect(gameStateManager.getCurrentState()).toBe('menu');
  });

  test('should switch states correctly', () => {
    const menuState: State = {
      name: 'menu',
      onEnter: jest.fn(),
      onExit: jest.fn(),
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    };

    const gameState: State = {
      name: 'game',
      onEnter: jest.fn(),
      onExit: jest.fn(),
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    };

    gameStateManager.registerState(menuState);
    gameStateManager.registerState(gameState);

    gameStateManager.switchState('menu');
    expect(menuState.onEnter).toHaveBeenCalledWith(mockEngine);
    expect(gameStateManager.getCurrentState()).toBe('menu');

    gameStateManager.switchState('game');
    expect(menuState.onExit).toHaveBeenCalledWith(mockEngine);
    expect(gameState.onEnter).toHaveBeenCalledWith(mockEngine);
    expect(gameStateManager.getCurrentState()).toBe('game');
  });

  test('should update current state', () => {
    const state: State = {
      name: 'test',
      onEnter: jest.fn(),
      onExit: jest.fn(),
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    };

    gameStateManager.registerState(state);
    gameStateManager.switchState('test');

    const deltaTime = 0.016;
    gameStateManager.update(deltaTime);

    expect(state.onUpdate).toHaveBeenCalledWith(mockEngine, deltaTime);
  });

  test('should render current state', () => {
    const state: State = {
      name: 'test',
      onEnter: jest.fn(),
      onExit: jest.fn(),
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    };

    gameStateManager.registerState(state);
    gameStateManager.switchState('test');

    const interpolation = 0.5;
    gameStateManager.render(interpolation);

    expect(state.onRender).toHaveBeenCalledWith(mockEngine, interpolation);
  });

  test('should handle missing state switch', () => {
    gameStateManager.switchState('non-existent');
    expect(gameStateManager.getCurrentState()).toBeNull();
  });
});
