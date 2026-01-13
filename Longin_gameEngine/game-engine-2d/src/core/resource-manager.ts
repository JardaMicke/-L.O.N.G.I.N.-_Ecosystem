import { Howl } from 'howler';
import { AudioManager } from '../audio/audio-manager';
import { Logger } from '../utils/logger';

/**
 * Manages loading, caching, and retrieval of game assets (images, audio, JSON).
 * Provides a central place to access resources and ensures they are loaded only once.
 */
export class ResourceManager {
  private images: Map<string, HTMLImageElement>;
  // Sounds are managed by AudioManager, but we keep a reference here for consistency if needed
  // or just delegate. Let's delegate.
  private data: Map<string, any>;

  constructor() {
    this.images = new Map();
    this.data = new Map();
  }

  /**
   * Loads an image from a URL and caches it.
   * If the image is already loaded, returns the cached version.
   *
   * @param {string} key - Unique identifier for the image.
   * @param {string} url - URL path to the image file.
   * @returns {Promise<HTMLImageElement>} Promise resolving to the loaded image element.
   */
  public async loadImage(key: string, url: string): Promise<HTMLImageElement> {
    if (this.images.has(key)) {
      return this.images.get(key)!;
    }

    return new Promise((resolve, reject) => {
      if (typeof Image === 'undefined') {
        // Node.js fallback or mock
        Logger.warn('ResourceManager: Image loading not supported in this environment');
        const mockImg = { src: url, width: 0, height: 0 } as any;
        this.images.set(key, mockImg);
        resolve(mockImg);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        Logger.info(`Loaded image: ${key}`);
        resolve(img);
      };
      img.onerror = (err) => {
        Logger.error(`Failed to load image: ${url}`, new Error(String(err)));
        reject(err);
      };
      img.src = url;
    });
  }

  /**
   * Loads a sound file via the AudioManager.
   *
   * @param {string} key - Unique identifier for the sound.
   * @param {string} url - URL path to the audio file.
   * @returns {Promise<Howl>} Promise resolving to the Howl instance.
   */
  public async loadSound(key: string, url: string): Promise<Howl> {
    return AudioManager.getInstance().loadSound(key, url);
  }

  /**
   * Loads a JSON file from a URL.
   *
   * @template T
   * @param {string} key - Unique identifier for the data.
   * @param {string} url - URL path to the JSON file.
   * @returns {Promise<T>} Promise resolving to the parsed JSON data.
   */
  public async loadJSON<T = any>(key: string, url: string): Promise<T> {
    if (this.data.has(key)) {
      return this.data.get(key);
    }

    try {
      // Use fetch if available (Browser/Node 18+)
      const response = await fetch(url);
      const json = await response.json();
      this.data.set(key, json);
      Logger.info(`Loaded JSON: ${key}`);
      return json;
    } catch (error) {
      Logger.error(`Failed to load JSON: ${url}`, error as Error);
      throw error;
    }
  }

  /**
   * Retrieves a cached image.
   * @param {string} key - The image identifier.
   * @returns {HTMLImageElement | undefined} The image or undefined if not found.
   */
  public getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  /**
   * Retrieves a sound instance from AudioManager.
   * @param {string} key - The sound identifier.
   * @returns {Howl | undefined} The sound instance.
   */
  public getSound(key: string): Howl | undefined {
    return AudioManager.getInstance().getSound(key);
  }

  /**
   * Retrieves cached data (JSON).
   * @template T
   * @param {string} key - The data identifier.
   * @returns {T | undefined} The data or undefined.
   */
  public getData<T>(key: string): T | undefined {
    return this.data.get(key);
  }

  /**
   * Clears all cached resources (images and data).
   */
  public clear(): void {
    this.images.clear();
    this.data.clear();
  }
}
