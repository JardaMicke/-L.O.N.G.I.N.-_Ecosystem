# Implementation Plan - Phase 7: Real Integration & Rendering

## Goal
Connect the existing `Game` engine with the React `GameView` and implement actual entity rendering (Units, Buildings). Currently, `GameView` uses a placeholder grid.

## User Review Required
None.

## Proposed Changes

### Client Integration

#### [MODIFY] [GameView.tsx](file:///c:/AI/LonginDev/longin-hosting-server/services/rfm-game/src/client/components/GameView.tsx)
- Remove placeholder grid code.
- Instantiate `Game` (or use a Singleton pattern for now).
- Call `game.attachRenderer(canvas)`.
- Start `game.loop.start()`.
- Handle cleanup on unmount.

### Rendering Engine

#### [MODIFY] [CanvasRenderer.ts](file:///c:/AI/LonginDev/longin-hosting-server/services/rfm-game/src/client/renderer/CanvasRenderer.ts)
- Implement `renderEntities(entityManager)` method.
- Draw "Blobs" (Units) as circles/shapes.
- Draw "Structures" (Buildings) as distinct shapes/icons.
- Draw "Territory" overlay if needed.

### Engine Updates

#### [MODIFY] [Game.ts](file:///c:/AI/LonginDev/longin-hosting-server/services/rfm-game/src/engine/Game.ts)
- Update `render()` to call `renderer.renderEntities(this.entityManager)`.

## Verification Plan
1. Open Game.
2. Verify Map is drawn (from MapManager).
3. Verify Units (if any spawned) are drawn.
4. Verify Game Loop is running (animations/updates).
