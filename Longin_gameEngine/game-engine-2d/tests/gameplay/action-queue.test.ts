import { ActionQueue, GameAction } from '../../src/gameplay/action-queue';

class MockAction implements GameAction {
    public id: string;
    public executed: boolean = false;
    public finished: boolean = false;

    constructor(id: string) {
        this.id = id;
    }

    execute(): void {
        this.executed = true;
    }

    isFinished(): boolean {
        return this.finished;
    }
}

describe('ActionQueue', () => {
    let queue: ActionQueue;

    beforeEach(() => {
        queue = new ActionQueue();
    });

    it('should enqueue actions', () => {
        const action = new MockAction('test');
        queue.enqueue(action);
        expect(queue.isEmpty()).toBe(false);
    });

    it('should run actions sequentially', () => {
        const a1 = new MockAction('1');
        const a2 = new MockAction('2');

        queue.enqueue(a1);
        queue.enqueue(a2);

        // First update starts A1
        queue.update();
        expect(queue.currentAction?.id).toBe('1');
        expect(a1.executed).toBe(true);
        expect(a2.executed).toBe(false);

        // Finish A1
        a1.finished = true;
        queue.update(); // Detects finish, clears current
        expect(queue.currentAction).toBeNull();

        // Next update starts A2
        queue.update();
        expect(queue.currentAction?.id).toBe('2');
        expect(a2.executed).toBe(true);
    });
});
