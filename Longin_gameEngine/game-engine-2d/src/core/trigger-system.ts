import { Logger } from '../utils/logger';
import { EventSystem } from '../core/event-system';

/**
 * Interface representing a condition that must be met for a trigger to fire.
 */
export interface TriggerCondition {
    evaluate(context: any): boolean;
}

/**
 * Interface representing an action to perform when a trigger fires.
 */
export interface TriggerAction {
    execute(context: any): void;
}

/**
 * Represents a Trigger that performs actions when conditions are met.
 */
export class Trigger {
    public isFired: boolean = false;
    public repeatCount: number = 0;
    public maxRepeats: number = 1;

    constructor(
        public id: string,
        private conditions: TriggerCondition[],
        private actions: TriggerAction[],
        maxRepeats: number = 1
    ) {
        this.maxRepeats = maxRepeats;
    }

    public check(context: any): void {
        if (this.isFired && this.repeatCount >= this.maxRepeats) return;

        const allMet = this.conditions.every(c => c.evaluate(context));

        if (allMet) {
            this.fire(context);
        }
    }

    private fire(context: any): void {
        Logger.info(`Trigger fired: ${this.id}`);
        this.actions.forEach(a => a.execute(context));
        this.repeatCount++;
        if (this.repeatCount >= this.maxRepeats) {
            this.isFired = true;
        }
    }
}

/**
 * Condition to check quest status.
 */
export class QuestStatusCondition implements TriggerCondition {
    constructor(private questId: string, private expectedStatus: any, private engine: any) { }
    evaluate(context: any): boolean {
        const quest = this.engine.questManager.getQuest(this.questId);
        return quest ? quest.status === this.expectedStatus : false;
    }
}

/**
 * Action to log a message.
 */
export class LogTriggerAction implements TriggerAction {
    constructor(private message: string) { }
    execute(context: any): void {
        Logger.info(`[TriggerAction] ${this.message}`);
    }
}

/**
 * System managed by the engine to handle world triggers.
 */
export class TriggerSystem {
    private triggers: Trigger[] = [];
    private eventSystem: EventSystem;

    constructor(eventSystem: EventSystem) {
        this.eventSystem = eventSystem;
        this.setupListeners();
    }

    private setupListeners(): void {
        // Triggers are evaluated on specific events
        this.eventSystem.on('update', (dt: number) => {
            this.evaluateTriggers({ type: 'update', deltaTime: dt });
        });

        this.eventSystem.on('quest:completed', (data: any) => {
            this.evaluateTriggers({ type: 'quest:completed', ...data });
        });

        // We can add more specific events if needed
    }

    public addTrigger(trigger: Trigger): void {
        this.triggers.push(trigger);
    }

    private evaluateTriggers(context: any): void {
        for (const trigger of this.triggers) {
            trigger.check(context);
        }
    }
}
