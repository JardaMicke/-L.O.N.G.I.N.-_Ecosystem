import { MapEditor } from '../../src/tools/map-editor';
import { Tilemap } from '../../src/world/tilemap';

describe('MapEditor', () => {
  let tilemap: Tilemap;
  let editor: MapEditor;

  beforeEach(() => {
    tilemap = new Tilemap(10, 10, 32);
    tilemap.registerTile(1, { id: 1, type: 'wall', walkable: false });
    tilemap.registerTile(2, { id: 2, type: 'water', walkable: false });
    editor = new MapEditor(tilemap);
  });

  it('should initialize with default settings', () => {
    expect(editor).toBeDefined();
    // Access private via cast if needed, or trust functionality
  });

  it('should paint with brush', () => {
    editor.setTileId(1);
    editor.applyAction(1, 1);
    expect(tilemap.getTileId('default', 1, 1)).toBe(1);
  });

  it('should erase tiles', () => {
    tilemap.setTile('default', 1, 1, 1);
    editor.setTool('eraser');
    editor.applyAction(1, 1);
    expect(tilemap.getTileId('default', 1, 1)).toBe(0);
  });

  it('should flood fill', () => {
    // Create a box of 1s
    /*
          1 1 1
          1 0 1
          1 1 1
        */
    // Actually simpler: fill a 3x3 area of 0s with 1s.
    editor.setTileId(1);
    editor.setTool('fill');
    editor.applyAction(0, 0); // Fill the whole empty map

    expect(tilemap.getTileId('default', 0, 0)).toBe(1);
    expect(tilemap.getTileId('default', 9, 9)).toBe(1);
  });

  it('should undo and redo actions', () => {
    editor.setTileId(1);
    editor.applyAction(1, 1);
    expect(tilemap.getTileId('default', 1, 1)).toBe(1);

    editor.undo();
    expect(tilemap.getTileId('default', 1, 1)).toBe(0);

    editor.redo();
    expect(tilemap.getTileId('default', 1, 1)).toBe(1);
  });

  it('should undo flood fill', () => {
    editor.setTileId(1);
    editor.setTool('fill');
    editor.applyAction(0, 0);
    expect(tilemap.getTileId('default', 5, 5)).toBe(1);

    editor.undo();
    expect(tilemap.getTileId('default', 5, 5)).toBe(0);
  });
});
