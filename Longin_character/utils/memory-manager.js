/**
 * @fileoverview Pokročilá správa paměti a modelů v aplikaci
 * 
 * Tento modul poskytuje funkce pro efektivní správu paměti aplikace, včetně:
 * - Automatického načítání a uvolňování AI modelů
 * - Optimalizace využití RAM paměti
 * - Monitorování a řízení využití systémových zdrojů
 * 
 * @module memory-manager
 * @version 1.0.0
 * @author Longin AI Team
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Třída pro správu paměti a zdrojů
 */
class MemoryManager {
  constructor(options = {}) {
    // Konfigurace
    this.config = {
      // Maximální využití RAM (v procentech) před uvolněním zdrojů
      maxMemoryUsage: options.maxMemoryUsage || 75,
      
      // Interval pro kontrolu využití paměti (ms)
      monitorInterval: options.monitorInterval || 30000,
      
      // Doba neaktivity modelu před uvolněním (ms)
      modelInactivityThreshold: options.modelInactivityThreshold || 600000, // 10 minut
      
      // Cesta k uložení modelů
      modelsPath: options.modelsPath || path.join(process.cwd(), 'models'),
      
      // Adresář pro dočasné soubory
      tempDir: options.tempDir || os.tmpdir(),
      
      // Povolit proaktivní správu paměti
      enableProactiveManagement: options.enableProactiveManagement !== undefined ? 
        options.enableProactiveManagement : true,
        
      // Povolit logování využití paměti
      enableMemoryLogging: options.enableMemoryLogging !== undefined ?
        options.enableMemoryLogging : true,
        
      // Práh pro generování upozornění (v procentech)
      warningThreshold: options.warningThreshold || 85
    };
    
    // Stav
    this.state = {
      // Aktivní modely v paměti
      activeModels: new Map(),
      
      // Sledování velikosti modelů
      modelSizes: new Map(),
      
      // Poslední načtené modely (pro cachování)
      recentlyUsedModels: [],
      
      // Celková velikost aktivních modelů v paměti (MB)
      totalModelSize: 0,
      
      // Poslední monitorované využití paměti
      lastMemoryUsage: {
        total: 0,
        free: 0,
        usage: 0
      },
      
      // Události pro správu paměti
      events: []
    };
    
    // Inicializace
    this._initialize();
  }
  
  /**
   * Inicializuje správce paměti
   * @private
   */
  _initialize() {
    // Vytvoření adresáře pro modely, pokud neexistuje
    try {
      if (!fs.existsSync(this.config.modelsPath)) {
        fs.mkdirSync(this.config.modelsPath, { recursive: true });
      }
    } catch (error) {
      logger.error(`Nepodařilo se vytvořit adresář pro modely: ${error.message}`);
    }
    
    // Spuštění monitorování paměti
    if (this.config.enableProactiveManagement) {
      this._startMemoryMonitoring();
    }
    
    // Zaznamenání inicializace
    this._logEvent('init', 'Memory Manager inicializován');
    logger.info('Memory Manager byl inicializován');
  }
  
  /**
   * Spustí monitorování využití paměti
   * @private
   */
  _startMemoryMonitoring() {
    // Interval pro kontrolu využití paměti
    this.monitorInterval = setInterval(() => {
      this._checkMemoryUsage();
    }, this.config.monitorInterval);
    
    // Zachytí události GC, pokud jsou dostupné
    if (global.gc && typeof global.gc === 'function') {
      // Poslouchá Node.js event pro GC, pokud je k dispozici
      process.on('gc', (details) => {
        this._logEvent('gc', `Garbage Collection: ${JSON.stringify(details)}`);
      });
    }
    
    // Zaznamenání spuštění monitorování
    this._logEvent('monitor', 'Spuštěno monitorování paměti');
    logger.info(`Spuštěno monitorování paměti s intervalem ${this.config.monitorInterval}ms`);
  }
  
  /**
   * Kontroluje aktuální využití paměti a případně provede optimalizace
   * @private
   */
  _checkMemoryUsage() {
    // Získání informací o využití paměti
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;
    
    // Aktualizace stavu
    this.state.lastMemoryUsage = {
      total: this._formatBytes(totalMem),
      free: this._formatBytes(freeMem),
      used: this._formatBytes(usedMem),
      percentage: memoryUsage.toFixed(1)
    };
    
    // Logování
    if (this.config.enableMemoryLogging) {
      logger.debug(`Využití paměti: ${memoryUsage.toFixed(1)}% (${this._formatBytes(usedMem)} / ${this._formatBytes(totalMem)})`);
    }
    
    // Kontrola na vysoké využití paměti
    if (memoryUsage > this.config.warningThreshold) {
      logger.warn(`Vysoké využití paměti: ${memoryUsage.toFixed(1)}%`);
      this._logEvent('high-memory', `Vysoké využití paměti: ${memoryUsage.toFixed(1)}%`);
    }
    
    // Automatické uvolnění paměti při překročení limitu
    if (memoryUsage > this.config.maxMemoryUsage) {
      this._freeMemory();
    }
    
    // Kontrola neaktivních modelů
    this._checkInactiveModels();
  }
  
  /**
   * Uvolní paměť odstraněním nepoužívaných zdrojů
   * @private
   */
  _freeMemory() {
    logger.info('Provádím uvolnění paměti...');
    this._logEvent('free-memory', 'Zahájeno uvolňování paměti');
    
    // 1. Uvolnění všech neaktivních modelů
    this._unloadInactiveModels();
    
    // 2. Vyčištění cache
    this._clearCaches();
    
    // 3. Vynucení garbage collection
    if (global.gc && typeof global.gc === 'function') {
      try {
        global.gc();
        this._logEvent('gc', 'Vynucen garbage collection');
        logger.debug('Vynucen garbage collection');
      } catch (error) {
        logger.error(`Chyba při vynucení garbage collection: ${error.message}`);
      }
    }
    
    // 4. Vyčištění dočasných souborů
    this._cleanTempFiles();
    
    // Aktualizace stavu po uvolnění
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;
    
    logger.info(`Paměť po uvolnění: ${memoryUsage.toFixed(1)}% (${this._formatBytes(usedMem)} / ${this._formatBytes(totalMem)})`);
    this._logEvent('memory-freed', `Paměť po uvolnění: ${memoryUsage.toFixed(1)}%`);
  }
  
  /**
   * Kontroluje a uvolňuje neaktivní modely
   * @private
   */
  _checkInactiveModels() {
    const now = Date.now();
    const inactiveModels = [];
    
    // Kontrola každého aktivního modelu
    for (const [modelId, modelInfo] of this.state.activeModels.entries()) {
      const inactiveTime = now - modelInfo.lastUsed;
      
      // Pokud je model neaktivní déle než práh, přidáme ho do seznamu
      if (inactiveTime > this.config.modelInactivityThreshold) {
        inactiveModels.push(modelId);
      }
    }
    
    // Uvolnění neaktivních modelů
    if (inactiveModels.length > 0) {
      logger.info(`Uvolňuji ${inactiveModels.length} neaktivních modelů`);
      
      for (const modelId of inactiveModels) {
        this.unloadModel(modelId);
      }
    }
  }
  
  /**
   * Uvolní všechny neaktivní modely
   * @private
   */
  _unloadInactiveModels() {
    const now = Date.now();
    let unloadedCount = 0;
    let freedMemory = 0;
    
    for (const [modelId, modelInfo] of this.state.activeModels.entries()) {
      this.unloadModel(modelId);
      unloadedCount++;
      freedMemory += modelInfo.size || 0;
    }
    
    if (unloadedCount > 0) {
      logger.info(`Uvolněno ${unloadedCount} modelů (${this._formatBytes(freedMemory * 1024 * 1024)})`);
    }
  }
  
  /**
   * Vyčistí různé cache pro uvolnění paměti
   * @private
   */
  _clearCaches() {
    // Vyčištění seznamu posledně použitých modelů
    this.state.recentlyUsedModels = [];
    
    // Zde by mohlo být vyčištění dalších interních cache
    
    // V případě, že používáme nějakou externí cache (např. node-cache)
    if (global.appCache) {
      global.appCache.clear();
    }
    
    logger.debug('Interní cache byly vyčištěny');
  }
  
  /**
   * Vyčistí dočasné soubory
   * @private
   */
  _cleanTempFiles() {
    try {
      const tempDir = path.join(this.config.tempDir, 'longin-ai-temp');
      
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          
          try {
            // Zjištění stáří souboru
            const stats = fs.statSync(filePath);
            const fileAge = Date.now() - stats.mtime.getTime();
            
            // Smazání souborů starších než 1 hodina
            if (fileAge > 3600000) {
              fs.unlinkSync(filePath);
              deletedCount++;
            }
          } catch (error) {
            logger.warn(`Nelze smazat dočasný soubor ${filePath}: ${error.message}`);
          }
        }
        
        if (deletedCount > 0) {
          logger.debug(`Smazáno ${deletedCount} dočasných souborů`);
        }
      }
    } catch (error) {
      logger.error(`Chyba při čištění dočasných souborů: ${error.message}`);
    }
  }
  
  /**
   * Zaznamenává událost správy paměti
   * @param {string} type - Typ události
   * @param {string} message - Zpráva
   * @private
   */
  _logEvent(type, message) {
    const event = {
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.state.events.push(event);
    
    // Omezení historie událostí na posledních 100
    if (this.state.events.length > 100) {
      this.state.events.shift();
    }
  }
  
  /**
   * Načte model do paměti
   * @param {string} modelId - Identifikátor modelu
   * @param {Object} options - Možnosti načtení
   * @returns {Promise<Object>} - Informace o načteném modelu
   */
  async loadModel(modelId, options = {}) {
    logger.info(`Načítám model: ${modelId}`);
    this._logEvent('load-model', `Načítání modelu ${modelId}`);
    
    // Kontrola, zda již model není načten
    if (this.state.activeModels.has(modelId)) {
      logger.debug(`Model ${modelId} je již načten, aktualizuji čas posledního použití`);
      
      // Aktualizace času posledního použití
      const modelInfo = this.state.activeModels.get(modelId);
      modelInfo.lastUsed = Date.now();
      modelInfo.usageCount++;
      
      // Aktualizace seznamu posledně použitých modelů
      this._updateRecentlyUsedModels(modelId);
      
      return modelInfo;
    }
    
    // Pokud máme vysoké využití paměti, uvolníme ji před načtením nového modelu
    const memUsage = this._getCurrentMemoryUsage();
    if (memUsage > this.config.maxMemoryUsage * 0.9) {
      logger.warn(`Vysoké využití paměti (${memUsage.toFixed(1)}%) před načtením modelu, uvolňuji paměť...`);
      this._freeMemory();
    }
    
    try {
      // Simulace načtení modelu (v reálné implementaci by zde bylo načtení do paměti)
      // ...
      
      // Odhad velikosti modelu (MB)
      const modelSize = options.size || this.state.modelSizes.get(modelId) || this._estimateModelSize(modelId);
      
      // Vytvoření záznamu o modelu
      const modelInfo = {
        id: modelId,
        size: modelSize,
        loadTime: Date.now(),
        lastUsed: Date.now(),
        usageCount: 1,
        options: { ...options }
      };
      
      // Přidání do seznamu aktivních modelů
      this.state.activeModels.set(modelId, modelInfo);
      
      // Aktualizace celkové velikosti modelů
      this.state.totalModelSize += modelSize;
      
      // Aktualizace seznamu posledně použitých modelů
      this._updateRecentlyUsedModels(modelId);
      
      logger.info(`Model ${modelId} úspěšně načten (${modelSize} MB)`);
      this._logEvent('model-loaded', `Model ${modelId} načten (${modelSize} MB)`);
      
      return modelInfo;
    } catch (error) {
      logger.error(`Chyba při načítání modelu ${modelId}: ${error.message}`);
      this._logEvent('model-load-error', `Chyba při načítání modelu ${modelId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Uvolní model z paměti
   * @param {string} modelId - Identifikátor modelu
   * @returns {boolean} - Zda byl model úspěšně uvolněn
   */
  unloadModel(modelId) {
    if (!this.state.activeModels.has(modelId)) {
      logger.debug(`Model ${modelId} není načten, nelze uvolnit`);
      return false;
    }
    
    logger.info(`Uvolňuji model: ${modelId}`);
    this._logEvent('unload-model', `Uvolňování modelu ${modelId}`);
    
    try {
      const modelInfo = this.state.activeModels.get(modelId);
      
      // Simulace uvolnění modelu (v reálné implementaci by zde bylo uvolnění z paměti)
      // ...
      
      // Odstranění ze seznamu aktivních modelů
      this.state.activeModels.delete(modelId);
      
      // Aktualizace celkové velikosti modelů
      this.state.totalModelSize -= modelInfo.size || 0;
      
      logger.info(`Model ${modelId} úspěšně uvolněn (${modelInfo.size || 0} MB)`);
      this._logEvent('model-unloaded', `Model ${modelId} uvolněn (${modelInfo.size || 0} MB)`);
      
      // Vynucení garbage collection, pokud je dostupný
      if (global.gc && typeof global.gc === 'function') {
        global.gc();
      }
      
      return true;
    } catch (error) {
      logger.error(`Chyba při uvolňování modelu ${modelId}: ${error.message}`);
      this._logEvent('model-unload-error', `Chyba při uvolňování modelu ${modelId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Aktualizuje seznam posledně použitých modelů
   * @param {string} modelId - Identifikátor modelu
   * @private
   */
  _updateRecentlyUsedModels(modelId) {
    // Odstranění modelu, pokud již v seznamu existuje
    this.state.recentlyUsedModels = this.state.recentlyUsedModels.filter(id => id !== modelId);
    
    // Přidání modelu na začátek seznamu
    this.state.recentlyUsedModels.unshift(modelId);
    
    // Omezení seznamu na 10 posledních modelů
    if (this.state.recentlyUsedModels.length > 10) {
      this.state.recentlyUsedModels.pop();
    }
  }
  
  /**
   * Vrátí aktuální využití paměti v procentech
   * @returns {number} - Procento využité paměti
   * @private
   */
  _getCurrentMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return ((totalMem - freeMem) / totalMem) * 100;
  }
  
  /**
   * Odhaduje velikost modelu
   * @param {string} modelId - Identifikátor modelu
   * @returns {number} - Odhadovaná velikost v MB
   * @private
   */
  _estimateModelSize(modelId) {
    // Tabulka odhadovaných velikostí podle typu modelu
    const sizeEstimates = {
      'llama2': 7000, // ~7GB
      'dolphin-mistral': 4000, // ~4GB
      'wizardlm-uncensored': 6000, // ~6GB
      'phi-2': 2500, // ~2.5GB
      'gemma': 9000, // ~9GB
      'mistral-7b': 4000, // ~4GB
      'orca-mini': 3000, // ~3GB
      'stable-diffusion': 4000, // ~4GB
      'default': 2000 // ~2GB
    };
    
    // Pokus o rozpoznání typu modelu z ID
    for (const [type, size] of Object.entries(sizeEstimates)) {
      if (modelId.includes(type)) {
        return size;
      }
    }
    
    // Výchozí odhad
    return sizeEstimates.default;
  }
  
  /**
   * Formátuje velikost v bytech na čitelný formát
   * @param {number} bytes - Velikost v bytech
   * @returns {string} - Formátovaná velikost
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Identifikuje nejlepší modely pro daný systém
   * @param {Object} systemInfo - Informace o systému
   * @param {string} modelType - Typ modelu ('llm' nebo 'image')
   * @returns {Array<Object>} - Seznam doporučených modelů
   */
  getRecommendedModels(systemInfo, modelType = 'llm') {
    // Pokud nejsou předány informace o systému, získáme je
    if (!systemInfo) {
      systemInfo = this.getSystemInfo();
    }
    
    // Kategorizace systému podle výkonu
    let performanceTier = 'low';
    
    if (systemInfo.memory >= 16 && systemInfo.cpuCores >= 8) {
      performanceTier = 'high';
    } else if (systemInfo.memory >= 8 && systemInfo.cpuCores >= 4) {
      performanceTier = 'medium';
    }
    
    // Přidání podpory GPU, pokud je k dispozici
    if (systemInfo.gpu && systemInfo.gpu.memory) {
      if (systemInfo.gpu.memory >= 8) {
        performanceTier = performanceTier === 'high' ? 'very-high' : 'high';
      } else if (systemInfo.gpu.memory >= 4) {
        performanceTier = performanceTier === 'low' ? 'medium' : performanceTier;
      }
    }
    
    // Definice doporučených modelů podle typu a výkonnostní kategorie
    const modelRecommendations = {
      llm: {
        'very-high': [
          { id: 'llama2:70b', name: 'Llama 2 (70B)', size: 35000, description: 'Výkonný open-source model s 70 miliardami parametrů' },
          { id: 'dolphin-mistral:7b', name: 'Dolphin Mistral (7B)', size: 4000, description: 'Necenzurovaný model vhodný pro konverzaci a roleplaying' },
          { id: 'wizardlm-uncensored:13b', name: 'WizardLM Uncensored (13B)', size: 6500, description: 'Vysoce kvalitní necenzurovaný model s 13 miliardami parametrů' }
        ],
        'high': [
          { id: 'wizardlm-uncensored:7b', name: 'WizardLM Uncensored (7B)', size: 4000, description: 'Menší verze necenzurovaného modelu s 7 miliardami parametrů' },
          { id: 'dolphin-mistral:7b', name: 'Dolphin Mistral (7B)', size: 4000, description: 'Necenzurovaný model vhodný pro konverzaci a roleplaying' },
          { id: 'mistral:7b', name: 'Mistral (7B)', size: 4000, description: 'Výkonný model s dobrou kvalitou odpovědí' }
        ],
        'medium': [
          { id: 'orca-mini:7b', name: 'Orca Mini (7B)', size: 4000, description: 'Dobrý kompromis mezi velikostí a kvalitou' },
          { id: 'dolphin-mistral:7b-q4', name: 'Dolphin Mistral (7B, 4-bit kvantizovaný)', size: 2000, description: 'Kvantizovaná verze s nižšími paměťovými nároky' },
          { id: 'phi-2:2.7b', name: 'Phi-2 (2.7B)', size: 1500, description: 'Malý, ale překvapivě výkonný model' }
        ],
        'low': [
          { id: 'phi-2:2.7b-q4', name: 'Phi-2 (2.7B, 4-bit kvantizovaný)', size: 800, description: 'Malý model s nízkou paměťovou náročností' },
          { id: 'orca-mini:3b-q4', name: 'Orca Mini (3B, 4-bit kvantizovaný)', size: 1500, description: 'Kvantizovaná verze pro slabší hardware' },
          { id: 'neural-chat:1.5b-q4', name: 'Neural Chat (1.5B, 4-bit kvantizovaný)', size: 600, description: 'Minimalistický model pro základní konverzaci' }
        ]
      },
      image: {
        'very-high': [
          { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', size: 6500, description: 'Nejkvalitnější model pro generování obrázků' },
          { id: 'stable-diffusion-dreamshaper-xl', name: 'Dreamshaper XL', size: 6800, description: 'Kreativní model s vysokou kvalitou detailů' },
          { id: 'realistic-vision-v5', name: 'Realistic Vision v5', size: 6000, description: 'Specializovaný na realistické obrázky' }
        ],
        'high': [
          { id: 'stable-diffusion-1.5', name: 'Stable Diffusion 1.5', size: 4200, description: 'Spolehlivý model pro většinu potřeb' },
          { id: 'dreamshaper-v8', name: 'Dreamshaper v8', size: 4500, description: 'Kreativní model s dobrým poměrem kvality a velikosti' },
          { id: 'deliberate-v2', name: 'Deliberate v2', size: 4300, description: 'Všestranný model s dobrou kvalitou' }
        ],
        'medium': [
          { id: 'stable-diffusion-1.5-pruned', name: 'Stable Diffusion 1.5 (Pruned)', size: 3200, description: 'Optimalizovaná verze s nižšími nároky' },
          { id: 'dreamshaper-v5-pruned', name: 'Dreamshaper v5 (Pruned)', size: 3400, description: 'Menší verze kreativního modelu' },
          { id: 'openjourney-v4', name: 'Openjourney v4', size: 3000, description: 'Stylizovaný model inspirovaný Midjourney' }
        ],
        'low': [
          { id: 'stable-diffusion-lite', name: 'Stable Diffusion Lite', size: 1800, description: 'Zmenšená verze pro nízký hardware' },
          { id: 'pixart-a', name: 'PixArt-α', size: 1600, description: 'Menší model optimalizovaný pro stylizované obrázky' },
          { id: 'stable-diffusion-1.5-fp16', name: 'Stable Diffusion 1.5 (FP16)', size: 2000, description: 'Verze s poloviční přesností pro úsporu paměti' }
        ]
      }
    };
    
    // Vrátíme doporučené modely pro danou kategorii
    return modelRecommendations[modelType][performanceTier] || modelRecommendations[modelType]['low'];
  }
  
  /**
   * Získá informace o systému
   * @returns {Object} - Informace o systému
   */
  getSystemInfo() {
    const cpuInfo = os.cpus();
    const totalMemory = os.totalmem() / (1024 * 1024 * 1024); // GB
    
    // Pokus o získání informací o GPU (ukázková implementace)
    let gpuInfo = null;
    
    try {
      // V reálné implementaci by zde byl kód pro detekci GPU
      // Například pomocí node-gpu nebo podobné knihovny
      gpuInfo = { 
        name: 'Unknown',
        memory: 0
      };
      
      // Pokus o detekci NVIDIA GPU pomocí příkazu nvidia-smi
      if (process.platform === 'win32') {
        try {
          const nvidiaSmi = require('child_process').execSync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits').toString();
          if (nvidiaSmi) {
            const lines = nvidiaSmi.trim().split('\n');
            if (lines.length > 0) {
              const parts = lines[0].split(',').map(p => p.trim());
              gpuInfo = {
                name: parts[0],
                memory: parseInt(parts[1]) / 1024 // Převod MB na GB
              };
            }
          }
        } catch (e) {
          // GPU nenalezena nebo nvidia-smi není k dispozici
        }
      }
    } catch (error) {
      logger.warn(`Nepodařilo se získat informace o GPU: ${error.message}`);
    }
    
    return {
      platform: os.platform(),
      architecture: os.arch(),
      cpuModel: cpuInfo.length > 0 ? cpuInfo[0].model : 'Unknown',
      cpuCores: cpuInfo.length,
      cpuSpeed: cpuInfo.length > 0 ? cpuInfo[0].speed : 0,
      memory: Math.round(totalMemory),
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)), // GB
      gpu: gpuInfo
    };
  }
  
  /**
   * Získá statistiky o využití paměti
   * @returns {Object} - Statistiky paměti
   */
  getMemoryStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;
    
    const processMemory = process.memoryUsage();
    
    return {
      system: {
        total: this._formatBytes(totalMem),
        free: this._formatBytes(freeMem),
        used: this._formatBytes(usedMem),
        percentage: memoryUsage.toFixed(1)
      },
      process: {
        rss: this._formatBytes(processMemory.rss),
        heapTotal: this._formatBytes(processMemory.heapTotal),
        heapUsed: this._formatBytes(processMemory.heapUsed),
        external: this._formatBytes(processMemory.external || 0)
      },
      models: {
        active: this.state.activeModels.size,
        totalSize: `${this.state.totalModelSize} MB`,
        list: Array.from(this.state.activeModels.entries()).map(([id, info]) => ({
          id,
          size: `${info.size} MB`,
          loadTime: new Date(info.loadTime).toISOString(),
          lastUsed: new Date(info.lastUsed).toISOString(),
          usageCount: info.usageCount
        }))
      },
      events: this.state.events.slice(-10) // Posledních 10 událostí
    };
  }
  
  /**
   * Uvolní paměť před ukončením
   */
  cleanup() {
    logger.info('Provádím cleanup Memory Manageru...');
    
    // Zastavení monitorování
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    // Uvolnění všech modelů
    this._unloadInactiveModels();
    
    // Vyčištění dočasných souborů
    this._cleanTempFiles();
    
    logger.info('Memory Manager cleanup dokončen');
  }
}

// Vytvoření a export instance
const memoryManager = new MemoryManager();

// Zachytit ukončení procesu pro cleanup
process.on('exit', () => {
  memoryManager.cleanup();
});

module.exports = memoryManager;