export interface Point {
  x: number;
  y: number;
}

export interface SpriteMetadata {
  walkableZones?: Point[][];
  variants?: string[]; // Asset IDs for variants
  variantWeights?: number[]; // Probabilities
  accessibleHeight?: number;
  maxAccessibleHeight?: number;
  actionBindings?: Record<string, string>;
}

export class Sprite {
  public width: number;
  public height: number;
  public pixels: (string | null)[]; // null = transparent
  public metadata: SpriteMetadata;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Array(width * height).fill(null);
    this.metadata = {
      // walkableZones is undefined by default, implying "pass-through" (no override)
    };
  }

  public getPixel(x: number, y: number): string | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.pixels[y * this.width + x];
  }

  public setPixel(x: number, y: number, color: string | null): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.pixels[y * this.width + x] = color;
  }
}

export type SpriteTool = 'pen' | 'eraser' | 'fill' | 'picker' | 'polygon' | 'rect-zone';

interface SpriteAction {
  changes?: { x: number; y: number; oldColor: string | null; newColor: string | null }[];
  polygon?: Point[];
}

export class SpriteEditor {
  public sprite: Sprite;
  private currentColor: string = '#000000';
  private currentTool: SpriteTool = 'pen';
  private currentPolygon: Point[] = [];
  private dragStart: Point | null = null; // For rect-zone
  private currentMousePos: Point | null = null; // For preview

  private undoStack: SpriteAction[] = [];
  private redoStack: SpriteAction[] = [];

  constructor(widthOrSprite: number | Sprite, height?: number) {
    if (widthOrSprite instanceof Sprite) {
      this.sprite = widthOrSprite;
    } else {
      this.sprite = new Sprite(widthOrSprite, height!);
    }
  }

  public setColor(color: string): void {
    this.currentColor = color;
  }

  public setTool(tool: SpriteTool): void {
    this.currentTool = tool;
    // Reset states when switching tools
    this.currentPolygon = [];
    this.dragStart = null;
  }

  public onMouseMove(x: number, y: number): void {
    this.currentMousePos = { x, y };
  }

  public applyAction(x: number, y: number): void {
    const changes: { x: number; y: number; oldColor: string | null; newColor: string | null }[] =
      [];

    if (this.currentTool === 'pen') {
      const oldColor = this.sprite.getPixel(x, y);
      if (oldColor !== this.currentColor) {
        this.sprite.setPixel(x, y, this.currentColor);
        changes.push({ x, y, oldColor, newColor: this.currentColor });
      }
    } else if (this.currentTool === 'eraser') {
      const oldColor = this.sprite.getPixel(x, y);
      if (oldColor !== null) {
        this.sprite.setPixel(x, y, null);
        changes.push({ x, y, oldColor, newColor: null });
      }
    } else if (this.currentTool === 'picker') {
      const color = this.sprite.getPixel(x, y);
      if (color !== null) {
        this.currentColor = color;
      }
      // No history change for picker
    } else if (this.currentTool === 'fill') {
      this.floodFill(x, y, this.currentColor, changes);
    } else if (this.currentTool === 'polygon') {
      this.handlePolygonTool(x, y);
      return; // Polygon actions are handled separately for undo/redo
    } else if (this.currentTool === 'rect-zone') {
      this.handleRectZoneTool(x, y);
      return;
    }

    if (changes && changes.length > 0) {
      this.undoStack.push({ changes });
      this.redoStack = [];
    }
  }

  private handleRectZoneTool(x: number, y: number): void {
    if (x < 0 || x >= this.sprite.width || y < 0 || y >= this.sprite.height) return;

    if (!this.dragStart) {
      this.dragStart = { x, y };
    } else {
      const start = this.dragStart;
      const end = { x, y };
      
      const x1 = Math.min(start.x, end.x);
      const y1 = Math.min(start.y, end.y);
      const x2 = Math.max(start.x, end.x);
      const y2 = Math.max(start.y, end.y);

      const rectPoly: Point[] = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x2, y: y2 },
        { x: x1, y: y2 }
      ];

      if (!this.sprite.metadata.walkableZones) {
        this.sprite.metadata.walkableZones = [];
      }
      this.sprite.metadata.walkableZones.push(rectPoly);
      this.undoStack.push({ polygon: rectPoly });
      this.redoStack = [];
      this.dragStart = null;
    }
  }

  private handlePolygonTool(x: number, y: number): void {
    // Validation: Check bounds
    if (x < 0 || x >= this.sprite.width || y < 0 || y >= this.sprite.height) return;

    // Validation: Must be on opaque pixel (as per user request)
    if (this.sprite.getPixel(x, y) === null) return;

    // Check if closing the polygon (near start point)
    if (this.currentPolygon.length > 2) {
      const start = this.currentPolygon[0];
      const dist = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
      if (dist < 2) { // Tolerance
        this.finishPolygon();
        return;
      }
    }

    this.currentPolygon.push({ x, y });
  }

  public finishPolygon(): void {
    if (this.currentPolygon.length < 3) return; // Need at least 3 points
    
    // Deep copy points
    const newPoly = this.currentPolygon.map(p => ({ ...p }));
    
    if (!this.sprite.metadata.walkableZones) {
      this.sprite.metadata.walkableZones = [];
    }
    this.sprite.metadata.walkableZones.push(newPoly);
    
    this.undoStack.push({ polygon: newPoly });
    this.redoStack = [];
    
    this.currentPolygon = [];
  }

  public getWalkableZones(): Point[][] {
    return this.sprite.metadata.walkableZones || [];
  }

  public getCurrentPolygon(): Point[] {
    return this.currentPolygon;
  }

  public undo(): void {
    const action = this.undoStack.pop();
    if (action) {
      if (action.changes) {
        for (const change of action.changes) {
          this.sprite.setPixel(change.x, change.y, change.oldColor);
        }
      } else if (action.polygon) {
        // Remove the polygon from metadata
        if (this.sprite.metadata.walkableZones) {
          const index = this.sprite.metadata.walkableZones.findIndex(p => p === action.polygon);
          if (index !== -1) {
            this.sprite.metadata.walkableZones.splice(index, 1);
          } else {
             // Fallback: remove last
             this.sprite.metadata.walkableZones.pop();
          }
        }
      }
      this.redoStack.push(action);
    }
  }

  public redo(): void {
    const action = this.redoStack.pop();
    if (action) {
      if (action.changes) {
        for (const change of action.changes) {
          this.sprite.setPixel(change.x, change.y, change.newColor);
        }
      } else if (action.polygon) {
        if (!this.sprite.metadata.walkableZones) this.sprite.metadata.walkableZones = [];
        this.sprite.metadata.walkableZones.push(action.polygon);
      }
      this.undoStack.push(action);
    }
  }

  private floodFill(startX: number, startY: number, targetColor: string, changes: any[]): void {
    // Check bounds for start
    if (startX < 0 || startX >= this.sprite.width || startY < 0 || startY >= this.sprite.height)
      return;

    const startColor = this.sprite.getPixel(startX, startY);
    if (startColor === targetColor) return;

    const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      // Check bounds
      if (x < 0 || x >= this.sprite.width || y < 0 || y >= this.sprite.height) continue;

      const currentColor = this.sprite.getPixel(x, y);

      if (currentColor === startColor) {
        this.sprite.setPixel(x, y, targetColor);
        changes.push({ x, y, oldColor: currentColor, newColor: targetColor });

        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
      }
    }
  }

  public toDataURL(): string {
    // Mock implementation for node environment or use Canvas
    // Since we are in Node, we can't easily generate dataURL without 'canvas' package.
    // We will return JSON for now or placeholder.
    return JSON.stringify(this.sprite.pixels);
  }

  /**
   * Renders the sprite and editor overlays (like walkable zones) to a canvas context.
   * This provides the requested visual feedback.
   */
  public render(ctx: CanvasRenderingContext2D, scale: number = 1): void {
    // 1. Render Pixels
    for (let y = 0; y < this.sprite.height; y++) {
      for (let x = 0; x < this.sprite.width; x++) {
        const color = this.sprite.getPixel(x, y);
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    // 2. Render Walkable Zones (Metadata)
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'; // Green for completed zones
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';

    if (this.sprite.metadata.walkableZones) {
      for (const zone of this.sprite.metadata.walkableZones) {
        if (zone.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(zone[0].x * scale + scale / 2, zone[0].y * scale + scale / 2);
        for (let i = 1; i < zone.length; i++) {
          ctx.lineTo(zone[i].x * scale + scale / 2, zone[i].y * scale + scale / 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 3. Render Current Polygon (in progress)
    if (this.currentTool === 'polygon' && this.currentPolygon.length > 0) {
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)'; // Blue for active drawing
      ctx.beginPath();
      const start = this.currentPolygon[0];
      ctx.moveTo(start.x * scale + scale / 2, start.y * scale + scale / 2);
      for (let i = 1; i < this.currentPolygon.length; i++) {
        const p = this.currentPolygon[i];
        ctx.lineTo(p.x * scale + scale / 2, p.y * scale + scale / 2);
      }
      ctx.stroke();

      // Draw points
      ctx.fillStyle = 'blue';
      for (const p of this.currentPolygon) {
        ctx.fillRect(p.x * scale, p.y * scale, scale, scale);
      }

      // Elastic line to mouse cursor
      if (this.currentMousePos) {
        const last = this.currentPolygon[this.currentPolygon.length - 1];
        ctx.beginPath();
        ctx.moveTo(last.x * scale + scale / 2, last.y * scale + scale / 2);
        ctx.lineTo(this.currentMousePos.x * scale + scale / 2, this.currentMousePos.y * scale + scale / 2);
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.stroke();
      }
    }

    // 4. Render Rect Zone Drag Preview
    if (this.currentTool === 'rect-zone' && this.dragStart && this.currentMousePos) {
      const start = this.dragStart;
      const end = this.currentMousePos;
      
      const x1 = Math.min(start.x, end.x);
      const y1 = Math.min(start.y, end.y);
      const x2 = Math.max(start.x, end.x);
      const y2 = Math.max(start.y, end.y);

      const x = x1 * scale;
      const y = y1 * scale;
      const w = (Math.abs(x2 - x1) + 1) * scale;
      const h = (Math.abs(y2 - y1) + 1) * scale;

      ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
  }

  // Variant Management
  public addVariant(assetId: string, weight: number = 1.0): void {
    if (!this.sprite.metadata.variants) this.sprite.metadata.variants = [];
    if (!this.sprite.metadata.variantWeights) this.sprite.metadata.variantWeights = [];

    this.sprite.metadata.variants.push(assetId);
    this.sprite.metadata.variantWeights.push(weight);
  }

  public removeVariant(assetId: string): void {
    if (!this.sprite.metadata.variants) return;
    const index = this.sprite.metadata.variants.indexOf(assetId);
    if (index !== -1) {
      this.sprite.metadata.variants.splice(index, 1);
      if (this.sprite.metadata.variantWeights) {
        this.sprite.metadata.variantWeights.splice(index, 1);
      }
    }
  }

  public getVariants(): string[] {
    return this.sprite.metadata.variants || [];
  }

  public getVariantWeights(): number[] {
    return this.sprite.metadata.variantWeights || [];
  }

  public setAccessibleHeight(height: number): void {
    const max = this.sprite.metadata.maxAccessibleHeight || 10;
    // Validate range
    if (height < 1) height = 1;
    if (height > max) height = max;
    
    this.sprite.metadata.accessibleHeight = height;
  }

  public setMaxAccessibleHeight(max: number): void {
    if (max < 1) max = 1;
    this.sprite.metadata.maxAccessibleHeight = max;
    
    // Re-validate current height
    if (this.sprite.metadata.accessibleHeight && this.sprite.metadata.accessibleHeight > max) {
        this.sprite.metadata.accessibleHeight = max;
    }
  }

  public getAccessibleHeight(): number {
    return this.sprite.metadata.accessibleHeight || 0; // 0 implies not set/default
  }

  public getMaxAccessibleHeight(): number {
      return this.sprite.metadata.maxAccessibleHeight || 10;
  }

  public bindAction(action: string, animation: string): void {
      if (!this.sprite.metadata.actionBindings) {
          this.sprite.metadata.actionBindings = {};
      }
      this.sprite.metadata.actionBindings[action] = animation;
  }

  public getActionBinding(action: string): string | undefined {
      return this.sprite.metadata.actionBindings ? this.sprite.metadata.actionBindings[action] : undefined;
  }

  public getAllBindings(): Record<string, string> {
      return this.sprite.metadata.actionBindings || {};
  }

  public removeBinding(action: string): void {
      if (this.sprite.metadata.actionBindings) {
          delete this.sprite.metadata.actionBindings[action];
      }
  }
}
