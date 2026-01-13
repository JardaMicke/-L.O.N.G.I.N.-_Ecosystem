import { Tilemap } from '../../src/world/tilemap';
import { MapEditor } from '../../src/tools/map-editor';

// Mock fetch globally
global.fetch = jest.fn();

describe('Map Editor Integration', () => {
  let tilemap: Tilemap;
  let mapEditor: MapEditor;

  beforeEach(() => {
    tilemap = new Tilemap(10, 10, 32); // 10x10 map, 32px tiles
    mapEditor = new MapEditor(tilemap);
    jest.clearAllMocks();
  });

  test('should modify tiles on default layer', () => {
    mapEditor.setTileId(1);
    mapEditor.setTool('brush');
    mapEditor.applyAction(0, 0); // Set tile at 0,0 to 1

    const tileId = tilemap.getTileId('default', 0, 0);
    expect(tileId).toBe(1);
  });

  test('should undo changes', () => {
    mapEditor.setTileId(1);
    mapEditor.setTool('brush');
    mapEditor.applyAction(0, 0);
    
    expect(tilemap.getTileId('default', 0, 0)).toBe(1);
    
    mapEditor.undo();
    expect(tilemap.getTileId('default', 0, 0)).toBe(0); // 0 is default/empty
  });

  test('should save map via API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'map_123' })
    });

    const result = await mapEditor.saveMap('Test Map', 'Tester');
    
    expect(result).toBe('map_123');
    expect(global.fetch).toHaveBeenCalledWith('/api/maps', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"name":"Test Map"')
    }));
  });

  test('should load map via API', async () => {
    const mockMapData = {
      id: 'map_123',
      name: 'Loaded Map',
      width: 10,
      height: 10,
      tileSize: 32,
      layers: [
        {
          name: 'default',
          visible: true,
          data: Array(10).fill(Array(10).fill(2)) // Fill with tile ID 2
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMapData
    });

    const success = await mapEditor.loadMap('map_123');
    
    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/maps/map_123');
    expect(tilemap.getTileId('default', 0, 0)).toBe(2);
  });
});
