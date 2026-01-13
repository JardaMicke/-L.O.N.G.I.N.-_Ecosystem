import { Camera } from '../graphics/camera';
import { Logger } from '../utils/logger';
import { Tilemap } from '../world/tilemap';

import { Engine } from './engine';

/**
 * Interface representing a game state (e.g., MainMenu, Gameplay, Pause).
 * Defines lifecycle methods for state transitions and updates.
 */
export interface State {
  /** Unique name of the state */
  name: string;
  /** Called when the state is entered */
  onEnter(engine: Engine): void;
  /** Called when the state is exited */
  onExit(engine: Engine): void;
  /** Called every frame to update logic */
  onUpdate(engine: Engine, deltaTime: number): void;
  /** Called every frame to render */
  onRender(engine: Engine, interpolation: number): void;
  /** Optional: Returns the active camera for this state */
  getCamera?(): Camera | null;
  /** Optional: Returns the active tilemap for this state */
  getTilemap?(): Tilemap | null;
  /** Optional: Sets the tilemap for this state */
  setTilemap?(tilemap: Tilemap): void;
}

/**
 * Manager for handling game states.
 * Allows registering states and switching between them.
 * Delegates update and render calls to the current state.
 */
export class GameStateManager {
  private states: Map<string, State>;
  private currentState: State | null = null;
  private engine: Engine;

  /**
   * Creates a new GameStateManager.
   * 
   * @param {Engine} engine - The engine instance.
   */
  constructor(engine: Engine) {
    this.engine = engine;
    this.states = new Map();
  }

  /**
   * Registers a new game state.
   * 
   * @param {State} state - The state to register.
   */
  public registerState(state: State): void {
    this.states.set(state.name, state);
  }

  /**
   * Switches to a registered state.
   * Calls onExit() on the current state and onEnter() on the new state.
   * 
   * @param {string} name - The name of the state to switch to.
   */
  public switchState(name: string): void {
    if (!this.states.has(name)) {
      Logger.error(`GameStateManager: State ${name} not found`);
      return;
    }

    if (this.currentState) {
      this.currentState.onExit(this.engine);
    }

    this.currentState = this.states.get(name)!;
    this.currentState.onEnter(this.engine);
    Logger.info(`GameStateManager: Switched to state ${name}`);
  }

  /**
   * Updates the current state.
   * 
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(deltaTime: number): void {
    if (this.currentState) {
      this.currentState.onUpdate(this.engine, deltaTime);
    }
  }

  /**
   * Renders the current state.
   * 
   * @param {number} interpolation - Interpolation factor for smooth rendering.
   */
  public render(interpolation: number): void {
    if (this.currentState) {
      this.currentState.onRender(this.engine, interpolation);
    }
  }

  /**
   * Gets the name of the current state.
   * 
   * @returns {string | null} The name of the current state, or null if none.
   */
  public getCurrentState(): string | null {
    return this.currentState ? this.currentState.name : null;
  }

  /**
   * Gets the active camera from the current state.
   * 
   * @returns {Camera | null} The active camera, or null.
   */
  public getCurrentCamera(): Camera | null {
    return this.currentState && this.currentState.getCamera ? this.currentState.getCamera() : null;
  }

  /**
   * Gets the active tilemap from the current state.
   * 
   * @returns {Tilemap | null} The active tilemap, or null.
   */
  public getCurrentTilemap(): Tilemap | null {
    return this.currentState && this.currentState.getTilemap
      ? this.currentState.getTilemap()
      : null;
  }

  /**
   * Sets the tilemap for the current state.
   * 
   * @param {Tilemap} tilemap - The tilemap to set.
   */
  public setTilemap(tilemap: Tilemap): void {
    if (this.currentState && this.currentState.setTilemap) {
      this.currentState.setTilemap(tilemap);
    }
  }
}
