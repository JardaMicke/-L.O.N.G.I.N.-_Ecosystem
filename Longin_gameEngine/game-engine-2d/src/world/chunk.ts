import { Logger } from '../utils/logger';
import { Tile } from './tilemap';

// Simple Vector2 interface if not found elsewhere, but we will likely import it
export interface Vector2 {
    x: number;
    y: number;
}

export class Chunk {
    public static readonly SIZE = 16;
    public readonly x: number;
    public readonly y: number;
    // Using 3 layers: Ground, Decoration, Overhead
    public layers: number[][][];
    public isDirty: boolean = false;

    // Entities IDs present in this chunk
    public entities: Set<string>;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.entities = new Set();
        this.layers = [
            this.createEmptyLayer(), // Layer 0: Ground
            this.createEmptyLayer(), // Layer 1: Decoration
            this.createEmptyLayer()  // Layer 2: Overhead
        ];
    }

    private createEmptyLayer(): number[][] {
        return Array(Chunk.SIZE).fill(null).map(() => Array(Chunk.SIZE).fill(0));
    }

    public getTile(layerIndex: number, localX: number, localY: number): number {
        if (this.isValidCoordinate(layerIndex, localX, localY)) {
            return this.layers[layerIndex][localY][localX];
        }
        return 0;
    }

    public setTile(layerIndex: number, localX: number, localY: number, tileId: number): void {
        if (this.isValidCoordinate(layerIndex, localX, localY)) {
            this.layers[layerIndex][localY][localX] = tileId;
            this.isDirty = true;
        }
    }

    private isValidCoordinate(layer: number, x: number, y: number): boolean {
        return layer >= 0 && layer < this.layers.length &&
            x >= 0 && x < Chunk.SIZE &&
            y >= 0 && y < Chunk.SIZE;
    }

    public serialize(): any {
        return {
            x: this.x,
            y: this.y,
            layers: this.layers,
            entities: Array.from(this.entities)
        };
    }

    public static deserialize(data: any): Chunk {
        const chunk = new Chunk(data.x, data.y);
        chunk.layers = data.layers || chunk.layers;
        chunk.entities = new Set(data.entities || []);
        return chunk;
    }
}
