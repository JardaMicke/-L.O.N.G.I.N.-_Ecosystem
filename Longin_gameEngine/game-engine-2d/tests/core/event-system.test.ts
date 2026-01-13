import { EventSystem } from '../../src/core/event-system';

describe('EventSystem', () => {
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = EventSystem.getInstance();
    eventSystem.clear();
  });

  test('should subscribe and emit events', () => {
    const callback = jest.fn();
    eventSystem.on('test-event', callback);

    eventSystem.emit('test-event', { data: 'test' });

    expect(callback).toHaveBeenCalledWith({ data: 'test' });
  });

  test('should handle multiple listeners', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    eventSystem.on('test-event', callback1);
    eventSystem.on('test-event', callback2);

    eventSystem.emit('test-event');

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  test('should unsubscribe correctly', () => {
    const callback = jest.fn();
    eventSystem.on('test-event', callback);
    eventSystem.off('test-event', callback);

    eventSystem.emit('test-event');

    expect(callback).not.toHaveBeenCalled();
  });
});
