
import { SpriteEditor, Sprite } from '../../src/tools/sprite-editor';

describe('SpriteEditor', () => {
  let editor: SpriteEditor;

  beforeEach(() => {
    // Create a 100x100 sprite
    editor = new SpriteEditor(100, 100);
  });

  describe('Walkable Zones', () => {
    it('should allow creating a rect zone', () => {
      editor.setTool('rect-zone');
      // Start drag
      editor.onMouseMove(10, 10);
      editor.applyAction(10, 10); // Start
      
      // End drag
      editor.onMouseMove(20, 20);
      editor.applyAction(20, 20); // End

      const zones = editor.getWalkableZones();
      expect(zones.length).toBe(1);
      expect(zones[0].length).toBe(4); // Rect has 4 points
      expect(zones[0][0]).toEqual({ x: 10, y: 10 });
      expect(zones[0][2]).toEqual({ x: 20, y: 20 });
    });

    it('should validate rect zone bounds', () => {
        editor.setTool('rect-zone');
        // Try start outside
        editor.applyAction(-5, -5); 
        // Try end inside
        editor.applyAction(10, 10);

        // Should not have created a zone because start was invalid
        expect(editor.getWalkableZones().length).toBe(0);
    });

    it('should allow creating a polygon zone', () => {
        editor.setTool('polygon');
        // Draw triangle
        // We need to set pixel to opaque first because polygon tool requires it?
        // Code says: if (this.sprite.getPixel(x, y) === null) return;
        // So we need to paint first.
        
        editor.setTool('pen');
        editor.setColor('#FFFFFF');
        editor.applyAction(10, 10);
        editor.applyAction(20, 20);
        editor.applyAction(10, 20);
        
        editor.setTool('polygon');
        editor.applyAction(10, 10);
        editor.applyAction(20, 20);
        editor.applyAction(10, 20);
        
        // Close polygon (click near start)
        editor.applyAction(10, 10);
        
        const zones = editor.getWalkableZones();
        expect(zones.length).toBe(1);
        expect(zones[0].length).toBe(3);
    });

    it('should support undo/redo for zones', () => {
        editor.setTool('rect-zone');
        editor.applyAction(10, 10);
        editor.applyAction(20, 20);
        
        expect(editor.getWalkableZones().length).toBe(1);
        
        editor.undo();
        expect(editor.getWalkableZones().length).toBe(0);
        
        editor.redo();
        expect(editor.getWalkableZones().length).toBe(1);
    });
  });

  describe('Variants', () => {
      it('should add and remove variants', () => {
          editor.addVariant('wall_damaged', 0.5);
          expect(editor.getVariants()).toContain('wall_damaged');
          expect(editor.getVariantWeights()).toContain(0.5);
          
          editor.removeVariant('wall_damaged');
          expect(editor.getVariants()).not.toContain('wall_damaged');
      });
  });

  describe('Height Control', () => {
    it('should set and get accessible height', () => {
      editor.setAccessibleHeight(5);
      expect(editor.getAccessibleHeight()).toBe(5);
    });

    it('should clamp height to range [1, max]', () => {
      editor.setAccessibleHeight(0);
      expect(editor.getAccessibleHeight()).toBe(1);

      editor.setMaxAccessibleHeight(8);
      editor.setAccessibleHeight(10);
      expect(editor.getAccessibleHeight()).toBe(8);
    });

    it('should update max height and clamp current height', () => {
      editor.setAccessibleHeight(10);
      editor.setMaxAccessibleHeight(5);
      expect(editor.getAccessibleHeight()).toBe(5);
      expect(editor.getMaxAccessibleHeight()).toBe(5);
    });
  });

  describe('Action Bindings', () => {
    it('should bind actions to animations', () => {
      editor.bindAction('Attack', 'attack_anim');
      expect(editor.getActionBinding('Attack')).toBe('attack_anim');
    });

    it('should overwrite existing bindings', () => {
      editor.bindAction('Walk', 'walk_1');
      editor.bindAction('Walk', 'walk_2');
      expect(editor.getActionBinding('Walk')).toBe('walk_2');
    });

    it('should remove bindings', () => {
      editor.bindAction('Idle', 'idle_anim');
      editor.removeBinding('Idle');
      expect(editor.getActionBinding('Idle')).toBeUndefined();
    });

    it('should return all bindings', () => {
      editor.bindAction('A', '1');
      editor.bindAction('B', '2');
      const bindings = editor.getAllBindings();
      expect(bindings['A']).toBe('1');
      expect(bindings['B']).toBe('2');
    });
  });
});
