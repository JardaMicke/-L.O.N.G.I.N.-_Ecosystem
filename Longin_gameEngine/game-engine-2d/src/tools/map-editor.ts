import { Tilemap } from '../world/tilemap';

export type ToolType = 'brush' | 'eraser' | 'fill';

interface EditorAction {
  type: string;
  layer: string;
  changes: { x: number; y: number; oldId: number; newId: number }[];
}

export class MapEditor {
  public tilemap: Tilemap;
  private currentLayer: string = 'default';
  private currentTileId: number = 1;
  private currentTool: ToolType = 'brush';

  private undoStack: EditorAction[] = [];
  private redoStack: EditorAction[] = [];
  public currentMapId: string | null = null;
  private autosaveInterval: any = null;
  private mapCache: Map<string, any> = new Map();

  constructor(tilemap: Tilemap) {
    this.tilemap = tilemap;
  }

  public async saveMap(name: string, author: string = 'Anonymous'): Promise<string | null> {
    const layers = this.tilemap.getLayerNames().map(layerName => ({
      name: layerName,
      data: this.tilemap.getLayerData(layerName)!,
      visible: this.tilemap.isLayerVisible(layerName)
    }));

    const mapData = {
      id: this.currentMapId || undefined,
      name,
      author,
      width: this.tilemap.width,
      height: this.tilemap.height,
      tileSize: this.tilemap.tileSize,
      layers,
      version: 1
    };

    try {
      const response = await fetch(this.currentMapId ? `/api/maps/${this.currentMapId}` : '/api/maps', {
        method: this.currentMapId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapData)
      });

      if (response.ok) {
        const result = await response.json();
        const newId = result.id || this.currentMapId;
        this.currentMapId = newId;
        
        // Update cache
        this.mapCache.set(newId, { ...mapData, id: newId });
        
        console.log(`Map saved successfully: ${newId}`);
        return newId;
      } else {
        console.error('Failed to save map:', await response.text());
        return null;
      }
    } catch (e) {
      console.error('Error saving map:', e);
      return null;
    }
  }

  public async loadMap(id: string, forceReload: boolean = false): Promise<boolean> {
    try {
      let mapData: any;

      if (!forceReload && this.mapCache.has(id)) {
        console.log('Loading map from cache...');
        mapData = this.mapCache.get(id);
      } else {
        const response = await fetch(`/api/maps/${id}`);
        if (!response.ok) {
          console.error('Map not found');
          return false;
        }
        mapData = await response.json();
        this.mapCache.set(id, mapData);
      }
      
      // Check dimensions
      if (mapData.width !== this.tilemap.width || mapData.height !== this.tilemap.height) {
        console.warn('Map dimensions differ. Resize implementation pending. Loading what fits.');
      }

      // Apply layers
      mapData.layers.forEach((layer: any) => {
        // Create layer if missing
        if (!this.tilemap.getLayerNames().includes(layer.name)) {
          this.tilemap.createLayer(layer.name);
        }

        // Restore visibility
        if (layer.visible !== undefined) {
            this.tilemap.setLayerVisibility(layer.name, layer.visible);
        }
        
        const targetLayer = this.tilemap.getLayerData(layer.name);
        if (targetLayer) {
          for (let y = 0; y < Math.min(mapData.height, this.tilemap.height); y++) {
            for (let x = 0; x < Math.min(mapData.width, this.tilemap.width); x++) {
               targetLayer[y][x] = layer.data[y][x];
            }
          }
        }
      });

      this.currentMapId = mapData.id;
      console.log(`Map loaded: ${mapData.name}`);
      return true;
    } catch (e) {
      console.error('Error loading map:', e);
      return false;
    }
  }

  public startAutosave(intervalMs: number = 60000, name: string = 'Autosave'): void {
    if (this.autosaveInterval) clearInterval(this.autosaveInterval);
    this.autosaveInterval = setInterval(() => {
      if (this.currentMapId) {
        console.log('Autosaving...');
        this.saveMap(name, 'AutosaveSystem');
      }
    }, intervalMs);
  }

  public stopAutosave(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  }

  // Layer Management
  public createLayer(name: string): void {
    this.tilemap.createLayer(name);
    this.setLayer(name);
  }

  public deleteLayer(name: string): void {
    // Prevent deleting the last layer or current layer if it causes issues
    if (this.tilemap.getLayerNames().length <= 1) {
      console.warn('Cannot delete the last layer');
      return;
    }
    
    this.tilemap.deleteLayer(name);
    
    // If current layer deleted, switch to another
    if (this.currentLayer === name) {
      this.currentLayer = this.tilemap.getLayerNames()[0];
    }
  }

  public renameLayer(oldName: string, newName: string): boolean {
    const success = this.tilemap.renameLayer(oldName, newName);
    if (success && this.currentLayer === oldName) {
      this.currentLayer = newName;
    }
    return success;
  }

  public moveLayer(name: string, direction: 'up' | 'down'): void {
    this.tilemap.moveLayer(name, direction);
  }

  public toggleLayerVisibility(name: string): void {
    const isVisible = this.tilemap.isLayerVisible(name);
    this.tilemap.setLayerVisibility(name, !isVisible);
  }

  public setLayer(name: string): void {
    if (this.tilemap.getLayerNames().includes(name)) {
      this.currentLayer = name;
    }
  }

  public getCurrentLayer(): string {
    return this.currentLayer;
  }

  public setTileId(id: number): void {
    this.currentTileId = id;
  }

  public setTool(tool: ToolType): void {
    this.currentTool = tool;
  }

  public applyAction(x: number, y: number): void {
    const changes: { x: number; y: number; oldId: number; newId: number }[] = [];

    if (this.currentTool === 'brush') {
      const oldId = this.tilemap.getTileId(this.currentLayer, x, y);
      if (oldId !== null && oldId !== this.currentTileId) {
        this.tilemap.setTile(this.currentLayer, x, y, this.currentTileId);
        changes.push({ x, y, oldId, newId: this.currentTileId });
      }
    } else if (this.currentTool === 'eraser') {
      const oldId = this.tilemap.getTileId(this.currentLayer, x, y);
      if (oldId !== null && oldId !== 0) {
        this.tilemap.setTile(this.currentLayer, x, y, 0);
        changes.push({ x, y, oldId, newId: 0 });
      }
    } else if (this.currentTool === 'fill') {
      this.floodFill(x, y, this.currentTileId, changes);
    }

    if (changes.length > 0) {
      this.undoStack.push({
        type: this.currentTool,
        layer: this.currentLayer,
        changes,
      });
      this.redoStack = []; // Clear redo on new action
    }
  }

  public undo(): void {
    const action = this.undoStack.pop();
    if (action) {
      for (const change of action.changes) {
        this.tilemap.setTile(action.layer, change.x, change.y, change.oldId);
      }
      this.redoStack.push(action);
    }
  }

  public redo(): void {
    const action = this.redoStack.pop();
    if (action) {
      for (const change of action.changes) {
        this.tilemap.setTile(action.layer, change.x, change.y, change.newId);
      }
      this.undoStack.push(action);
    }
  }

  private floodFill(startX: number, startY: number, targetId: number, changes: any[]): void {
    const startId = this.tilemap.getTileId(this.currentLayer, startX, startY);
    if (startId === null || startId === targetId) return;

    const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
    // Use a 2D boolean array for visited to be faster than Set string manipulation if map is small,
    // but Set is easier to implement.
    // Actually, we can check if we already changed the tile in 'changes' or check the map value?
    // But map value is updated as we go.
    // So checking if map value == startId is enough?
    // CAREFUL: If startId == targetId, infinite loop. Checked at start.
    // If we update the map immediately, then `getTileId` returns `targetId`, so it won't be processed again.

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      const currentId = this.tilemap.getTileId(this.currentLayer, x, y);

      if (currentId === startId) {
        this.tilemap.setTile(this.currentLayer, x, y, targetId);
        changes.push({ x, y, oldId: currentId, newId: targetId });

        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
      }
    }
  }
}
