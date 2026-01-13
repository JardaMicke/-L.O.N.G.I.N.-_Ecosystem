import { DialogueManager, DialogueNode } from '../gameplay/dialogue-manager';
import { EventSystem } from '../core/event-system';

/**
 * UI Component for rendering dialogues on screen using HTML overlay.
 */
export class DialogueUI {
    private container: HTMLDivElement;
    private speakerEl: HTMLDivElement;
    private textEl: HTMLDivElement;
    private choicesEl: HTMLDivElement;
    private dialogueManager: DialogueManager;
    private eventSystem: EventSystem;

    constructor(dialogueManager: DialogueManager, eventSystem: EventSystem) {
        this.dialogueManager = dialogueManager;
        this.eventSystem = eventSystem;

        if (typeof document !== 'undefined') {
            this.container = document.createElement('div');
            this.setupUI();
            this.setupListeners();
            document.body.appendChild(this.container);
        } else {
            this.container = {} as HTMLDivElement;
            this.speakerEl = {} as HTMLDivElement;
            this.textEl = {} as HTMLDivElement;
            this.choicesEl = {} as HTMLDivElement;
        }
    }

    private setupUI(): void {
        this.container.id = 'dialogue-container';
        this.container.style.position = 'fixed';
        this.container.style.bottom = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.width = '80%';
        this.container.style.maxWidth = '800px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        this.container.style.color = '#fff';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.border = '2px solid #555';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.zIndex = '10000';
        this.container.style.display = 'none';

        this.speakerEl = document.createElement('div');
        this.speakerEl.style.fontWeight = 'bold';
        this.speakerEl.style.color = '#ffcc00';
        this.speakerEl.style.fontSize = '1.2em';
        this.speakerEl.style.marginBottom = '10px';
        this.container.appendChild(this.speakerEl);

        this.textEl = document.createElement('div');
        this.textEl.style.fontSize = '1.1em';
        this.textEl.style.lineHeight = '1.4';
        this.textEl.style.marginBottom = '20px';
        this.container.appendChild(this.textEl);

        this.choicesEl = document.createElement('div');
        this.choicesEl.style.display = 'flex';
        this.choicesEl.style.flexDirection = 'column';
        this.choicesEl.style.gap = '10px';
        this.container.appendChild(this.choicesEl);
    }

    private setupListeners(): void {
        this.eventSystem.on('dialogue:started', (node: DialogueNode) => {
            this.render(node);
            this.container.style.display = 'block';
        });

        this.eventSystem.on('dialogue:ended', () => {
            this.container.style.display = 'none';
        });
    }

    private render(node: DialogueNode): void {
        this.speakerEl.textContent = node.speaker;
        this.textEl.textContent = node.text;
        this.choicesEl.innerHTML = '';

        if (node.choices && node.choices.length > 0) {
            node.choices.forEach((choice, index) => {
                const btn = document.createElement('button');
                btn.textContent = choice.text;
                btn.style.padding = '10px';
                btn.style.backgroundColor = '#444';
                btn.style.color = '#fff';
                btn.style.border = '1px solid #666';
                btn.style.borderRadius = '5px';
                btn.style.cursor = 'pointer';
                btn.style.textAlign = 'left';

                btn.onmouseover = () => btn.style.backgroundColor = '#666';
                btn.onmouseout = () => btn.style.backgroundColor = '#444';
                btn.onclick = () => this.dialogueManager.selectChoice(index);

                this.choicesEl.appendChild(btn);
            });
        } else {
            // Add a "Continue" button if no choices provided
            const btn = document.createElement('button');
            btn.textContent = 'Continue';
            btn.style.padding = '10px';
            btn.style.backgroundColor = '#444';
            btn.style.color = '#fff';
            btn.style.border = '1px solid #666';
            btn.style.borderRadius = '5px';
            btn.style.cursor = 'pointer';
            btn.style.width = '100px';
            btn.style.alignSelf = 'flex-end';

            btn.onmouseover = () => btn.style.backgroundColor = '#666';
            btn.onmouseout = () => btn.style.backgroundColor = '#444';
            btn.onclick = () => this.dialogueManager.endDialogue();

            this.choicesEl.appendChild(btn);
        }
    }
}
