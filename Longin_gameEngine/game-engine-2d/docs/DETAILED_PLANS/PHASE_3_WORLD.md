# DETAILNÍ PLÁN - FÁZE 3: WORLD SYSTEMS
## Focus: Infinite Worlds, Chunks, Advanced Terrain

**Cíl**: Implementovat systém pro nekonečný nebo velmi velký svět pomocí chunků, generování terénu a správy zdrojů.

---

### Krok 21: Chunk System Core
**Soubor: `src/world/chunk.ts`**
```typescript
export class Chunk {
  static readonly SIZE = 16;
  x: number;
  y: number;
  tiles: Tile[][];
  isDifferent: boolean = false; // Pro vykreslování
  entities: Set<string>; // ID entit v chunku

  constructor(x: number, y: number) { ... }
}
```

**Soubor: `src/world/chunk-manager.ts`**
```typescript
export class ChunkManager {
  chunks: Map<string, Chunk> = new Map();
  activeChunks: string[] = [];
  
  // Načte chunky kolem hráče
  update(playerPos: Vector2) {
    const coords = this.getChunkCoords(playerPos);
    // Unload far chunks
    // Load/Generate new chunks
  }

  getChunkKey(x: number, y: number): string { return `${x},${y}`; }
}
```

### Krok 22: Advanced Terrain Generator & Biomes
**Soubor: `src/world/biome-generator.ts`**
```typescript
export enum BiomeType {
  DESERT, GRASSLAND, FOREST, TUNDRA, SNOW, OCEAN
}

export class BiomeGenerator {
  // Uses temperature and humidity noise maps
  getBiome(x: number, y: number): BiomeType {
    const temp = noise.get(x, y);
    const rain = noise.get(x + 1000, y);
    // Whitaker diagram logic
  }
}
```

**Rozšíření `src/world/terrain-generator.ts`**:
- Integrace s `BiomeGenerator`.
- Generování dekorací (stromy, kameny) na základě biomu.

### Krok 23: World Streaming & Persistence
**Soubor: `src/world/world-streamer.ts`**
- **Cíl**: Ukládat změněné chunky na disk/do DB a uvolňovat paměť.
- Metody: `saveChunk(chunk: Chunk)`, `loadChunk(x: y): Promise<Chunk>`.

### Krok 24: Resource Spawning System
**Soubor: `src/world/resource-spawner.ts`**
```typescript
export class ResourceSpawner {
  spawnGroups: SpawnRule[] = [
    { type: 'GOLD_VEIN', biome: BiomeType.DESERT, probability: 0.05 },
    { type: 'IRON_VEIN', biome: BiomeType.TUNDRA, probability: 0.1 }
  ];

  populateChunk(chunk: Chunk) {
    // Iterate tiles and apply rules
  }
}
```

---
## Implementační Checklist
1. [ ] `Chunk` class with serialization.
2. [ ] `ChunkManager` with load/unload radius logic.
3. [ ] `BiomeGenerator` using logical noise maps.
4. [ ] `ResourceSpawner` for initial world population.
