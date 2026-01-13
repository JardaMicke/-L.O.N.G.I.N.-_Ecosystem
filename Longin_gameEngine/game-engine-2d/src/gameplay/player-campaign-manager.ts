import { Logger } from '../utils/logger';
import { EventSystem } from '../core/event-system';

/**
 * Interface representing the state of a game campaign.
 */
export interface CampaignState {
    lastScenarioId: string;
    completedScenarios: string[];
    globalVariables: Record<string, any>;
    currentQuestIds: string[];
}

/**
 * Manager for handling campaign progression and persistent variables across scenarios.
 */
export class PlayerCampaignManager {
    private state: CampaignState = {
        lastScenarioId: '',
        completedScenarios: [],
        globalVariables: {},
        currentQuestIds: []
    };
    private eventSystem: EventSystem;
    private storageKey: string = 'campaign_data';

    constructor(eventSystem: EventSystem) {
        this.eventSystem = eventSystem;
        this.load();
        this.setupListeners();
    }

    private setupListeners(): void {
        this.eventSystem.on('quest:completed', (data: any) => {
            this.setVariable(`quest_${data.questId}_completed`, true);
        });
    }

    /**
     * Sets a persistent campaign variable.
     */
    public setVariable(key: string, value: any): void {
        this.state.globalVariables[key] = value;
        this.save();
        this.eventSystem.emit('campaign:variable_changed', { key, value });
    }

    /**
     * Gets a campaign variable.
     */
    public getVariable<T>(key: string, defaultValue?: T): T | undefined {
        return this.state.globalVariables[key] ?? defaultValue;
    }

    /**
     * Completes a scenario and marks it in the state.
     */
    public completeScenario(id: string): void {
        if (!this.state.completedScenarios.includes(id)) {
            this.state.completedScenarios.push(id);
        }
        this.state.lastScenarioId = id;
        this.save();
        this.eventSystem.emit('campaign:scenario_completed', { scenarioId: id });
    }

    /**
     * Saves campaign data to persistent storage.
     */
    public save(): void {
        if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
            try {
                (globalThis as any).localStorage.setItem(this.storageKey, JSON.stringify(this.state));
                Logger.info('Campaign state saved.');
            } catch (e) {
                Logger.error('Failed to save campaign state', e as Error);
            }
        }
    }

    /**
     * Loads campaign data from persistent storage.
     */
    public load(): void {
        if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
            const data = (globalThis as any).localStorage.getItem(this.storageKey);
            if (data) {
                try {
                    this.state = JSON.parse(data);
                    Logger.info('Campaign state loaded.');
                } catch (e) {
                    Logger.error('Failed to parse campaign state', e as Error);
                }
            }
        }
    }

    /**
     * Resets the entire campaign progress.
     */
    public reset(): void {
        this.state = {
            lastScenarioId: '',
            completedScenarios: [],
            globalVariables: {},
            currentQuestIds: []
        };
        this.save();
        Logger.info('Campaign reset.');
    }

    public getState(): CampaignState {
        return { ...this.state };
    }
}
