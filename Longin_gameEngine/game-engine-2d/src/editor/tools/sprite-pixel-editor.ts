import { Logger } from '../../utils/logger';

export class SpritePixelEditor {
    private width: number;
    private height: number;
    private pixels: string[][]; // Store hex colors

    constructor(width: number = 16, height: number = 16) {
        this.width = width;
        this.height = height;
        this.pixels = Array(height).fill(null).map(() => Array(width).fill('#00000000')); // Transparent default
    }

    public setPixel(x: number, y: number, color: string): void {
        if (this.isValidCoordinate(x, y)) {
            this.pixels[y][x] = color;
            // Logger.info(`Set pixel ${x},${y} to ${color}`);
        }
    }

    public getPixel(x: number, y: number): string {
        if (this.isValidCoordinate(x, y)) {
            return this.pixels[y][x];
        }
        return '#00000000';
    }

    public resize(width: number, height: number): void {
        // Create new buffer
        const newPixels = Array(height).fill(null).map(() => Array(width).fill('#00000000'));

        // Copy old data
        for (let y = 0; y < Math.min(this.height, height); y++) {
            for (let x = 0; x < Math.min(this.width, width); x++) {
                newPixels[y][x] = this.pixels[y][x];
            }
        }

        this.width = width;
        this.height = height;
        this.pixels = newPixels;
        Logger.info(`Resized sprite to ${width}x${height}`);
    }

    public clear(color: string = '#00000000'): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.pixels[y][x] = color;
            }
        }
    }

    // Exports to simple JSON representation for now. 
    // In a real browser env we might use Canvas to produce DataURL.
    public exportData(): any {
        return {
            width: this.width,
            height: this.height,
            pixels: this.pixels
        };
    }

    public importData(data: any): void {
        if (data.width && data.height && data.pixels) {
            this.width = data.width;
            this.height = data.height;
            this.pixels = data.pixels;
        }
    }

    private isValidCoordinate(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}
