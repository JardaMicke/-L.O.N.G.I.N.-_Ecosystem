# 📖 LONGIN HOSTING - KOMPLETNÍ IMPLEMENTAČNÍ PŘÍRUČKA

> **Pro AI Agenta (Claude/Cursor)** | Vibe Coding | Optimized for 512+ token chunks
> 
> **Verze:** 1.0 | **Status:** PRODUCTION READY | **Březen 2025**

---

## 🎯 JAK ČÍST TUTO PŘÍRUČKU

### Struktura
1. **PRD (Product Requirements Document)** - Co budujeme a proč
2. **7 FÁZÍ** - Sekvenční kroky implementace
3. **7 PROMPTŮ** - Detailní instruktážní prompty pro AI agenta
4. **KONFIGURAČNÍ SOUBORY** - Všechny env, docker, config soubory
5. **ARCHITEKTURNÍ DIAGRAMY** - Vizuální znázornění

### Použití s AI Agentem

```
1. Vytvoř Task 1.1 → AI Agent implementuje
2. Pokud hotovo → Vytvoř Task 1.2
3. Pokud blokáda → Pošli relavantní PROMPT AI Agentovi
4. Repeat pro všechny Tasky
```

---

## 📋 PRODUCT REQUIREMENTS DOCUMENT

### Co je Longin Hosting?

**Longin** je **self-hosted aplikační runtime** umožňující:
- ✅ Deploy libovolné aplikace do Docker kontejneru
- ✅ Správa portů (3100-4000)
- ✅ Real-time monitoring (CPU, memory, network)
- ✅ Git webhook integrace
- ✅ Live log streaming
- ✅ User management & RBAC

### Klíčové Features

| Feature | Status | Priority |
|---------|--------|----------|
| User Auth (JWT) | Phase 2 | 🔴 Critical |
| Docker Integration | Phase 3 | 🔴 Critical |
| Applications CRUD | Phase 3 | 🟠 High |
| Real-time Metrics | Phase 4 | 🟠 High |
| Frontend UI | Phase 5 | 🟠 High |
| Monitoring & Logs | Phase 6 | 🟡 Medium |
| Git Webhooks | Phase 7 | 🟡 Medium |

### Tech Stack

**Backend:**
- Node.js 20 + Express + TypeScript
- PostgreSQL + TypeORM
- Redis + Socket.io
- Dockerode (Docker SDK)
- JWT + bcryptjs (Auth)

**Frontend:**
- React 18 + TypeScript
- Redux Toolkit (State)
- Vite (Build)
- Tailwind CSS (Styling)
- Socket.io Client (Real-time)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Prometheus + Grafana (Monitoring)
- ELK Stack (Logging)

### Architektura

```
┌─────────────────────────────────────────────────────┐
│                   LONGIN HOSTING                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend (React)        Backend (Express)          │
│  ├─ Dashboard            ├─ REST API                │
│  ├─ App Manager          ├─ WebSocket              │
│  ├─ Monitoring           ├─ Docker SDK             │
│  └─ Logs                 └─ Metrics Collector      │
│         │                       │                   │
│         └───────────────────────┘                   │
│                 (HTTP + WS)                         │
│                                                     │
│  Database Layer:          Message Queue:            │
│  ├─ PostgreSQL 15         ├─ Redis                  │
│  ├─ 7 Tables             ├─ Session Store          │
│  └─ TypeORM              └─ Pub/Sub                │
│                                                     │
│  Container Runtime:                                 │
│  ├─ Docker Socket                                  │
│  ├─ Container Mgmt                                 │
│  └─ Port Allocation (3100-4000)                    │
│                                                     │
│  Monitoring:              Logging:                  │
│  ├─ Prometheus            ├─ Loki                   │
│  ├─ Grafana              ├─ Elasticsearch          │
│  └─ Node Exporter        └─ Kibana                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User        →  Frontend      →  Backend       →  Database
  │              │              │              │
  ├─Login        ├─Socket        ├─Auth        ├─User
  ├─Deploy App   ├─WebSocket     ├─Docker      ├─Application
  ├─View Logs    ├─Real-time     ├─Container   ├─Container
  └─Monitor      └─Charts        ├─Metrics     └─Metrics
                                └─Webhooks

Docker Engine: Create/Start/Stop containers
    │
    ├─ Memory/CPU metrics
    ├─ Log streams  
    └─ Health checks
```

---

## 🏗️ PHASE OVERVIEW

### Phase 1: Foundation (2-3 týdny)
- Project struktura + monorepo
- Docker & Docker Compose
- CI/CD pipeline (GitHub Actions)
- **OUTPUT:** Dev prostředí ready

### Phase 2: Authentication (2-3 týdny)
- Database schema (7 tabulek)
- TypeORM entities
- JWT auth + password hashing
- REST API endpoints
- **OUTPUT:** Auth working, API endpoints ready

### Phase 3: Docker Integration (2 týdny)
- Docker SDK wrapper (dockerode)
- Container CRUD operations
- Port allocation system
- Container status tracking
- **OUTPUT:** Can create/manage containers

### Phase 4: Real-time & WebSocket (2 týdny)
- Socket.io server setup
- Metrics broadcasting
- Log streaming
- Admin namespace
- **OUTPUT:** Real-time data flows

### Phase 5: Frontend (3-4 týdny)
- React components
- Redux store
- API integration
- Socket.io client
- **OUTPUT:** Working UI

### Phase 6: Monitoring & Deployment (3 týdny)
- Prometheus setup
- Grafana dashboards
- ELK logging
- Production configs
- **OUTPUT:** Monitoring stack + deployment ready

---

## 📊 SEKVENCE TASKŮ (ZÁVISLOSTI)

```
PHASE 1                 PHASE 2                 PHASE 3
├─ 1.1: Init           ├─ 2.1: DB Schema       ├─ 3.1: Docker Wrapper
├─ 1.2: Backend        ├─ 2.2: Redis           ├─ 3.2: Container Service
├─ 1.3: Frontend       ├─ 2.3: Auth            ├─ 3.3: Port Mgmt
├─ 1.4: Database       ├─ 2.4: Middleware      └─ 3.4: App Routes
├─ 1.5: Docker Compose ├─ 2.5: Auth Routes
└─ 1.6: GitHub Actions └─ 2.6: API Server

PHASE 4                 PHASE 5                 PHASE 6
├─ 4.1: Socket.io      ├─ 5.1: Redux Store     ├─ 6.1: Prometheus
├─ 4.2: Metrics Svc    ├─ 5.2: Components      ├─ 6.2: Grafana
├─ 4.3: Logs Svc       ├─ 5.3: Pages           ├─ 6.3: ELK Stack
└─ 4.4: Websocket API  ├─ 5.4: Socket Client   └─ 6.4: Deployment
                       └─ 5.5: Styling & Tests
```

**KRITICKÉ ZÁVISLOSTI:**
- 2.1 MUSÍ být hotovo před 2.2+
- 2.3 MUSÍ být hotovo před 2.4+
- 3.x MUSÍ počkat na 2.6
- 4.x MUSÍ počkat na 3.x
- 5.x MŮŽE jít paralelně s 4.x

---

## 🔧 CENTRÁLNÍ KONFIGURAČNÍ SOUBORY

### .env (Root)

```env
# ========== NODE ==========
NODE_ENV=development
LOG_LEVEL=debug

# ========== PORTS ==========
LONGIN_CORE_API_PORT=3001
LONGIN_CORE_WEBSOCKET_PORT=3002
LONGIN_UI_PORT=3000
DATABASE_PORT=5432
REDIS_PORT=6379

# ========== DATABASE ==========
DATABASE_HOST=localhost
DATABASE_USER=longin
DATABASE_PASSWORD=longin_secure_password_change_in_production
DATABASE_NAME=longin_db

# ========== REDIS ==========
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ========== JWT SECRETS ==========
JWT_ACCESS_SECRET=your_super_secret_access_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ========== FRONTEND ==========
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001

# ========== DOCKER ==========
DOCKER_SOCKET=/var/run/docker.sock
DOCKER_HOST=unix:///var/run/docker.sock

# ========== GIT ==========
GITHUB_API_TOKEN=your_github_token_optional
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# ========== MONITORING ==========
PROMETHEUS_PORT=9090
GRAFANA_PORT=3004
GRAFANA_ADMIN_PASSWORD=admin

# ========== DEPLOYMENT ==========
DEPLOYMENT_ENV=production
DEPLOYMENT_URL=https://longin.example.com
```

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    ports:
      - "${DATABASE_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./services/database/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./services/database/pgvector-init.sql:/docker-entrypoint-initdb.d/02-pgvector.sql
    networks:
      - longin-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT}:6379"
    volumes:
      - redis_data:/data
    networks:
      - longin-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  longin-core:
    build:
      context: .
      dockerfile: services/longin-core/Dockerfile
      target: development
    ports:
      - "${LONGIN_CORE_API_PORT}:3001"
      - "${LONGIN_CORE_WEBSOCKET_PORT}:3002"
    environment:
      - NODE_ENV=development
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USER=${DATABASE_USER}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME}
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - ./services/longin-core/src:/app/services/longin-core/src
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - longin-network

  longin-ui:
    build:
      context: .
      dockerfile: services/longin-ui/Dockerfile
      target: development
    ports:
      - "${LONGIN_UI_PORT}:3000"
    environment:
      - REACT_APP_API_URL=${REACT_APP_API_URL}
      - REACT_APP_SOCKET_URL=${REACT_APP_SOCKET_URL}
    volumes:
      - ./services/longin-ui/src:/app/services/longin-ui/src
    depends_on:
      - longin-core
    networks:
      - longin-network

volumes:
  postgres_data:
  redis_data:

networks:
  longin-network:
    driver: bridge
```

---

## 📚 QUICK START CHECKLIST

```bash
# 1. Prerequisites
- Node.js 20+
- Docker & Docker Desktop
- PostgreSQL 15 (nebo v docker)
- Redis 7 (nebo v docker)
- pnpm

# 2. Setup
git clone <repo>
cd longin-hosting-server
cp .env.example .env
pnpm install

# 3. Development
docker-compose up -d
pnpm dev

# 4. Verify
curl http://localhost:3001/health       # Backend
curl http://localhost:3000              # Frontend
docker ps | grep longin                 # Containers

# 5. Troubleshoot
docker logs longin-core-1
docker logs longin-ui-1
pnpm test
```

---

## 🎯 NEXT STEPS

1. **Přečti si kompletní TODO LIST** v `longin-phase1-6-prompts.md`
2. **Nastartuj Task 1.1** a poskytni AI Agentovi příslušný PROMPT
3. **Postupuj sekvenčně** - nepreskakuj tasky
4. **Po každém tasku** - verify, test, commit
5. **Feedback loop** - pokud je blokáda, pošli relevantní PROMPT AI Agentovi

---

**Vše potřebné je připraveno. Teď je na řadě implementace. LET'S GO! 🚀**

