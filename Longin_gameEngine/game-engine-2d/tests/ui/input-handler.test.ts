import { EventSystem } from '../../src/core/event-system';
import { InputHandler } from '../../src/ui/input-handler';

describe('InputHandler', () => {
  let inputHandler: InputHandler;
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = EventSystem.getInstance();
    inputHandler = new InputHandler();

    // Mock window and document
    global.window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as any;

    global.navigator = {
      getGamepads: jest.fn().mockReturnValue([]),
    } as any;

    inputHandler.initialize(global.window);
  });

  test('should track key presses', () => {
    // Trigger keydown
    const keyDown = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'keydown',
    )[1];
    keyDown({ key: 'ArrowUp' });

    expect(inputHandler.isKeyDown('ArrowUp')).toBe(true);

    // Trigger keyup
    const keyUp = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'keyup',
    )[1];
    keyUp({ key: 'ArrowUp' });

    expect(inputHandler.isKeyDown('ArrowUp')).toBe(false);
  });

  test('should poll gamepads', () => {
    const mockGamepad = {
      index: 0,
      id: 'Gamepad 1',
      buttons: [{ pressed: true }, { pressed: false }],
      axes: [0.5, -0.5],
    };

    (navigator.getGamepads as jest.Mock).mockReturnValue([mockGamepad]);

    const emitSpy = jest.spyOn(eventSystem, 'emit');

    inputHandler.update();

    expect(inputHandler.isGamepadButtonDown(0, 0)).toBe(true);
    expect(inputHandler.isGamepadButtonDown(0, 1)).toBe(false);
    expect(inputHandler.getGamepadAxis(0, 0)).toBe(0.5);

    expect(emitSpy).toHaveBeenCalledWith('input:gamepad_down', { index: 0, button: 0 });

    // Test button release
    mockGamepad.buttons[0].pressed = false;
    inputHandler.update();
    expect(emitSpy).toHaveBeenCalledWith('input:gamepad_up', { index: 0, button: 0 });
  });
});
