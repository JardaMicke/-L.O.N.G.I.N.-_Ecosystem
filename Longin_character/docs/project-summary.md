# Project Summary - Shrnutí projektu

## Přehled aplikace

Candy AI je pokročilá aplikace pro interakci s AI postavami, která kombinuje místní LLM modely s moderním webovým rozhraním. Aplikace umožňuje uživatelům vytvářet vlastní AI postavy s unikátními osobnostmi a vést s nimi konverzace v přirozeném jazyce.

## Klíčové vlastnosti

### 🤖 AI Postavy
- Vytváření a přizpůsobení postav s vlastními osobnostmi
- Podpora pro různé typy postav a vlastnosti
- Export/import postav ve standardizovaném formátu

### 💬 Pokročilé konverzace
- Streaming generování odpovědí v reálném čase
- Kontextově aware odpovědi s využitím paměti
- Podpora pro více současných konverzací

### 🧠 Systém paměti
- Automatické ukládání důležitých informací z konverzací
- Inteligentní vyhledávání relevantních vzpomínek
- Kategorizace a tagování pamětí

### 🎯 Achievement systém
- Komplexní systém odměn a pokroku
- Sledování statistik používání
- Notifikace o odemčených achievementech

### 🔊 Hlasová syntéza
- Text-to-speech s různými hlasy
- Podpora pro více jazyků
- Uložení audio souborů pro offline použití

### 🎨 Generování obrázků
- Generování obrázků z textových popisů
- Různé styly a parametry
- Historie generovaných obrázků

### 🎭 Role-playing scénáře
- Přednastavené scénáře pro roleplay
- Branching storylines
- Kategorizace podle žánrů

## Technická architektura

### Backend Stack
- **Node.js** s Express.js framework
- **SQLite** pro ukládání dat
- **Socket.IO** pro real-time komunikaci
- **Multer** pro nahrávání souborů
- **UUID** pro unikátní identifikátory

### AI Služby
- **Ollama** - Lokální LLM modely (Dolphin-Mistral, WizardLM)
- **ComfyUI** - Generování obrázků
- **Coqui TTS** - Hlasová syntéza

### Infrastruktura
- **Docker** kontejnerizace všech služeb
- **Redis** pro caching
- **Nginx** reverse proxy (v produkci)

### Databázové schéma
```sql
-- Hlavní tabulky
characters          -- Definice postav
character_traits    -- Vlastnosti postav
conversations       -- Konverzace
messages           -- Zprávy v konverzacích
memories           -- Paměťový systém
user_settings      -- Uživatelská nastavení
achievements       -- Achievement systém
scenarios          -- Role-playing scénáře
```

## Služby a moduly

### 1. Model Service (`model-service.js`)
Spravuje AI modely a jejich přepínání:
- Kontrola dostupnosti modelů
- Streaming generování textu
- Konfigurace parametrů (temperature, top_p)
- Event-driven architektura

### 2. Memory Service (`memory-service.js`)
Poskytuje systém dlouhodobé paměti:
- Ukládání a kategorizace vzpomínek
- Inteligentní vyhledávání podle relevance
- Analýza konverzací pro automatické vytváření pamětí
- Správa vztahů mezi postavami a uživatelem

### 3. Achievement Service (`achievement-service.js`)
Implementuje gamifikační prvky:
- Definice a správa achievementů
- Sledování statistik uživatelů
- Automatické odhalování a udělování odměn
- Event listeners pro notifikace

### 4. Voice Service (`voice-service.js`)
Poskytuje hlasové funkcionality:
- Text-to-speech s různými hlasy
- Správa audio souborů
- Konfigurační profily hlasů
- Kontrola dostupnosti TTS služby

### 5. Story Engine (`story-engine.js`)
Spravuje role-playing scénáře:
- Branching storylines
- Dynamické generování story událostí
- Kontext-aware odpovědi podle scénáře

### 6. Optimizations (`optimizations.js`)
Poskytuje výkonnostní optimalizace:
- Komprese HTTP odpovědí
- Optimalizace obrázků
- Cache management
- Performance monitoring

## Konfigurace prostředí

### Docker Compose služby
```yaml
ollama:      # Port 11434 - LLM API
comfyui:     # Port 7860 - Image generation
redis:       # Port 6379 - Caching
coqui-tts:   # Port 5002 - Text-to-speech
backend:     # Port 3000 - Main API
```

### Proměnné prostředí
```bash
# API endpoints
OLLAMA_API_URL=http://ollama:11434/api
SD_API_URL=http://comfyui:7860
TTS_API_URL=http://coqui-tts:5002
REDIS_URL=redis://redis:6379

# Directories
AUDIO_CACHE_DIR=/app/public/audio
UPLOAD_DIR=/app/public/uploads

# Model settings
DEFAULT_MODEL=dolphin-mistral
DEFAULT_TEMPERATURE=0.7
DEFAULT_TOP_P=0.9
```

## Bezpečnostní opatření

### 1. Input Validation
- Sanitizace všech uživatelských vstupů
- Validace formátů souborů a jejich velikostí
- Ochrana proti SQL injection a XSS

### 2. File Upload Security
- Omezení typů přijímaných souborů
- Kontrola velikosti souborů (max 5MB)
- UUID názvy souborů pro prevenci path traversal

### 3. Rate Limiting
- Omezení počtu API volání na IP
- Throttling pro resource-intensive operace
- Queue management pro batch operace

### 4. Data Protection
- SQLite databáze s Foreign Key constraints
- Automatické zálohy databáze
- Oddělení citlivých dat v Docker volumes

## Vývojové nástroje

### Testing
- **Jest** pro unit a integration testy
- **Supertest** pro API testování
- Automatické spouštění testů při commit

### Code Quality
- **ESLint** pro linting JavaScript kódu
- **Prettier** pro code formatting
- Pre-commit hooks pro kvalitu kódu

### Monitoring
- Health check endpointy
- Strukturované logování
- Performance metriky
- Error tracking

## Nasazení a škálování

### Lokální vývoj
```bash
# Docker development
docker-compose up -d

# Nebo lokální běh
npm install
npm run dev
```

### Produkční nasazení
- Docker Swarm nebo Kubernetes orchestrace
- Load balancing pro API endpoints
- Dedicated databázové servery
- CDN pro statické soubory

### Škálovací strategie
- Horizontální škálování backend služeb
- Oddělené instance pro AI modely
- Redis cluster pro distribuované caching
- Database sharding pro velké objemy dat

## Budoucí rozšíření

### Plánované funkce
1. **Multi-user podpora** - Autentizace a uživatelské účty
2. **Hlasové vstupy** - Speech-to-text funkcionalita
3. **Mobilní aplikace** - React Native nebo Flutter
4. **Cloud sync** - Synchronizace mezi zařízeními
5. **Plugin systém** - Rozšíření třetích stran

### Technické vylepšení
1. **Vector databáze** - Sémantické vyhledávání v paměti
2. **WebRTC** - Real-time hlasová komunikace
3. **GraphQL API** - Efektivnější data fetching
4. **Microservices** - Rozdělení na specializované služby
5. **AI model fine-tuning** - Přizpůsobení modelů konkrétním postavám

## Komunita a podpora

### Dokumentace
- API reference s OpenAPI specifikací
- Vývojářské příručky s příklady
- Troubleshooting guide
- Video tutoriály

### Open Source
- GitHub repozitář s MIT licencí
- Příspěvky komunity vítány
- Issue tracking a feature requests
- Code review proces

### Podpora
- Discord komunita
- Oficiální fórum
- E-mail podpora
- Pravidelné aktualizace a bugfixy

---

*Aplikace je navržena s důrazem na lokalitu, soukromí a výkon. Všechna AI zpracování probíhá lokálně bez odesílání dat na externí servery.*