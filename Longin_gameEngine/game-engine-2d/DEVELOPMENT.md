# Příručka pro vývojáře

**Poslední aktualizace / Last Update:** 2026-01-02

## Standardy kvality kódu

### Linting a Formátování
V projektu používáme **ESLint** pro statickou analýzu a **Prettier** pro formátování kódu.

- **Pravidla**: Jsou definována v `eslint.config.mjs` a `.prettierrc`.
- **Automatická kontrola**: Probíhá pomocí `husky` pre-commit hooku, který spouští `lint-staged`. Před každým commitem se automaticky zkontrolují a opraví změněné soubory.
- **Ruční kontrola**: Můžete spustit `npm run lint` nebo `npm run lint:fix`.

### Testování
Používáme **Jest** pro unit a integrační testy.

- **Umístění testů**:
  - Unit testy: Kopírují strukturu `src/` ve složce `tests/`.
  - Integrační testy: Ve složce `tests/integration/`.
- **Pokrytí kódu (Coverage)**:
  - Minimální požadované pokrytí je definováno v `jest.config.js`.
  - Globální limity:
    - Statements: 70%
    - Branches: 50%
    - Functions: 65%
    - Lines: 70%
- **Spuštění testů**: `npm test` nebo `npm run test:cov`.
- **E2E Scénáře**: Spouštějte pomocí `npm test tests/integration`.

### CI/CD Workflow
Projekt využívá GitHub Actions. Každý Pull Request musí projít kontrolou (Build, Lint, Test).

## Postup při vývoji (Workflow)
1. Vytvořte novou větev pro vaši funkcionalitu (`git checkout -b feature/nazev-funkce`).
2. Implementujte změny a pište testy (TDD přístup je doporučen).
3. Ujistěte se, že testy prochází (`npm test`).
4. Commitněte změny. Pre-commit hook automaticky zformátuje kód.
5. Pushněte větev a vytvořte Pull Request.
6. Počkejte na schválení CI pipeline.

## Struktura kódu
Dodržujte modularitu a principy Clean Code.

- **ECS**: Logika patří do Systemů, data do Komponent.
- **Scripting**:
  - `ScriptSystem` spravuje životní cyklus skriptů.
  - Skripty musí implementovat `IScript`.
- **Managers**: Pro globální správu stavu používejte Managery (např. `ConfigManager`, `EventManager`).
- **Audio**:
  - `AudioManager`: Správa globálního audia (hudba, sfx).
  - `AudioSystem`: ECS systém pro prostorový zvuk (spatial audio).
- **Interfaces**: Definujte rozhraní pro všechny veřejné API.

## Dokumentace
- **ADR**: Architektonická rozhodnutí jsou zaznamenána v `docs/adr/`.
- **API**: Referenční příručka v `docs/API_REFERENCE.md`.
