# Candy AI - Nastavení a spuštění

Tento dokument obsahuje instrukce pro nastavení a spuštění Candy AI aplikace.

## Struktura projektu

```
candy-ai/
├── docker/                 # Docker konfigurace
│   ├── docker-compose.yml  # Konfigurace služeb
│   └── models/             # Definice modelů
├── backend/                # Express API server
├── frontend/               # Electron + React aplikace
└── assets/                 # Obrázky a další soubory
```

## Kroky k nastavení

### 1. Docker kontejnery

Nejprve spusťte Docker kontejnery pro AI služby:

```bash
cd docker
docker-compose up -d
```

Tím spustíte:
- Ollama (LLM modely)
- Stable Diffusion WebUI
- Redis cache
- Coqui TTS

### 2. Instalace backend serveru

```bash
cd backend
npm install
node setup-demo.js  # Nahrát demo data
npm start
```

Backend API bude dostupné na adrese http://localhost:3000

### 3. Instalace a spuštění frontend aplikace

```bash
cd frontend
npm install
npm run dev
```

Tím se spustí Electron aplikace s React frontendem.

## Použité necenzurované modely

- **Dolphin-Mistral 7B**: Uncensored konverzační model
- **WizardLM-Uncensored 7B**: Alternativní uncensored model
- **Stable Diffusion 1.5**: Model pro generování obrázků bez NSFW filtrů

## Demo postavy

Aplikace obsahuje demo postavu "Sakura" s následujícími vlastnostmi:
- Milá, energická, stydlivá
- Fanoušek anime a mangy
- Programátorka
- Věk: 19 let

## Poznámky k vývoji

Při dalším vývoji dodržujte:

1. **Jednoduchost first** - upřednostňujte jednoduchá řešení
2. **Test early** - testujte každou funkcionalitu ihned
3. **Necenzurované modely** - používejte pouze modely bez NSFW filtrů
4. **Docker izolace** - všechny AI služby běží v kontejnerech
5. **Postupnost** - dokončujte jednu fázi před zahájením další