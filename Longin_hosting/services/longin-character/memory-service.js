/**
 * Služba pro práci s pamětí AI a optimalizaci využití zdrojů
 * Poskytuje pokročilé nástroje pro správu paměti a automatické uvolňování
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');

class MemoryService {
  constructor() {
    this.memories = new Map();
    this.memoryIndex = new Map(); // Index pro rychlé vyhledávání
    this.activeModels = new Map(); // Aktivní AI modely
    this.persistencePath = path.join(__dirname, 'data', 'memories');
    this.maxMemoryEntries = 50; // Maximum záznamů v paměti pro jednu postavu
    this.memoryPruneInterval = 60 * 60 * 1000; // 1 hodina
    this.modelUnloadTime = 10 * 60 * 1000; // 10 minut neaktivity = vyložení modelu
    
    // Inicializace
    this._ensureDirectoryExists();
    this._setupMemoryPruning();
    this._setupModelMemoryManagement();
  }

  /**
   * Zajistí existenci adresáře pro ukládání dat
   * @private
   */
  _ensureDirectoryExists() {
    if (!fs.existsSync(this.persistencePath)) {
      fs.mkdirSync(this.persistencePath, { recursive: true });
      logger.info(`Vytvořen adresář pro persistentní paměť: ${this.persistencePath}`);
    }
  }

  /**
   * Nastaví automatické prořezávání a optimalizaci paměti
   * @private
   */
  _setupMemoryPruning() {
    setInterval(() => {
      this._pruneMemories();
      this._consolidateMemories();
    }, this.memoryPruneInterval);
    
    logger.info(`Nastaveno automatické prořezávání paměti každých ${this.memoryPruneInterval / (60 * 1000)} minut`);
  }

  /**
   * Nastaví automatickou správu modelů v paměti
   * @private
   */
  _setupModelMemoryManagement() {
    // Kontrola neaktivních modelů každou minutu
    setInterval(() => {
      const now = Date.now();
      
      for (const [modelId, modelInfo] of this.activeModels.entries()) {
        const inactiveTime = now - modelInfo.lastUsed;
        
        // Pokud je model neaktivní déle než stanovený čas, uvolni ho z paměti
        if (inactiveTime > this.modelUnloadTime) {
          this._unloadModel(modelId);
          logger.info(`Model ${modelId} byl automaticky uvolněn z paměti po ${inactiveTime / 60000} minutách neaktivity`);
        }
      }
    }, 60 * 1000); // Kontrola každou minutu
    
    logger.info('Aktivována automatická správa modelů v paměti');
  }

  /**
   * Odstraní nejstarší vzpomínky, pokud je překročen limit
   * @private
   */
  _pruneMemories() {
    for (const [characterId, memories] of this.memories.entries()) {
      if (memories.length > this.maxMemoryEntries) {
        // Ponech pouze nejnovější záznamy
        const prunedMemories = memories.slice(-this.maxMemoryEntries);
        this.memories.set(characterId, prunedMemories);
        
        // Aktualizuj index
        this._rebuildMemoryIndex(characterId);
        
        logger.info(`Prořezáno ${memories.length - prunedMemories.length} starých vzpomínek pro postavu ${characterId}`);
      }
    }
  }

  /**
   * Sloučí podobné vzpomínky pro úsporu paměti
   * @private
   */
  _consolidateMemories() {
    for (const [characterId, memories] of this.memories.entries()) {
      const consolidatedMemories = [];
      const topics = new Map();
      
      // Seskupení vzpomínek podle témat
      for (const memory of memories) {
        const topic = memory.topic || 'unknown';
        
        if (!topics.has(topic)) {
          topics.set(topic, []);
        }
        
        topics.get(topic).push(memory);
      }
      
      // Sloučení vzpomínek v rámci témat
      for (const [topic, topicMemories] of topics.entries()) {
        if (topicMemories.length <= 1) {
          // Přidej jednotlivé vzpomínky beze změny
          consolidatedMemories.push(...topicMemories);
        } else {
          // Seřaď podle důležitosti a času
          topicMemories.sort((a, b) => {
            // Prioritizuj důležitost
            if (a.importance !== b.importance) {
              return b.importance - a.importance;
            }
            // Pak seřaď podle času (novější mají přednost)
            return new Date(b.timestamp) - new Date(a.timestamp);
          });
          
          // Ponech 3 nejdůležitější/nejnovější vzpomínky a ostatní sluč
          const keptMemories = topicMemories.slice(0, 3);
          const toConsolidate = topicMemories.slice(3);
          
          if (toConsolidate.length > 0) {
            const consolidatedMemory = {
              id: uuidv4(),
              characterId: characterId,
              topic: topic,
              summary: `Souhrn ${toConsolidate.length} vzpomínek na téma ${topic}`,
              details: toConsolidate.map(m => m.summary || m.details).join('. '),
              timestamp: new Date().toISOString(),
              importance: Math.max(...toConsolidate.map(m => m.importance || 1)),
              isConsolidated: true,
              sourceMemories: toConsolidate.map(m => m.id)
            };
            
            keptMemories.push(consolidatedMemory);
            logger.info(`Sloučeno ${toConsolidate.length} vzpomínek na téma ${topic} pro postavu ${characterId}`);
          }
          
          consolidatedMemories.push(...keptMemories);
        }
      }
      
      // Aktualizuj paměť postavy
      if (consolidatedMemories.length < memories.length) {
        this.memories.set(characterId, consolidatedMemories);
        this._rebuildMemoryIndex(characterId);
        logger.info(`Paměť postavy ${characterId} byla optimalizována: ${memories.length} -> ${consolidatedMemories.length} vzpomínek`);
      }
    }
  }

  /**
   * Znovu vytvoří index paměti pro postavu
   * @param {string} characterId - ID postavy
   * @private
   */
  _rebuildMemoryIndex(characterId) {
    const memories = this.memories.get(characterId) || [];
    const characterIndex = new Map();
    
    for (const memory of memories) {
      // Indexace podle tématu
      const topic = memory.topic || 'unknown';
      if (!characterIndex.has(topic)) {
        characterIndex.set(topic, []);
      }
      characterIndex.get(topic).push(memory.id);
      
      // Indexace podle klíčových slov (pro rychlé vyhledávání)
      const keywords = this._extractKeywords(memory);
      for (const keyword of keywords) {
        if (!characterIndex.has(keyword)) {
          characterIndex.set(keyword, []);
        }
        characterIndex.get(keyword).push(memory.id);
      }
    }
    
    this.memoryIndex.set(characterId, characterIndex);
  }

  /**
   * Extrahuje klíčová slova ze vzpomínky pro indexaci
   * @param {object} memory - Vzpomínka
   * @returns {string[]} - Seznam klíčových slov
   * @private
   */
  _extractKeywords(memory) {
    const text = [
      memory.summary || '',
      memory.details || '',
      memory.userMessage || '',
      memory.characterResponse || ''
    ].join(' ').toLowerCase();
    
    // Odstranění interpunkce a rozdělení na slova
    const words = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').split(/\s+/);
    
    // Filtrování stop slov a krátkých slov
    const stopWords = ['a', 'an', 'the', 'je', 'jsem', 'jsou', 'v', 'na', 'to', 'že', 'se', 'co', 'jak'];
    const keywords = words.filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    
    // Vrácení unikátních klíčových slov
    return [...new Set(keywords)];
  }

  /**
   * Vytvoří novou vzpomínku pro postavu
   * @param {string} characterId - ID postavy
   * @param {object} memoryData - Data vzpomínky
   * @returns {object} - Vytvořená vzpomínka
   */
  createMemory(characterId, memoryData) {
    if (!characterId) {
      throw new Error('ID postavy je povinné');
    }
    
    // Vytvoření vzpomínky s povinnými poli
    const memory = {
      id: uuidv4(),
      characterId: characterId,
      timestamp: new Date().toISOString(),
      importance: memoryData.importance || 1,
      ...memoryData
    };
    
    // Inicializace paměti postavy, pokud ještě neexistuje
    if (!this.memories.has(characterId)) {
      this.memories.set(characterId, []);
    }
    
    // Přidání vzpomínky
    const characterMemories = this.memories.get(characterId);
    characterMemories.push(memory);
    
    // Aktualizace indexu
    if (!this.memoryIndex.has(characterId)) {
      this.memoryIndex.set(characterId, new Map());
    }
    
    const characterIndex = this.memoryIndex.get(characterId);
    
    // Indexace podle tématu
    const topic = memory.topic || 'unknown';
    if (!characterIndex.has(topic)) {
      characterIndex.set(topic, []);
    }
    characterIndex.get(topic).push(memory.id);
    
    // Indexace podle klíčových slov
    const keywords = this._extractKeywords(memory);
    for (const keyword of keywords) {
      if (!characterIndex.has(keyword)) {
        characterIndex.set(keyword, []);
      }
      characterIndex.get(keyword).push(memory.id);
    }
    
    // Uložení do persistentního úložiště
    this._persistMemories(characterId);
    
    logger.info(`Vytvořena nová vzpomínka ${memory.id} pro postavu ${characterId}`);
    
    return memory;
  }

  /**
   * Získá seznam vzpomínek pro postavu
   * @param {string} characterId - ID postavy
   * @param {object} options - Možnosti filtrování a řazení
   * @returns {Array} - Seznam vzpomínek
   */
  getMemories(characterId, options = {}) {
    if (!characterId) {
      throw new Error('ID postavy je povinné');
    }
    
    // Získání vzpomínek
    const memories = this.memories.get(characterId) || [];
    
    // Filtrování podle tématu
    if (options.topic) {
      return memories.filter(memory => memory.topic === options.topic);
    }
    
    // Filtrování podle klíčového slova
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase();
      const characterIndex = this.memoryIndex.get(characterId);
      
      if (characterIndex && characterIndex.has(keyword)) {
        const memoryIds = characterIndex.get(keyword);
        return memories.filter(memory => memoryIds.includes(memory.id));
      }
      
      // Pokud není klíčové slovo v indexu, proveď vyhledávání v textu
      return memories.filter(memory => {
        const text = [
          memory.summary || '',
          memory.details || '',
          memory.userMessage || '',
          memory.characterResponse || ''
        ].join(' ').toLowerCase();
        
        return text.includes(keyword);
      });
    }
    
    // Řazení podle důležitosti nebo času
    if (options.sortBy === 'importance') {
      return [...memories].sort((a, b) => b.importance - a.importance);
    }
    
    // Výchozí řazení podle času (od nejnovějších)
    return [...memories].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Získá konkrétní vzpomínku podle ID
   * @param {string} characterId - ID postavy
   * @param {string} memoryId - ID vzpomínky
   * @returns {object|null} - Vzpomínka nebo null
   */
  getMemory(characterId, memoryId) {
    if (!characterId || !memoryId) {
      throw new Error('ID postavy a ID vzpomínky jsou povinné');
    }
    
    const memories = this.memories.get(characterId) || [];
    return memories.find(memory => memory.id === memoryId) || null;
  }

  /**
   * Aktualizuje existující vzpomínku
   * @param {string} characterId - ID postavy
   * @param {string} memoryId - ID vzpomínky
   * @param {object} updates - Aktualizace
   * @returns {object|null} - Aktualizovaná vzpomínka nebo null
   */
  updateMemory(characterId, memoryId, updates) {
    if (!characterId || !memoryId) {
      throw new Error('ID postavy a ID vzpomínky jsou povinné');
    }
    
    const memories = this.memories.get(characterId) || [];
    const memoryIndex = memories.findIndex(memory => memory.id === memoryId);
    
    if (memoryIndex === -1) {
      return null;
    }
    
    // Aktualizace vzpomínky
    const updatedMemory = {
      ...memories[memoryIndex],
      ...updates,
      // Zachování původních hodnot těchto polí
      id: memoryId,
      characterId: characterId
    };
    
    memories[memoryIndex] = updatedMemory;
    
    // Aktualizace indexu
    this._rebuildMemoryIndex(characterId);
    
    // Persistentní uložení
    this._persistMemories(characterId);
    
    logger.info(`Aktualizována vzpomínka ${memoryId} pro postavu ${characterId}`);
    
    return updatedMemory;
  }

  /**
   * Odstraní vzpomínku
   * @param {string} characterId - ID postavy
   * @param {string} memoryId - ID vzpomínky
   * @returns {boolean} - True, pokud byla vzpomínka odstraněna
   */
  deleteMemory(characterId, memoryId) {
    if (!characterId || !memoryId) {
      throw new Error('ID postavy a ID vzpomínky jsou povinné');
    }
    
    const memories = this.memories.get(characterId) || [];
    const filteredMemories = memories.filter(memory => memory.id !== memoryId);
    
    if (filteredMemories.length === memories.length) {
      return false; // Vzpomínka nebyla nalezena
    }
    
    // Aktualizace paměti
    this.memories.set(characterId, filteredMemories);
    
    // Aktualizace indexu
    this._rebuildMemoryIndex(characterId);
    
    // Persistentní uložení
    this._persistMemories(characterId);
    
    logger.info(`Odstraněna vzpomínka ${memoryId} pro postavu ${characterId}`);
    
    return true;
  }

  /**
   * Vytvoří vzpomínku z konverzace
   * @param {string} characterId - ID postavy
   * @param {string} userMessage - Zpráva uživatele
   * @param {string} characterResponse - Odpověď postavy
   * @param {object} options - Další možnosti
   * @returns {object} - Vytvořená vzpomínka
   */
  createConversationMemory(characterId, userMessage, characterResponse, options = {}) {
    const memoryData = {
      userMessage,
      characterResponse,
      summary: options.summary || `Dialog o "${userMessage.substring(0, 20)}..."`,
      topic: options.topic || 'conversation',
      importance: options.importance || 1
    };
    
    return this.createMemory(characterId, memoryData);
  }

  /**
   * Uloží vzpomínky postavy do persistentního úložiště
   * @param {string} characterId - ID postavy
   * @private
   */
  _persistMemories(characterId) {
    const memories = this.memories.get(characterId) || [];
    const filePath = path.join(this.persistencePath, `${characterId}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(memories), 'utf8');
      logger.debug(`Persistentně uloženo ${memories.length} vzpomínek pro postavu ${characterId}`);
    } catch (error) {
      logger.error(`Chyba při ukládání vzpomínek pro postavu ${characterId}:`, error);
    }
  }

  /**
   * Načte vzpomínky postavy z persistentního úložiště
   * @param {string} characterId - ID postavy
   * @returns {Array} - Seznam vzpomínek
   */
  loadMemories(characterId) {
    if (!characterId) {
      throw new Error('ID postavy je povinné');
    }
    
    const filePath = path.join(this.persistencePath, `${characterId}.json`);
    
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const memories = JSON.parse(data);
        
        // Aktualizace paměti
        this.memories.set(characterId, memories);
        
        // Aktualizace indexu
        this._rebuildMemoryIndex(characterId);
        
        logger.info(`Načteno ${memories.length} vzpomínek pro postavu ${characterId}`);
        
        return memories;
      }
    } catch (error) {
      logger.error(`Chyba při načítání vzpomínek pro postavu ${characterId}:`, error);
    }
    
    // Pokud nemáme persistentní data, vraťme prázdné pole
    return [];
  }

  /**
   * Získá nejrelevantnější vzpomínky pro aktuální kontext
   * @param {string} characterId - ID postavy
   * @param {string} context - Aktuální kontext (např. uživatelova zpráva)
   * @param {number} limit - Maximální počet vzpomínek
   * @returns {Array} - Seznam relevantních vzpomínek
   */
  getRelevantMemories(characterId, context, limit = 5) {
    if (!characterId || !context) {
      throw new Error('ID postavy a kontext jsou povinné');
    }
    
    const memories = this.memories.get(characterId) || [];
    
    // Extrakce klíčových slov z kontextu
    const contextKeywords = this._extractKeywords({ details: context });
    
    // Hodnocení vzpomínek podle relevance ke kontextu
    const scoredMemories = memories.map(memory => {
      const memoryKeywords = this._extractKeywords(memory);
      
      // Počet společných klíčových slov
      const commonKeywords = contextKeywords.filter(keyword => memoryKeywords.includes(keyword));
      const keywordScore = commonKeywords.length / Math.max(1, contextKeywords.length);
      
      // Faktor důležitosti
      const importanceFactor = memory.importance || 1;
      
      // Faktor času (novější vzpomínky jsou relevantnější)
      const timeFactor = 1 + (1 / (1 + (Date.now() - new Date(memory.timestamp).getTime()) / (1000 * 60 * 60 * 24)));
      
      // Celkové skóre
      const score = keywordScore * importanceFactor * timeFactor;
      
      return { memory, score };
    });
    
    // Seřazení podle skóre a omezení počtu
    const relevantMemories = scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
    
    return relevantMemories;
  }

  /**
   * Načte AI model do paměti a označí ho jako aktivní
   * @param {string} modelId - ID modelu
   * @param {object} modelOptions - Další informace o modelu
   * @returns {object} - Informace o načteném modelu
   */
  loadModel(modelId, modelOptions = {}) {
    if (!modelId) {
      throw new Error('ID modelu je povinné');
    }
    
    // Pokud je model již načten, aktualizuj čas posledního použití
    if (this.activeModels.has(modelId)) {
      const modelInfo = this.activeModels.get(modelId);
      modelInfo.lastUsed = Date.now();
      modelInfo.usageCount++;
      
      logger.debug(`Model ${modelId} již načten, aktualizován čas použití`);
      
      return modelInfo;
    }
    
    // Virtuální simulace načtení modelu (v reálné implementaci by zde bylo načtení modelu)
    logger.info(`Načítám model ${modelId} do paměti...`);
    
    // Simulace zatížení paměti
    const modelSize = modelOptions.size || 2048; // Velikost v MB
    const memoryUsage = process.memoryUsage();
    
    // Kontrola dostupné paměti
    const availableMemory = os.freemem() / (1024 * 1024); // Dostupná paměť v MB
    
    if (availableMemory < modelSize * 1.5) { // Požadujeme 1.5x více paměti než velikost modelu
      logger.warn(`Nedostatek paměti pro načtení modelu ${modelId}: dostupno ${Math.round(availableMemory)}MB, požadováno ${Math.round(modelSize * 1.5)}MB`);
      
      // Pokusit se uvolnit paměť odstraněním nejméně používaných modelů
      this._freemMemoryForModel(modelSize * 1.5);
    }
    
    // Vytvoření informací o modelu
    const modelInfo = {
      id: modelId,
      loaded: true,
      size: modelSize,
      loadTime: Date.now(),
      lastUsed: Date.now(),
      usageCount: 1,
      options: modelOptions
    };
    
    // Přidání modelu do aktivních
    this.activeModels.set(modelId, modelInfo);
    
    logger.info(`Model ${modelId} byl úspěšně načten do paměti`);
    
    return modelInfo;
  }

  /**
   * Uvolní model z paměti
   * @param {string} modelId - ID modelu
   * @returns {boolean} - True, pokud byl model uvolněn
   * @private
   */
  _unloadModel(modelId) {
    if (!this.activeModels.has(modelId)) {
      return false;
    }
    
    // Virtuální simulace uvolnění modelu
    logger.info(`Uvolňuji model ${modelId} z paměti...`);
    
    // Odstranění modelu z aktivních
    this.activeModels.delete(modelId);
    
    // Zde by bylo volání global.gc() pro uvolnění paměti, pokud je k dispozici
    if (global.gc) {
      global.gc();
    }
    
    return true;
  }

  /**
   * Uvolní paměť pro nový model
   * @param {number} requiredMemory - Požadovaná paměť v MB
   * @returns {boolean} - True, pokud byla paměť úspěšně uvolněna
   * @private
   */
  _freemMemoryForModel(requiredMemory) {
    if (this.activeModels.size === 0) {
      return false; // Nejsou žádné modely k uvolnění
    }
    
    // Seřaď modely podle času posledního použití (nejstarší první)
    const modelsByLastUsed = [...this.activeModels.entries()]
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    let freedMemory = 0;
    
    // Postupně uvolňuj modely, dokud nemáš dostatek paměti
    for (const [modelId, modelInfo] of modelsByLastUsed) {
      this._unloadModel(modelId);
      freedMemory += modelInfo.size;
      
      logger.info(`Uvolněn model ${modelId} pro získání paměti (${modelInfo.size}MB)`);
      
      if (freedMemory >= requiredMemory) {
        return true;
      }
    }
    
    return freedMemory > 0;
  }

  /**
   * Získá statistiky o používání paměti
   * @returns {object} - Statistiky paměti
   */
  getMemoryStats() {
    // Počet vzpomínek pro každou postavu
    const characterStats = {};
    let totalMemories = 0;
    
    for (const [characterId, memories] of this.memories.entries()) {
      characterStats[characterId] = memories.length;
      totalMemories += memories.length;
    }
    
    // Statistiky aktivních modelů
    const modelStats = {
      active: this.activeModels.size,
      totalSize: 0,
      oldest: null,
      newest: null
    };
    
    if (this.activeModels.size > 0) {
      let oldestTime = Date.now();
      let newestTime = 0;
      
      for (const [modelId, modelInfo] of this.activeModels.entries()) {
        modelStats.totalSize += modelInfo.size;
        
        if (modelInfo.lastUsed < oldestTime) {
          oldestTime = modelInfo.lastUsed;
          modelStats.oldest = modelId;
        }
        
        if (modelInfo.lastUsed > newestTime) {
          newestTime = modelInfo.lastUsed;
          modelStats.newest = modelId;
        }
      }
    }
    
    // Systémové statistiky paměti
    const systemMemory = {
      total: Math.round(os.totalmem() / (1024 * 1024)), // MB
      free: Math.round(os.freemem() / (1024 * 1024)), // MB
      process: {
        rss: Math.round(process.memoryUsage().rss / (1024 * 1024)), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)), // MB
        heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)) // MB
      }
    };
    
    return {
      characters: characterStats,
      totalMemories,
      models: modelStats,
      system: systemMemory
    };
  }
}

module.exports = new MemoryService();