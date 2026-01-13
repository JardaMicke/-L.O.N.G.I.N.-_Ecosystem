import { Logger } from '../utils/logger';
import { SpriteManager } from '../graphics/sprite-manager';

export interface AnimationFrame {
  frameNumber: number;
  assets: AssetInstance[];
}

export interface AssetInstance {
  id: string; // Unique instance ID
  assetId: string; // Resource ID
  x: number; // Grid X (0-8)
  y: number; // Grid Y (0-8)
  rotation: number; // 0-7 (45 degree increments)
}

export interface AnimationSequence {
  name: string;
  duration: number; // Frames (60-240)
  frames: AnimationFrame[]; // All calculated frames
  keyFrames: Map<number, AssetInstance[]>; // User defined keyframes
  gridType: 'square' | 'hex';
}

export class AnimationEditor {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private currentAnimation: AnimationSequence;
  private currentFrameIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 60; // FPS target

  private selectedInstanceId: string | null = null;
  private selectedAssetId: string | null = null;
  private spriteManager: SpriteManager;

  // Grid Config
  private readonly GRID_SIZE = 9;
  private readonly CELL_SIZE = 40;
  private readonly CANVAS_SIZE = 400; // 9 * 40 + padding
  private timelineSlider: HTMLInputElement | null = null;

  constructor(spriteManager: SpriteManager) {
    this.spriteManager = spriteManager;
    this.currentAnimation = {
      name: 'New Animation',
      duration: 60,
      frames: [],
      keyFrames: new Map(),
      gridType: 'square'
    };
    // Initialize empty frames
    this.recalculateFrames();

    if (typeof document !== 'undefined') {
      this.container = document.createElement('div');
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
      this.setupUI();
      document.body.appendChild(this.container);
      
      this.setupEvents();
      this.draw();
    } else {
      this.container = {} as HTMLDivElement;
      this.canvas = {} as HTMLCanvasElement;
      this.ctx = {} as CanvasRenderingContext2D;
    }
  }

  public toggle(): void {
    if (typeof document === 'undefined') return;
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'flex' : 'none';
    if (this.isVisible) {
      this.draw();
    }
  }

  private setupEvents(): void {
    // Canvas Drop
    this.canvas.ondragover = (e) => {
        e.preventDefault();
    };

    this.canvas.ondrop = (e) => {
        e.preventDefault();
        const assetId = e.dataTransfer?.getData('text/plain');
        if (assetId) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleDrop(assetId, x, y);
        }
    };

    // Canvas Click (Selection/Move)
    this.canvas.onclick = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Check if clicked on an asset
        const clickedAsset = this.getAssetAt(screenX, screenY);
        
        if (clickedAsset) {
            this.selectedInstanceId = clickedAsset.id;
            this.selectedAssetId = clickedAsset.assetId;
            this.updateAssetPropertiesPanel();
        } else {
            // If we have a selection and click on empty space, MOVE IT
            if (this.selectedInstanceId) {
                 const gridPos = this.getGridCoordinates(screenX, screenY);
                 if (gridPos) {
                     this.moveSelectedAsset(gridPos.x, gridPos.y);
                 }
            }
        }
        this.draw();
    };

    // Global Key Events
    window.addEventListener('keydown', (e) => {
        if (!this.isVisible) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteSelectedAsset();
        }
    });
  }

  private deleteSelectedAsset(): void {
      if (!this.selectedInstanceId) return;

      // Remove from all keyframes
      this.currentAnimation.keyFrames.forEach((assets, frame) => {
          const index = assets.findIndex(a => a.id === this.selectedInstanceId);
          if (index !== -1) {
              assets.splice(index, 1);
          }
      });
      
      this.selectedInstanceId = null;
      this.selectedAssetId = null;
      this.updateAssetPropertiesPanel();
      this.recalculateFrames();
      this.draw();
  }

  private rotateSelectedAsset(dir: number): void {
      if (!this.selectedInstanceId) return;
      
      let assets = this.currentAnimation.keyFrames.get(this.currentFrameIndex);
      if (!assets) {
          assets = [];
          this.currentAnimation.keyFrames.set(this.currentFrameIndex, assets);
      }

      let asset = assets.find(a => a.id === this.selectedInstanceId);
      
      if (!asset) {
          // Pull from interpolation if not in keyframe
          const interpolatedFrame = this.currentAnimation.frames[this.currentFrameIndex];
          const interpolatedAsset = interpolatedFrame.assets.find(a => a.id === this.selectedInstanceId);
          if (interpolatedAsset) {
              asset = { ...interpolatedAsset };
              assets.push(asset);
          }
      }

      if (asset) {
          asset.rotation = (asset.rotation + dir + 8) % 8;
          this.recalculateFrames();
          this.draw();
      }
  }

  private getAssetAt(screenX: number, screenY: number): AssetInstance | null {
      const frame = this.currentAnimation.frames[this.currentFrameIndex];
      if (!frame) return null;

      const offsetX = (this.CANVAS_SIZE - (this.GRID_SIZE * this.CELL_SIZE)) / 2;
      const offsetY = (this.CANVAS_SIZE - (this.GRID_SIZE * this.CELL_SIZE)) / 2;

      // Reverse iterate to pick top-most
      for (let i = frame.assets.length - 1; i >= 0; i--) {
          const asset = frame.assets[i];
          let ax = 0, ay = 0;

           if (this.currentAnimation.gridType === 'square') {
              ax = offsetX + asset.x * this.CELL_SIZE + this.CELL_SIZE / 2;
              ay = offsetY + asset.y * this.CELL_SIZE + this.CELL_SIZE / 2;
          } else {
               const hexHeight = this.CELL_SIZE;
               const hexWidth = (Math.sqrt(3) / 2) * hexHeight;
               const vertDist = hexHeight * 0.75;
               
               ax = offsetX + asset.x * hexWidth + (Math.floor(asset.y) % 2) * (hexWidth / 2) + hexWidth/2;
               ay = offsetY + asset.y * vertDist + hexHeight/2;
          }

          // Simple circle collision for selection
          const dist = Math.sqrt(Math.pow(screenX - ax, 2) + Math.pow(screenY - ay, 2));
          if (dist < this.CELL_SIZE / 2) {
              return asset;
          }
      }
      return null;
  }

  private moveSelectedAsset(x: number, y: number): void {
      if (!this.selectedInstanceId) return;

      // Get current frame assets
      let assets = this.currentAnimation.keyFrames.get(this.currentFrameIndex);
      
      // If no keyframe here, we need to create one based on current interpolated state
      // OR we just assume we are moving the asset to this new position at this frame.
      
      if (!assets) {
          assets = [];
          this.currentAnimation.keyFrames.set(this.currentFrameIndex, assets);
      }

      // Check if asset exists in this keyframe
      let asset = assets.find(a => a.id === this.selectedInstanceId);
      
      if (asset) {
          // Update existing keyframe data
          asset.x = x;
          asset.y = y;
      } else {
          // Asset exists in animation but not explicitly in this keyframe.
          // We need to pull it from the interpolated frame and add it as a keyframe here.
          const interpolatedFrame = this.currentAnimation.frames[this.currentFrameIndex];
          const interpolatedAsset = interpolatedFrame.assets.find(a => a.id === this.selectedInstanceId);
          
          if (interpolatedAsset) {
              // Create new keyframe entry
              assets.push({
                  ...interpolatedAsset,
                  x: x,
                  y: y
              });
          }
      }
      
      this.recalculateFrames();
  }

  private handleDrop(assetId: string, screenX: number, screenY: number): void {
      const gridPos = this.getGridCoordinates(screenX, screenY);
      if (gridPos) {
          this.addKeyFrameAsset(assetId, gridPos.x, gridPos.y);
      }
  }

  private getGridCoordinates(screenX: number, screenY: number): {x: number, y: number} | null {
      const offsetX = (this.CANVAS_SIZE - (this.GRID_SIZE * this.CELL_SIZE)) / 2;
      const offsetY = (this.CANVAS_SIZE - (this.GRID_SIZE * this.CELL_SIZE)) / 2;

      if (this.currentAnimation.gridType === 'square') {
          const gx = Math.floor((screenX - offsetX) / this.CELL_SIZE);
          const gy = Math.floor((screenY - offsetY) / this.CELL_SIZE);
          if (gx >= 0 && gx < this.GRID_SIZE && gy >= 0 && gy < this.GRID_SIZE) {
              return { x: gx, y: gy };
          }
      } else {
          // Hex Grid Click Logic (Simplified approximation)
          const hexHeight = this.CELL_SIZE;
          const hexWidth = (Math.sqrt(3) / 2) * hexHeight;
          const vertDist = hexHeight * 0.75;
          
          const row = Math.floor((screenY - offsetY) / vertDist);
          const col = Math.floor((screenX - offsetX - (row % 2) * (hexWidth / 2)) / hexWidth);
          
           if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
              return { x: col, y: row };
          }
      }
      return null;
  }

  private addKeyFrameAsset(assetId: string, x: number, y: number): void {
      const instanceId = `${assetId}_${Date.now()}`; 
      
      const newAsset: AssetInstance = {
          id: instanceId,
          assetId: assetId,
          x: x,
          y: y,
          rotation: 0 // Default
      };

      let assets = this.currentAnimation.keyFrames.get(this.currentFrameIndex);
      if (!assets) {
          assets = [];
          this.currentAnimation.keyFrames.set(this.currentFrameIndex, assets);
      }
      assets.push(newAsset);
      
      this.selectedInstanceId = instanceId; // Select new asset
      this.selectedAssetId = assetId;
      this.updateAssetPropertiesPanel();

      this.recalculateFrames();
      this.draw();
  }

  private recalculateFrames(): void {
      this.currentAnimation.frames = [];
      for (let i = 0; i <= this.currentAnimation.duration; i++) {
          this.currentAnimation.frames.push({ frameNumber: i, assets: [] });
      }

      const allInstanceIds = new Set<string>();
      this.currentAnimation.keyFrames.forEach(assets => {
          assets.forEach(a => allInstanceIds.add(a.id));
      });

      allInstanceIds.forEach(id => {
          this.interpolateAsset(id);
      });
  }

  private interpolateAsset(instanceId: string): void {
      const keyframes: { frame: number, asset: AssetInstance }[] = [];
      
      const sortedFrames = Array.from(this.currentAnimation.keyFrames.keys()).sort((a, b) => a - b);
      
      for (const f of sortedFrames) {
          const assets = this.currentAnimation.keyFrames.get(f);
          const asset = assets?.find(a => a.id === instanceId);
          if (asset) {
              keyframes.push({ frame: f, asset });
          }
      }

      if (keyframes.length === 0) return;

      for (let i = 0; i < keyframes.length - 1; i++) {
          const start = keyframes[i];
          const end = keyframes[i+1];
          
          for (let f = start.frame; f <= end.frame; f++) {
              const progress = (f - start.frame) / (end.frame - start.frame);
              
              const lx = start.asset.x + (end.asset.x - start.asset.x) * progress;
              const ly = start.asset.y + (end.asset.y - start.asset.y) * progress;
              
              const dx = end.asset.x - start.asset.x;
              const dy = end.asset.y - start.asset.y;
              let rotation = start.asset.rotation;
              
              if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
                  angle += 90; 
                  if (angle < 0) angle += 360;
                  rotation = Math.round(angle / 45) % 8;
              }

              this.currentAnimation.frames[f].assets.push({
                  id: instanceId,
                  assetId: start.asset.assetId,
                  x: lx,
                  y: ly,
                  rotation: rotation
              });
          }
      }
      
      if (keyframes.length === 1) {
          const kf = keyframes[0];
          this.currentAnimation.frames[kf.frame].assets.push({ ...kf.asset });
      }
  }

  public exportToJson(): string {
      // Convert Map to array for JSON serialization
      const keyFramesArray = Array.from(this.currentAnimation.keyFrames.entries());
      const exportData = {
          name: this.currentAnimation.name,
          duration: this.currentAnimation.duration,
          gridType: this.currentAnimation.gridType,
          keyFrames: keyFramesArray
      };
      return JSON.stringify(exportData, null, 2);
  }

  private setupUI(): void {
    this.container.style.position = 'fixed';
    this.container.style.top = '50px';
    this.container.style.left = '100px'; 
    this.container.style.width = '900px';
    this.container.style.height = '700px';
    this.container.style.backgroundColor = 'rgba(30, 30, 30, 0.98)';
    this.container.style.color = '#fff';
    this.container.style.border = '1px solid #666';
    this.container.style.borderRadius = '5px';
    this.container.style.zIndex = '10000';
    this.container.style.display = 'none';
    this.container.style.fontFamily = 'Arial, sans-serif';
    this.container.style.padding = '10px';
    this.container.style.flexDirection = 'column';
    this.container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.borderBottom = '1px solid #555';
    header.style.paddingBottom = '5px';
    header.style.marginBottom = '10px';

    const title = document.createElement('h3');
    title.innerText = 'Animation Editor';
    title.style.margin = '0';

    const controls = document.createElement('div');
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'X';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#fff';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.onclick = () => this.toggle();
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);
    this.container.appendChild(header);

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flex = '1';
    content.style.gap = '20px';
    
    const leftPanel = document.createElement('div');
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.alignItems = 'center';
    
    this.canvas.width = this.CANVAS_SIZE;
    this.canvas.height = this.CANVAS_SIZE;
    this.canvas.style.border = '1px solid #444';
    this.canvas.style.backgroundColor = '#111';
    
    leftPanel.appendChild(this.canvas);
    
    const timelineControls = this.createTimelineControls();
    leftPanel.appendChild(timelineControls);

    const rightPanel = document.createElement('div');
    rightPanel.style.flex = '1';
    rightPanel.style.borderLeft = '1px solid #444';
    rightPanel.style.paddingLeft = '10px';
    
    rightPanel.appendChild(this.createGridControls());
    rightPanel.appendChild(this.createAssetPalette());
    rightPanel.appendChild(this.createAssetPropertiesPanel());
    rightPanel.appendChild(this.createExportControls());

    content.appendChild(leftPanel);
    content.appendChild(rightPanel);
    this.container.appendChild(content);
  }

  private createTimelineControls(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.marginTop = '10px';
    container.style.width = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '5px';

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '5px';
    
    const playBtn = document.createElement('button');
    playBtn.innerText = 'Play';
    playBtn.onclick = () => this.togglePlayback();
    
    const stopBtn = document.createElement('button');
    stopBtn.innerText = 'Stop';
    stopBtn.onclick = () => this.stopPlayback();

    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear Frame';
    clearBtn.onclick = () => {
        this.currentAnimation.keyFrames.delete(this.currentFrameIndex);
        this.recalculateFrames();
        this.draw();
    };

    buttons.appendChild(playBtn);
    buttons.appendChild(stopBtn);
    buttons.appendChild(clearBtn);

    this.timelineSlider = document.createElement('input');
    this.timelineSlider.type = 'range';
    this.timelineSlider.min = '0';
    this.timelineSlider.max = '60'; 
    this.timelineSlider.value = '0';
    this.timelineSlider.style.width = '100%';
    this.timelineSlider.oninput = (e) => {
      this.currentFrameIndex = parseInt((e.target as HTMLInputElement).value);
      this.draw();
    };

    container.appendChild(buttons);
    container.appendChild(this.timelineSlider);
    
    return container;
  }

  private createGridControls(): HTMLDivElement {
    const container = document.createElement('div');
    container.innerHTML = '<h4>Grid Settings</h4>';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.innerText = 'Switch to Hex Grid';
    toggleBtn.onclick = () => {
      this.currentAnimation.gridType = this.currentAnimation.gridType === 'square' ? 'hex' : 'square';
      toggleBtn.innerText = this.currentAnimation.gridType === 'square' ? 'Switch to Hex Grid' : 'Switch to Square Grid';
      this.draw();
    };

    const durationLabel = document.createElement('div');
    durationLabel.style.marginTop = '10px';
    durationLabel.innerText = 'Duration: ';
    const durationInput = document.createElement('input');
    durationInput.type = 'number';
    durationInput.min = '60';
    durationInput.max = '240';
    durationInput.value = '60';
    durationInput.onchange = (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        this.currentAnimation.duration = val;
        if (this.timelineSlider) this.timelineSlider.max = val.toString();
        this.recalculateFrames();
    };
    durationLabel.appendChild(durationInput);
    
    container.appendChild(toggleBtn);
    container.appendChild(durationLabel);
    return container;
  }

  private createAssetPalette(): HTMLDivElement {
    const container = document.createElement('div');
    container.innerHTML = '<h4>Assets</h4>';
    container.style.marginTop = '20px';
    
    // Asset List
    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gridTemplateColumns = 'repeat(3, 1fr)';
    list.style.gap = '5px';

    ['Unit', 'Tree', 'Rock'].forEach(name => {
      const item = document.createElement('div');
      item.innerText = name[0];
      item.title = name;
      item.style.width = '40px';
      item.style.height = '40px';
      item.style.background = '#444';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'center';
      item.style.cursor = 'grab';
      item.draggable = true;
      item.ondragstart = (e) => {
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', name);
        }
      };
      list.appendChild(item);
    });

    container.appendChild(list);

    // Selected Asset Controls
    const controls = document.createElement('div');
    controls.style.marginTop = '15px';
    controls.style.borderTop = '1px solid #444';
    controls.style.paddingTop = '10px';
    controls.innerHTML = '<h5>Selected Asset</h5>';
    
    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '5px';

    const rotL = document.createElement('button');
    rotL.innerText = '↺';
    rotL.onclick = () => this.rotateSelectedAsset(-1);
    
    const rotR = document.createElement('button');
    rotR.innerText = '↻';
    rotR.onclick = () => this.rotateSelectedAsset(1);

    const delBtn = document.createElement('button');
    delBtn.innerText = 'Del';
    delBtn.style.backgroundColor = '#622';
    delBtn.onclick = () => this.deleteSelectedAsset();

    btnGroup.appendChild(rotL);
    btnGroup.appendChild(rotR);
    btnGroup.appendChild(delBtn);
    
    controls.appendChild(btnGroup);
    container.appendChild(controls);

    return container;
  }

  private createAssetPropertiesPanel(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'asset-properties-panel';
    container.style.marginTop = '20px';
    container.style.borderTop = '1px solid #444';
    container.style.paddingTop = '10px';
    container.innerHTML = '<h4>Asset Properties</h4><p style="font-size:12px;color:#aaa">Select an asset from palette to edit</p>';
    return container;
  }

  private updateAssetPropertiesPanel(): void {
    const container = document.getElementById('asset-properties-panel');
    if (!container || !this.selectedAssetId) return;

    container.innerHTML = `<h4>Properties: ${this.selectedAssetId}</h4>`;
    
    // Height Control
    const meta = this.spriteManager.getAssetMetadata(this.selectedAssetId) || { walkableZones: [] };
    
    const heightGroup = document.createElement('div');
    heightGroup.style.marginBottom = '10px';
    
    const hLabel = document.createElement('label');
    hLabel.textContent = 'Accessible Height: ';
    hLabel.style.display = 'block';
    
    const hInput = document.createElement('input');
    hInput.type = 'number';
    hInput.min = '1';
    hInput.max = (meta.maxAccessibleHeight || 10).toString();
    hInput.value = (meta.accessibleHeight || 1).toString();
    hInput.style.width = '60px';
    
    const hVal = document.createElement('span');
    hVal.textContent = ` (${hInput.value})`;
    hVal.style.marginLeft = '5px';

    const maxLabel = document.createElement('label');
    maxLabel.textContent = 'Max Height: ';
    maxLabel.style.display = 'block';
    maxLabel.style.marginTop = '5px';
    
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.min = '1';
    maxInput.value = (meta.maxAccessibleHeight || 10).toString();
    maxInput.style.width = '60px';
    
    hInput.oninput = () => {
        let val = parseInt(hInput.value);
        const max = parseInt(maxInput.value) || 10;
        if (val < 1) val = 1;
        if (val > max) val = max;
        hInput.value = val.toString();
        hVal.textContent = ` (${val})`;
        
        // Update Metadata
        if (!meta.accessibleHeight) meta.accessibleHeight = 1;
        meta.accessibleHeight = val;
        this.spriteManager.registerAssetMetadata(this.selectedAssetId!, meta);
    };
    
    maxInput.onchange = () => {
        let val = parseInt(maxInput.value);
        if (val < 1) val = 1;
        maxInput.value = val.toString();
        hInput.max = val.toString();
        
        // Re-validate height
        if (parseInt(hInput.value) > val) {
            hInput.value = val.toString();
            hVal.textContent = ` (${val})`;
            meta.accessibleHeight = val;
        }
        
        meta.maxAccessibleHeight = val;
        this.spriteManager.registerAssetMetadata(this.selectedAssetId!, meta);
    };

    heightGroup.appendChild(hLabel);
    heightGroup.appendChild(hInput);
    heightGroup.appendChild(hVal);
    heightGroup.appendChild(maxLabel);
    heightGroup.appendChild(maxInput);
    container.appendChild(heightGroup);

    // Action Binding
    const bindingGroup = document.createElement('div');
    bindingGroup.innerHTML = '<h5>Action Bindings</h5>';
    
    const bindContainer = document.createElement('div');
    bindContainer.style.display = 'flex';
    bindContainer.style.flexDirection = 'column';
    bindContainer.style.gap = '5px';

    const renderBindings = () => {
        bindContainer.innerHTML = '';
        const bindings = meta.actionBindings || {};
        for (const [action, anim] of Object.entries(bindings)) {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '12px';
            row.innerHTML = `<span>${action} -> ${anim}</span>`;
            
            // Remove button (optional)
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.style.fontSize = '10px';
            removeBtn.onclick = () => {
                delete meta.actionBindings![action];
                this.spriteManager.registerAssetMetadata(this.selectedAssetId!, meta);
                renderBindings();
            };
            row.appendChild(removeBtn);
            bindContainer.appendChild(row);
        }
    };
    renderBindings();
    
    // Add New Binding
    const newBindRow = document.createElement('div');
    newBindRow.style.marginTop = '5px';
    newBindRow.style.display = 'flex';
    newBindRow.style.gap = '5px';
    
    const actionSelect = document.createElement('select');
    ['Idle', 'Walk', 'Attack', 'Hit', 'Die', 'Interact'].forEach(act => {
        const opt = document.createElement('option');
        opt.value = act;
        opt.textContent = act;
        actionSelect.appendChild(opt);
    });
    
    const animInput = document.createElement('input'); // Or select if we knew animations
    animInput.placeholder = 'Anim Name';
    animInput.style.width = '80px';
    
    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.onclick = () => {
        if (!meta.actionBindings) meta.actionBindings = {};
        if (animInput.value) {
            meta.actionBindings[actionSelect.value] = animInput.value;
            this.spriteManager.registerAssetMetadata(this.selectedAssetId!, meta);
            renderBindings();
        }
    };
    
    newBindRow.appendChild(actionSelect);
    newBindRow.appendChild(animInput);
    newBindRow.appendChild(addBtn);
    
    bindingGroup.appendChild(bindContainer);
    bindingGroup.appendChild(newBindRow);
    container.appendChild(bindingGroup);
  }

  private createExportControls(): HTMLDivElement {
      const container = document.createElement('div');
      container.style.marginTop = '20px';
      container.style.borderTop = '1px solid #444';
      container.style.paddingTop = '10px';
      
      const btn = document.createElement('button');
      btn.innerText = 'Export to JSON';
      btn.onclick = () => {
          const json = this.exportToJson();
          console.log(json);
          alert('Animation JSON exported to console');
      };
      
      container.appendChild(btn);
      return container;
  }

  private togglePlayback(): void {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.playLoop();
    }
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    this.currentFrameIndex = 0;
    if (this.timelineSlider) this.timelineSlider.value = '0';
    this.draw();
  }

  private playLoop(): void {
    if (!this.isPlaying) return;
    
    this.currentFrameIndex++;
    if (this.currentFrameIndex >= this.currentAnimation.duration) {
      this.currentFrameIndex = 0;
    }
    
    if (this.timelineSlider) this.timelineSlider.value = this.currentFrameIndex.toString();
    
    this.draw();
    requestAnimationFrame(() => this.playLoop());
  }

  private draw(): void {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;

    const offsetX = (this.CANVAS_SIZE - (this.GRID_SIZE * this.CELL_SIZE)) / 2;
    const offsetY = (this.CANVAS_SIZE - (this.GRID_SIZE * this.CELL_SIZE)) / 2;

    if (this.currentAnimation.gridType === 'square') {
      this.drawSquareGrid(offsetX, offsetY);
    } else {
      this.drawHexGrid(offsetX, offsetY);
    }

    this.drawCenterMarker(offsetX, offsetY);

    const frame = this.currentAnimation.frames[this.currentFrameIndex];
    if (frame && frame.assets) {
        frame.assets.forEach(asset => {
            this.drawAsset(asset, offsetX, offsetY);
        });
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Frame: ${this.currentFrameIndex}`, 10, 20);
  }

  private drawAsset(asset: AssetInstance, offsetX: number, offsetY: number): void {
      let x = 0, y = 0;

      if (this.currentAnimation.gridType === 'square') {
          x = offsetX + asset.x * this.CELL_SIZE + this.CELL_SIZE / 2;
          y = offsetY + asset.y * this.CELL_SIZE + this.CELL_SIZE / 2;
      } else {
           const hexHeight = this.CELL_SIZE;
           const hexWidth = (Math.sqrt(3) / 2) * hexHeight;
           const vertDist = hexHeight * 0.75;
           
           x = offsetX + asset.x * hexWidth + (Math.floor(asset.y) % 2) * (hexWidth / 2) + hexWidth/2;
           y = offsetY + asset.y * vertDist + hexHeight/2;
      }

      this.ctx.save();
      this.ctx.translate(x, y);
      
      const angleRad = (asset.rotation * 45 - 90) * (Math.PI / 180);
      this.ctx.rotate(angleRad);

      this.ctx.fillStyle = (this.selectedInstanceId === asset.id) ? '#ff0' : '#0f0';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -15);
      this.ctx.lineTo(10, 10);
      this.ctx.lineTo(-10, 10);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#000';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(asset.assetId[0], -3, 5);

      this.ctx.restore();
  }

  private drawSquareGrid(offsetX: number, offsetY: number): void {
    for (let x = 0; x <= this.GRID_SIZE; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX + x * this.CELL_SIZE, offsetY);
      this.ctx.lineTo(offsetX + x * this.CELL_SIZE, offsetY + this.GRID_SIZE * this.CELL_SIZE);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.GRID_SIZE; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, offsetY + y * this.CELL_SIZE);
      this.ctx.lineTo(offsetX + this.GRID_SIZE * this.CELL_SIZE, offsetY + y * this.CELL_SIZE);
      this.ctx.stroke();
    }
  }

  private drawHexGrid(offsetX: number, offsetY: number): void {
    const hexHeight = this.CELL_SIZE;
    const hexWidth = (Math.sqrt(3) / 2) * hexHeight;
    const vertDist = hexHeight * 0.75;

    for (let row = 0; row < this.GRID_SIZE; row++) {
        for (let col = 0; col < this.GRID_SIZE; col++) {
            const x = offsetX + col * hexWidth + (row % 2) * (hexWidth / 2);
            const y = offsetY + row * vertDist;
            
            this.drawHexagon(x + hexWidth/2, y + hexHeight/2, this.CELL_SIZE / 2);
        }
    }
  }

  private drawHexagon(x: number, y: number, radius: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + radius * Math.cos(angle);
        const hy = y + radius * Math.sin(angle);
        if (i === 0) this.ctx.moveTo(hx, hy);
        else this.ctx.lineTo(hx, hy);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawCenterMarker(offsetX: number, offsetY: number): void {
      const cx = 4;
      const cy = 4;
      
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      if (this.currentAnimation.gridType === 'square') {
          this.ctx.fillRect(offsetX + cx * this.CELL_SIZE, offsetY + cy * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
      } else {
          const hexHeight = this.CELL_SIZE;
          const hexWidth = (Math.sqrt(3) / 2) * hexHeight;
          const vertDist = hexHeight * 0.75;

          const x = offsetX + cx * hexWidth + (cy % 2) * (hexWidth / 2);
          const y = offsetY + cy * vertDist;
          
          this.ctx.beginPath();
          const radius = this.CELL_SIZE / 2;
          const hCenterX = x + hexWidth/2;
          const hCenterY = y + hexHeight/2;
          
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = hCenterX + radius * Math.cos(angle);
            const hy = hCenterY + radius * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(hx, hy);
            else this.ctx.lineTo(hx, hy);
          }
          this.ctx.closePath();
          this.ctx.fill();
      }
  }
}
