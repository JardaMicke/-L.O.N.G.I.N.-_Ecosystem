# Vývojářský Deník - Reborn from Magic (RFM)

## 2026-01-12
### Zahájení projektu
- **Stav**: Zahájena implementace podle schváleného plánu.
- **Entita**: Genesis Agent
- **Rozhodnutí**:
  - Topologie mřížky: **Hexagonální** (dle požadavku uživatele).
  - Web Stack: Node.js + React + Canvas (v rámci Longin monorepa).
  - Architektura: ECS (Entity Component System) pro herní logiku.

### Krok 1: Inicializace struktury
- Vytvoření adresáře `services/rfm-game` v `longin-hosting-server`.
- Inicializace `DEV_DIARY.md`.
- Vytvoření základních konfiguračních souborů (`package.json`, `tsconfig.json`).
- Vytvoření adresářové struktury (`src/engine`, `src/client`, `src/server` a podadresáře).

### Krok 2: Implementace Jádra (Core Engine)
- Zahájena implementace `GameLoop` a `GridSystem`.
- Implementováno `Hex.ts` a `Layout.ts` pro hexagonální mřížku.
- Implementováno simple ECS (`EntityManager`, `Entity`, `Component`, `System`).

### Krok 3: Start Implementace Mapy
- Plánování generátoru mapy.
- Implementováno `HexData.ts`, `MapManager.ts`.
- Implementováno `MapGenerator.ts` (generování hexagonální mapy, zdroje, zdi).
- Implementováno `CanvasRenderer.ts` (vykreslování mřížky a zdrojů).
- Implementováno základy `ResourceSystem.ts`.

### Krok 4: Implementace Jednotek (Units & Tasks)
- Zahájena implementace entit `Blob` (Units).
- Tvorba komponent: `PositionComponent`, `MoveComponent`, `WorkerComponent`.
- Implementace `MovementSystem`.
- Implementace `TaskManager` pro přidělování úkolů.
- Implementace `Pathfinding.ts` (A* algoritmus pro Hex mřížku).
- Integrace Pathfinding do `TaskManager`.
- Implementace `WorkerAISystem` s work timerem.
- Vytvoření `Game.ts` pro inicializaci všech systémů.

### Krok 5: Budovy a Expanze (Buildings & Expansion)
- Cíl: Implementace struktur (`StructureComponent`) a expanze území.
- Implementováno `StructureComponent.ts` (Fortress, BuilderHut, atd.).
- Implementováno `TerritorySystem.ts` pro správu území.
- Implementováno `ConstructionSystem.ts` pro stavbu.
- Aktualizováno `Game.ts` o nové systémy.

### Krok 6: Boj a Velitelské Bloby (Combat & Command Blobs)
- Implementováno `CommandBlobComponent.ts` a `CombatStatsComponent.ts`.
- Implementováno `CombatSystem.ts` (základní cooldown a target logic).
- Aktualizováno `Game.ts` o Combat System.
- **Oprava**: Kompletní přepis `TerritorySystem.ts` pro vyřešení konfliktu úprav.
- Implementováno `ArmyEditor.tsx` (3x5 grid UI).

### Krok 7: UI a Integrace
- Cíl: Integrace do Longin menu a HUD.










### Krok 7.1: Obnova základů (Foundation Restoration)
- **Nález**: Chybějící `index.html`, `vite.config.ts` a server entry point.
- **Akce**:
  - Vytvořen `index.html` pro Vite/React.
  - Vytvořen `vite.config.ts` s proxy na backend (port 3000).
  - Vytvořen `src/server/index.ts` (Express + Socket.io).

### Krok 7.2: Implementace UI (Phase 6)
- **Komponenty**:
  - App.tsx: Hlavní menu s přepínáním.
  - GameView.tsx: Kontejner pro hru.
  - ResourceHUD.tsx: Zobrazuje suroviny.
  - Inspector.tsx: Detail panel.
  - main.tsx: Entry point.
- **Styling**: Inline styling pro rychlou iteraci.

### Krok 7.3: Verifikace a Opravy
- **Problémy**:
  1. App.tsx: Chybný default import ArmyEditor (opraveno na named import).
  2. Pathfinding.ts: Přístup k directions přes instanci místo statické třídy Hex (opraveno).
  3. vite.config vs tsconfig: Konflikt CJS/ESM. Vyřešeno přechodem na vite.config.mts a instalací @vitejs/plugin-react.
- **Výsledek**: npm run build prošel úspěšně.
- **Stav**: UI a základní integrace hotova. Připraveno na nasazení/testování.
