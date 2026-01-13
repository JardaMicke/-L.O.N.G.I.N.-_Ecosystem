# Standardizační Plán LONGIN Ecosystemu

## 1. Komunikační Standardy

### API Protokoly
- **REST API**:
  - Formát: JSON (`application/json`).
  - Naming Convention: `kebab-case` pro URL (`/api/v1/user-profiles`), `camelCase` pro JSON keys.
  - Obalování odpovědí:
    ```json
    {
      "success": true,
      "data": { ... },
      "error": null,
      "meta": { "timestamp": "..." }
    }
    ```
- **WebSocket**:
  - Event-based messaging (Socket.io).
  - Namespaces: `/core`, `/character`, `/game`.

### Message Queue (Redis)
- **Kanály**: `[module].[action].[status]` (např. `character.thought.generated`, `system.deployment.failed`).
- **Payload**: Musí obsahovat `traceId` pro distribuované trasování.

## 2. Logování a Monitoring

### Logovací Formát
Všechny služby musí logovat ve strukturovaném JSON formátu kompatibilním s ELK stackem (Elasticsearch, Logstash, Kibana) nebo podobným agregátorem.

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2026-01-13T10:00:00Z",
  "service": "longin-core",
  "traceId": "123-abc",
  "metadata": { "userId": 5 }
}
```

### Monitoring
- **Health Checks**: Každá služba musí exponovat endpoint `/health` (vrací 200 OK + stav DB/Redis spojení).
- **Metriky**: Prometheus formát na endpointu `/metrics` (CPU, RAM, Request Count, Error Rate).

## 3. Bezpečnost a Autentizace

- **Identita**: JWT (JSON Web Tokens) vydávané službou `Longin Core`.
- **Expirace**: Access Token (15 min), Refresh Token (7 dní).
- **Service-to-Service**: Vnitřní služby komunikují přes privátní Docker síť; pro kritické operace vyžadují API Key v hlavičce `X-Service-Key`.

## 4. Vývojové Standardy (Codebase)

- **Jazyk**: TypeScript (vynuceno pro nové moduly), Python (pouze pro AI/ML specifické úlohy).
- **Linting**: ESLint + Prettier (konfigurace v `Longin_hosting` bude master).
- **Git Flow**:
  - `main`: Produkční verze.
  - `develop`: Integrační větev.
  - `feature/*`: Vývoj nových funkcí.
- **Commit Messages**: Conventional Commits (`feat: add login`, `fix: resolve timeout`).

## 5. Verzování
- **SemVer 2.0.0**: Major.Minor.Patch (např. 1.0.0).
- API verze v URL: `/api/v1/...`.
