# 002. Implementace Systému Behaviorálních Stromů (Behavior Tree System)

## Status
Accepted

## Context
Pro řízení umělé inteligence (AI) entit ve hře (např. nepřátelé, NPC) potřebujeme flexibilní a modulární systém rozhodování. Jednoduché stavové automaty (FSM) se stávají nepřehlednými při rostoucí komplexitě. Behaviorální stromy (Behavior Trees - BT) nabízejí lepší škálovatelnost, znovupoužitelnost logiky a snadnější vizualizaci.

Potřebujeme systém, který podporuje:
1.  Základní uzly (Sequence, Selector, Parallel).
2.  Vlastní podmínky a akce.
3.  Sdílení dat mezi uzly (Blackboard).
4.  Integraci s ECS (Entity Component System).
5.  Runtime debugging a editaci.
6.  Serializaci a načítání z dat (JSON).

## Decision
Rozhodli jsme se implementovat vlastní **Behavior Tree System** v TypeScriptu, integrovaný do existujícího ECS.

### Architektura:

1.  **BehaviorNode (Abstraktní třída)**:
    *   Základní stavební kámen.
    *   Definuje metodu `tick(blackboard: Blackboard): NodeStatus`.
    *   Stavy: `SUCCESS`, `FAILURE`, `RUNNING`.

2.  **Composite Nodes (Řídící uzly)**:
    *   **Sequence**: Provádí potomky popořadě, dokud jeden neselže. (AND logika)
    *   **Selector**: Provádí potomky popořadě, dokud jeden neuspěje. (OR logika)
    *   **Parallel**: Provádí potomky současně (v jednom ticku).

3.  **Leaf Nodes (Listové uzly)**:
    *   **Action**: Provádí konkrétní herní logiku (pohyb, útok).
    *   **Condition**: Ověřuje stav světa (je hráč v dosahu?).

4.  **Blackboard**:
    *   Sdílené úložiště dat pro strom.
    *   Umožňuje komunikaci mezi uzly a předávání kontextu (např. reference na entitu).

5.  **ECS Integrace**:
    *   **BehaviorTreeComponent**: Drží instanci stromu a blackboard.
    *   **BehaviorTreeSystem**: Pravidelně volá `tick()` na aktivních stromech.

6.  **Serializace a Data (Nově přidáno)**:
    *   **NodeRegistry**: Umožňuje registraci typů uzlů podle názvu (string -> class).
    *   **BehaviorTreeBuilder**: Vytváří instance stromů z JSON definic.
    *   **JSON Schema**: Definice stromu obsahuje `type`, `properties` (pole nebo objekt) a `children`.

7.  **Tooling**:
    *   **BTEditor**: Vizuální editor pro runtime úpravy, tvorbu stromů a přiřazování entitám. Umožňuje editaci vlastností a struktury.
    *   **BehaviorTreeRegistry**: Centrální registr běžících stromů.

## Consequences
*   **Positive**:
    *   Vysoká modularita a znovupoužitelnost AI logiky.
    *   Data-driven přístup díky JSON serializaci.
    *   Možnost editace AI chování za běhu bez rekompilace.
*   **Negative**:
    *   Vyšší paměťová náročnost (každá entita může mít instanci stromu).
    *   Nutnost registrace všech custom nodů do NodeRegistry pro serializaci.
*   **Risks**:
    *   Výkonnostní dopad při velkém počtu entit (nutno řešit frekvenci aktualizací).

## Compliance
Implementace dodržuje principy SOLID a Clean Architecture. Všechny komponenty jsou testovatelné a serializovatelné.
