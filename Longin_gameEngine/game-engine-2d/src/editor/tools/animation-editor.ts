import { Logger } from '../../utils/logger';

export interface AnimationFrame {
    textureId: string; // or sprite sheet index
    duration: number; // ms
}

export interface AnimationSequence {
    name: string;
    frames: AnimationFrame[];
    loop: boolean;
}

export class AnimationEditor {
    private animations: Map<string, AnimationSequence> = new Map();

    public createAnimation(name: string, loop: boolean = true): AnimationSequence {
        const anim: AnimationSequence = {
            name,
            frames: [],
            loop
        };
        this.animations.set(name, anim);
        return anim;
    }

    public addFrame(animName: string, textureId: string, duration: number = 100): void {
        const anim = this.animations.get(animName);
        if (anim) {
            anim.frames.push({ textureId, duration });
        }
    }

    public getAnimation(name: string): AnimationSequence | undefined {
        return this.animations.get(name);
    }

    public removeFrame(animName: string, index: number): void {
        const anim = this.animations.get(animName);
        if (anim && index >= 0 && index < anim.frames.length) {
            anim.frames.splice(index, 1);
        }
    }

    public setLoop(animName: string, loop: boolean): void {
        const anim = this.animations.get(animName);
        if (anim) anim.loop = loop;
    }
}
