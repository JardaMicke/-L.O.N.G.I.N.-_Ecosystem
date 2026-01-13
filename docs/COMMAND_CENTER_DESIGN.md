# Návrh Architektury Command Centra

## 1. Modulární Architektura

Systém bude postaven na principu **Hexagonální Architektury** s centrálním jádrem (`Longin Core`).

### Klíčové Komponenty
1. **API Gateway (Traefik)**:
   - Jediný vstupní bod pro všechny klienty (UI, Extension, Electron).
   - Routing:
     - `/api/core/*` -> Longin Core
     - `/api/character/*` -> Character Service
     - `/api/bridge/*` -> Bridge Service
     - `/ws/*` -> WebSocket Server

2. **Event Bus (Redis Stream)**:
   - Asynchronní komunikace mezi službami.
   - Kanály: `system.events`, `ai.thought`, `user.action`.

3. **Plugin System**:
   - Umožní dynamické načítání AI agentů.
   - Standardizované rozhraní pro agenty (Input -> Process -> Output).

## 2. Specifikace Trvalé Paměti

Datový model (PostgreSQL) bude rozšířen o:

```sql
-- Tabulka pro vektorovou paměť (pomocí pgvector)
CREATE TABLE memory_embeddings (
    id UUID PRIMARY KEY,
    content TEXT,
    embedding VECTOR(1536),
    source_module VARCHAR(50), -- 'character', 'bridge', 'core'
    created_at TIMESTAMP
);

-- Tabulka pro kontext postav
CREATE TABLE character_context (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    traits JSONB,
    state JSONB
);
```

## 3. Standardizace

### Komunikační Protokol (Longin Protocol)
Všechny zprávy mezi moduly musí mít formát:
```json
{
  "traceId": "uuid",
  "timestamp": "ISO8601",
  "source": "module_name",
  "type": "COMMAND | EVENT | QUERY",
  "payload": { ... }
}
```

### Autentizace
- Centralizovaná **OAuth2 / JWT** autorizace v `Longin Core`.
- Všechny ostatní služby (Character, Bridge) ověřují tokeny proti Core (nebo sdílenému Redis klíči).

## 4. Integrace LLM
Vytvoření nové microservisy **`longin-brain`**:
- Abstrahuje volání LLM (Ollama, OpenAI).
- Spravuje frontu požadavků.
- Cachuje odpovědi.
- Character Backend bude volat `longin-brain` místo přímého volání API.
