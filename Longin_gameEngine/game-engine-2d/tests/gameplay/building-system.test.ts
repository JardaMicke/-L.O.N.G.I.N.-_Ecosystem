import { Entity } from '../../src/ecs/entity';
import { BuildingSystem, BuildingBlueprint } from '../../src/gameplay/building-system';
import { InventoryComponent, ItemType } from '../../src/gameplay/inventory';
import { Tilemap } from '../../src/world/tilemap';

describe('BuildingSystem', () => {
  let tilemap: Tilemap;
  let inventory: InventoryComponent;
  let buildingSystem: BuildingSystem;
  let blueprint: BuildingBlueprint;

  beforeEach(() => {
    // Setup Tilemap 10x10, tileSize 32
    tilemap = new Tilemap(10, 10, 32);
    // Register a walkable tile (0 is empty/walkable by default in our mock logic usually,
    // but Tilemap.isWalkable checks if tileId != 0 => tile.walkable.
    // Wait, Tilemap.ts says: if tileId !== 0 { if (!tile.walkable) return false; }
    // So 0 (empty) is walkable.

    // Register a blocked tile
    tilemap.registerTile(1, { id: 1, type: 'wall', walkable: false });
    // Register a building tile
    tilemap.registerTile(2, { id: 2, type: 'building', walkable: false });

    inventory = new InventoryComponent(100);
    inventory.addItem({
      id: 'wood',
      name: 'Wood',
      type: ItemType.Resource,
      quantity: 100,
      maxStack: 100,
    });
    inventory.addItem({
      id: 'gold',
      name: 'Gold',
      type: ItemType.Resource,
      quantity: 50,
      maxStack: 100,
    });

    buildingSystem = new BuildingSystem(tilemap);

    blueprint = {
      id: 'house',
      name: 'House',
      width: 2,
      height: 2,
      cost: [
        { itemId: 'wood', amount: 50 },
        { itemId: 'gold', amount: 10 },
      ],
      tileId: 2,
      passable: false,
    };
  });

  it('should initialize and create layer', () => {
    expect(tilemap.getLayerNames()).toContain('buildings');
  });

  it('should allow placement when valid', () => {
    expect(buildingSystem.canPlace(0, 0, blueprint, inventory)).toBe(true);
  });

  it('should not allow placement out of bounds', () => {
    expect(buildingSystem.canPlace(-1, 0, blueprint, inventory)).toBe(false);
    expect(buildingSystem.canPlace(9, 9, blueprint, inventory)).toBe(false); // 2x2 needs 9,9 -> 10,10 which is out
  });

  it('should not allow placement if obstructed', () => {
    // Place an obstruction
    tilemap.setTile('default', 0, 0, 1); // 1 is wall/unwalkable
    expect(buildingSystem.canPlace(0, 0, blueprint, inventory)).toBe(false);
  });

  it('should not allow placement if insufficient resources', () => {
    inventory.removeItem('wood', 80); // 20 left, need 50
    expect(buildingSystem.canPlace(0, 0, blueprint, inventory)).toBe(false);
  });

  it('should place building successfully', () => {
    const entity = buildingSystem.placeBuilding(2, 2, blueprint, inventory);

    expect(entity).toBeDefined();
    expect(entity instanceof Entity).toBe(true);

    // Check cost deducted
    expect(inventory.getCount('wood')).toBe(50);
    expect(inventory.getCount('gold')).toBe(40);

    // Check tilemap updated
    // 2,2 to 3,3 should be tileId 2
    expect(tilemap.getTileId('buildings', 2, 2)).toBe(2);
    expect(tilemap.getTileId('buildings', 3, 2)).toBe(2);
    expect(tilemap.getTileId('buildings', 2, 3)).toBe(2);
    expect(tilemap.getTileId('buildings', 3, 3)).toBe(2);

    // Check collision (now it should be blocked because we set tileId 2 which is unwalkable)
    expect(tilemap.isWalkable(2, 2)).toBe(false);
  });

  it('should fail to place building if conditions not met', () => {
    tilemap.setTile('default', 2, 2, 1); // Blocked
    const entity = buildingSystem.placeBuilding(2, 2, blueprint, inventory);

    expect(entity).toBeNull();
    expect(inventory.getCount('wood')).toBe(100); // No refund needed as not spent
  });
});
