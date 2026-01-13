import { Logger } from '../utils/logger';
import { EventSystem } from '../core/event-system';
import { Quest, QuestStatus } from './quest';

/**
 * Manager responsible for tracking and updating all game quests.
 */
export class QuestManager {
    private quests: Map<string, Quest> = new Map();
    private eventSystem: EventSystem;

    constructor(eventSystem: EventSystem) {
        this.eventSystem = eventSystem;
        this.setupListeners();
    }

    private setupListeners(): void {
        // Listen to generic game events that might trigger quest updates
        this.eventSystem.on('entity:death', (data: any) => {
            this.updateQuests({ type: 'entity:death', ...data });
        });

        this.eventSystem.on('resource:collected', (data: any) => {
            this.updateQuests({ type: 'resource:collected', ...data });
        });

        this.eventSystem.on('area:reached', (data: any) => {
            this.updateQuests({ type: 'area:reached', ...data });
        });
    }

    /**
     * Registers and starts a new quest.
     * @param quest The quest instance to add.
     */
    public acceptQuest(quest: Quest): void {
        if (this.quests.has(quest.id)) {
            Logger.warn(`Quest ${quest.id} is already registered.`);
            return;
        }
        this.quests.set(quest.id, quest);
        quest.start();
        this.eventSystem.emit('quest:started', { questId: quest.id, title: quest.title });
    }

    /**
     * Updates all active quests with new data.
     * @param data Event data.
     */
    private updateQuests(data: any): void {
        for (const quest of this.quests.values()) {
            if (quest.status === QuestStatus.IN_PROGRESS) {
                quest.update(this.eventSystem, data);
            }
        }
    }

    /**
     * Retrieves a quest by ID.
     */
    public getQuest(id: string): Quest | undefined {
        return this.quests.get(id);
    }

    /**
     * Returns all registered quests.
     */
    public getAllQuests(): Quest[] {
        return Array.from(this.quests.values());
    }

    /**
     * Returns only active (in-progress) quests.
     */
    public getActiveQuests(): Quest[] {
        return this.getAllQuests().filter(q => q.status === QuestStatus.IN_PROGRESS);
    }
}
