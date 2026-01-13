import { Logger } from '../utils/logger';

export enum ResourceType {
    GOLD = 'gold',
    WOOD = 'wood',
    IRON = 'iron',
    FOOD = 'food'
}

export class ResourceSystem {
    private resources: Record<ResourceType, number> = {
        [ResourceType.GOLD]: 0,
        [ResourceType.WOOD]: 0,
        [ResourceType.IRON]: 0,
        [ResourceType.FOOD]: 0
    };

    private capacity: number = 200; // Default max per resource

    constructor(initialRes?: Partial<Record<ResourceType, number>>) {
        if (initialRes) {
            Object.assign(this.resources, initialRes);
        }
    }

    public get(type: ResourceType): number {
        return this.resources[type];
    }

    public add(type: ResourceType, amount: number): void {
        if (amount < 0) return;
        this.resources[type] = Math.min(this.resources[type] + amount, this.capacity);
        Logger.info(`Added ${amount} ${type}. Total: ${this.resources[type]}`);
    }

    public remove(type: ResourceType, amount: number): boolean {
        if (this.resources[type] >= amount) {
            this.resources[type] -= amount;
            Logger.info(`Removed ${amount} ${type}. Total: ${this.resources[type]}`);
            return true;
        }
        return false;
    }

    public hasChecked(costs: Record<ResourceType, number>): boolean {
        for (const [type, cost] of Object.entries(costs)) {
            if (this.resources[type as ResourceType] < cost) return false;
        }
        return true;
    }
}
