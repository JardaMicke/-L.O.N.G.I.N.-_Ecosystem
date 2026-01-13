# Dokumentace Candy AI Clone

Vítejte v dokumentaci k projektu Candy AI Clone - necenzurovanému AI asistentovi vyvinutému v rámci "Vibe Coding" přístupu.

## Obsah dokumentace

### [Uživatelská příručka](user-guide.md)
Kompletní průvodce pro koncové uživatele aplikace. Obsahuje:
- Instalační instrukce
- Průvodce rozhraním aplikace
- Chat s postavami
- Role-Playing mód
- Dosahování achievementů
- Řešení problémů

### [Vývojářská dokumentace](developer-guide.md)
Technická dokumentace pro vývojáře, kteří chtějí přispívat do projektu:
- Architektura projektu
- Technologický stack
- API komponenty
- Frontend komponenty
- AI integrace

### [Instalační příručka](installation-guide.md)
Detailní postupy pro instalaci na různých platformách:
- Windows
- macOS
- Linux
- Docker

### [API Reference](api-reference.md)
Kompletní popis všech API endpointů:
- Characters API
- Chat API
- Memory API
- Voice API
- Models API
- Story Engine API

## Základní informace o projektu

Candy AI Clone je desktopová aplikace, která umožňuje vést konverzace s AI postavami bez jakýchkoli obsahových omezení. Aplikace běží lokálně na počítači uživatele a využívá LLM modely v Docker kontejnerech pro generování odpovědí.

### Hlavní funkce

- **Necenzurované konverzace**: Žádné NSFW filtry
- **Postavy s pamětí**: AI postavy si pamatují předchozí konverzace
- **Role-Playing mód**: Příběhové větve a interaktivní scenáře
- **Hlasový výstup**: Text-to-speech pro odpovědi postav
- **Osobnost postav**: Systém pro definování osobnostních rysů
- **Offline provoz**: Vše běží lokálně, bez závislosti na online službách

### Technologie

- **AI Modely**: Ollama (Dolphin-Mistral, WizardLM-Uncensored)
- **Generování obrázků**: Stable Diffusion WebUI
- **TTS**: Coqui TTS
- **Backend**: Express.js, SQLite, Socket.IO
- **Frontend**: Electron, React, Chakra UI

## Začínáme

1. Postupujte podle [instalační příručky](installation-guide.md)
2. Seznamte se s [uživatelskou příručkou](user-guide.md)
3. Spusťte aplikaci a začněte s první konverzací!

## Varování

Tento projekt je určen pouze pro vzdělávací účely a vývoj AI technologií. Generovaný obsah je necenzurovaný a může obsahovat materiál nevhodný pro některé uživatele.