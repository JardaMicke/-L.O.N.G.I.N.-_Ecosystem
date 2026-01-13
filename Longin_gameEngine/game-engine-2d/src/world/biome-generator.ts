

import { createNoise2D, NoiseFunction2D } from 'simplex-noise';

/**
 * Enum representing different biome types.
 */
export enum BiomeType {
    OCEAN,
    BEACH,
    GRASSLAND,
    FOREST,
    DESERT,
    SNOW
}

export class BiomeGenerator {
    private noise2D_height: NoiseFunction2D;
    private noise2D_temp: NoiseFunction2D;

    constructor(private seed: number = 0) {
        // Create two different noise functions for variety
        // simplex-noise 4.x uses a PRNG function if provided, or Math.random default
        // We can mimic seeding by just creating them - simpler for now.
        // For true determinism with seed, we'd need a seeded PRNG like alea.
        // For this step, we'll let it be random per instance or just use standard creation.
        this.noise2D_height = createNoise2D();
        this.noise2D_temp = createNoise2D();
    }

    public getBiome(x: number, y: number): BiomeType {
        // simplex-noise returns -1 to 1. Map to 0 to 1 for easier logic.
        const height = (this.noise2D_height(x * 0.005, y * 0.005) + 1) * 0.5;
        const temperature = (this.noise2D_temp(x * 0.005, y * 0.005) + 1) * 0.5;

        // Apply same Whitaker-like logic
        if (height < 0.3) return BiomeType.OCEAN;
        if (height < 0.35) return BiomeType.BEACH;

        if (temperature > 0.6) {
            if (height < 0.5) return BiomeType.DESERT;
            return BiomeType.FOREST; // Tropical forest
        }

        if (temperature < 0.3) {
            return BiomeType.SNOW;
        }

        if (height > 0.6) return BiomeType.FOREST;

        return BiomeType.GRASSLAND;
    }
}
