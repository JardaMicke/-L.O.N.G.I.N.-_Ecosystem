
/**
 * @jest-environment jsdom
 */
import { AnimationEditor } from '../../src/tools/animation-editor';
import { SpriteManager } from '../../src/graphics/sprite-manager';

describe('AnimationEditor', () => {
  let editor: AnimationEditor;
  let mockSpriteManager: any;

  beforeEach(() => {
    // Mock SpriteManager
    mockSpriteManager = {
      getAssetMetadata: jest.fn().mockReturnValue({
        accessibleHeight: 1,
        maxAccessibleHeight: 10,
        actionBindings: {}
      }),
      registerAssetMetadata: jest.fn()
    };

    // Mock canvas getContext to avoid JSDOM error
    HTMLCanvasElement.prototype.getContext = jest.fn();

    // Mock document if needed (JSDOM handles this)

    document.body.innerHTML = '';
    
    editor = new AnimationEditor(mockSpriteManager);
  });

  it('should create UI container', () => {
    // The container is appended to body in constructor
    const container = document.body.querySelector('div'); 
    // Note: AnimationEditor creates a container. 
    // Let's find it by some characteristic if possible, or just check body children
    expect(document.body.children.length).toBeGreaterThan(0);
  });

  it('should update asset properties panel when asset is selected', () => {
    // Trigger asset selection logic
    // We can simulate a drop or just call addKeyFrameAsset if it was public, but it's private.
    // However, we can simulate the "drop" event on the canvas.
    
    // Or we can cast to any to access private methods for testing
    (editor as any).addKeyFrameAsset('Unit', 0, 0);

    // Now check if properties panel is updated
    const panel = document.getElementById('asset-properties-panel');
    expect(panel).not.toBeNull();
    expect(panel?.innerHTML).toContain('Properties: Unit');
    expect(panel?.innerHTML).toContain('Accessible Height');
    expect(panel?.innerHTML).toContain('Action Bindings');
  });

  it('should update accessible height metadata', () => {
    (editor as any).addKeyFrameAsset('Unit', 0, 0);
    
    const panel = document.getElementById('asset-properties-panel');
    const input = panel?.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    // Change value
    input.value = '5';
    input.dispatchEvent(new Event('input'));

    expect(mockSpriteManager.registerAssetMetadata).toHaveBeenCalledWith('Unit', expect.objectContaining({
        accessibleHeight: 5
    }));
  });

  it('should add action binding', () => {
    (editor as any).addKeyFrameAsset('Unit', 0, 0);
    
    const panel = document.getElementById('asset-properties-panel');
    // Find the add button (it has text '+')
    const buttons = panel?.querySelectorAll('button');
    const addBtn = Array.from(buttons || []).find(b => b.textContent === '+');
    expect(addBtn).toBeDefined();

    // Find input for animation name
    const animInput = panel?.querySelector('input[placeholder="Anim Name"]') as HTMLInputElement;
    expect(animInput).toBeDefined();
    
    animInput.value = 'WalkAnim';
    addBtn?.click();

    expect(mockSpriteManager.registerAssetMetadata).toHaveBeenCalledWith('Unit', expect.objectContaining({
        actionBindings: expect.objectContaining({
            'Idle': 'WalkAnim' // Default selection is Idle
        })
    }));
  });
});
