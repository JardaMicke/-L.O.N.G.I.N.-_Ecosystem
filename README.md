# 🏛️ L.O.N.G.I.N. Ecosystem

> **Local Orchestration Network for Generalized Intelligence Nodes**

Modulární platforma pro orchestraci AI agentů, Docker hosting, herní engine a distribuované výpočty.

---

## 🚀 Quick Start

```bash
# 1. Klonování
git clone <repo>
cd L.O.N.G.I.N.Ecosystem

# 2. Konfigurace
cp .env.ecosystem .env

# 3. Spuštění základních služeb (Core + UI + DB + Redis)
docker-compose -f docker-compose.ecosystem.yml up -d

# 4. Spuštění s AI moduly
docker-compose -f docker-compose.ecosystem.yml --profile ai up -d

# 5. Spuštění s monitoringem
docker-compose -f docker-compose.ecosystem.yml --profile monitoring up -d
```

---

## 📦 Komponenty Ekosystému

| Komponenta | Port | Popis | Stav |
|------------|------|-------|------|
| **Longin Core** | 3001 | Centrální orchestrátor, Docker hosting | 🟡 70% |
| **Longin UI** | 3000 | Dashboard pro správu | 🟡 60% |
| **Longin Character** | 3011 | AI asistent (Ollama/OpenAI) | 🟠 60% |
| **Longin Bridge** | 5001 | Browser-OS most (WebRTC) | 🟠 50% |
| **Game Engine** | 3020 | 2D RTS/RPG engine | 🔴 40% |
| **Performance Hub** | TBD | Distributed computing | 🔴 10% |

---

## 📁 Struktura Projektu

```
L.O.N.G.I.N.Ecosystem/
├── docs/                      # 📚 Centrální dokumentace
│   ├── ARCHITECTURE.md        # Architektonický přehled
│   ├── STANDARDS.md           # Komunikační standardy
│   └── ...                    # Další dokumenty
├── Longin_hosting/            # 🖥️ Command Center (Core + UI)
│   └── services/
│       ├── longin-core/       # Express.js API
│       └── longin-ui/         # React Dashboard
├── Longin_character/          # 🤖 AI Agent
├── Longin_bridge/             # 🌉 Browser Bridge
├── Longin_gameEngine/         # 🎮 2D Game Engine
├── Longin_performance_hub/    # ⚡ Distributed Computing (docs)
├── Games/                     # 🎲 Herní projekty
├── Tools/                     # 🔧 Pomocné nástroje
├── _archive/                  # 📦 Archivované projekty
├── .env.ecosystem             # ⚙️ Sjednocená konfigurace
└── docker-compose.ecosystem.yml  # 🐳 Orchestrace všech služeb
```

---

## 📖 Dokumentace

Veškerá dokumentace je sjednocena v složce `/docs`:

- [Architektura](docs/ARCHITECTURE.md) - Přehled systému a navigace
- [Standardy](docs/STANDARDS.md) - Komunikační a vývojové standardy
- [Roadmapa](docs/ROADMAP.md) - Plán implementace
- [Inventář](docs/INVENTORY.md) - Seznam všech komponent

---

## 🛠️ Technologie

**Backend:** Node.js, Express, TypeScript, TypeORM, Socket.IO  
**Frontend:** React, Vite, TypeScript  
**Database:** PostgreSQL, Redis, pgvector  
**AI:** Ollama, OpenAI, Stable Diffusion  
**DevOps:** Docker, Traefik, Prometheus, Grafana

---

## 📊 Architektura

```
┌─────────────────────────────────────────────────┐
│              TRAEFIK GATEWAY (:80)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ LONGIN CORE │  │  LONGIN UI  │              │
│  │   (:3001)   │  │   (:3000)   │              │
│  └──────┬──────┘  └─────────────┘              │
│         │                                       │
│  ┌──────▼──────────────────────────────────┐   │
│  │  PostgreSQL (:5432) + Redis (:6379)     │   │
│  └──────────────────────────────────────────┘   │
│         │                                       │
│  ┌──────▼──────────────────────────────────┐   │
│  │  CHARACTER │ BRIDGE │ GAME ENGINE       │   │
│  │   (:3011)  │(:5001) │    (:3020)        │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📜 License

MIT

---

**Verze:** 2.0 | **Aktualizace:** Leden 2026
