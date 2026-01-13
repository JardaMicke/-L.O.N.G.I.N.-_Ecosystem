
import { PathfindingManager } from '../gameplay/pathfinding-manager';
import { Tilemap } from '../world/tilemap';
import { Point } from '../utils/pathfinding-utils';
import { Camera } from '../graphics/camera';

export class PathfindingVisualizer {
    private manager: PathfindingManager;
    private tilemap: Tilemap;
    private startPoint: Point | null = null;
    private endPoint: Point | null = null;
    private currentPath: Point[] = [];
    private isVisible: boolean = false;

    constructor(manager: PathfindingManager, tilemap: Tilemap) {
        this.manager = manager;
        this.tilemap = tilemap;
    }

    public toggleVisibility(visible?: boolean) {
        this.isVisible = visible ?? !this.isVisible;
    }

    public isVisibleEnabled(): boolean {
        return this.isVisible;
    }

    public setStart(x: number, y: number) {
        this.startPoint = { x, y };
        this.recalculate();
    }

    public setEnd(x: number, y: number) {
        this.endPoint = { x, y };
        this.recalculate();
    }

    public clear() {
        this.startPoint = null;
        this.endPoint = null;
        this.currentPath = [];
    }

    private recalculate() {
        if (this.startPoint && this.endPoint) {
            this.currentPath = this.manager.findPath(this.startPoint, this.endPoint);
        }
    }

    public render(ctx: CanvasRenderingContext2D, camera: Camera) {
        if (!this.isVisible) return;

        const grid = this.manager.getGrid();
        const tileSize = this.tilemap.tileSize;
        const offsetX = -camera.x;
        const offsetY = -camera.y;

        // Optimization: Only draw visible grid cells
        const startCol = Math.floor(camera.x / tileSize);
        const endCol = startCol + (camera.width / tileSize) + 1;
        const startRow = Math.floor(camera.y / tileSize);
        const endRow = startRow + (camera.height / tileSize) + 1;

        for (let y = Math.max(0, startRow); y < Math.min(grid.length, endRow); y++) {
            for (let x = Math.max(0, startCol); x < Math.min(grid[0].length, endCol); x++) {
                const isWalkable = grid[y][x];
                
                // Draw blocked cells as red overlay
                if (!isWalkable) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.fillRect(x * tileSize + offsetX, y * tileSize + offsetY, tileSize, tileSize);
                } else {
                    // Draw walkable as faint green (optional, maybe too noisy)
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
                    ctx.fillRect(x * tileSize + offsetX, y * tileSize + offsetY, tileSize, tileSize);
                }
                
                // Grid lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.strokeRect(x * tileSize + offsetX, y * tileSize + offsetY, tileSize, tileSize);
            }
        }

        // Draw Start
        if (this.startPoint) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
            ctx.fillRect(this.startPoint.x * tileSize + offsetX, this.startPoint.y * tileSize + offsetY, tileSize, tileSize);
            ctx.strokeStyle = 'blue';
            ctx.strokeRect(this.startPoint.x * tileSize + offsetX, this.startPoint.y * tileSize + offsetY, tileSize, tileSize);
        }

        // Draw End
        if (this.endPoint) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.6)'; // Gold
            ctx.fillRect(this.endPoint.x * tileSize + offsetX, this.endPoint.y * tileSize + offsetY, tileSize, tileSize);
            ctx.strokeStyle = 'gold';
            ctx.strokeRect(this.endPoint.x * tileSize + offsetX, this.endPoint.y * tileSize + offsetY, tileSize, tileSize);
        }

        // Draw Path
        if (this.currentPath.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            this.currentPath.forEach((p, i) => {
                const px = p.x * tileSize + tileSize / 2 + offsetX;
                const py = p.y * tileSize + tileSize / 2 + offsetY;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();
        }
    }
}
