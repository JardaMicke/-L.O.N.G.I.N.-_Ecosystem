import { Howl, Howler } from 'howler';
import { Logger } from '../utils/logger';
import { AudioConfig, AudioTrack } from './interfaces';
import { ConfigManager } from '../core/config-manager';
import { EventSystem } from '../core/event-system';

/**
 * Singleton manager for handling audio playback.
 * Wraps Howler.js for sound effects and music.
 * Manages global volume, muting, and config integration.
 */
export class AudioManager {
  private static instance: AudioManager;
  private configManager: ConfigManager;
  private eventSystem: EventSystem;
  private sounds: Map<string, Howl>;
  private currentMusic: Howl | null = null;
  private currentMusicKey: string | null = null;

  /**
   * Private constructor for Singleton pattern.
   * Initializes listeners and sets initial volume.
   */
  constructor() {
    this.sounds = new Map();
    this.configManager = ConfigManager.getInstance();
    this.eventSystem = EventSystem.getInstance();

    this.setupConfigListeners();
    this.updateGlobalVolume();
  }

  /**
   * Gets the singleton instance of AudioManager.
   * 
   * @returns {AudioManager} The singleton instance.
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initializes the audio manager with optional configuration.
   * 
   * @param {Partial<AudioConfig>} config - Initial configuration overrides.
   */
  public init(config?: Partial<AudioConfig>): void {
    if (config) {
      if (config.masterVolume !== undefined) this.setMasterVolume(config.masterVolume);
      if (config.sfxVolume !== undefined) this.setSfxVolume(config.sfxVolume);
      if (config.musicVolume !== undefined) this.setMusicVolume(config.musicVolume);
      if (config.muted !== undefined) this.configManager.set('audio.muted', config.muted);
    }
    this.updateGlobalVolume();
    Logger.info('AudioManager initialized');
  }

  /**
   * Sets up listeners for configuration changes.
   */
  private setupConfigListeners(): void {
    this.eventSystem.on('config:changed', (data: { path: string, value: any }) => {
      if (data.path.startsWith('audio')) {
        this.updateGlobalVolume();

        if (data.path === 'audio.musicVolume' && this.currentMusic) {
          // We don't apply master volume here because Howler global volume handles it?
          // Actually Howler.volume() sets global volume. Individual sound volume is relative.
          // So music volume should be just musicVolume.
          this.currentMusic.volume(data.value);
        }
      }
    });
  }

  /**
   * Loads a sound file.
   * 
   * @param {string} key - Unique key for the sound.
   * @param {string} src - Path to the audio file.
   * @param {Partial<AudioTrack>} options - Playback options (loop, volume, etc.).
   * @returns {Promise<Howl>} Promise resolving to the loaded Howl instance.
   */
  public loadSound(key: string, src: string, options: Partial<AudioTrack> = {}): Promise<Howl> {
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [src],
        loop: options.loop || false,
        volume: options.volume || 1.0,
        autoplay: options.autoplay || false,
        sprite: options.sprite,
        onload: () => {
          Logger.info(`Audio loaded: ${key}`);
          resolve(sound);
        },
        onloaderror: (id: number, err: any) => {
          Logger.error(`Failed to load audio: ${key}`, new Error(String(err)));
          reject(err);
        },
      });
      this.sounds.set(key, sound);
    });
  }

  /**
   * Plays a sound effect.
   * 
   * @param {string} key - Key of the sound to play.
   * @param {number} volumeScale - Multiplier for the SFX volume (default: 1.0).
   * @returns {number | null} The sound ID or null if not found.
   */
  public playSfx(key: string, volumeScale: number = 1.0): number | null {
    const sound = this.sounds.get(key);
    if (!sound) {
      Logger.warn(`Sound not found: ${key}`);
      return null;
    }
    const id = sound.play();
    const sfxVolume = this.configManager.getConfig().audio.sfxVolume;
    sound.volume(sfxVolume * volumeScale, id);
    return id;
  }

  /**
   * Plays background music.
   * Handles cross-fading if music is already playing.
   * 
   * @param {string} key - Key of the music track.
   * @param {number} fadeDuration - Duration of cross-fade in ms (default: 1000).
   */
  public playMusic(key: string, fadeDuration: number = 1000): void {
    if (this.currentMusicKey === key) return;

    const newMusic = this.sounds.get(key);
    if (!newMusic) {
      Logger.warn(`Music not found: ${key}`);
      return;
    }

    if (this.currentMusic) {
      const oldMusic = this.currentMusic;
      oldMusic.fade(oldMusic.volume(), 0, fadeDuration);
      oldMusic.once('fade', () => {
        oldMusic.stop();
      });
    }

    this.currentMusic = newMusic;
    this.currentMusicKey = key;
    this.currentMusic.loop(true);
    this.currentMusic.volume(0);
    this.currentMusic.play();

    const musicVolume = this.configManager.getConfig().audio.musicVolume;
    this.currentMusic.fade(0, musicVolume, fadeDuration);
  }

  /**
   * Stops the currently playing music with a fade out.
   * 
   * @param {number} fadeDuration - Fade out duration in ms (default: 1000).
   */
  public stopMusic(fadeDuration: number = 1000): void {
    if (this.currentMusic) {
      const music = this.currentMusic;
      music.fade(music.volume(), 0, fadeDuration);
      music.once('fade', () => {
        music.stop();
        if (this.currentMusic === music) {
          this.currentMusic = null;
          this.currentMusicKey = null;
        }
      });
    }
  }

  /**
   * Sets the global master volume.
   * 
   * @param {number} vol - Volume level (0.0 to 1.0).
   */
  public setMasterVolume(vol: number): void {
    const value = Math.max(0, Math.min(1, vol));
    this.configManager.set('audio.masterVolume', value);
  }

  /**
   * Sets the music volume.
   * 
   * @param {number} vol - Volume level (0.0 to 1.0).
   */
  public setMusicVolume(vol: number): void {
    const value = Math.max(0, Math.min(1, vol));
    this.configManager.set('audio.musicVolume', value);
    // Note: Config listener will handle the actual volume update
  }

  /**
   * Sets the sound effects volume.
   * 
   * @param {number} vol - Volume level (0.0 to 1.0).
   */
  public setSfxVolume(vol: number): void {
    const value = Math.max(0, Math.min(1, vol));
    this.configManager.set('audio.sfxVolume', value);
  }

  /**
   * Toggles the global mute state.
   */
  public toggleMute(): void {
    const current = this.configManager.getConfig().audio.muted;
    this.configManager.set('audio.muted', !current);
  }

  /**
   * Updates global Howler settings based on configuration.
   */
  private updateGlobalVolume(): void {
    const config = this.configManager.getConfig().audio;
    // @ts-ignore
    Howler.volume(config.masterVolume);
    // @ts-ignore
    Howler.mute(config.muted);
  }

  /**
   * Retrieves a loaded sound object.
   * 
   * @param {string} key - The sound key.
   * @returns {Howl | undefined} The Howl instance or undefined.
   */
  public getSound(key: string): Howl | undefined {
    return this.sounds.get(key);
  }

  /**
   * Gets the current SFX volume setting.
   * 
   * @returns {number} Current SFX volume.
   */
  public getSfxVolume(): number {
    return this.configManager.getConfig().audio.sfxVolume;
  }

  /**
   * Gets the current music volume setting.
   * 
   * @returns {number} Current music volume.
   */
  public getMusicVolume(): number {
    return this.configManager.getConfig().audio.musicVolume;
  }
}
