import { State } from '../../core/game-state';
import { Engine } from '../../core/engine';
import { Tilemap } from '../../world/tilemap';
import { TilemapRenderer } from '../../graphics/tilemap-renderer';
import { Camera } from '../../graphics/camera';
import { MapEditor, ToolType } from '../../tools/map-editor';
import { EditorUI } from '../../ui/editor-ui';
import { AssetManagerUI } from '../../ui/asset-manager-ui';
import { PathfindingManager } from '../../gameplay/pathfinding-manager';
import { PathfindingVisualizer } from '../../tools/pathfinding-visualizer';
import { Logger } from '../../utils/logger';

export class EditorState implements State {
  public name: string = 'Editor';
  private engine: Engine | null = null;
  private tilemap: Tilemap;
  private tilemapRenderer: TilemapRenderer | null = null;
  private camera: Camera;
  private mapEditor: MapEditor | null = null;
  private ui: EditorUI;
  private assetManagerUI: AssetManagerUI;
  private pathfindingManager: PathfindingManager | null = null;
  private pathfindingVisualizer: PathfindingVisualizer | null = null;
  private isInitialized: boolean = false;
  private currentTool: string = 'brush';

  constructor() {
    this.tilemap = new Tilemap(50, 50, 32); // Default map
    this.camera = new Camera(800, 600);
    this.ui = new EditorUI();
    this.assetManagerUI = new AssetManagerUI((asset) => {
        Logger.info(`Selected asset: ${asset.original_name}`);
        
        const existingTiles = this.tilemap.getTiles();
        const maxId = existingTiles.length > 0 ? Math.max(...existingTiles.map(t => t.id)) : 0;
        const newId = maxId + 1;

        const newTile = {
            id: newId,
            type: asset.original_name.split('.')[0],
            walkable: true,
            textureUrl: asset.path
        };

        this.tilemap.registerTile(newId, newTile);
        this.ui.populateTiles(this.tilemap.getTiles());
        
        // Auto-select the new tile
        this.mapEditor?.setTileId(newId);
        Logger.info(`Created new tile ID ${newId} from asset`);
    });
  }

  public onEnter(engine: Engine): void {
    Logger.info('Entering EditorState');
    this.engine = engine;

    if (!this.isInitialized) {
      this.initialize(engine);
      this.isInitialized = true;
    }

    // Initialize MapEditor
    this.mapEditor = engine.toolManager.startMapEditing(this.tilemap);

    // Initialize UI
    this.ui.initialize('game-container'); // Assuming 'game-container' is the wrapper
    
    // Register Tiles (same as PlayState for now)
    // In a real app, this should come from a central registry
    this.tilemap.registerTile(1, { id: 1, type: 'grass', walkable: true });
    this.tilemap.registerTile(2, { id: 2, type: 'wall', walkable: false });
    this.tilemap.registerTile(3, { id: 3, type: 'water', walkable: false });

    // Populate UI
    this.ui.populateTiles([
      { id: 1, type: 'grass', walkable: true },
      { id: 2, type: 'wall', walkable: false },
      { id: 3, type: 'water', walkable: false }
    ]);

    // Helper to refresh UI layer list
    const refreshLayerList = () => {
      const layers = this.tilemap.getLayerNames().map(name => ({
        name,
        visible: this.tilemap.isLayerVisible(name),
        data: [] // Not needed for UI
      }));
      // We need to know current layer. MapEditor doesn't expose it publicly?
      // It does via private currentLayer.
      // I should add getCurrentLayer() to MapEditor.
      
      // For now let's assume 'default' or track it here?
      // Better to add getter to MapEditor.
      this.ui.updateLayerList(layers, this.mapEditor?.getCurrentLayer() || 'default');
    };

    // Setup Callbacks
    this.ui.setCallbacks({
      onToolSelect: (tool) => {
        Logger.info(`Selected tool: ${tool}`);
        this.currentTool = tool;
        if (tool === 'nav') {
            this.pathfindingVisualizer?.toggleVisibility(true);
        } else {
            this.pathfindingVisualizer?.toggleVisibility(false);
            this.mapEditor?.setTool(tool as ToolType);
        }
      },
      onTileSelect: (tileId) => {
        Logger.info(`Selected tile: ${tileId}`);
        this.mapEditor?.setTileId(tileId);
      },
      onLayerSelect: (layer) => {
        Logger.info(`Selected layer: ${layer}`);
        this.mapEditor?.setLayer(layer);
        refreshLayerList();
      },
      onLayerAdd: (name) => {
        this.mapEditor?.createLayer(name);
        refreshLayerList();
      },
      onLayerDelete: (name) => {
        this.mapEditor?.deleteLayer(name);
        refreshLayerList();
      },
      onLayerRename: (oldName, newName) => {
        this.mapEditor?.renameLayer(oldName, newName);
        refreshLayerList();
      },
      onLayerMove: (name, dir) => {
        this.mapEditor?.moveLayer(name, dir);
        refreshLayerList();
      },
      onLayerVisibility: (name) => {
        this.mapEditor?.toggleLayerVisibility(name);
        refreshLayerList();
      },
      onAssetManagerOpen: () => {
        this.assetManagerUI.show();
      },
      onSave: async () => {
        Logger.info('Saving map...');
        const name = prompt('Map Name:', 'New Map');
        if (name && this.mapEditor) {
            const id = await this.mapEditor.saveMap(name, 'User');
            if (id) {
                alert(`Map saved! ID: ${id}`);
            } else {
                alert('Save failed.');
            }
        }
      },
      onLoad: async (id: string) => {
          Logger.info(`Loading map: ${id}`);
          if (this.mapEditor) {
              const success = await this.mapEditor.loadMap(id);
              if (success) {
                  alert('Map loaded successfully!');
                  refreshLayerList();
                  this.ui.populateTiles(this.tilemap.getTiles());
              } else {
                  alert('Load failed.');
              }
          }
      },
      onUndo: () => {
        this.mapEditor?.undo();
      },
      onRedo: () => {
        this.mapEditor?.redo();
      },
      onTileEdit: (tileId, changes) => {
        Logger.info(`Editing tile ${tileId}: ${JSON.stringify(changes)}`);
        const existing = this.tilemap.getTiles().find(t => t.id === tileId);
        if (existing) {
             const updated = { ...existing, ...changes };
             // Merge properties specifically if they exist in both
             if (changes.properties && existing.properties) {
                 updated.properties = { ...existing.properties, ...changes.properties };
             }
             this.tilemap.registerTile(tileId, updated);
             this.ui.populateTiles(this.tilemap.getTiles());
        }
      }
    });

    // Initial population
    refreshLayerList();

    // Resize Camera
    const canvas = engine.renderer.getCanvas();
    if (canvas) {
      this.camera.resize(canvas.width, canvas.height);
    }
    
    // Subscribe to Resize
    engine.eventSystem.on('engine:resize', this.handleResize);
  }

  public onExit(): void {
    Logger.info('Exiting EditorState');
    this.ui.destroy();
    if (this.engine) {
      this.engine.toolManager.stopEditing();
      this.engine.eventSystem.off('engine:resize', this.handleResize);
    }
    this.mapEditor = null;
  }

  public onUpdate(engine: Engine, deltaTime: number): void {
    if (!this.engine || !this.mapEditor) return;

    // Handle Camera Movement (WASD or Arrows)
    const speed = 500 * deltaTime;
    const input = this.engine.inputHandler;

    if (input.isKeyDown('ArrowUp') || input.isKeyDown('w')) this.camera.y -= speed;
    if (input.isKeyDown('ArrowDown') || input.isKeyDown('s')) this.camera.y += speed;
    if (input.isKeyDown('ArrowLeft') || input.isKeyDown('a')) this.camera.x -= speed;
    if (input.isKeyDown('ArrowRight') || input.isKeyDown('d')) this.camera.x += speed;

    // Handle Mouse Input
    const mousePos = input.getMousePosition();
    const worldPos = this.screenToWorld(mousePos.x, mousePos.y);
    const tileX = Math.floor(worldPos.x / this.tilemap.tileSize);
    const tileY = Math.floor(worldPos.y / this.tilemap.tileSize);

    if (this.currentTool === 'nav') {
        if (input.isMouseButtonDown(0)) { // Left Click - Start
            this.pathfindingVisualizer?.setStart(tileX, tileY);
        }
        if (input.isMouseButtonDown(2)) { // Right Click - End
            this.pathfindingVisualizer?.setEnd(tileX, tileY);
        }
    } else {
        if (input.isMouseButtonDown(0)) { // Left Click - Paint
            if (tileX >= 0 && tileX < this.tilemap.width && tileY >= 0 && tileY < this.tilemap.height) {
                this.mapEditor.applyAction(tileX, tileY);
            }
        }
    }
  }

  public onRender(engine: Engine, interpolation: number): void {
    const ctx = engine.renderer.getContext();
    if (!this.tilemapRenderer || !ctx) return;

    // Clear background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.camera.width, this.camera.height);

    // Render Map
    this.tilemapRenderer.render(this.tilemap, this.camera);

    // Render Pathfinding
    if (this.pathfindingVisualizer && this.pathfindingVisualizer.isVisibleEnabled()) {
        this.pathfindingVisualizer.render(ctx, this.camera);
    }
  }

  private initialize(engine: Engine): void {
    this.tilemapRenderer = new TilemapRenderer(engine.renderer);
    this.pathfindingManager = new PathfindingManager(this.tilemap);
    this.pathfindingVisualizer = new PathfindingVisualizer(this.pathfindingManager, this.tilemap);
  }

  private handleResize = (data: { width: number; height: number }) => {
    this.camera.resize(data.width, data.height);
  };

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: this.camera.x + sx / this.camera.zoom,
      y: this.camera.y + sy / this.camera.zoom
    };
  }
}
