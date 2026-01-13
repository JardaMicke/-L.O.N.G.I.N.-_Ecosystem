import { Logger } from '../utils/logger';
import { EventSystem } from '../core/event-system';

/**
 * Interface representing a choice in a dialogue branching.
 */
export interface DialogueChoice {
    text: string;
    nextId?: string;
    action?: () => void;
}

/**
 * Interface representing a single piece of dialogue.
 */
export interface DialogueNode {
    id: string;
    speaker: string;
    text: string;
    choices?: DialogueChoice[];
    onStart?: () => void;
}

/**
 * Manager for handling game dialogues and branching choices.
 */
export class DialogueManager {
    private dialogues: Map<string, DialogueNode> = new Map();
    private currentNode: DialogueNode | null = null;
    private eventSystem: EventSystem;
    private isVisible: boolean = false;

    constructor(eventSystem: EventSystem) {
        this.eventSystem = eventSystem;
    }

    public registerDialogues(nodes: DialogueNode[]): void {
        for (const node of nodes) {
            this.dialogues.set(node.id, node);
        }
    }

    public startDialogue(id: string): void {
        const node = this.dialogues.get(id);
        if (!node) {
            Logger.warn(`Dialogue node ${id} not found.`);
            return;
        }

        this.currentNode = node;
        this.isVisible = true;

        if (node.onStart) {
            node.onStart();
        }

        this.eventSystem.emit('dialogue:started', node);
        Logger.info(`Dialogue started: [${node.speaker}] ${node.text}`);
    }

    public selectChoice(index: number): void {
        if (!this.currentNode || !this.currentNode.choices) return;

        const choice = this.currentNode.choices[index];
        if (!choice) return;

        if (choice.action) {
            choice.action();
        }

        if (choice.nextId) {
            this.startDialogue(choice.nextId);
        } else {
            this.endDialogue();
        }
    }

    public endDialogue(): void {
        const previousNode = this.currentNode;
        this.currentNode = null;
        this.isVisible = false;
        this.eventSystem.emit('dialogue:ended', previousNode);
    }

    public getCurrentNode(): DialogueNode | null {
        return this.currentNode;
    }

    public isOpen(): boolean {
        return this.isVisible;
    }
}
