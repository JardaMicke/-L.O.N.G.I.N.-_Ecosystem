# AI System Documentation / Dokumentace AI Systému

## English

### Overview
The AI system is built on the Entity Component System (ECS) architecture, ensuring modularity and performance. It consists of three main pillars:
1. **Task System**: Manages high-level goals (Gather, Attack, Build).
2. **Behavior Tree Integration**: Handles low-level execution logic with support for dynamic switching.
3. **Campaign / World State**: Provides global context for decision making.

### Components

#### Task System
- **TaskManager**: A System that maintains a pool of pending tasks and assigns them to suitable agents based on capabilities and efficiency.
- **TaskComponent**: Attached to agents to hold their assigned tasks and queue.

#### Behavior Trees (Smart Agent)
- **SmartAgentComponent**: Allows an entity to hold multiple Behavior Trees (e.g., `WorkerTree`, `CombatTree`) and switching rules.
- **SmartAgentSystem**: Periodically evaluates rules (e.g., "If Threat > 50, switch to Combat") and updates the active tree.

#### World State
- **CampaignManager**: Aggregates data from the world (Resources, Factions, Threats) into a `WorldStateSnapshot`.
- **Components**: `FactionComponent`, `ResourceNodeComponent`, `ThreatComponent`, `StrategicValueComponent`.

### Usage
To create a smart unit:
1. Add `TaskComponent`.
2. Add `SmartAgentComponent` and register trees + rules.
3. Add `BehaviorTreeComponent` (managed by SmartAgent).

---

## Čeština

### Přehled
AI systém je postaven na architektuře Entity Component System (ECS), což zajišťuje modularitu a výkon. Skládá se ze tří hlavních pilířů:
1. **Systém úkolů**: Spravuje vysokoúrovňové cíle (Těžba, Útok, Stavba).
2. **Integrace Behaviorálních stromů**: Řeší nízkoúrovňovou logiku vykonávání s podporou dynamického přepínání.
3. **Kampaň / Stav světa**: Poskytuje globální kontext pro rozhodování.

### Komponenty

#### Systém úkolů
- **TaskManager**: Systém, který udržuje seznam čekajících úkolů a přiděluje je vhodným agentům na základě jejich schopností a efektivity.
- **TaskComponent**: Připojuje se k agentům a uchovává jejich přidělené úkoly a frontu.

#### Behaviorální stromy (Smart Agent)
- **SmartAgentComponent**: Umožňuje entitě držet více behaviorálních stromů (např. `WorkerTree`, `CombatTree`) a pravidla pro přepínání.
- **SmartAgentSystem**: Pravidelně vyhodnocuje pravidla (např. "Pokud je Hrozba > 50, přepni na Boj") a aktualizuje aktivní strom.

#### Stav světa
- **CampaignManager**: Agreguje data ze světa (Zdroje, Frakce, Hrozby) do `WorldStateSnapshot`.
- **Komponenty**: `FactionComponent`, `ResourceNodeComponent`, `ThreatComponent`, `StrategicValueComponent`.

### Použití
Pro vytvoření chytré jednotky:
1. Přidejte `TaskComponent`.
2. Přidejte `SmartAgentComponent` a zaregistrujte stromy + pravidla.
3. Přidejte `BehaviorTreeComponent` (spravováno SmartAgentem).
