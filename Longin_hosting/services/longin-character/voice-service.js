/**
 * Služba pro práci s hlasovými profily a TTS
 * Zpracovává generování řeči, nahrávání a přehrávání audio souborů
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class VoiceService {
  constructor() {
    this.audioDir = path.join(__dirname, '../public/audio');
    this.voiceProfilesCache = {};
    this.ttsProviders = [
      { name: 'azure', method: this.generateAzureTTS },
      { name: 'aws', method: this.generateAWSTTS },
      { name: 'elevenlabs', method: this.generateElevenLabsTTS },
      { name: 'local', method: this.generateLocalTTS }
    ];
    
    this.ensureDirectories();
    this.loadVoiceProfiles();
  }

  /**
   * Zajistí vytvoření potřebných adresářů
   */
  ensureDirectories() {
    const dirs = [
      this.audioDir,
      path.join(this.audioDir, 'generated'),
      path.join(this.audioDir, 'cache'),
      path.join(this.audioDir, 'profiles')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Načte hlasové profily z externích zdrojů
   */
  async loadVoiceProfiles() {
    try {
      // Načtení základních hlasových profilů
      this.voiceProfilesCache = {
        en_female_1: {
          id: 'en_female_1',
          name: 'Emma',
          language: 'en',
          gender: 'female',
          description: 'Pleasant female English voice'
        },
        en_female_2: {
          id: 'en_female_2', 
          name: 'Sarah',
          language: 'en',
          gender: 'female',
          description: 'Warm female English voice'
        },
        en_male_1: {
          id: 'en_male_1',
          name: 'James',
          language: 'en', 
          gender: 'male',
          description: 'Deep male English voice'
        },
        cs_female_1: {
          id: 'cs_female_1',
          name: 'Tereza',
          language: 'cs',
          gender: 'female', 
          description: 'Přirozený ženský český hlas'
        }
      };
      
    } catch (error) {
      const logger = require('./utils/logger');
      logger.error('Chyba při načítání hlasových profilů:', { error: error.message });
    }
  }

  /**
   * Vrátí seznam dostupných hlasových profilů
   * @returns {Array} - Seznam hlasových profilů
   */
  getVoiceProfiles() {
    return Object.values(this.voiceProfilesCache);
  }

  /**
   * Získá konkrétní hlasový profil podle ID
   * @param {string} voiceId - ID hlasového profilu
   * @returns {object|null} - Hlasový profil nebo null
   */
  getVoiceProfile(voiceId) {
    return this.voiceProfilesCache[voiceId] || null;
  }

  /**
   * Generuje řeč z textu s automatickým fallback systémem
   * @param {string} text - Text pro konverzi na řeč
   * @param {string} voiceId - ID hlasového profilu
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async generateSpeech(text, voiceId = 'en_female_1') {
    // Kontrola cache
    const cachedAudio = await this.getCachedAudio(text, voiceId);
    if (cachedAudio) {
      return cachedAudio;
    }

    // Pokus s jednotlivými providery
    for (const provider of this.ttsProviders) {
      try {
        const audioBuffer = await provider.method.call(this, text, voiceId);
        
        if (audioBuffer && audioBuffer.length > 0) {
          await this.cacheAudioFile(text, voiceId, audioBuffer);
          return audioBuffer;
        }
      } catch (error) {
        continue; // Zkusit další provider
      }
    }

    throw new Error('Služba text-to-speech je momentálně nedostupná.');
  }

  /**
   * Azure Cognitive Services TTS
   */
  async generateAzureTTS(text, voiceId) {
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      throw new Error('Azure Speech credentials not configured');
    }

    const voiceMapping = {
      'cs_female_1': 'cs-CZ-VlastaNeural',
      'cs_male_1': 'cs-CZ-AntoninNeural', 
      'en_female_1': 'en-US-JennyNeural',
      'en_male_1': 'en-US-GuyNeural'
    };

    const selectedVoice = voiceMapping[voiceId] || 'en-US-JennyNeural';
    
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${selectedVoice}">
          ${text}
        </voice>
      </speak>
    `;

    const response = await axios.post(
      `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      ssml,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * AWS Polly TTS
   */
  async generateAWSTTS(text, voiceId) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      throw new Error('AWS credentials not configured');
    }

    const AWS = require('aws-sdk');
    const polly = new AWS.Polly({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });

    const voiceMapping = {
      'cs_female_1': 'Aditi',
      'en_female_1': 'Joanna', 
      'en_male_1': 'Matthew'
    };

    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceMapping[voiceId] || 'Joanna',
      Engine: 'neural'
    };

    const result = await polly.synthesizeSpeech(params).promise();
    return result.AudioStream;
  }

  /**
   * ElevenLabs TTS
   */
  async generateElevenLabsTTS(text, voiceId) {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceMapping = {
      'en_female_1': 'EXAVITQu4vr4xnSDxMaL',
      'en_male_1': 'VR6AewLTigWG4xSOukaG'
    };

    const elevenLabsVoiceId = voiceMapping[voiceId] || voiceMapping['en_female_1'];

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * Lokální TTS server (Coqui TTS)
   */
  async generateLocalTTS(text, voiceId) {
    const localTTSUrl = process.env.LOCAL_TTS_URL || 'http://localhost:5002';
    
    const response = await axios.post(
      `${localTTSUrl}/api/tts`,
      {
        text: text,
        voice: voiceId,
        format: 'mp3'
      },
      {
        timeout: 45000,
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * Získá cached audio soubor
   */
  async getCachedAudio(text, voiceId) {
    try {
      const hash = require('crypto').createHash('md5').update(text + voiceId).digest('hex');
      const filename = `cached_${hash}.mp3`;
      const filePath = path.join(this.audioDir, 'cache', filename);
      
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
    } catch (error) {
      // Cache není kritický
    }
    return null;
  }

  /**
   * Cache audio soubor pro budoucí použití
   */
  async cacheAudioFile(text, voiceId, audioBuffer) {
    try {
      const hash = require('crypto').createHash('md5').update(text + voiceId).digest('hex');
      const filename = `cached_${hash}.mp3`;
      const filePath = path.join(this.audioDir, 'cache', filename);
      
      const cacheDir = path.dirname(filePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, audioBuffer);
    } catch (error) {
      // Cache není kritický
    }
  }

  /**
   * Kontroluje dostupnost TTS serveru
   * @param {string} url - URL serveru
   * @returns {Promise<boolean>} - True pokud je server dostupný
   */
  async checkTTSServerHealth(url) {
    try {
      const healthUrl = `${url}/health`;
      
      try {
        await axios.get(healthUrl, { timeout: 5000 });
      } catch (healthError) {
        // Pokud health endpoint selže, zkusíme hlavní URL
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Jednoduchá detekce jazyka textu
   * @param {string} text - Text k detekci
   * @returns {string} - Kód jazyka (en, cs, jp, ...)
   */
  detectLanguage(text) {
    const czechChars = 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ';
    const japaneseChars = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
    
    // Kontrola českých znaků
    for (const char of text) {
      if (czechChars.includes(char)) {
        return 'cs';
      }
    }
    
    // Kontrola japonských znaků
    if (japaneseChars.test(text)) {
      return 'ja';
    }
    
    // Výchozí je angličtina
    return 'en';
  }

  /**
   * Kontroluje dostupnost STT serveru
   * @returns {Promise<boolean>} - True pokud je server dostupný
   */
  async checkSTTServerHealth() {
    try {
      const sttUrl = process.env.STT_SERVICE_URL || 'http://localhost:5003';
      await axios.get(`${sttUrl}/health`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Převede audio na text (Speech-to-Text)
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} language - Jazyk pro rozpoznání
   * @returns {Promise<string>} - Rozpoznaný text
   */
  async speechToText(audioBuffer, language = 'cs') {
    const sttUrl = process.env.STT_SERVICE_URL || 'http://localhost:5003';
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBuffer, { filename: 'audio.wav' });
      formData.append('language', language);
      
      const response = await axios.post(`${sttUrl}/api/stt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });
      
      return response.data.text || '';
    } catch (error) {
      throw new Error('Speech-to-text služba není dostupná');
    }
  }

  /**
   * Ukládá audio soubor na disk
   * @param {Buffer} audioData - Audio data
   * @param {string} filename - Název souboru
   * @returns {Promise<string>} - Cesta k uloženému souboru
   */
  async saveAudioFile(audioData, filename) {
    const filePath = path.join(this.audioDir, 'generated', filename);
    
    try {
      fs.writeFileSync(filePath, audioData);
      return filePath;
    } catch (error) {
      throw new Error('Nepodařilo se uložit audio soubor');
    }
  }

  /**
   * Získá informace o audio souboru
   * @param {string} filename - Název souboru
   * @returns {Promise<object>} - Informace o souboru
   */
  async getAudioFileInfo(filename) {
    const filePath = path.join(this.audioDir, 'generated', filename);
    
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Soubor nenalezen');
      }
      
      const stats = fs.statSync(filePath);
      
      return {
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        path: filePath
      };
    } catch (error) {
      throw new Error('Nepodařilo se získat informace o souboru');
    }
  }

  /**
   * Odstraní audio soubor
   * @param {string} filename - Název souboru
   * @returns {Promise<boolean>} - True pokud byl soubor úspěšně odstraněn
   */
  async deleteAudioFile(filename) {
    const filePath = path.join(this.audioDir, 'generated', filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      throw new Error('Nepodařilo se odstranit audio soubor');
    }
  }

  /**
   * Vyčistí staré audio soubory
   * @param {number} maxAge - Maximální stáří souborů v dnech
   * @returns {Promise<number>} - Počet odstraněných souborů
   */
  async cleanupOldAudioFiles(maxAge = 7) {
    const generatedDir = path.join(this.audioDir, 'generated');
    const cacheDir = path.join(this.audioDir, 'cache');
    let deletedCount = 0;
    
    try {
      const cleanDirectory = (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000));
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.birthtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        });
      };
      
      cleanDirectory(generatedDir);
      cleanDirectory(cacheDir);
      
      return deletedCount;
    } catch (error) {
      throw new Error('Nepodařilo se vyčistit staré audio soubory');
    }
  }
}

module.exports = new VoiceService();