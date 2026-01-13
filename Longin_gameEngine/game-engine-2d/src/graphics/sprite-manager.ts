import { ResourceManager } from '../core/resource-manager';
import { Logger } from '../utils/logger';

/**
 * Represents a 2D point coordinate.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Metadata associated with a sprite or asset.
 */
export interface SpriteMetadata {
  /** Defines walkable areas within the sprite (for navigation). */
  walkableZones?: Point[][];
  /** List of alternative asset IDs for this sprite. */
  variants?: string[]; // Asset IDs for variants
  /** Probabilities (0-1) for selecting each variant. */
  variantWeights?: number[]; // Probabilities (0-1)
  /** Height of the accessible space (1-10). Default is 1. */
  accessibleHeight?: number;
  /** Maximum configurable height for this asset. Default is 10. */
  maxAccessibleHeight?: number;
  /** Binding of Action Types to Animation Names. */
  actionBindings?: Record<string, string>;
}

/**
 * Defines a single frame within a sprite sheet.
 */
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Defines an animation sequence.
 */
export interface AnimationDefinition {
  name: string;
  frames: SpriteFrame[]; // Can be indices or rects. Using rects for flexibility.
  frameRate: number; // Frames per second
  loop: boolean;
  metadata?: SpriteMetadata;
}

/**
 * Represents a sprite sheet containing multiple frames and animations.
 */
export interface SpriteSheet {
  imageId: string;
  frameWidth: number;
  frameHeight: number;
  animations: Map<string, AnimationDefinition>;
}

/**
 * Manages sprite sheets, animations, and asset metadata.
 * Handles extracting frames from sprite sheets and resolving sprite variants.
 */
export class SpriteManager {
  private resourceManager: ResourceManager;
  private spriteSheets: Map<string, SpriteSheet>;
  private assetMetadata: Map<string, SpriteMetadata>;

  /**
   * Creates a new SpriteManager.
   * @param {ResourceManager} resourceManager - Reference to the ResourceManager for loading images.
   */
  constructor(resourceManager: ResourceManager) {
    this.resourceManager = resourceManager;
    this.spriteSheets = new Map();
    this.assetMetadata = new Map();
  }

  /**
   * Registers metadata for a specific asset ID.
   * @param {string} id - The asset ID.
   * @param {SpriteMetadata} metadata - The metadata object.
   */
  public registerAssetMetadata(id: string, metadata: SpriteMetadata): void {
    this.assetMetadata.set(id, metadata);
  }

  /**
   * Retrieves metadata for an asset.
   * @param {string} id - The asset ID.
   * @returns {SpriteMetadata | undefined} The metadata or undefined.
   */
  public getAssetMetadata(id: string): SpriteMetadata | undefined {
    return this.assetMetadata.get(id);
  }

  /**
   * Resolves a variant for a given asset ID based on a seed.
   * Ensures consistency: same seed always returns same variant.
   *
   * @param {string} id - The base asset ID.
   * @param {number} seed - Seed value for deterministic random selection.
   * @returns {string} The resolved asset ID (variant or original).
   */
  public resolveVariant(id: string, seed: number): string {
    const metadata = this.assetMetadata.get(id);
    if (!metadata || !metadata.variants || metadata.variants.length === 0) {
      return id;
    }

    // Deterministic random using sine of seed
    const rand = Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
    
    // If weights are provided
    if (metadata.variantWeights && metadata.variantWeights.length === metadata.variants.length) {
      let sum = 0;
      for (let i = 0; i < metadata.variantWeights.length; i++) {
        sum += metadata.variantWeights[i];
        if (rand < sum) {
          return metadata.variants[i];
        }
      }
      return metadata.variants[metadata.variants.length - 1];
    }

    // Uniform distribution
    const index = Math.floor(rand * metadata.variants.length);
    return metadata.variants[index];
  }

  /**
   * Registers a new sprite sheet.
   *
   * @param {string} id - Unique identifier for the sprite sheet.
   * @param {string} imageId - Resource ID of the source image.
   * @param {number} frameWidth - Width of a single frame.
   * @param {number} frameHeight - Height of a single frame.
   */
  public registerSpriteSheet(
    id: string,
    imageId: string,
    frameWidth: number,
    frameHeight: number,
  ): void {
    this.spriteSheets.set(id, {
      imageId,
      frameWidth,
      frameHeight,
      animations: new Map(),
    });
    Logger.info(`Registered spritesheet: ${id}`);
  }

  /**
   * Creates an animation from a grid of frames.
   *
   * @param {string} sheetId - The ID of the sprite sheet.
   * @param {string} name - Name of the animation.
   * @param {number[]} frameIndices - Array of frame indices (0-based).
   * @param {number} columns - Number of columns in the grid.
   * @param {number} [frameRate=10] - Playback speed in fps.
   * @param {boolean} [loop=true] - Whether the animation should loop.
   */
  public createAnimationFromGrid(
    sheetId: string,
    name: string,
    frameIndices: number[],
    columns: number,
    frameRate: number = 10,
    loop: boolean = true,
  ): void {
    const sheet = this.spriteSheets.get(sheetId);
    if (!sheet) {
      Logger.error(`SpriteSheet ${sheetId} not found`);
      return;
    }

    const frames: SpriteFrame[] = frameIndices.map((index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        x: col * sheet.frameWidth,
        y: row * sheet.frameHeight,
        width: sheet.frameWidth,
        height: sheet.frameHeight,
      };
    });

    this.defineAnimation(sheetId, name, frames, frameRate, loop);
  }

  /**
   * Defines a custom animation with explicit frames.
   *
   * @param {string} sheetId - The sprite sheet ID.
   * @param {string} name - Animation name.
   * @param {SpriteFrame[]} frames - Array of frame definitions.
   * @param {number} [frameRate=10] - FPS.
   * @param {boolean} [loop=true] - Looping.
   * @param {SpriteMetadata} [metadata] - Optional metadata.
   */
  public defineAnimation(
    sheetId: string,
    name: string,
    frames: SpriteFrame[],
    frameRate: number = 10,
    loop: boolean = true,
    metadata?: SpriteMetadata
  ): void {
    const sheet = this.spriteSheets.get(sheetId);
    if (!sheet) return;

    sheet.animations.set(name, {
      name,
      frames,
      frameRate,
      loop,
      metadata
    });
  }

  /**
   * Calculates the rectangle for a specific frame index in a sprite sheet.
   *
   * @param {string} sheetId - The sprite sheet ID.
   * @param {number} frameIndex - The index of the frame.
   * @returns {SpriteFrame | null} The frame rectangle or null if invalid.
   */
  public getFrameRect(sheetId: string, frameIndex: number): SpriteFrame | null {
    const sheet = this.spriteSheets.get(sheetId);
    if (!sheet) return null;

    const img = this.resourceManager.getImage(sheet.imageId);
    if (!img) return null; // Image not loaded yet

    const cols = Math.floor(img.width / sheet.frameWidth);
    const col = frameIndex % cols;
    const row = Math.floor(frameIndex / cols);

    return {
      x: col * sheet.frameWidth,
      y: row * sheet.frameHeight,
      width: sheet.frameWidth,
      height: sheet.frameHeight,
    };
  }

  /**
   * Gets the source image for a sprite sheet.
   * @param {string} sheetId - The sprite sheet ID.
   * @returns {HTMLImageElement | undefined} The image element.
   */
  public getImage(sheetId: string): HTMLImageElement | undefined {
    const sheet = this.spriteSheets.get(sheetId);
    return sheet ? this.resourceManager.getImage(sheet.imageId) : undefined;
  }

  /**
   * Retrieves the full sprite sheet definition.
   * @param {string} id - The sprite sheet ID.
   * @returns {SpriteSheet | undefined} The sprite sheet object.
   */
  public getSpriteSheet(id: string): SpriteSheet | undefined {
    return this.spriteSheets.get(id);
  }
}
