# Longin charakter AI

Necenzurovaný AI asistent.

## Struktura projektu

```
longin-charakter-ai/
├── docker/                 # Docker konfigurace
│   ├── docker-compose.yml  # Konfigurace všech služeb
│   ├── models/             # Modelové soubory pro Ollama
│   └── README.md           # Instrukce pro nastavení prostředí
├── backend/                # Express.js API server
│   ├── server.js           # Hlavní soubor serveru
│   ├── package.json        # Závislosti backendu
│   └── Dockerfile          # Docker konfigurace pro backend
├── frontend/               # Electron + React aplikace
│   ├── src/                # Zdrojové soubory frontendu
│   ├── public/             # Statické soubory
│   └── package.json        # Závislosti frontendu
├── docs/                   # Dokumentace
│   ├── user-guide.md       # Uživatelská příručka
│   ├── developer-guide.md  # Vývojářská dokumentace
│   ├── installation-guide.md # Instalační příručka
│   └── api-reference.md    # API reference
└── index.html              # Úvodní stránka projektu
```

## Fáze projektu

1. **Příprava prostředí** - Docker & AI Modely
2. **Základní aplikace** - Frontend & Backend
3. **AI Integrace** - LLM Konverzace & Generování obrázků
4. **Správa postav** - Character Creation & Memory
5. **Pokročilé funkce** - Voice & Role-Play Engine
6. **Optimalizace & UI/UX** - Performance & User Experience
7. **Finalizace** - Testing & Deployment

## Technologie

- **AI Modely**: Ollama (Dolphin-Mistral, WizardLM-Uncensored)
- **Generování obrázků**: Stable Diffusion WebUI (necenzurované modely zdarma NSFW)
- **TTS**: Coqui TTS
- **Backend**: Express.js, SQLite, Socket.IO
- **Frontend**: Electron, React, Chakra UI

## Instalace a spuštění

### Příprava prostředí

```bash
# Naklonujte repozitář
git clone https://github.com/username/longin-charakter-ai.git
cd longin-charakter-ai

# Spusťte Docker kontejnery
cd docker
docker-compose up -d

# Nainstalujte a spusťte backend
cd ../backend
npm install
npm start

# Nainstalujte a spusťte frontend
cd ../frontend
npm install
npm run dev
```

Pro vytvoření instalačního balíčku:

```bash
node scripts/build-installer.js --win
```

## Dokumentace

Kompletní dokumentace je k dispozici ve složce `/docs`:

- [Uživatelská příručka](docs/user-guide.md)
- [Vývojářská dokumentace](docs/developer-guide.md)
- [Instalační příručka](docs/installation-guide.md)
- [API Reference](docs/api-reference.md)

## Poznámky

Tento projekt je určen pouze pro vzdělávací účely a vývoj AI technologií. Všechny konverzace a generovaný obsah je necenzurovaný, bez NSFW filtrů.

## Kritické poznámky pro vibe coding

- **Jednoduchost first**: Každý úkol implementuj co nejjednodušeji
- **Test early**: Po každém úkolu otestuj funkcionalitu
- **Necenzurované modely**: Používej pouze necenzurované modely zdarma NSFW
- **Docker izolace**: Všechny AI služby běží v kontejnerech
- **Postupnost**: Nepřeskakuj kroky, dokončuj fáze postupně