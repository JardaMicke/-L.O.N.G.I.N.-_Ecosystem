import { Logger } from '../utils/logger';

/**
 * Interface representing a single tile definition.
 */
export interface Tile {
  /** Unique identifier for the tile type */
  id: number;
  /** Descriptive type name (e.g., 'grass', 'wall') */
  type: string;
  /** Whether entities can walk on this tile */
  walkable: boolean;
  /** URL to the tile texture image */
  textureUrl?: string;
  /** Additional custom properties */
  properties?: Record<string, any>;
}

export interface TileLayer {
  name: string;
  data: number[][];
  visible: boolean;
}

/**
 * Manages tile-based game world data.
 * Handles multiple layers, tile definitions, and collision checks.
 */
export class Tilemap {
  /** Width of the map in tiles */
  public readonly width: number;
  /** Height of the map in tiles */
  public readonly height: number;
  /** Size of each tile in pixels (assumes square tiles) */
  public readonly tileSize: number;

  private layers: TileLayer[];
  private tileset: Map<number, Tile>;

  /**
   * Creates a new Tilemap.
   * 
   * @param {number} width - Map width in tiles.
   * @param {number} height - Map height in tiles.
   * @param {number} tileSize - Size of a tile side in pixels.
   */
  constructor(width: number, height: number, tileSize: number) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.layers = [];
    this.tileset = new Map();

    // Initialize default layer
    this.createLayer('default');
  }

  /**
   * Creates a new empty layer.
   * 
   * @param {string} name - The name of the layer.
   */
  public createLayer(name: string): void {
    if (this.layers.some(l => l.name === name)) {
      Logger.warn(`Tilemap: Layer ${name} already exists`);
      return;
    }
    const data = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(0)); // 0 = empty

    this.layers.push({
      name,
      data,
      visible: true
    });
  }

  public deleteLayer(name: string): void {
    const index = this.layers.findIndex(l => l.name === name);
    if (index !== -1) {
      this.layers.splice(index, 1);
    }
  }

  public renameLayer(oldName: string, newName: string): boolean {
    const layer = this.layers.find(l => l.name === oldName);
    if (layer && !this.layers.some(l => l.name === newName)) {
      layer.name = newName;
      return true;
    }
    return false;
  }

  public moveLayer(name: string, direction: 'up' | 'down'): void {
    const index = this.layers.findIndex(l => l.name === name);
    if (index === -1) return;

    if (direction === 'up' && index < this.layers.length - 1) {
      // Swap with next
      const temp = this.layers[index];
      this.layers[index] = this.layers[index + 1];
      this.layers[index + 1] = temp;
    } else if (direction === 'down' && index > 0) {
      // Swap with prev
      const temp = this.layers[index];
      this.layers[index] = this.layers[index - 1];
      this.layers[index - 1] = temp;
    }
  }

  public setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.layers.find(l => l.name === name);
    if (layer) {
      layer.visible = visible;
    }
  }

  public isLayerVisible(name: string): boolean {
    const layer = this.layers.find(l => l.name === name);
    return layer ? layer.visible : false;
  }

  /**
   * Registers a tile definition.
   * 
   * @param {number} id - The unique tile ID.
   * @param {Tile} tile - The tile definition object.
   */
  public registerTile(id: number, tile: Tile): void {
    this.tileset.set(id, tile);
  }

  public getTiles(): Tile[] {
    return Array.from(this.tileset.values());
  }

  /**
   * Sets a specific tile at the given coordinates on a layer.
   * 
   * @param {string} layerName - The target layer.
   * @param {number} x - The x-coordinate (in tiles).
   * @param {number} y - The y-coordinate (in tiles).
   * @param {number} tileId - The ID of the tile to place.
   */
  public setTile(layerName: string, x: number, y: number, tileId: number): void {
    if (!this.isValidCoordinate(x, y)) {
      Logger.warn(`Tilemap: Invalid coordinate (${x}, ${y})`);
      return;
    }

    const layer = this.layers.find(l => l.name === layerName);
    if (!layer) {
      Logger.warn(`Tilemap: Layer ${layerName} not found`);
      return;
    }

    layer.data[y][x] = tileId;
  }

  /**
   * Gets the tile ID at the given coordinates.
   * 
   * @param {string} layerName - The source layer.
   * @param {number} x - The x-coordinate (in tiles).
   * @param {number} y - The y-coordinate (in tiles).
   * @returns {number | null} The tile ID, or null if invalid or layer missing.
   */
  public getTileId(layerName: string, x: number, y: number): number | null {
    if (!this.isValidCoordinate(x, y)) return null;

    const layer = this.layers.find(l => l.name === layerName);
    if (!layer) return null;

    return layer.data[y][x];
  }

  public getLayerNames(): string[] {
    return this.layers.map(l => l.name);
  }

  public getLayerData(layerName: string): number[][] | null {
    const layer = this.layers.find(l => l.name === layerName);
    return layer ? layer.data : null;
  }

  /**
   * Gets the tile definition at the given coordinates.
   * 
   * @param {string} layerName - The source layer.
   * @param {number} x - The x-coordinate (in tiles).
   * @param {number} y - The y-coordinate (in tiles).
   * @returns {Tile | undefined} The tile definition, or undefined if empty/invalid.
   */
  public getTile(layerName: string, x: number, y: number): Tile | undefined {
    const id = this.getTileId(layerName, x, y);
    if (id === null || id === 0) return undefined;
    return this.tileset.get(id);
  }

  /**
   * Gets the tile definition at the given pixel coordinates.
   * Useful for converting mouse clicks or entity positions to tiles.
   * 
   * @param {string} layerName - The source layer.
   * @param {number} pixelX - The x-coordinate in pixels.
   * @param {number} pixelY - The y-coordinate in pixels.
   * @returns {Tile | undefined} The tile definition.
   */
  public getTileAtPixel(layerName: string, pixelX: number, pixelY: number): Tile | undefined {
    const x = Math.floor(pixelX / this.tileSize);
    const y = Math.floor(pixelY / this.tileSize);
    return this.getTile(layerName, x, y);
  }

  /**
   * Checks if a specific coordinate is walkable.
   * Checks all layers; if any layer has a non-walkable tile, the spot is blocked.
   * 
   * @param {number} x - The x-coordinate (in tiles).
   * @param {number} y - The y-coordinate (in tiles).
   * @returns {boolean} True if walkable, false otherwise.
   */
  public isWalkable(x: number, y: number): boolean {
    if (!this.isValidCoordinate(x, y)) return false;

    for (const layer of this.layers) {
      if (!layer.visible) continue;

      const tileId = layer.data[y][x];
      if (tileId !== 0) {
        const tile = this.tileset.get(tileId);
        // Default to walkable if not specified, but usually we want explicit
        if (tile && tile.walkable === false) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Generates collision bodies for all non-walkable tiles.
   * Useful for initializing the Physics System at chunk load.
   * @param createBodyCallback Function to create a physics body in the physics world
   * @returns Array of created body references (simulated)
   */
  public generateColliders(createBodyCallback: (x: number, y: number, w: number, h: number) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.isWalkable(x, y)) {
          // Create a static body at this location
          // Coords are top-left of tile converted to world space implicitly by caller usually,
          // or we pass tile coords. Here we pass world pixel coords assuming usage.
          createBodyCallback(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
      }
    }
  }

  /**
   * Serializes the tilemap to a JSON-compatible object.
   * 
   * @returns {any} Serialized tilemap data.
   */
  public toJSON(): any {
    return {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      layers: this.layers,
      tileset: Array.from(this.tileset.entries()),
    };
  }

  /**
   * Deserializes a Tilemap from a JSON object.
   * 
   * @param {any} data - The serialized data.
   * @returns {Tilemap} The reconstructed Tilemap instance.
   */
  public static fromJSON(data: any): Tilemap {
    const tilemap = new Tilemap(data.width, data.height, data.tileSize);

    // Restore tileset
    if (data.tileset) {
      for (const [id, tile] of data.tileset) {
        tilemap.registerTile(id, tile);
      }
    }

    // Restore layers
    // Clear default layer created in constructor
    tilemap.layers = [];

    if (data.layers) {
      if (Array.isArray(data.layers)) {
        // New format: Layer[]
        tilemap.layers = data.layers;
      } else {
        // Old format: [string, number[][]][]
        for (const [name, layerData] of data.layers) {
          tilemap.layers.push({
            name,
            data: layerData,
            visible: true
          });
        }
      }
    }

    return tilemap;
  }

  /**
   * Validates if the coordinates are within the map bounds.
   * 
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {boolean} True if valid.
   */
  private isValidCoordinate(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
