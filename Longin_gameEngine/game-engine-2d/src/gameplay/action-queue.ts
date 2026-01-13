
import { Logger } from '../utils/logger';

// Interface for a generic game action
export interface GameAction {
    id: string;
    execute(): void;
    isFinished(): boolean;
    priority?: number;
}

export class ActionQueue {
    private queue: GameAction[] = [];
    public currentAction: GameAction | null = null;

    public enqueue(action: GameAction): void {
        this.queue.push(action);
        Logger.info(`Action enqueued: ${action.id}`);
    }

    public clear(): void {
        this.queue = [];
        this.currentAction = null;
    }

    public update(): void {
        if (!this.currentAction) {
            if (this.queue.length > 0) {
                this.currentAction = this.queue.shift()!;
                Logger.info(`Starting action: ${this.currentAction.id}`);
                this.currentAction.execute();
            }
        } else {
            if (this.currentAction.isFinished()) {
                Logger.info(`Action finished: ${this.currentAction.id}`);
                this.currentAction = null;
            }
        }
    }

    public isEmpty(): boolean {
        return this.currentAction === null && this.queue.length === 0;
    }
}
