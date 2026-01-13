import { Component } from '../ecs/component';

/**
 * Component that emits sound from an entity's position.
 * Used for spatial audio (attenuation, panning).
 */
export class AudioSourceComponent extends Component {
  public readonly name = 'AudioSource';
  
  /** Key of the sound to play */
  public soundKey: string;
  /** Base volume of the sound (0.0 to 1.0) */
  public volume: number;
  /** Whether the sound loops */
  public loop: boolean;
  /** Maximum distance at which the sound is audible */
  public range: number;
  
  /** Current playing state (internal use) */
  public isPlaying: boolean = false;
  /** ID of the currently playing sound instance (internal use) */
  public playId: number | null = null;

  /**
   * Creates a new AudioSourceComponent.
   * 
   * @param {string} soundKey - The key of the preloaded sound.
   * @param {number} range - Audible range in pixels (default: 500).
   * @param {number} volume - Volume level (default: 1.0).
   * @param {boolean} loop - Whether to loop (default: false).
   */
  constructor(soundKey: string, range: number = 500, volume: number = 1.0, loop: boolean = false) {
    super();
    this.soundKey = soundKey;
    this.range = range;
    this.volume = volume;
    this.loop = loop;
  }
}

/**
 * Component that marks an entity as the "ears" of the world.
 * Usually attached to the Player or Camera.
 * Used to calculate distance and panning for AudioSourceComponents.
 */
export class AudioListenerComponent extends Component {
  public readonly name = 'AudioListener';
  
  constructor() {
    super();
  }
}
