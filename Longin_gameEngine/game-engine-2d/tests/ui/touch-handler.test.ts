import { EventSystem } from '../../src/core/event-system';
import { TouchHandler } from '../../src/ui/touch-handler';

describe('TouchHandler', () => {
  let touchHandler: TouchHandler;
  let element: HTMLElement;
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = EventSystem.getInstance();
    touchHandler = new TouchHandler();

    // Mock HTMLElement
    element = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as HTMLElement;
  });

  test('should initialize and attach listeners', () => {
    touchHandler.initialize(element);
    expect(element.addEventListener).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function),
      expect.any(Object),
    );
    expect(element.addEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      expect.any(Object),
    );
    expect(element.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
  });

  test('should detect tap gesture', (done) => {
    touchHandler.initialize(element);

    // Get listener callbacks
    const listeners: any = {};
    (element.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      listeners[event] = callback;
    });
    touchHandler.initialize(element);

    const touchStart = {
      preventDefault: jest.fn(),
      touches: [{ clientX: 100, clientY: 100 }],
      changedTouches: [{ clientX: 100, clientY: 100 }],
    };

    const touchEnd = {
      preventDefault: jest.fn(),
      changedTouches: [{ clientX: 100, clientY: 100 }],
    };

    eventSystem.on('input:gesture', (gesture: any) => {
      if (gesture.type === 'tap') {
        expect(gesture.x).toBe(100);
        expect(gesture.y).toBe(100);
        done();
      }
    });

    listeners['touchstart'](touchStart);
    listeners['touchend'](touchEnd);
  });

  test('should detect swipe gesture', (done) => {
    touchHandler.initialize(element);

    // Get listener callbacks
    const listeners: any = {};
    (element.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      listeners[event] = callback;
    });
    touchHandler.initialize(element);

    const touchStart = {
      preventDefault: jest.fn(),
      touches: [{ clientX: 100, clientY: 100 }],
    };

    const touchMove = {
      preventDefault: jest.fn(),
      touches: [{ clientX: 200, clientY: 100 }], // Moved 100px right
    };

    eventSystem.on('input:gesture', (gesture: any) => {
      if (gesture.type === 'swipe') {
        expect(gesture.deltaX).toBe(100);
        done();
      }
    });

    listeners['touchstart'](touchStart);
    listeners['touchmove'](touchMove);
  });
});
