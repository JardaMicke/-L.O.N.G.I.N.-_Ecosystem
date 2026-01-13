import { Logger } from '../utils/logger';
import { EventSystem } from '../core/event-system';

/**
 * Status of a quest or an objective.
 */
export enum QuestStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

/**
 * Interface representing a single quest objective.
 */
export interface Objective {
    id: string;
    description: string;
    isCompleted: boolean;
    currentValue: number;
    targetValue: number;

    update(eventSystem: EventSystem, data: any): void;
}

/**
 * Abstract class for common objective logic.
 */
export abstract class BaseObjective implements Objective {
    public isCompleted: boolean = false;
    public currentValue: number = 0;

    constructor(
        public id: string,
        public description: string,
        public targetValue: number
    ) { }

    abstract update(eventSystem: EventSystem, data: any): void;

    protected checkCompletion(): void {
        if (this.currentValue >= this.targetValue) {
            this.isCompleted = true;
        }
    }
}

/**
 * Concrete implementation for "Kill X entities" objective.
 */
export class KillObjective extends BaseObjective {
    constructor(
        id: string,
        description: string,
        targetValue: number,
        private entityType?: string
    ) {
        super(id, description, targetValue);
    }

    update(eventSystem: EventSystem, data: any): void {
        if (this.isCompleted) return;

        if (data.type === 'entity:death') {
            if (!this.entityType || data.entityType === this.entityType) {
                this.currentValue++;
                this.checkCompletion();
            }
        }
    }
}

/**
 * Concrete implementation for "Collect X resources" objective.
 */
export class CollectObjective extends BaseObjective {
    constructor(
        id: string,
        description: string,
        targetValue: number,
        private resourceType: string
    ) {
        super(id, description, targetValue);
    }

    update(eventSystem: EventSystem, data: any): void {
        if (this.isCompleted) return;

        if (data.type === 'resource:collected') {
            if (data.resourceType === this.resourceType) {
                this.currentValue += data.amount;
                this.checkCompletion();
            }
        }
    }
}

/**
 * Represents a Quest, which is a collection of objectives.
 */
export class Quest {
    public status: QuestStatus = QuestStatus.NOT_STARTED;
    public objectives: Objective[] = [];

    constructor(
        public id: string,
        public title: string,
        public description: string,
        objectives: Objective[] = []
    ) {
        this.objectives = objectives;
    }

    public update(eventSystem: EventSystem, data: any): void {
        if (this.status !== QuestStatus.IN_PROGRESS) return;

        let allCompleted = true;
        for (const obj of this.objectives) {
            obj.update(eventSystem, data);
            if (!obj.isCompleted) {
                allCompleted = false;
            }
        }

        if (allCompleted) {
            this.status = QuestStatus.COMPLETED;
            Logger.info(`Quest COMPLETED: ${this.title}`);
            eventSystem.emit('quest:completed', { questId: this.id });
        }
    }

    public start(): void {
        this.status = QuestStatus.IN_PROGRESS;
        Logger.info(`Quest STARTED: ${this.title}`);
    }
}
