# Server.js - Hlavní dokumentace

Tento soubor obsahuje hlavní backend logiku aplikace a spravuje všechny API endpointy, připojení k databázi a další služby.

## Architektura

Server.js je vstupní bod backend aplikace a zajišťuje tyto hlavní funkce:

- HTTP server s Express.js framework
- RESTful API endpointy pro komunikaci s frontend aplikací
- Socketové spojení pro real-time komunikaci
- Správa databáze (SQLite)
- Integrace s AI modely a dalšími službami

## Hlavní komponenty

1. **Express aplikace** - Poskytuje API endpointy a middleware
2. **Socket.IO** - Zajišťuje real-time komunikaci, především pro streaming odpovědí AI
3. **SQLite databáze** - Ukládá data o postavách, konverzacích a uživatelských nastaveních
4. **Služby** - Integrace externích služeb (AI modely, hlasová syntéza)

## Konfigurace a Inicializace

Server inicializuje všechny potřebné služby a databázi při spuštění:

```javascript
// Inicializace Express aplikace
const app = express();
const port = 3000;

// Nastavení middlewaru
app.use(cors());
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Nastavení databáze
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));
const memoryService = new MemoryService(path.join(__dirname, 'database.sqlite'));
const achievementService = new AchievementService(path.join(__dirname, 'database.sqlite'));
const voiceService = new VoiceService();
```

## API Endpointy

### Health Check

```
GET /api/health
```

Vrací status serveru a připojených služeb.

### Postavy (Characters)

```
GET /api/characters
GET /api/characters/:id
POST /api/characters
PUT /api/characters/:id
DELETE /api/characters/:id
POST /api/characters/import
GET /api/characters/:id/export
```

### Konverzace (Conversations)

```
GET /api/conversations
GET /api/conversations/:id
POST /api/conversations
DELETE /api/conversations/:id
```

### Zprávy (Messages)

```
GET /api/messages/:conversationId
POST /api/messages
```

### Paměti (Memories)

```
GET /api/memories/:characterId
POST /api/memories
PUT /api/memories/:id
DELETE /api/memories/:id
```

### Modely (AI Models)

```
GET /api/models
GET /api/models/active
POST /api/models/switch
POST /api/models/options
```

### Nastavení (Settings)

```
GET /api/settings
POST /api/settings
```

### Hlasová služba (Voice Service)

```
POST /api/tts
POST /api/stt
```

### Generování obrázků (Image Generation)

```
POST /api/generate-image
```

### Achievementy (Achievement System)

```
GET /api/achievements
GET /api/stats
```

### Scénáře (Role-playing Scenarios)

```
GET /api/scenarios
POST /api/scenarios
```

## Socket.IO Event Handlers

Server využívá Socket.IO pro real-time komunikaci, zejména pro:

1. Streamování odpovědí AI modelů
2. Notifikace o achievementech
3. Aktualizace stavu modelů

Hlavní události:

- `connection` - Připojení klienta
- `join-conversation` - Klient se připojí ke konkrétní konverzaci
- `models-status-updated` - Aktualizace stavu dostupných modelů
- `model-switched` - Změna aktivního modelu
- `llm-response-chunk` - Část odpovědi AI modelu
- `message-complete` - Kompletní zpráva byla vygenerována
- `achievement-unlocked` - Odemčen nový achievement

## Zabezpečení

Server implementuje následující bezpečnostní opatření:

1. Sanitizace vstupů a ochrana proti path traversal
2. Validace nahrávaných souborů (typy, velikost)
3. Limitace délky vstupů pro AI modely a TTS službu
4. Používání UUID pro identifikátory namísto sekvenčních ID

## Správa Databáze

Server inicializuje tabulky v SQLite databázi při spuštění:

1. `characters` - Postavy s osobností a vlastnostmi
2. `character_traits` - Vlastnosti postav
3. `conversations` - Konverzace
4. `messages` - Zprávy v konverzacích
5. `user_settings` - Uživatelská nastavení
6. `scenarios` - Role-playing scénáře

## Chybové Stavy

Server implementuje centralizované zpracování chyb:

1. Databázové chyby jsou logovány a vraceny klientovi s příslušným HTTP kódem
2. Chyby externích služeb jsou zpracovány a logovány
3. Chybějící parametry nebo nevalidní vstupy jsou validovány před zpracováním

## Optimalizace

Server využívá několik optimalizačních technik:

1. Komprese odpovědí
2. Caching statických souborů a výsledků dotazů
3. Optimalizace obrázků
4. Monitorování výkonu

## Ukončení

Server elegantně ukončuje spojení při vypnutí:

```javascript
process.on('SIGINT', () => {
  // Zavře databázové spojení při ukončení aplikace
  db.close();
  console.log('Database connection closed');
  process.exit();
});
```