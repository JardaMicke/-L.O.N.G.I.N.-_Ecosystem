export class Gizmos {

    public static drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string = 'red'): void {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }

    public static drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, size: number, color: string = 'rgba(255, 255, 255, 0.2)'): void {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x <= width; x += size) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }

        for (let y = 0; y <= height; y += size) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }

        ctx.stroke();
    }

    public static drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string = 'yellow'): void {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}
