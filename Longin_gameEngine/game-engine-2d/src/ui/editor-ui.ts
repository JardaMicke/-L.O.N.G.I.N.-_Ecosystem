import { Tile, TileLayer } from '../world/tilemap';

/**
 * Manages the HTML-based UI for the Map Editor.
 */
export class EditorUI {
  private container: HTMLElement | null = null;
  private toolContainer: HTMLElement | null = null;
  private tileContainer: HTMLElement | null = null;
  private layerContainer: HTMLElement | null = null;
  private layerList: HTMLElement | null = null;
  private contextMenu: HTMLElement | null = null;

  private onToolSelect?: (tool: string) => void;
  private onTileSelect?: (tileId: number) => void;
  private onTileEdit?: (tileId: number, data: Partial<Tile>) => void;
  private onLayerSelect?: (layer: string) => void;
  private onLayerAdd?: (name: string) => void;
  private onLayerDelete?: (name: string) => void;
  private onLayerRename?: (oldName: string, newName: string) => void;
  private onLayerMove?: (name: string, direction: 'up' | 'down') => void;
  private onLayerVisibility?: (name: string) => void;
  private onAssetManagerOpen?: () => void;
  private onSave?: () => void;
  private onLoad?: (id: string) => void;
  private onUndo?: () => void;
  private onRedo?: () => void;

  /**
   * Initializes the Editor UI overlay.
   * @param parentId The ID of the parent element to append the UI to (usually document.body or a wrapper).
   */
  public initialize(parentId: string = 'game-container'): void {
    let parent = document.getElementById(parentId);
    if (!parent) {
      parent = document.body;
    }

    // Main Container
    this.container = document.createElement('div');
    this.container.id = 'editor-ui';
    this.container.className = 'glass-panel modern-ui fade-in';
    this.container.style.position = 'absolute';
    this.container.style.top = '60px'; // Below dev toolbar
    this.container.style.right = '10px';
    this.container.style.width = '240px';
    this.container.style.padding = '15px';
    this.container.style.zIndex = '1000';
    this.container.style.maxHeight = 'calc(100vh - 80px)';
    this.container.style.overflowY = 'auto';

    // Title
    const title = document.createElement('h3');
    title.innerText = 'Map Editor';
    title.style.marginTop = '0';
    title.style.textAlign = 'center';
    this.container.appendChild(title);

    // Tools Section
    this.createSectionTitle('Tools');
    this.toolContainer = document.createElement('div');
    this.toolContainer.style.display = 'flex';
    this.toolContainer.style.gap = '5px';
    this.toolContainer.style.marginBottom = '10px';
    this.container.appendChild(this.toolContainer);

    this.addToolButton('Brush', 'brush');
    this.addToolButton('Eraser', 'eraser');
    this.addToolButton('Fill', 'fill');
    this.addToolButton('Nav', 'nav');

    // Layers Section
    this.createSectionTitle('Layers');
    this.layerContainer = document.createElement('div');
    this.layerContainer.style.marginBottom = '10px';
    this.container.appendChild(this.layerContainer);

    // Add Layer Button
    const addLayerBtn = document.createElement('button');
    addLayerBtn.className = 'modern-btn';
    addLayerBtn.innerText = '+ Add Layer';
    addLayerBtn.style.width = '100%';
    addLayerBtn.style.marginBottom = '5px';
    addLayerBtn.style.fontSize = '10px';
    addLayerBtn.onclick = () => {
      const name = prompt('Layer Name:');
      if (name && this.onLayerAdd) this.onLayerAdd(name);
    };
    this.layerContainer.appendChild(addLayerBtn);

    // Layer List
    this.layerList = document.createElement('div');
    this.layerList.style.display = 'flex';
    this.layerList.style.flexDirection = 'column';
    this.layerList.style.gap = '2px';
    this.layerList.style.maxHeight = '150px';
    this.layerList.style.overflowY = 'auto';
    this.layerContainer.appendChild(this.layerList);

    // Tiles Section
    this.createSectionTitle('Tiles');
    this.tileContainer = document.createElement('div');
    this.tileContainer.style.display = 'grid';
    this.tileContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(30px, 1fr))';
    this.tileContainer.style.gap = '5px';
    this.tileContainer.style.marginBottom = '10px';
    this.container.appendChild(this.tileContainer);

    // Actions Section
    this.createSectionTitle('Actions');
    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '5px';
    actionsDiv.style.flexWrap = 'wrap';
    this.container.appendChild(actionsDiv);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'modern-btn';
    saveBtn.innerText = 'Save';
    saveBtn.style.flex = '1';
    saveBtn.onclick = () => { if (this.onSave) this.onSave(); };
    actionsDiv.appendChild(saveBtn);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'modern-btn';
    loadBtn.innerText = 'Load';
    loadBtn.style.flex = '1';
    loadBtn.onclick = () => {
      const id = prompt('Map ID to load:');
      if (id && this.onLoad) {
        this.onLoad(id);
      }
    };
    actionsDiv.appendChild(loadBtn);

    const assetsBtn = document.createElement('button');
    assetsBtn.className = 'modern-btn';
    assetsBtn.innerText = 'Assets';
    assetsBtn.style.flex = '1';
    assetsBtn.onclick = () => { if (this.onAssetManagerOpen) this.onAssetManagerOpen(); };
    actionsDiv.appendChild(assetsBtn);

    const undoBtn = document.createElement('button');
    undoBtn.className = 'modern-btn';
    undoBtn.innerText = 'Undo';
    undoBtn.style.flex = '1';
    undoBtn.onclick = () => { if (this.onUndo) this.onUndo(); };
    actionsDiv.appendChild(undoBtn);

    const redoBtn = document.createElement('button');
    redoBtn.className = 'modern-btn';
    redoBtn.innerText = 'Redo';
    redoBtn.style.flex = '1';
    redoBtn.onclick = () => { if (this.onRedo) this.onRedo(); };
    actionsDiv.appendChild(redoBtn);

    parent.appendChild(this.container);

    // Context Menu
    this.contextMenu = document.createElement('div');
    this.contextMenu.style.position = 'absolute';
    this.contextMenu.style.backgroundColor = '#333';
    this.contextMenu.style.border = '1px solid #666';
    this.contextMenu.style.padding = '5px';
    this.contextMenu.style.display = 'none';
    this.contextMenu.style.zIndex = '2000';
    this.contextMenu.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.5)';
    document.body.appendChild(this.contextMenu);

    // Close context menu on click elsewhere
    document.addEventListener('click', () => {
      if (this.contextMenu) this.contextMenu.style.display = 'none';
    });
  }

  public setCallbacks(callbacks: {
    onToolSelect: (tool: string) => void;
    onTileSelect: (tileId: number) => void;
    onTileEdit?: (tileId: number, data: Partial<Tile>) => void;
    onLayerSelect: (layer: string) => void;
    onLayerAdd?: (name: string) => void;
    onLayerDelete?: (name: string) => void;
    onLayerRename?: (oldName: string, newName: string) => void;
    onLayerMove?: (name: string, direction: 'up' | 'down') => void;
    onLayerVisibility?: (name: string) => void;
    onAssetManagerOpen?: () => void;
    onSave?: () => void;
    onLoad?: (id: string) => void;
    onUndo?: () => void;
    onRedo?: () => void;
  }): void {
    this.onToolSelect = callbacks.onToolSelect;
    this.onTileSelect = callbacks.onTileSelect;
    this.onLayerSelect = callbacks.onLayerSelect;
    this.onLayerAdd = callbacks.onLayerAdd;
    this.onLayerDelete = callbacks.onLayerDelete;
    this.onLayerRename = callbacks.onLayerRename;
    this.onLayerMove = callbacks.onLayerMove;
    this.onLayerVisibility = callbacks.onLayerVisibility;
    this.onAssetManagerOpen = callbacks.onAssetManagerOpen;
    this.onSave = callbacks.onSave;
    this.onLoad = callbacks.onLoad;
    this.onUndo = callbacks.onUndo;
    this.onRedo = callbacks.onRedo;
    this.onTileEdit = callbacks.onTileEdit;
  }

  public updateLayerList(layers: TileLayer[], activeLayer: string): void {
    if (!this.layerList) return;
    this.layerList.innerHTML = '';

    // Reverse order so top layers appear at top of list
    [...layers].reverse().forEach(layer => {
      const item = this.createLayerItem(layer, layer.name === activeLayer);
      this.layerList!.appendChild(item);
    });
  }

  private createLayerItem(layer: TileLayer, isActive: boolean): HTMLElement {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.padding = '2px';
    item.style.backgroundColor = isActive ? '#444' : '#222';
    item.style.border = isActive ? '1px solid #666' : '1px solid #333';
    item.style.fontSize = '11px';

    // Visibility Toggle
    const visBtn = document.createElement('span');
    visBtn.innerText = layer.visible ? '👁️' : '🚫';
    visBtn.style.cursor = 'pointer';
    visBtn.style.marginRight = '5px';
    visBtn.onclick = (e) => {
      e.stopPropagation();
      if (this.onLayerVisibility) this.onLayerVisibility(layer.name);
    };
    item.appendChild(visBtn);

    // Layer Name (Selectable)
    const nameSpan = document.createElement('span');
    nameSpan.innerText = layer.name;
    nameSpan.style.flex = '1';
    nameSpan.style.cursor = 'pointer';
    nameSpan.onclick = () => {
      if (this.onLayerSelect) this.onLayerSelect(layer.name);
    };
    nameSpan.ondblclick = () => {
      const newName = prompt('Rename Layer:', layer.name);
      if (newName && newName !== layer.name && this.onLayerRename) {
        this.onLayerRename(layer.name, newName);
      }
    };
    item.appendChild(nameSpan);

    // Actions Container
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '2px';

    // Up/Down
    const upBtn = document.createElement('button');
    upBtn.innerText = '↑';
    upBtn.style.padding = '0 2px';
    upBtn.onclick = (e) => {
      e.stopPropagation();
      if (this.onLayerMove) this.onLayerMove(layer.name, 'up');
    };
    actions.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.innerText = '↓';
    downBtn.style.padding = '0 2px';
    downBtn.onclick = (e) => {
      e.stopPropagation();
      if (this.onLayerMove) this.onLayerMove(layer.name, 'down');
    };
    actions.appendChild(downBtn);

    // Delete
    const delBtn = document.createElement('button');
    delBtn.innerText = '×';
    delBtn.style.padding = '0 2px';
    delBtn.style.color = 'red';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete layer '${layer.name}'?`) && this.onLayerDelete) {
        this.onLayerDelete(layer.name);
      }
    };
    actions.appendChild(delBtn);

    item.appendChild(actions);

    return item;
  }

  public populateTiles(tiles: Tile[]): void {
    if (!this.tileContainer) return;
    this.tileContainer.innerHTML = '';

    tiles.forEach(tile => {
      const btn = document.createElement('div');
      btn.title = tile.type;
      btn.style.width = '30px';
      btn.style.height = '30px';
      btn.style.border = '1px solid #fff';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = '10px';
      btn.style.overflow = 'hidden';

      if (tile.textureUrl) {
        btn.style.backgroundImage = `url(${tile.textureUrl})`;
        btn.style.backgroundSize = 'cover';
        btn.style.color = 'transparent';
      } else {
        btn.innerText = tile.id.toString();
        btn.style.backgroundColor = this.getTileColor(tile.type);
        btn.style.color = 'black';
      }

      btn.onclick = () => {
        this.highlightTile(btn);
        if (this.onTileSelect) this.onTileSelect(tile.id);
      };

      btn.oncontextmenu = (e) => {
        e.preventDefault();
        this.showContextMenu(e.pageX, e.pageY, tile);
      };

      this.tileContainer!.appendChild(btn);
    });
  }

  private highlightTile(selectedBtn: HTMLElement): void {
    if (!this.tileContainer) return;
    Array.from(this.tileContainer.children).forEach((child) => {
      (child as HTMLElement).style.borderColor = '#fff';
    });
    selectedBtn.style.borderColor = 'yellow';
  }

  private getTileColor(type: string): string {
    switch (type) {
      case 'grass': return '#0f0';
      case 'wall': return '#888';
      case 'water': return '#00f';
      default: return '#fff';
    }
  }

  private showContextMenu(x: number, y: number, tile: Tile): void {
    if (!this.contextMenu) return;

    this.contextMenu.innerHTML = '';
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = 'block';

    const title = document.createElement('div');
    title.innerText = `Tile: ${tile.type} (${tile.id})`;
    title.style.borderBottom = '1px solid #666';
    title.style.marginBottom = '5px';
    title.style.paddingBottom = '2px';
    title.style.color = '#ccc';
    title.style.fontSize = '12px';
    this.contextMenu.appendChild(title);

    // Edit Walkable
    const walkBtn = document.createElement('div');
    walkBtn.innerText = `Walkable: ${tile.walkable ? 'Yes' : 'No'}`;
    walkBtn.style.cursor = 'pointer';
    walkBtn.style.fontSize = '12px';
    walkBtn.style.padding = '2px 5px';
    walkBtn.onmouseover = () => walkBtn.style.backgroundColor = '#555';
    walkBtn.onmouseout = () => walkBtn.style.backgroundColor = 'transparent';
    walkBtn.onclick = () => {
      if (this.onTileEdit) {
        this.onTileEdit(tile.id, { walkable: !tile.walkable });
      }
    };
    this.contextMenu.appendChild(walkBtn);

    // Set Color (if no texture)
    if (!tile.textureUrl) {
      const colorBtn = document.createElement('div');
      colorBtn.innerText = 'Set Color';
      colorBtn.style.cursor = 'pointer';
      colorBtn.style.fontSize = '12px';
      colorBtn.style.padding = '2px 5px';
      colorBtn.onmouseover = () => colorBtn.style.backgroundColor = '#555';
      colorBtn.onmouseout = () => colorBtn.style.backgroundColor = 'transparent';
      colorBtn.onclick = () => {
        const newColor = prompt('Enter color (hex):', tile.properties?.color || '#ffffff');
        if (newColor && this.onTileEdit) {
          this.onTileEdit(tile.id, { properties: { ...tile.properties, color: newColor } });
        }
      };
      this.contextMenu.appendChild(colorBtn);
    }
  }

  private addToolButton(label: string, value: string): void {
    if (!this.toolContainer) return;
    const btn = document.createElement('button');
    btn.className = 'modern-btn';
    btn.innerText = label;
    btn.style.flex = '1';
    btn.style.padding = '4px';
    btn.style.fontSize = '12px';
    btn.onclick = () => {
      if (this.onToolSelect) this.onToolSelect(value);
      // Highlight logic could be added here
    };
    this.toolContainer.appendChild(btn);
  }

  private createSectionTitle(text: string): void {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.fontSize = '12px';
    el.style.color = '#ccc';
    el.style.marginBottom = '5px';
    this.container?.appendChild(el);
  }

  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
