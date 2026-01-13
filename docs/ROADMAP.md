# Roadmapa a Testovací Strategie

## 1. Roadmapa Implementace

### Fáze 1: Konsolidace a Standardizace (Týden 1-2)
- [ ] **Task 1.1**: Migrace `Longin_character` na TypeScript a začlenění do monorepa pod `services/`.
- [ ] **Task 1.2**: Kontejnerizace `Longin_bridge` (Python) a přidání do `docker-compose.yml`.
- [ ] **Task 1.3**: Sjednocení konfigurace portů a environment proměnných.

### Fáze 2: Command Center Core (Týden 3-4)
- [ ] **Task 2.1**: Rozšíření `Longin Core` o API pro registraci modulů.
- [ ] **Task 2.2**: Implementace `Redis Pub/Sub` pro komunikaci mezi moduly.
- [ ] **Task 2.3**: Vytvoření centralizované auth middleware.

### Fáze 3: AI Brain & Paměť (Týden 5-6)
- [ ] **Task 3.1**: Extrakce `ModelService` do samostatné služby `longin-brain`.
- [ ] **Task 3.2**: Implementace vektorové databáze (pgvector) v Postgres.
- [ ] **Task 3.3**: Napojení `Character` a `Bridge` na novou paměť.

### Fáze 4: UI a Integrace (Týden 7-8)
- [ ] **Task 4.1**: Dashboard widgety pro ovládání AI agentů.
- [ ] **Task 4.2**: Vizualizace "myšlenkového procesu" AI v reálném čase.

## 2. Testovací Strategie

### Úrovně Testování
1. **Unit Testy**:
   - Nástroj: **Jest** (pro TS/JS), **PyTest** (pro Python).
   - Cíl: 80% pokrytí business logiky (Services, Utils).
   - Pravidlo: Každý commit musí projít unit testy.

2. **Integrační Testy**:
   - Nástroj: **Supertest** (API), **Testcontainers**.
   - Cíl: Ověření komunikace s DB a Redis.
   - Scénáře: Registrace uživatele, Uložení paměti, Generování odpovědi.

3. **End-to-End (E2E) Testy**:
   - Nástroj: **Playwright** nebo **Cypress** (nebo existující `longin-e2e` v `Longin_hosting`).
   - Cíl: Simulace uživatelského průchodu celým ekosystémem.
   - Flow: Login -> Chat s Charakterem -> Změna nastavení -> Logout.

4. **Load Testy**:
   - Nástroj: **k6**.
   - Cíl: Ověřit stabilitu WebSocketu při 100+ souběžných agentech.

### CI/CD Pipeline
- **Pre-commit**: Lint (ESLint), Unit Tests.
- **Pull Request**: Build všech Docker images, Integrační testy.
- **Master Merge**: Deploy na staging, E2E testy.
