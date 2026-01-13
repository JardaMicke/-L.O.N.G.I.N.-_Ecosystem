import { SpritePixelEditor } from '../../src/editor/tools/sprite-pixel-editor';
import { BuildingEditor } from '../../src/editor/tools/building-editor';
import { AnimationEditor } from '../../src/editor/tools/animation-editor';

describe('Advanced Editors', () => {

    describe('SpritePixelEditor', () => {
        it('should set and get pixels', () => {
            const editor = new SpritePixelEditor(10, 10);
            editor.setPixel(5, 5, '#FF0000');
            expect(editor.getPixel(5, 5)).toBe('#FF0000');
            expect(editor.getPixel(0, 0)).toBe('#00000000');
        });

        it('should resize correctly', () => {
            const editor = new SpritePixelEditor(2, 2);
            editor.setPixel(0, 0, '#FFFFFF');
            editor.resize(4, 4);
            expect(editor.getPixel(0, 0)).toBe('#FFFFFF');
            expect(editor.getPixel(3, 3)).toBe('#00000000');
        });
    });

    describe('BuildingEditor', () => {
        it('should create and update buildings', () => {
            const editor = new BuildingEditor();
            const b = editor.createBuilding('barracks', 'Barracks');

            expect(b.id).toBe('barracks');
            expect(b.width).toBe(1);

            editor.updateBuilding('barracks', { width: 3, height: 3 });
            const updated = editor.getBuilding('barracks');
            expect(updated?.width).toBe(3);
        });
    });

    describe('AnimationEditor', () => {
        it('should manage frames', () => {
            const editor = new AnimationEditor();
            editor.createAnimation('idle');
            editor.addFrame('idle', 'idle_0', 200);
            editor.addFrame('idle', 'idle_1', 200);

            const anim = editor.getAnimation('idle');
            expect(anim?.frames.length).toBe(2);
            expect(anim?.frames[0].duration).toBe(200);

            editor.removeFrame('idle', 0);
            expect(anim?.frames.length).toBe(1);
            expect(anim?.frames[0].textureId).toBe('idle_1');
        });
    });
});
