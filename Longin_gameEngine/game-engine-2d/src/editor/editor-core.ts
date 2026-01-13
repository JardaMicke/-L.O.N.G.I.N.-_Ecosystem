import { Logger } from '../utils/logger';

export enum EditorTool {
    NONE = 'none',
    SELECT = 'select',
    BRUSH = 'brush',
    ERASER = 'eraser',
    BUCKET = 'bucket',
    PICKER = 'picker'
}

export class EditorCore {
    private static instance: EditorCore;

    public isActive: boolean = false;
    public activeTool: EditorTool = EditorTool.NONE;
    public selectedLayer: number = 0;

    // Selection state
    public selectedEntityId: string | null = null;

    private constructor() {
        Logger.info('EditorCore initialized');
    }

    public static getInstance(): EditorCore {
        if (!EditorCore.instance) {
            EditorCore.instance = new EditorCore();
        }
        return EditorCore.instance;
    }

    public toggle(active: boolean): void {
        this.isActive = active;
        Logger.info(`Editor mode: ${this.isActive ? 'ON' : 'OFF'}`);
    }

    public setTool(tool: EditorTool): void {
        this.activeTool = tool;
        Logger.info(`Editor tool set to: ${tool}`);
    }

    public selectEntity(entityId: string | null): void {
        this.selectedEntityId = entityId;
        Logger.info(`Editor selected entity: ${entityId}`);
    }
}
