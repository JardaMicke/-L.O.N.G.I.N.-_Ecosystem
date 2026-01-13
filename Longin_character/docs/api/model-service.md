# Model Service - Dokumentace

`model-service.js` je klíčová služba, která zajišťuje integraci a správu AI modelů. Stará se o komunikaci s Ollama API, přepínání mezi modely a generování textu.

## Architektura

Model Service je implementována jako singleton instance třídy `ModelService`, která rozšiřuje `EventEmitter` pro podporu událostí. Poskytuje rozhraní pro práci s AI modely a abstrahuje detaily komunikace s Ollama API.

## Hlavní funkce

### Inicializace a Konfigurace

```javascript
const OLLAMA_API_BASE = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
const DEFAULT_MODEL = 'dolphin-mistral';
const MODEL_INFO_CACHE_KEY = 'models_info';
const MODEL_INFO_CACHE_DURATION = 5 * 60 * 1000; // 5 minut
```

Model Service podporuje konfiguraci přes proměnné prostředí a implementuje caching informací o modelech pro zvýšení výkonu.

### Podporované modely

Service podporuje následující modely:

1. **dolphin-mistral**
   - 7B parametrů
   - Obecný necenzurovaný model založený na architektuře Mistral 7B
   - Kontextové okno: 8192 tokenů
   - Silné stránky: Konverzace, Role-playing, Následování instrukcí

2. **wizardlm-uncensored**
   - 7B parametrů
   - Necenzurovaný model se silnými schopnostmi následovat instrukce
   - Kontextové okno: 4096 tokenů
   - Silné stránky: Následování instrukcí, Znalostní úkoly, Komplexní usuzování

### Získání informací o modelech

```javascript
/**
 * Získá všechny podporované modely
 * @returns {Array} Seznam podporovaných modelů se stavem
 */
getSupportedModels()

/**
 * Získá detaily pro konkrétní model
 * @param {string} modelId - ID modelu
 * @returns {Object|null} Detaily modelu nebo null pokud model nebyl nalezen
 */
getModelDetails(modelId)

/**
 * Získá aktuálně aktivní model
 * @returns {Object} Detaily aktivního modelu
 */
getActiveModel()
```

### Nastavení a kontrola stavu modelů

```javascript
/**
 * Nastaví možnosti modelu
 * @param {Object} options - Možnosti modelu
 */
setModelOptions(options)

/**
 * Zkontroluje dostupnost všech modelů
 */
async checkModelsStatus()

/**
 * Stáhne model pokud není dostupný
 * @param {string} modelId - ID modelu ke stažení
 * @returns {Promise} Stav stahování
 */
async pullModel(modelId)
```

### Přepínání modelů

```javascript
/**
 * Přepne na jiný model
 * @param {string} modelId - ID modelu, na který se má přepnout
 * @returns {Promise} Výsledek přepnutí
 */
async switchModel(modelId)
```

### Generování textu

```javascript
/**
 * Generuje text pomocí aktivního modelu
 * @param {string} prompt - Text promptu
 * @param {Object} options - Možnosti generování
 * @returns {Promise} Vygenerovaný text
 */
async generateText(prompt, options = {})

/**
 * Streamuje generování textu pomocí aktivního modelu
 * @param {string} prompt - Text promptu
 * @param {Function} onChunk - Callback pro každý chunk textu
 * @param {Object} options - Možnosti generování
 * @returns {Promise} Stav dokončení
 */
async streamText(prompt, onChunk, options = {})
```

## Události (Events)

Model Service emituje následující události:

- `models-status-updated` - Když se aktualizuje stav modelů
- `model-options-changed` - Když se změní možnosti modelu
- `model-loading` - Když začíná stahování modelu
- `model-ready` - Když je model připraven k použití
- `model-error` - Když nastane chyba s modelem
- `model-switched` - Když je model přepnut

## Použití v kódu

```javascript
// Import service
const modelService = require('./model-service');

// Naslouchání událostí
modelService.on('model-switched', (data) => {
  console.log(`Přepnuto na model: ${data.modelId}`);
});

// Kontrola dostupných modelů
await modelService.checkModelsStatus();

// Přepnutí modelu
await modelService.switchModel('wizardlm-uncensored');

// Generování textu
const result = await modelService.generateText('Ahoj, jak se máš?');
console.log(result.text);

// Streamování odpovědi
await modelService.streamText(
  'Vysvětli mi kvantovou fyziku',
  (chunk) => {
    process.stdout.write(chunk);
  }
);
```

## Optimalizace a Caching

Service využívá `memory-cache` pro cachování informací o modelech, což snižuje počet volání API a zlepšuje výkon. Cache vyprší po 5 minutách, což zajišťuje relativně aktuální informace při zachování výkonu.

## Chybové stavy

Service implementuje komplexní zpracování chyb:

1. Nedostupný model - Pokusí se stáhnout model před jeho použitím
2. Chyby API - Zachyceny a předány volajícímu
3. Chyby při streamování - Zachyceny a reportovány přes callbacks

## Rozšiřitelnost

Nové modely lze snadno přidat do `SUPPORTED_MODELS` objektu s jejich metadaty a budou automaticky dostupné přes API.