# DETAILNÍ PLÁN - FÁZE 5: EDITORS & TOOLS
## Focus: Content Creation Pipeline

**Cíl**: Vytvořit sadu nástrojů pro tvorbu obsahu hry bez nutnosti psát kód. Nástroje by měly být web-based (součástí dev buildu).

---

### Architektura Editoru
Editor bude běžet jako samostatná "Scene" nebo overlay nad hrou, sdílející stejný renderer.

**Soubor: `src/editor/editor-core.ts`**
- Singleton spravující stav editoru (ActiveTool, Selection, History/Undo).

### Krok 33: Asset & Sprite Editor
**Soubor: `src/editor/tools/sprite-editor.ts`**
- **Funkce**:
  - Definovat slice/atlasery pro sprite sheety.
  - Nastavovat pivot pointy.
  - Definovat kolizní boxy (hitboxy).
- **UI**: Panel s náhledem, formuláře pro souřadnice.

### Krok 34: Tilemap Painter
**Soubor: `src/editor/tools/tile-painter.ts`**
- **Nástroje**:
  - `Brush`: Kreslení jednotlivých dlaždic.
  - `Fill`: Bucket fill.
  - `Eraser`: Mazání.
  - `Rect`: Obdélníky.
- **Auto-tiling**: Definice pravidel pro přechody (tráva -> voda).

### Krok 35: Entity & Property Editor
**Soubor: `src/editor/tools/property-inspector.ts`**
- **Funkce**: Zobrazení komponent vybrané entity v UI a jejich editace v reálném čase.
- **Implementace**: Reflexe přes `IComponent.serialize()`/`deserialize()`, generování HTML formulářů.

### Krok 36: Scripting / Event Editor (Visual)
**Soubor: `src/editor/tools/visual-scripter.ts`**
- **Cíl**: Propojování eventů (OnEnter, OnClick) s akcemi (SpawnEnemy, Dialogue) pomocí node-based editoru nebo jednoduchého listu.

### Krok 37: UI Layout Editor
**Soubor: `src/editor/tools/ui-editor.ts`**
- Drag & Drop rozhraní pro tvorbu menu a HUDů. Ukládání do JSON definic.

---

## Implementační Checklist
1. [ ] `EditorCore` se systémem panelů a nástrojů.
2. [ ] `InputHijack` pro editor (aby inputy neovládaly hru, když je editor aktivní).
3. [ ] `PropertyInspector` generující UI z komponent.
4. [ ] `Gizmos` modul pro vykreslování pomocných čar (grid, colliders) v editoru.
