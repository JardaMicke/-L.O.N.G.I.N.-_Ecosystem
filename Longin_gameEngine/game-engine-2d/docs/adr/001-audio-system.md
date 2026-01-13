# 001. Implementace Audio Systému

## Status
Accepted

## Context
Projekt `game-engine-2d` postrádal funkcionalitu pro přehrávání zvuků a hudby. Bylo nutné zvolit řešení, které je kompatibilní s webovými prohlížeči, podporuje různé formáty (mp3, wav, ogg) a umožňuje pokročilé funkce jako prostorový zvuk (spatial audio).

## Decision
Rozhodli jsme se použít knihovnu **Howler.js** jako backend pro audio engine.

### Architektura:
1.  **AudioManager (Core)**: Singleton třída zapouzdřující Howler.
    *   Řídí globální hlasitost a mute.
    *   Spravuje načítání a přehrávání zvuků (SFX) a hudby.
    *   Řídí cross-fading hudby.
2.  **ResourceManager**: Deleguje načítání zvuků na `AudioManager`.
3.  **AudioSystem (ECS)**:
    *   **AudioSourceComponent**: Komponenta nesoucí informaci o zvuku, hlasitosti a dosahu.
    *   **AudioListenerComponent**: Komponenta určující "uši" ve scéně (typicky kamera nebo hráč).
    *   System automaticky vypočítává hlasitost a stereo panning na základě vzdálenosti mezi zdrojem a posluchačem.

## Consequences
*   **Positive**: Rychlá implementace robustního audia. Podpora pro moderní audio API.
*   **Negative**: Přidána externí závislost (`howler`).
*   **Risks**: Nutnost spravovat uvolňování paměti pro velké audio soubory (Howler to řeší částečně automaticky).

## Compliance
Implementace dodržuje ECS vzor a Clean Architecture.
