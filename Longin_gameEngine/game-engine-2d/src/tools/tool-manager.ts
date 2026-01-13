import { Tilemap } from '../world/tilemap';

import { MapEditor } from './map-editor';
import { SpriteEditor, Sprite } from './sprite-editor';
import { ConfigEditor } from './config-editor';
import { BTEditor } from './bt-editor';
import { AnimationEditor } from './animation-editor';
import { SpriteManager } from '../graphics/sprite-manager';

export class ToolManager {
  public mapEditor?: MapEditor;
  public spriteEditor?: SpriteEditor;
  public configEditor?: ConfigEditor;
  public btEditor?: BTEditor;
  public animationEditor?: AnimationEditor;

  constructor(spriteManager: SpriteManager) {
    this.configEditor = new ConfigEditor();
    this.btEditor = new BTEditor();
    this.animationEditor = new AnimationEditor(spriteManager);
  }

  public startMapEditing(tilemap: Tilemap): MapEditor {
    this.mapEditor = new MapEditor(tilemap);
    return this.mapEditor;
  }

  public startSpriteEditing(width: number, height: number): SpriteEditor {
    const sprite = new Sprite(width, height);
    this.spriteEditor = new SpriteEditor(sprite);
    return this.spriteEditor;
  }

  public loadSpriteForEditing(sprite: Sprite): SpriteEditor {
    this.spriteEditor = new SpriteEditor(sprite);
    return this.spriteEditor;
  }

  public stopEditing(): void {
    this.mapEditor = undefined;
    this.spriteEditor = undefined;
    // ConfigEditor, BTEditor and AnimationEditor persist
  }
}
