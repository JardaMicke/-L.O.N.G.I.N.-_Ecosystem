# Uživatelská příručka - Game Engine 2D

**Poslední aktualizace / Last Update:** 2026-01-02

## Obsah / Table of Contents
1. [Správa Projektů / Project Management](#správa-projektů)
2. [Map Editor](#map-editor)
3. [Skriptování / Scripting](#skriptování)
4. [Ladění a Výkon / Debugging & Performance](#ladění-a-výkon)

---

## Správa Projektů <a name="správa-projektů"></a>

Game Engine 2D umožňuje pracovat s více projekty (hrami) současně. Každý projekt má svou vlastní konfiguraci, mapy a nastavení.

### Hlavní Menu
Po spuštění aplikace se zobrazí hlavní menu. Místo přímého startu hry naleznete tlačítko **Projekty**.

### Obrazovka Projektů
Kliknutím na tlačítko **Projekty** se otevře správce projektů. Zde můžete:

1.  **Vytvořit nový projekt**:
    - Klikněte na tlačítko **Create New Project**.
    - Zadejte název projektu.
    - Projekt se vytvoří a přidá do seznamu.

2.  **Otevřít existující projekt**:
    - V seznamu projektů klikněte na tlačítko **Open** u požadovaného projektu.
    - Tím se projekt načte a přepne se do Lobby/Editoru.

3.  **Přejmenovat projekt**:
    - Klikněte na tlačítko **Rename**.
    - Zadejte nový název.

4.  **Smazat projekt**:
    - Klikněte na tlačítko **Delete**.
    - Potvrďte smazání. **Pozor: Tato akce je nevratná.**

### Výchozí Projekt (RFM)
Při prvním spuštění aplikace je automaticky vytvořen projekt s názvem **RFM** (Reference Model). Tento projekt slouží jako výchozí bod a ukázka.

---

## Map Editor <a name="map-editor"></a>

Map Editor slouží k vytváření herních úrovní pomocí dlaždic (tiles).

### Ovládání
- **Levé Tlačítko Myši**: Kreslení vybranou dlaždicí.
- **Pravé Tlačítko Myši**: Mazání (nebo výběr nástroje gumy).
- **Klávesové Zkratky**:
  - `Ctrl + Z`: Zpět (Undo)
  - `Ctrl + Y` / `Ctrl + Shift + Z`: Znovu (Redo)
  - `Ctrl + S`: Uložit mapu

### Funkce
- **Vrstvy (Layers)**: Umožňuje kreslit do různých hloubek (např. pozadí, popředí).
- **Paleta (Palette)**: Výběr textur a objektů pro vkládání.

---

## Skriptování <a name="skriptování"></a>

Pokročilí uživatelé mohou definovat vlastní chování herních objektů pomocí TypeScript/JavaScript skriptů.

### Základy
Každý skript implementuje rozhraní `IScript` s metodami:
- `onStart`: Volá se při inicializaci.
- `onUpdate`: Volá se každý snímek (frame).

Podrobné informace naleznete v technické dokumentaci [SCRIPTING_API.md](./SCRIPTING_API.md).

---

## Ladění a Výkon <a name="ladění-a-výkon"></a>

Engine obsahuje nástroje pro sledování výkonu.

### Debug Overlay
Překryvná vrstva zobrazující klíčové statistiky.
- **FPS (Snímky za sekundu)**: Ukazuje plynulost hry.
- **Frame Time**: Čas potřebný k vykreslení jednoho snímku.
- **Memory**: Využití paměti (pokud prohlížeč podporuje).
- **Entities**: Počet aktivních entit ve scéně.

Pro aktivaci Debug Overlay stiskněte klávesu **` (vlnovka/backtick)** nebo použijte tlačítko v editoru.
