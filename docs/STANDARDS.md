# Standardizační Plán LONGIN Ecosystemu

## 1. Komunikační Standardy

### 1.1 Protokoly
- **Inter-Service (Synchronní)**: REST API (JSON)
  - Použití: Přímé dotazy na stav, CRUD operace.
  - Dokumentace: OpenAPI 3.0 (Swagger).
- **Inter-Service (Asynchronní)**: Redis Streams
  - Použití: Události (UserCreated, DeploymentFinished), příkazy pro AI.
- **Real-time (Client-Server)**: WebSocket (Socket.IO)
  - Použití: Chat s postavou, streamování logů, notifikace.

### 1.2 Formát Zpráv (Longin Envelope)
Každá zpráva v systému (REST response i Event) musí dodržovat tuto obálku:

```typescript
interface LonginMessage<T> {
  meta: {
    traceId: string;      // UUID v4 pro distribuované trasování
    timestamp: string;    // ISO 8601 UTC
    source: string;       // Název služby (např. 'longin-core')
    version: string;      // Verze API (např. 'v1')
  };
  data: T;                // Samotný payload
  error?: {               // Přítomno pouze v případě chyby
    code: string;         // Unikátní kód chyby (např. 'AUTH_FAILED')
    message: string;      // Lidsky čitelná zpráva
    details?: any;        // Další kontext
  };
}
```

## 2. Autentizace a Autorizace

### 2.1 Identita
- **Central Authority**: Longin Core je jediným vydavatelem identit.
- **Tokeny**:
  - `Access Token`: JWT (krátká platnost, 15 min). Obsahuje `sub` (userId), `roles`, `permissions`.
  - `Refresh Token`: Opaque token (dlouhá platnost, 7 dní) uložený v HTTP-only cookie nebo secure storage.

### 2.2 Service-to-Service
- Služby se navzájem autentizují pomocí **API Keys** nebo **mTLS** (v budoucnu).
- Prozatím: Sdílený `INTERNAL_API_SECRET` v environment proměnných.

## 3. Logování a Monitoring

### 3.1 Strukturované Logování
Všechny služby musí logovat ve formátu JSON na `stdout`/`stderr`.

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2026-01-13T10:00:00Z",
  "service": "longin-core",
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "context": {
    "userId": "user_123",
    "ip": "192.168.1.1"
  }
}
```

### 3.2 Úrovně Logování
- `ERROR`: Chyba vyžadující okamžitou pozornost (pád služby, DB nedostupná).
- `WARN`: Neočekávaný stav, ale systém běží (validace vstupu selhala).
- `INFO`: Významné business události (start služby, login, vytvoření entity).
- `DEBUG`: Detailní informace pro vývoj (payloady, SQL queries).

### 3.3 Metriky
Všechny služby musí vystavovat endpoint `/metrics` ve formátu **Prometheus**.
Povinné metriky:
- `http_request_duration_seconds`: Histogram latence.
- `http_requests_total`: Counter počtu requestů (label: status_code).
- `process_cpu_usage`: Využití CPU.
- `process_resident_memory_bytes`: Využití RAM.

## 4. Verzování a Branching
- **Git Flow**:
  - `main`: Produkční verze.
  - `develop`: Integrační větev.
  - `feature/*`: Vývoj nových funkcí.
- **Semantic Versioning**: `MAJOR.MINOR.PATCH`.

## 5. Error Handling
Standardizované HTTP status kódy:
- `200 OK`: Úspěch (synchronní).
- `201 Created`: Úspěšně vytvořeno.
- `202 Accepted`: Přijato ke zpracování (asynchronní).
- `400 Bad Request`: Chyba validace (klient).
- `401 Unauthorized`: Chybějící nebo neplatný token.
- `403 Forbidden`: Nedostatečná oprávnění.
- `404 Not Found`: Zdroj nenalezen.
- `500 Internal Server Error`: Neočekávaná chyba serveru.
