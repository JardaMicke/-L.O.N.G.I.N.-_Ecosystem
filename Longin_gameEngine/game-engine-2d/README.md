# Game Engine 2D

**Poslední aktualizace / Last Update:** 2026-01-02

## Popis projektu
Modulární 2D herní engine postavený na moderních webových technologiích s podporou ECS, skriptování a pokročilého editoru.

### Klíčové Funkce
- **ECS Architektura**: Vysoce výkonný systém entit a komponent.
- **Skriptování**: Podpora vlastních skriptů (TypeScript/JS) pro herní logiku.
- **Map Editor**: Integrovaný nástroj pro tvorbu úrovní s podporou vrstev.
- **Profiling**: Vestavěné nástroje pro měření výkonu a ladění.
- **Multi-Project**: Správa více herních projektů v jedné instanci.

## Instrukce pro instalaci a spuštění

### Požadavky
- Node.js v20+
- npm v10+

### Instalace
```bash
npm install
```

### Spuštění
Pro spuštění serveru a klienta:
```bash
npm start
```

Pro spuštění v produkčním režimu:
```bash
npm run start:prod
```

### Testování
Spuštění všech testů:
```bash
npm test
```

Spuštění integračních (E2E) testů:
```bash
npm test tests/integration
```

Pro spuštění testů s coverage reportem:
```bash
npm run test:cov
```

### Kvalita kódu
Projekt používá ESLint a Prettier pro zajištění kvality a konzistence kódu.

Kontrola kódu:
```bash
npm run lint
```

Oprava formátování:
```bash
npm run lint:fix
```

### CI/CD
Projekt využívá GitHub Actions pro automatizaci testování a buildu. Pipeline se spouští při každém pushi do větve `main` a při vytvoření Pull Requestu.

## Struktura projektu
- `src/` - Zdrojové kódy
  - `core/` - Jádro enginu (GameLoop, Engine)
  - `ecs/` - Entity Component System
  - `graphics/` - Grafický subsystém (Renderer, Layers)
  - `physics/` - Fyzikální subsystém
  - `scripting/` - Systém pro uživatelské skripty
  - `tools/` - Editor nástroje (MapEditor)
  - `server/` - Serverová část (API, DB)
- `tests/` - Unit a Integrační testy
- `docs/` - Dokumentace (API, Architektura, User Guide)
- `dist/` - Kompilovaný výstup
