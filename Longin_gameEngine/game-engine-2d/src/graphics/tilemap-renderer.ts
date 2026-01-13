import { Tilemap } from '../world/tilemap';

import { Camera } from './camera';
import { Renderer } from './renderer';

/**
 * Helper class for rendering tilemaps.
 * Optimizes rendering by only drawing tiles visible within the camera viewport.
 */
export class TilemapRenderer {
  private renderer: Renderer;

  /**
   * Creates a new TilemapRenderer.
   * 
   * @param {Renderer} renderer - The renderer to use.
   */
  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  /**
   * Renders the tilemap.
   * Optimizes rendering by only drawing tiles visible within the camera viewport (culling).
   * 
   * @param {Tilemap} tilemap - The tilemap data to render.
   * @param {Camera} [camera] - The active camera for culling and transformation.
   * @returns {void}
   */
  public render(tilemap: Tilemap, camera?: Camera): void {
    const layerNames = tilemap.getLayerNames();
    const ctx = this.renderer.getContext();
    if (!ctx) return;

    // Viewport offset
    const offsetX = camera ? -camera.x : 0;
    const offsetY = camera ? -camera.y : 0;
    const zoom = camera ? camera.zoom : 1;

    // Determine visible range
    let startX = 0;
    let startY = 0;
    let endX = tilemap.width;
    let endY = tilemap.height;

    if (camera) {
      startX = Math.floor(camera.x / tilemap.tileSize);
      startY = Math.floor(camera.y / tilemap.tileSize);
      endX = startX + Math.ceil(camera.width / zoom / tilemap.tileSize) + 1;
      endY = startY + Math.ceil(camera.height / zoom / tilemap.tileSize) + 1;

      startX = Math.max(0, startX);
      startY = Math.max(0, startY);
      endX = Math.min(tilemap.width, endX);
      endY = Math.min(tilemap.height, endY);
    }

    ctx.save();

    // Apply camera transform
    // Note: If we use renderer.renderRect, it uses current ctx state.
    // We transform the context so we can draw in world coordinates.
    if (camera) {
      ctx.scale(zoom, zoom);
      ctx.translate(offsetX, offsetY);
    }

    for (const layerName of layerNames) {
      if (!tilemap.isLayerVisible(layerName)) continue;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const tile = tilemap.getTile(layerName, x, y);
          if (tile) {
            const px = x * tilemap.tileSize;
            const py = y * tilemap.tileSize;

            let color = '#ccc';
            if (tile.properties && tile.properties.color) {
              color = tile.properties.color;
            } else {
              // Fallback debug colors
              if (tile.type === 'wall') color = '#333';
              else if (tile.type === 'water') color = '#00f';
              else if (tile.type === 'grass') color = '#0f0';
            }

            this.renderer.renderRect(px, py, tilemap.tileSize, tilemap.tileSize, color);
          }
        }
      }
    }

    ctx.restore();
  }
}
