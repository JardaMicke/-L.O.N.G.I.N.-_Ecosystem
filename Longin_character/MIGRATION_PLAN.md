# 📝 Migrační Plán: Longin Character Backend → TypeScript

> **Verze:** 1.0  
> **Datum:** 2026-01-19  
> **Status:** IN PROGRESS

---

## 📋 Přehled Migrace

### Aktuální Stav
- **Jazyk:** JavaScript (CommonJS)
- **Framework:** Express.js
- **Řádky kódu:** ~2000+
- **Hlavní třídy:** MemoryService, ModelService, StoryEngine
- **Databáze:** SQLite3

### Cílový Stav
- **Jazyk:** TypeScript (ES Modules)
- **Kompatibilita:** Plná kompatibilita s Longin Core
- **Typová bezpečnost:** 100% pokrytí typy

---

## 📁 Soubory k Migraci

### Priorita 1: Infrastruktura (Den 1) ✅
| Soubor | Řádky | Komplexita | Status |
|--------|-------|------------|--------|
| `package.json` | 46 | Nízká | [x] |
| `tsconfig.json` | NEW | Nízká | [x] |
| `server.ts` | 165 | Nízká | [x] |

### Priorita 2: Utility a Typy (Den 1-2) ✅
| Soubor | Řádky | Komplexita | Status |
|--------|-------|------------|--------|
| `utils/logger.ts` | 76 | Nízká | [x] |
| `types/index.ts` | 170 | Vysoká | [x] |

### Priorita 3: Services (Den 2-4) 🔄
| Soubor | Řádky | Komplexita | Status |
|--------|-------|------------|--------|
| `memory-service.ts` | 450 | Vysoká | [x] |
| `model-service.ts` | 340 | Vysoká | [x] |
| `story-engine.ts` | 578 | Vysoká | [x] |
| `voice-service.ts` | ~400 | Střední | [x] |
| `achievement-service.ts` | ~400 | Střední | [x] |
| `update-service.ts` | ~400 | Střední | [x] |
| `optimizations.ts` | ~200 | Nízká | [x] |

### Priorita 4: Controllers a Routes (Den 4-5)
| Soubor | Řádky | Komplexita | Status |
|--------|-------|------------|--------|
| `controllers/chatController.js` → `.ts` | ~250 | Střední | [x] |
| `controllers/generationController.js` → `.ts` | ~400 | Střední | [x] |
| `routes/api.js` → `routes/api.ts` | ~50 | Nízká | [x] |
| `routes/update-routes.js` → `.ts` | ~130 | Nízká | [x] |
| `middleware/*.js` → `middleware/*.ts` | ~50 | Nízká | [x] |

### Priorita 5: Testy (Den 5)
| Soubor | Řádky | Komplexita | Status |
|--------|-------|------------|--------|
| `tests/api.test.js` → `.ts` | ~100 | Střední | [x] |
| `tests/model-service.test.js` → `.ts` | ~100 | Střední | [x] |

---

## 🔧 Kroky Implementace

### Krok 1: Nastavení TypeScript Projektu
```bash
# V Longin_character/backend/

# 1. Aktualizace package.json
# 2. Instalace TypeScript dependencies
# 3. Vytvoření tsconfig.json
# 4. Vytvoření types/index.ts
```

**Nové závislosti:**
- typescript
- @types/node
- @types/express
- @types/multer
- @types/uuid
- @types/cors
- ts-node
- ts-node-dev

### Krok 2: Vytvoření TypeScript Typů

```typescript
// types/index.ts

export interface Character {
  id: string;
  name: string;
  personality: string;
  traits: string[];
  backstory?: string;
}

export interface Memory {
  id: string;
  characterId: string;
  type: 'conversation' | 'event' | 'narrative';
  content: string;
  importance: number;
  timestamp: Date;
  keywords: string[];
}

export interface ModelOptions {
  character?: Character;
  memories?: Memory[];
  temperature?: number;
  maxTokens?: number;
  provider?: 'openai' | 'claude' | 'local';
}

export interface GenerationResult {
  success: boolean;
  response?: string;
  error?: string;
  timestamp: Date;
}
```

### Krok 3: Migrace Server Entry Point

```typescript
// server.ts
import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/api';

const app: Application = express();
const port: number = parseInt(process.env.PORT || '3011', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Longin Character API is running', version: '2.0' });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Character API running on port ${port}`);
});

export default app;
```

### Krok 4: Migrace Tříd (Příklad MemoryService)

```typescript
// services/memory-service.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { Memory, Character } from '../types';

export class MemoryService {
  private memories: Map<string, Memory[]> = new Map();
  private memoryIndex: Map<string, Map<string, string[]>> = new Map();
  private readonly maxMemoriesPerCharacter: number = 1000;
  private readonly dataDir: string;

  constructor() {
    this.dataDir = path.join(__dirname, '../../data/memories');
    this._ensureDirectoryExists();
    this._setupMemoryPruning();
  }

  // ... metody s plnými typy
}

export default new MemoryService();
```

---

## ✅ Checklist Migrace

### Fáze 1: Setup
- [ ] package.json aktualizován s TS dependencies
- [ ] tsconfig.json vytvořen
- [x] types/index.ts vytvořen se všemi interfaces
- [ ] .eslintrc aktualizován pro TypeScript

### Fáze 2: Core Migrace
- [ ] utils/logger.ts migrován
- [x] error-handler.ts migrován
- [x] server.ts migrován
- [x] Projekt se kompiluje bez chyb

### Fáze 3: Services
- [x] memory-service.ts migrován
- [x] model-service.ts migrován
- [x] story-engine.ts migrován
- [x] Ostatní services migrovány

### Fáze 4: Controllers/Routes
- [x] Všechny controllers migrovány
- [x] Všechny routes migrovány
- [x] Middleware migrován

### Fáze 5: Testy
- [x] Testy migrovány na TypeScript
- [ ] Všechny testy procházejí
- [ ] Pokrytí kódu > 80%

### Fáze 6: Integrace
- [ ] Build funguje bez chyb
- [ ] Docker image funguje
- [ ] Integrace s Core API ověřena

---

## ⏱️ Časový Odhad

| Fáze | Odhad |
|------|-------|
| Setup | 2 hodiny |
| Core Migrace | 4 hodiny |
| Services | 8-10 hodin |
| Controllers/Routes | 4 hodiny |
| Testy | 4 hodiny |
| Integrace | 2 hodiny |
| **Celkem** | **24-30 hodin** |

---

## 🚨 Rizika a Mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| SQLite3 typy | Střední | Nízký | Použít @types/sqlite3 |
| Socket.io integrace | Nízká | Střední | Postupná migrace |
| Runtime chyby | Střední | Vysoký | Striktní testování |

---

## 📎 Související Dokumenty

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [STANDARDS.md](../docs/STANDARDS.md)
