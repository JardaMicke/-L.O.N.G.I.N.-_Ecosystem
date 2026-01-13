import { TransformComponent } from '../core/components';
import { Entity } from '../ecs/entity';
import { Tilemap } from '../world/tilemap';

import { InventoryComponent } from './inventory';

export interface BuildingBlueprint {
  id: string;
  name: string;
  width: number; // in tiles
  height: number; // in tiles
  cost: { itemId: string; amount: number }[];
  tileId?: number; // Tile ID to set on map for collision/logic
  passable: boolean;
  // visual details would go here (sprite, etc)
}

export class BuildingSystem {
  private tilemap: Tilemap;
  private buildingsLayer: string = 'buildings';

  constructor(tilemap: Tilemap, buildingsLayer: string = 'buildings') {
    this.tilemap = tilemap;
    this.buildingsLayer = buildingsLayer;

    // Ensure layer exists
    if (!this.tilemap.getLayerNames().includes(this.buildingsLayer)) {
      this.tilemap.createLayer(this.buildingsLayer);
    }
  }

  public canPlace(
    x: number,
    y: number,
    blueprint: BuildingBlueprint,
    inventory?: InventoryComponent,
  ): boolean {
    // 1. Check bounds
    if (
      x < 0 ||
      y < 0 ||
      x + blueprint.width > this.tilemap.width ||
      y + blueprint.height > this.tilemap.height
    ) {
      return false;
    }

    // 2. Check collisions (must be walkable / empty)
    // We assume we want to place on empty space.
    // If the blueprint is passable (e.g. a road), maybe we can place on non-walkable?
    // Usually we check if the ground is valid.
    // For simplicity: Check if the area is currently walkable.
    for (let i = 0; i < blueprint.width; i++) {
      for (let j = 0; j < blueprint.height; j++) {
        if (!this.tilemap.isWalkable(x + i, y + j)) {
          return false;
        }
      }
    }

    // 3. Check cost
    if (inventory) {
      for (const cost of blueprint.cost) {
        if (!inventory.hasItem(cost.itemId, cost.amount)) {
          return false;
        }
      }
    }

    return true;
  }

  public placeBuilding(
    x: number,
    y: number,
    blueprint: BuildingBlueprint,
    inventory?: InventoryComponent,
  ): Entity | null {
    if (!this.canPlace(x, y, blueprint, inventory)) {
      return null;
    }

    // 1. Deduct cost
    if (inventory) {
      for (const cost of blueprint.cost) {
        inventory.removeItem(cost.itemId, cost.amount);
      }
    }

    // 2. Update Tilemap
    // If tileId is provided, we set it. The tile definition determines walkability.
    if (blueprint.tileId !== undefined) {
      for (let i = 0; i < blueprint.width; i++) {
        for (let j = 0; j < blueprint.height; j++) {
          this.tilemap.setTile(this.buildingsLayer, x + i, y + j, blueprint.tileId);
        }
      }
    }

    // 3. Create Entity
    // We center the entity or place at top-left?
    // Transform usually denotes top-left or center depending on engine convention.
    // In this engine, renderer seems to draw images at x,y.
    // Let's assume Top-Left for now as it matches grid coordinates.
    const pixelX = x * this.tilemap.tileSize;
    const pixelY = y * this.tilemap.tileSize;

    const buildingEntity = new Entity(`building_${blueprint.id}_${x}_${y}`);
    buildingEntity.addComponent(new TransformComponent(pixelX, pixelY));

    // Add a tag or component to identify as building
    // buildingEntity.addComponent(new BuildingComponent(blueprint)); // If we had one

    return buildingEntity;
  }
}
