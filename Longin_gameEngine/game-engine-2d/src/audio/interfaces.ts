/**
 * Configuration for the global audio system.
 */
export interface AudioConfig {
  /** Master volume level (0.0 to 1.0) */
  masterVolume: number;
  /** Sound effects volume level (0.0 to 1.0) */
  sfxVolume: number;
  /** Music volume level (0.0 to 1.0) */
  musicVolume: number;
  /** Whether audio is globally muted */
  muted: boolean;
}

/**
 * Definition of an audio track or sound effect.
 */
export interface AudioTrack {
  /** Unique key identifier for the sound */
  key: string;
  /** Path to the audio file */
  src: string;
  /** Whether the sound should loop automatically */
  loop?: boolean;
  /** Default volume for this specific track */
  volume?: number;
  /** Whether to play immediately on load */
  autoplay?: boolean;
  /** Sprite definition for audio sprites (key: [start, duration]) */
  sprite?: { [key: string]: [number, number] };
}
