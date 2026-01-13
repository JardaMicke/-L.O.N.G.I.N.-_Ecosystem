import { Engine } from '../src/core/engine';
import { Quest, KillObjective } from '../src/gameplay/quest';
import { DialogueNode } from '../src/gameplay/dialogue-manager';
import { Trigger, QuestStatusCondition, LogTriggerAction } from '../src/core/trigger-system';
import { QuestStatus } from '../src/gameplay/quest';
import { Logger } from '../src/utils/logger';

// Mock localStorage for Node.js environment
if (typeof global !== 'undefined' && !(global as any).localStorage) {
    (global as any).localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { }
    };
}

async function verifyQuestSystem() {
    Logger.info('--- STARTING PHASE 12 VERIFICATION ---');

    // 1. Initialize Engine
    const engine = new Engine();

    // 2. Create a Quest
    const orcQuest = new Quest(
        'kill_orcs',
        'Defeat the Orc Raiders',
        'The village is under attack! Kill 3 Orcs.',
        [new KillObjective('kill_orcs_obj', 'Kill 3 Orcs', 3, 'orc')]
    );

    // 3. Register a Dialogue
    const nodes: DialogueNode[] = [
        {
            id: 'village_elder_start',
            speaker: 'Elder',
            text: 'Please help us, traveler! Orcs are attacking!',
            choices: [
                {
                    text: 'I will help!',
                    action: () => engine.questManager.acceptQuest(orcQuest)
                },
                {
                    text: 'Not my problem.',
                    action: () => Logger.info('Player refused quest.')
                }
            ]
        }
    ];
    engine.dialogueManager.registerDialogues(nodes);

    // 4. Create a Trigger (if quest completed, log victory)
    const victoryTrigger = new Trigger(
        'victory_trigger',
        [new QuestStatusCondition('kill_orcs', QuestStatus.COMPLETED, engine)],
        [new LogTriggerAction('VICTORY ACHIEVED!')]
    );
    engine.triggerSystem.addTrigger(victoryTrigger);

    // 5. Simulate Dialogue start and choice
    engine.dialogueManager.startDialogue('village_elder_start');
    engine.dialogueManager.selectChoice(0); // Select "I will help!"

    // 6. Verify Quest started
    const activeQuests = engine.questManager.getActiveQuests();
    console.log(`Active Quests: ${activeQuests.length} (${activeQuests[0]?.title})`);

    // 7. Simulate Orc Deaths
    engine.eventSystem.emit('entity:death', { entityType: 'orc' });
    engine.eventSystem.emit('entity:death', { entityType: 'orc' });
    engine.eventSystem.emit('entity:death', { entityType: 'orc' });

    // 8. Trigger evaluation is normally done on 'update' or specific events
    // In our implementation, TriggerSystem listens to 'quest:completed' too.

    // Check final status
    const quest = engine.questManager.getQuest('kill_orcs');
    console.log(`Quest Status: ${quest?.status}`);
    console.log(`Trigger Fired: ${victoryTrigger.isFired}`);

    if (quest?.status === QuestStatus.COMPLETED && victoryTrigger.isFired) {
        Logger.info('--- PHASE 12 VERIFICATION SUCCESSFUL ---');
    } else {
        Logger.error('--- PHASE 12 VERIFICATION FAILED ---');
    }
}

verifyQuestSystem().catch(err => console.error(err));
