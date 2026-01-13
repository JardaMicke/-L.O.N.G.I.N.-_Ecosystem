import { EditorCore, EditorTool } from '../../src/editor/editor-core';
import { TilePainter } from '../../src/editor/tools/tile-painter';
import { ChunkManager } from '../../src/world/chunk-manager';
import { Chunk } from '../../src/world/chunk';

// Mock ChunkManager
jest.mock('../../src/world/chunk-manager');

describe('EditorCore', () => {
    it('should be a singleton', () => {
        const instance1 = EditorCore.getInstance();
        const instance2 = EditorCore.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should toggle state', () => {
        const editor = EditorCore.getInstance();
        editor.toggle(true);
        expect(editor.isActive).toBe(true);
        editor.toggle(false);
        expect(editor.isActive).toBe(false);
    });

    it('should switch tools', () => {
        const editor = EditorCore.getInstance();
        editor.setTool(EditorTool.BRUSH);
        expect(editor.activeTool).toBe(EditorTool.BRUSH);
    });
});

describe('TilePainter', () => {
    it('should paint on valid chunk', () => {
        const chunkManager = new ChunkManager();
        const chunk = new Chunk(0, 0);
        // data usually initialized in constructor

        // Mock getChunkAtWorldPos
        (chunkManager.getChunkAtWorldPos as jest.Mock).mockReturnValue(chunk);

        const painter = new TilePainter(chunkManager);
        const editor = EditorCore.getInstance();
        editor.setTool(EditorTool.BRUSH);
        painter.activeTileId = 99;
        painter.activeLayer = 0;

        painter.onMouseDown(10, 10);

        expect(chunk.getTile(0, 10, 10)).toBe(99);
    });
});
