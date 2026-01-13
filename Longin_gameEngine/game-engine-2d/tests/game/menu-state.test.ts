import { Engine } from '../../src/core/engine';
import { MenuState } from '../../src/game/states/menu-state';
import { Button } from '../../src/ui/button';

jest.mock('../../src/core/engine');
jest.mock('../../src/ui/button');
jest.mock('../../src/ui/text');
jest.mock('../../src/utils/logger');

describe('MenuState', () => {
  let engine: Engine;
  let menuState: MenuState;

  beforeEach(() => {
    engine = new Engine() as jest.Mocked<Engine>;
    engine.uiManager = {
      addElement: jest.fn(),
      clear: jest.fn(),
      removeElement: jest.fn(),
    } as any;
    engine.gameStateManager = {
      switchState: jest.fn(),
    } as any;

    menuState = new MenuState();
  });

  it('should have name "Menu"', () => {
    expect(menuState.name).toBe('Menu');
  });

  it('should add UI elements on enter', () => {
    menuState.onEnter(engine);
    expect(engine.uiManager.addElement).toHaveBeenCalledTimes(3); // Title, Start, Exit
  });

  it('should clear UI on exit', () => {
    menuState.onExit(engine);
    expect(engine.uiManager.clear).toHaveBeenCalled();
  });

  it('should switch to Lobby state when Start Game is clicked', () => {
    // We need to capture the click handler
    // Since we mocked Button, we need to inspect how it's called or mock the instance

    // Let's rely on the implementation detail that we assign onClick to the button instance
    // But since we are mocking Button constructor, we won't get a real instance unless we mock implementation

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let startBtnCallback: Function | undefined;

    (Button as unknown as jest.Mock).mockImplementation((id, x, y, w, h, text) => {
      const btn: any = { id, text, onClick: undefined };
      if (text === 'Start Game') {
        // We can't easily capture the assignment unless we proxy the property or run the code
        // The code is: startBtn.onClick = () => ...
        // So the instance returned by new Button() will have onClick assigned.
        // We can intercept that by returning an object that we keep a reference to.
        return new Proxy(btn, {
          set: (target, prop, value) => {
            if (prop === 'onClick') {
              startBtnCallback = value;
            }
            target[prop] = value;
            return true;
          },
        });
      }
      return btn;
    });

    menuState.onEnter(engine);

    expect(startBtnCallback).toBeDefined();
    if (startBtnCallback) {
      startBtnCallback();
      expect(engine.gameStateManager.switchState).toHaveBeenCalledWith('Lobby');
    }
  });
});
