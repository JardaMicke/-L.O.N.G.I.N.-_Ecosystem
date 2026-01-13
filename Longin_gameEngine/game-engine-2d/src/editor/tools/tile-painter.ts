import { ChunkManager } from '../../world/chunk-manager';
import { EditorCore, EditorTool } from '../editor-core';
import { Logger } from '../../utils/logger';

export class TilePainter {
    private chunkManager: ChunkManager;
    private editorCore: EditorCore;

    public activeTileId: number = 1; // Default to grass or whatever
    public activeLayer: number = 0;

    constructor(chunkManager: ChunkManager) {
        this.chunkManager = chunkManager;
        this.editorCore = EditorCore.getInstance();
    }

    public onMouseDown(worldX: number, worldY: number): void {
        if (this.editorCore.activeTool !== EditorTool.BRUSH) return;
        this.paint(worldX, worldY);
    }

    public onMouseMove(worldX: number, worldY: number): void {
        if (this.editorCore.activeTool !== EditorTool.BRUSH) return;
        // Check if mouse is down (need input system integration)
        // For now assuming explicit calls
    }

    public paint(worldX: number, worldY: number): void {
        const chunk = this.chunkManager.getChunkAtWorldPos(worldX, worldY);
        if (chunk) {
            // Need to convert world to local chunk coords
            // This logic exists in ChunkManager, maybe expose it or replicate
            // Let's use ChunkManager to set tile if it exposed setTileAt
            // ChunkManager doesn't expose setTileAt yet, so we do it on chunk manually for now
            // But ChunkManager.getTileAt exists.

            // Calculating local coords:
            const size = 16; // Chunk.SIZE
            const localX = Math.floor(Math.abs((worldX % size + size) % size));
            const localY = Math.floor(Math.abs((worldY % size + size) % size));

            chunk.setTile(this.activeLayer, localX, localY, this.activeTileId);
            Logger.info(`Painted tile ${this.activeTileId} at ${worldX},${worldY}`);
        }
    }
}
