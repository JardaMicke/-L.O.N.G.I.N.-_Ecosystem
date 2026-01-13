# Integrační Mapa a Diagram Závislostí

## Současný Stav (Fragmentovaný)

```mermaid
graph TD
    User[Uživatel] --> UI[Longin UI :3000]
    User --> Electron[Character App]
    User --> Ext[Chrome Extension]
    
    UI --> Core[Longin Core :3001]
    Core --> DB[(Postgres)]
    Core --> Redis[(Redis)]
    
    Electron --> CharBackend[Character API :?]
    CharBackend --> Ollama[Local LLM :11434]
    
    Ext --> Bridge[Python Bridge :5000]
```

## Chybějící Propojení
1. **Character <-> Core**: Charakter neví o stavu systému (deploymenty, notifikace).
2. **Bridge <-> Core**: Data z prohlížeče se nedostávají do centrální paměti.
3. **Game Engine <-> Core**: Hry nejsou spravovány centrálním dashboardem.

## Cílový Stav (Integrovaný)

```mermaid
graph TD
    User --> Gateway[Traefik Gateway :80]
    
    subgraph "Command Center"
        Gateway --> UI[Longin UI]
        Gateway --> Core[Longin Core]
        Core --> DB[(Postgres)]
        Core --> Redis[(Redis)]
    end
    
    subgraph "Agents & Modules"
        Core -- WebSocket --> Character[Character Agent]
        Core -- REST/WS --> Bridge[Bridge Service]
        Core -- Docker API --> Game[Game Engine]
    end
    
    subgraph "External Intelligence"
        Character --> LLM_Router[LLM Gateway]
        LLM_Router --> Ollama
        LLM_Router --> OpenAI
    end
```

## Datové Toky
1. **Centrální Paměť**: Všechny moduly (Character, Bridge) by měly ukládat dlouhodobá data do Core Postgres databáze přes API.
2. **Event Bus**: Redis Pub/Sub pro komunikaci mezi moduly v reálném čase.
