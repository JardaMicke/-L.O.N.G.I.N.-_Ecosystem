import { Logger } from '../utils/logger';

/**
 * Class representing a rendering layer.
 * Layers are used to control the drawing order of entities and UI elements.
 */
export class Layer {
  /** Layer name (unique identifier) */
  public name: string;
  
  /** 
   * Z-index for sorting. 
   * Lower values are drawn first (background), higher values are drawn last (foreground/UI).
   */
  public zIndex: number;
  
  /** Whether the layer is visible and should be rendered */
  public visible: boolean = true;
  
  /**
   * Creates a new Layer.
   * 
   * @param {string} name - The unique name of the layer.
   * @param {number} zIndex - The z-index for sorting order.
   */
  constructor(name: string, zIndex: number) {
    this.name = name;
    this.zIndex = zIndex;
  }
}

/**
 * Manager for handling rendering layers.
 * Allows adding, retrieving, and sorting layers to control render order.
 * 
 * @example
 * ```typescript
 * const layerManager = new LayerManager();
 * layerManager.addLayer('particles', 5);
 * const sortedLayers = layerManager.getLayers();
 * ```
 */
export class LayerManager {
  private layers: Layer[];

  /**
   * Creates a new LayerManager and initializes default layers.
   * Default layers: 'background' (-10), 'default' (0), 'ui' (10).
   */
  constructor() {
    this.layers = [];
    // Default layers
    this.addLayer('background', -10);
    this.addLayer('default', 0);
    this.addLayer('ui', 10);
  }

  /**
   * Adds a new layer.
   * 
   * @param {string} name - Layer name.
   * @param {number} zIndex - Z-index.
   */
  public addLayer(name: string, zIndex: number): void {
    const layer = new Layer(name, zIndex);
    this.layers.push(layer);
    this.sortLayers();
    Logger.info(`Layer added: ${name} (zIndex: ${zIndex})`);
  }

  /**
   * Retrieves a layer by name.
   * 
   * @param {string} name - Layer name.
   * @returns {Layer | undefined} The layer, or undefined if not found.
   */
  public getLayer(name: string): Layer | undefined {
    return this.layers.find((l) => l.name === name);
  }

  /**
   * Returns all layers.
   * 
   * @returns {Layer[]} Array of layers.
   */
  public getLayers(): Layer[] {
    return this.layers;
  }

  /**
   * Sorts layers by zIndex in ascending order.
   */
  private sortLayers(): void {
    this.layers.sort((a, b) => a.zIndex - b.zIndex);
  }
}
