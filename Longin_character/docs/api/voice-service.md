# Voice Service - Dokumentace

`voice-service.js` poskytuje integraci s Coqui TTS (Text-to-Speech) službou pro generování hlasových výstupů ze zadaného textu. Tato služba umožňuje postavám "mluvit" s různými hlasy.

## Architektura

VoiceService je implementována jako třída, která zapouzdřuje funkcionalitu pro text-to-speech konverzi. Služba komunikuje s Coqui TTS API a spravuje generované audio soubory.

## Inicializace a Konfigurace

```javascript
/**
 * Voice Service - Integrace s Coqui TTS pro funkcionalitu text-to-speech
 * Tato služba spravuje generování hlasu a caching
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// TTS API URL z Docker prostředí
const TTS_API_URL = process.env.TTS_API_URL || 'http://localhost:5002';

// Cache adresář pro ukládání generovaných audio souborů
const AUDIO_CACHE_DIR = process.env.AUDIO_CACHE_DIR || path.join(__dirname, 'public', 'audio');

// Vytvoření audio adresáře, pokud neexistuje
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

class VoiceService {
  constructor() {
    this.audioDir = AUDIO_CACHE_DIR;
    this.apiUrl = TTS_API_URL;
  }
}
```

## Hlasové profily

Služba podporuje několik hlasových profilů, které mohou být použity pro různé postavy:

```javascript
/**
 * Mapa hlasových profilů - mapuje ID profilů na parametry TTS API
 */
const VOICE_PROFILES = {
  'en_female_1': {
    model_name: 'tts_models/en/ljspeech/tacotron2-DDC',
    speaker_id: null,
    style_wav: null
  },
  'en_female_2': {
    model_name: 'tts_models/en/vctk/vits',
    speaker_id: 'p225', // VCTK female speaker
    style_wav: null
  },
  'en_male_1': {
    model_name: 'tts_models/en/vctk/vits',
    speaker_id: 'p270', // VCTK male speaker
    style_wav: null
  },
  'cs_female_1': {
    model_name: 'tts_models/multilingual/multi-dataset/your_tts',
    speaker_id: null,
    language_id: 'cs',
    style_wav: null
  }
};
```

## Hlavní metody

### Text-to-Speech

```javascript
/**
 * Generuje řeč z textu pomocí Coqui TTS
 * 
 * @param {string} text - Text ke konverzi na řeč
 * @param {string} voiceId - ID hlasového profilu (výchozí je en_female_1)
 * @param {Object} options - Další možnosti jako rychlost, výška tónu, atd.
 * @returns {Promise<Object>} - Objekt obsahující URL audia a metadata
 */
async textToSpeech(text, voiceId = 'en_female_1', options = {}) {
  try {
    // Získání hlasového profilu
    const voiceProfile = VOICE_PROFILES[voiceId] || VOICE_PROFILES.en_female_1;
    
    // Vygenerování unikátního ID pro toto audio
    const audioId = uuidv4();
    const audioPath = path.join(this.audioDir, `${audioId}.wav`);
    const audioUrl = `/audio/${audioId}.wav`;
    
    // Vytvoření parametrů požadavku
    const requestParams = {
      text: text,
      ...voiceProfile,
      ...options
    };
    
    console.log(`Generování řeči pro: "${text.substring(0, 30)}..."`);
    console.log(`Použití hlasového profilu: ${voiceId}`);
    
    // Volání Coqui TTS API
    const response = await axios.post(`${this.apiUrl}/api/tts`, requestParams, {
      responseType: 'arraybuffer'
    });
    
    // Uložení audio souboru
    fs.writeFileSync(audioPath, response.data);
    
    return {
      success: true,
      audioUrl,
      metadata: {
        text,
        voiceId,
        duration: null // Vyžadovalo by analýzu audia pro určení
      }
    };
  } catch (error) {
    console.error('Chyba při generování řeči:', error);
    return {
      success: false,
      error: error.message || 'Neznámá chyba v generování řeči'
    };
  }
}
```

### Správa hlasových profilů

```javascript
/**
 * Seznam dostupných hlasových profilů
 * 
 * @returns {Array} - Pole objektů hlasových profilů
 */
getVoiceProfiles() {
  return Object.keys(VOICE_PROFILES).map(id => ({
    id,
    name: this.getVoiceProfileName(id)
  }));
}

/**
 * Získání uživatelsky přívětivého názvu pro hlasový profil
 * 
 * @param {string} profileId - ID hlasového profilu
 * @returns {string} - Uživatelsky přívětivý název
 */
getVoiceProfileName(profileId) {
  const profileMap = {
    'en_female_1': 'English - Female 1',
    'en_female_2': 'English - Female 2',
    'en_male_1': 'English - Male 1',
    'cs_female_1': 'Czech - Female 1'
  };
  
  return profileMap[profileId] || profileId;
}
```

### Kontrola dostupnosti služby

```javascript
/**
 * Kontrola dostupnosti TTS služby
 * 
 * @returns {Promise<boolean>} - True pokud je služba dostupná
 */
async checkServiceAvailability() {
  try {
    await axios.get(`${this.apiUrl}/api/version`);
    return true;
  } catch (error) {
    console.error('TTS služba není dostupná:', error.message);
    return false;
  }
}
```

## Použití v kódu

```javascript
// Import a inicializace služby
const VoiceService = require('./voice-service');
const voiceService = new VoiceService();

// Kontrola dostupnosti
const isAvailable = await voiceService.checkServiceAvailability();

if (isAvailable) {
  // Získání dostupných hlasových profilů
  const profiles = voiceService.getVoiceProfiles();
  console.log(profiles);
  
  // Generování řeči
  const result = await voiceService.textToSpeech(
    'Ahoj, jak se máš?',
    'cs_female_1'
  );
  
  if (result.success) {
    console.log(`Audio dostupné na: ${result.audioUrl}`);
  } else {
    console.error(`Chyba: ${result.error}`);
  }
}
```

## Správa souborů

Služba automaticky vytváří a spravuje audio soubory:

1. Každý generovaný audio soubor dostane jedinečné UUID
2. Soubory jsou ukládány v `AUDIO_CACHE_DIR`
3. URL souborů jsou relativní k `/audio/` cestě

## Optimalizace

Pro produkční nasazení by bylo vhodné implementovat:

1. Caching často používaných frází
2. Čištění starých audio souborů
3. Předzpracování textu pro lepší výslovnost

## Chybové stavy

Služba implementuje komplexní zpracování chyb:

1. Kontroluje dostupnost TTS služby
2. Zachycuje a loguje chyby při generování
3. Vrací strukturované chybové objekty pro zpracování klientem

## Rozšiřitelnost

Nové hlasové profily lze snadno přidat do `VOICE_PROFILES` objektu. Budoucí rozšíření mohou zahrnovat:

1. Podporu pro více TTS poskytovatelů
2. Pokročilé emoční nastavení hlasů
3. Implementaci speech-to-text pro obousměrnou hlasovou komunikaci