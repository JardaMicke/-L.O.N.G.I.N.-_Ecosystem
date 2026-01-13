import { Component } from '../ecs/component';

export enum ItemType {
  Resource = 'Resource',
  Consumable = 'Consumable',
  Equipment = 'Equipment',
  Quest = 'Quest',
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  quantity: number;
  maxStack: number;
  icon?: string; // Path to icon or sprite ID
  data?: any; // Custom data (e.g., stats for equipment)
}

export class InventoryComponent extends Component {
  public readonly name = 'Inventory';
  public items: Item[] = [];
  public capacity: number;

  constructor(capacity: number = 20) {
    super();
    this.capacity = capacity;
  }

  public addItem(newItem: Item): boolean {
    // 1. Try to stack with existing items
    if (newItem.maxStack > 1) {
      const existingItem = this.items.find((i) => i.id === newItem.id && i.quantity < i.maxStack);
      if (existingItem) {
        const space = existingItem.maxStack - existingItem.quantity;
        const amountToAdd = Math.min(space, newItem.quantity);

        existingItem.quantity += amountToAdd;
        newItem.quantity -= amountToAdd;

        if (newItem.quantity === 0) {
          return true;
        }
        // If we still have quantity, try to add as new slot or stack again (recursion or loop)
        // For simplicity, let's just loop if we want perfect stacking,
        // but usually finding one slot is enough for simple implementations.
        // Let's do it properly:
        return this.addItem(newItem);
      }
    }

    // 2. Add as new item if we have space
    if (this.items.length < this.capacity) {
      // Clone the item to avoid reference issues if the source object is reused
      this.items.push({ ...newItem });
      return true;
    }

    return false; // Inventory full
  }

  public removeItem(itemId: string, quantity: number = 1): boolean {
    if (!this.hasItem(itemId, quantity)) {
      return false;
    }

    let remaining = quantity;

    // Iterate backwards to safely remove items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.id === itemId) {
        if (item.quantity >= remaining) {
          item.quantity -= remaining;
          remaining = 0;
          if (item.quantity === 0) {
            this.items.splice(i, 1);
          }
          break;
        } else {
          remaining -= item.quantity;
          this.items.splice(i, 1);
        }
      }
    }

    return true;
  }

  public hasItem(itemId: string, quantity: number = 1): boolean {
    let count = 0;
    for (const item of this.items) {
      if (item.id === itemId) {
        count += item.quantity;
      }
    }
    return count >= quantity;
  }

  public getCount(itemId: string): number {
    let count = 0;
    for (const item of this.items) {
      if (item.id === itemId) {
        count += item.quantity;
      }
    }
    return count;
  }

  public isFull(): boolean {
    return this.items.length >= this.capacity;
  }
}
