# Docker Setup - Průvodce

Tento průvodce vás provede nastavením aplikace pomocí Docker. Docker zajišťuje konzistentní a izolované prostředí pro všechny komponenty aplikace.

## Požadavky

Před začátkem se ujistěte, že máte nainstalováno:

1. [Docker](https://www.docker.com/products/docker-desktop)
2. [Docker Compose](https://docs.docker.com/compose/install/) (obvykle nainstalován s Docker Desktop)
3. Minimálně 8GB RAM a 20GB volného místa na disku
4. Pro GPU akceleraci: NVIDIA GPU s CUDA podporou a [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-docker)

## Struktura Docker konfigurace

Aplikace používá následující kontejnery:

1. **ollama** - Poskytuje API pro LLM modely
2. **comfyui** - Služba pro generování obrázků
3. **redis** - In-memory databáze pro caching
4. **coqui-tts** - Text-to-speech služba
5. **backend** - Node.js API server aplikace

## Postup instalace

### 1. Klonování repozitáře

```bash
git clone https://github.com/your-repo/candy-ai.git
cd candy-ai
```

### 2. Konfigurace proměnných prostředí

Pro základní nastavení není nutné upravovat proměnné prostředí. Pokud potřebujete vlastní konfiguraci, vytvořte soubor `.env` v adresáři `docker`:

```
# Porty služeb
BACKEND_PORT=3000
OLLAMA_PORT=11434
COMFYUI_PORT=7860
REDIS_PORT=6379
TTS_PORT=5002

# Cesty k adresářům pro persistentní data
OLLAMA_MODELS_DIR=./ollama-models
COMFYUI_MODELS_DIR=./comfyui-models
COMFYUI_OUTPUTS_DIR=./comfyui-outputs
REDIS_DATA_DIR=./redis-data
COQUI_MODELS_DIR=./coqui-models
```

### 3. Spuštění služeb

Spuštění všech služeb pomocí Docker Compose:

```bash
cd docker
docker-compose up -d
```

Tímto se spustí všechny kontejnery na pozadí. Při prvním spuštění dojde ke stažení všech potřebných Docker obrazů, což může trvat několik minut.

### 4. Kontrola stavu služeb

Kontrola, zda všechny služby běží:

```bash
docker-compose ps
```

Měli byste vidět všech 5 kontejnerů se statusem "Up":

```
    Name                   Command               State           Ports
-----------------------------------------------------------------------------
candy-backend    npm start                      Up      0.0.0.0:3000->3000/tcp
candy-comfyui    python main.py --listen -- ...   Up      0.0.0.0:7860->7860/tcp
candy-ollama     ollama serve                    Up      0.0.0.0:11434->11434/tcp
candy-redis      redis-server --appendonly yes   Up      0.0.0.0:6379->6379/tcp
candy-tts        python3 server.py               Up      0.0.0.0:5002->5002/tcp
```

### 5. Inicializace modelů

Pro inicializaci LLM modelů:

```bash
# Stažení základního modelu
docker exec -it candy-ollama ollama pull dolphin-mistral

# Stažení dalšího modelu (volitelné)
docker exec -it candy-ollama ollama pull wizardlm-uncensored
```

Stažení modelů může trvat 10-30 minut v závislosti na rychlosti vašeho připojení k internetu.

## Používání Docker služeb

### Přístup k API

Backend API je dostupné na:

```
http://localhost:3000
```

### Monitorování kontejnerů

Pro zobrazení logů všech kontejnerů:

```bash
docker-compose logs -f
```

Pro zobrazení logů konkrétního kontejneru:

```bash
docker-compose logs -f backend
```

### Zastavení služeb

Pro zastavení všech služeb:

```bash
docker-compose down
```

Pro úplné odstranění kontejnerů a jejich dat:

```bash
docker-compose down -v
```

## Konfigurace GPU akcelerace

Pro využití GPU akcelerace pro LLM modely a generování obrázků je nutné mít správně nainstalovaný NVIDIA Container Toolkit.

Docker Compose soubor již obsahuje konfiguraci pro GPU akceleraci:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

Tato konfigurace umožňuje kontejnerům přístup k GPU. Pokud máte více GPU, můžete upravit hodnotu `count` nebo specifikovat konkrétní GPU.

## Řešení problémů

### 1. Kontejnery se nespustí

Zkontrolujte logy:

```bash
docker-compose logs
```

Ujistěte se, že máte dostatečná oprávnění a že žádný jiný proces nepoužívá stejné porty.

### 2. Problém s GPU akcelerací

Zkontrolujte, zda je NVIDIA Container Toolkit správně nainstalovaný:

```bash
docker run --gpus all nvidia/cuda:11.0-base nvidia-smi
```

Pokud tento příkaz selže, je problém s instalací NVIDIA driverů nebo Container Toolkit.

### 3. Nedostatek paměti

Při nedostatku paměti můžete upravit limity v docker-compose.yml:

```yaml
services:
  ollama:
    mem_limit: 4g
```

## Aktualizace služeb

Pro aktualizaci služeb na nejnovější verze:

```bash
docker-compose pull
docker-compose up -d
```

## Zabezpečení

Důležité poznámky k zabezpečení:

1. Výchozí konfigurace je určena pro lokální vývoj, ne pro produkční nasazení
2. Pro produkční nasazení přidejte autentizaci a HTTPS
3. Zvažte oddělení databáze a citlivých dat do samostatných kontejnerů s vlastními objemy

## Další kroky

Po úspěšném nastavení Docker prostředí můžete:

1. Přejít k [Vývojářské dokumentaci](/docs/developer-guide.md) pro informace o vývoji
2. Navštívit [Uživatelskou příručku](/docs/user-guide.md) pro práci s aplikací
3. Přečíst si [API referenci](/docs/api-reference.md) pro integraci s API