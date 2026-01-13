# Plán Vývoje / Project Development Plan

**Poslední aktualizace / Last Update:** 2026-01-02

## Přehled Fází / Phases Overview

| Fáze / Phase | Stav / Status | Termín / Deadline | Milník / Milestone |
|--------------|---------------|-------------------|--------------------|
| 1. Core      | Hotovo / Done | 2025-Q4           | Funkční Engine Loop & ECS |
| 2. Editor    | Hotovo / Done | 2025-Q4           | Project Manager & Map Editor |
| 3. Gameplay  | Hotovo / Done | 2026-01-01        | Scripting & AI |
| 4. Release   | Hotovo / Done | 2026-01-02        | Profiling, E2E Tests, Docs |
| 5. Expansion | Plánováno     | 2026-Q1           | Audio Pipeline, Multiplayer |

---

## Fáze 1: Jádro Enginu a Základní Editor (Hotovo)
**Zdroje:** 1 Senior Dev
- [x] ECS Architektura (Entity-Component-System)
- [x] Webpack Bundling & Build Pipeline
- [x] Základní Renderovací systém (Canvas API)
- [x] Server (Node.js + Express)
- [x] Parita prostředí (Dev/Prod)

## Fáze 2: Rozšíření Editoru a Správa Projektů (Hotovo)
**Zdroje:** 1 Senior Dev, 1 UI Designer
- [x] **Správa Projektů (Project Management)**
    - [x] Datová struktura Projektu
    - [x] ProjectManager (CRUD)
    - [x] ProjectSelectionState (UI)
    - [x] Integrace do Hlavního Menu
- [x] **Pokročilý Map Editor**
    - [x] Ukládání/Načítání map na server (API)
    - [x] Vrstvy (Layers)
    - [x] Tile Palette UI
    - [x] Undo/Redo System
- [x] **Asset Management (Basic)**
    - [x] Upload spritů

## Fáze 3: Gameplay a AI (Hotovo)
**Zdroje:** 1 Senior Dev, 1 QA
- [x] **Behavior Tree Editor**
    - [x] Visual Editor
    - [x] Node Logic
- [x] **Pathfinding**
    - [x] A* Algoritmus
    - [x] Visualizer
- [x] **Scripting Interface**
    - [x] IScript & ScriptContext
    - [x] Sandbox Isolation (Safe Facade)
    - [x] Lifecycle (Start, Update, Destroy)

## Fáze 4: Release a Optimalizace (Hotovo)
**Zdroje:** 1 Senior Dev, 1 QA, 1 Tech Writer
- [x] **Performance Profiling**
    - [x] Profiler Class (FPS, Frame Time)
    - [x] Debug Overlay Integration
- [x] **Testování**
    - [x] E2E Scénáře (Gameplay, Editor, Scripting)
    - [x] Integrační testy
- [x] **Dokumentace**
    - [x] API Reference
    - [x] User Guide Update
    - [x] Architecture Update

## Fáze 5: Future Expansion (Plánováno / Planned)
**Termín:** Q1 2026
- [ ] **Advanced Audio**
    - [ ] Audio Sprite Support
    - [ ] Spatial Audio
- [ ] **Multiplayer**
    - [ ] WebSocket Server
    - [ ] State Synchronization
- [ ] **Export**
    - [ ] Build to Desktop (Electron)
    - [ ] Build to Mobile (Capacitor)
