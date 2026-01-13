import { Engine } from './core/engine';
import { EngineFactory } from './core/engine-factory';
import { LobbyState } from './game/states/lobby-state';
import { MenuState } from './game/states/menu-state';
import { ProjectSelectionState } from './game/states/project-selection-state';
import { PlayState } from './game/states/play-state';
import { EditorState } from './game/states/editor-state';
import { MobileControls } from './ui/mobile-controls';
import { TouchHandler } from './ui/touch-handler';
import { Logger } from './utils/logger';

// Ensure correct viewport for mobile
function setupViewport() {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.appendChild(meta);
  }
  // Prevent zooming and ensure full width
  meta.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
  );
}

// Entry point for the browser
document.addEventListener('DOMContentLoaded', () => {
  Logger.info('Starting Game Client...');

  setupViewport();

  // Use Factory to create Engine with all dependencies injected
  const engine = EngineFactory.createEngine();

  // Register States
  const menuState = new MenuState();
  const projectState = new ProjectSelectionState();
  const lobbyState = new LobbyState();
  const playState = new PlayState();
  const editorState = new EditorState();

  engine.gameStateManager.registerState(menuState);
  engine.gameStateManager.registerState(projectState);
  engine.gameStateManager.registerState(lobbyState);
  engine.gameStateManager.registerState(playState);
  engine.gameStateManager.registerState(editorState);

  // Initialize Engine (Renderer, Input, Network)
  // Assuming we have a canvas with id 'game-canvas'
  engine.initialize('game-canvas');

  // Initialize Mobile Controls
  const touchHandler = new TouchHandler();
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    touchHandler.initialize(canvas);
  }

  const mobileControls = new MobileControls(engine.inputHandler);
  mobileControls.initialize();

  // Switch to initial state
  engine.gameStateManager.switchState('Menu');

  // Start Game Loop
  engine.gameLoop.start();
});
