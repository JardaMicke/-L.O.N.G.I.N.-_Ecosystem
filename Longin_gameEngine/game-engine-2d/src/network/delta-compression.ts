import { Entity } from '../ecs/entity';
import { Component } from '../ecs/component';

export class DeltaCompression {

    /**
     * Compares two states of an entity and returns only changed components.
     * This is a simplified version. Real version would diff specific properties.
     */
    public static getEntityDelta(prev: Entity, current: Entity): any {
        const delta: any = { id: current.id };
        let hasChanges = false;

        const currComps = current.getAllComponents();

        // For now, simpler approach: assume we don't have deeply stored 'prev' state for every tick in this demo.
        // Instead, we just serialize what is "dirty" or changed. 
        // But without previous state, we can't do delta.

        // Let's implement a utility that specificially compares two objects

        return delta; // Stub
    }

    public static computeDiff(obj1: any, obj2: any): any {
        const diff: any = {};

        // Added or Changed keys
        for (const key of Object.keys(obj2)) {
            const val1 = obj1[key];
            const val2 = obj2[key];

            if (val1 !== val2) {
                if (typeof val2 === 'object' && val2 !== null && typeof val1 === 'object' && val1 !== null) {
                    // Recursive diff
                    const d = this.computeDiff(val1, val2);
                    if (Object.keys(d).length > 0) {
                        diff[key] = d;
                    }
                } else {
                    // Primitive change
                    diff[key] = val2;
                }
            }
        }

        // Removed keys logic could be added here if needed (sending null), 
        // but for now we assume state sync overwrites.

        return diff;
    }
}
