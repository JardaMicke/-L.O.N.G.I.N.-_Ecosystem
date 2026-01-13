# Memory Service - Dokumentace

`memory-service.js` je klíčová komponenta spravující dlouhodobou paměť postav v aplikaci. Tato služba poskytuje sofistikovaný systém ukládání, vyhledávání a relevance paměťových záznamů, které informují chování postav v konverzacích.

## Architektura

MemoryService je implementována jako třída, která komunikuje s SQLite databází. Poskytuje komplexní rozhraní pro práci s pamětí postav, včetně kategorizace, tagování a relevantního vyhledávání.

## Hlavní komponenty

### Inicializace databáze

```javascript
/**
 * Inicializace databázového schématu pro paměti
 */
initializeDatabase() {
  this.db.serialize(() => {
    // Tabulka pamětí pro ukládání vzpomínek postav
    this.db.run(`CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      importance INTEGER DEFAULT 5,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
      access_count INTEGER DEFAULT 0,
      FOREIGN KEY (character_id) REFERENCES characters (id)
    )`);

    // Tagy paměti pro kategorizaci
    this.db.run(`CREATE TABLE IF NOT EXISTS memory_tags (
      memory_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (memory_id, tag),
      FOREIGN KEY (memory_id) REFERENCES memories (id)
    )`);

    // Uživatelské vztahy
    this.db.run(`CREATE TABLE IF NOT EXISTS relationships (
      character_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      value INTEGER DEFAULT 0,
      description TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (character_id, relationship_type),
      FOREIGN KEY (character_id) REFERENCES characters (id)
    )`);

    console.log('Memory database initialized');
  });
}
```

### Správa pamětí

#### Vytvoření paměti

```javascript
/**
 * Vytvoří novou paměť pro postavu
 * 
 * @param {string} characterId - ID postavy
 * @param {string} type - Typ paměti (fact, preference, event, atd.)
 * @param {string} content - Obsah paměti
 * @param {Array} tags - Tagy pro kategorizaci paměti
 * @param {number} importance - Skóre důležitosti (1-10)
 * @returns {Promise<object>} - Vytvořená paměť
 */
createMemory(characterId, type, content, tags = [], importance = 5) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    
    this.db.run(
      'INSERT INTO memories (id, character_id, type, content, importance) VALUES (?, ?, ?, ?, ?)',
      [id, characterId, type, content, importance],
      async (err) => {
        if (err) return reject(err);
        
        // Přidání tagů, pokud byly poskytnuty
        if (tags.length > 0) {
          try {
            await this._addTagsToMemory(id, tags);
          } catch (error) {
            console.error('Error adding tags to memory:', error);
          }
        }
        
        resolve({
          id,
          character_id: characterId,
          type,
          content,
          importance,
          tags
        });
      }
    );
  });
}
```

#### Získání pamětí

```javascript
/**
 * Získá paměti pro postavu
 * 
 * @param {string} characterId - ID postavy
 * @param {object} options - Možnosti dotazu (limit, type, tags)
 * @returns {Promise<Array>} - Seznam pamětí
 */
getMemories(characterId, options = {}) {
  const { limit = 50, type = null, tags = [] } = options;
  
  return new Promise((resolve, reject) => {
    let query = `
      SELECT m.*, GROUP_CONCAT(mt.tag) as tags
      FROM memories m
      LEFT JOIN memory_tags mt ON m.id = mt.memory_id
      WHERE m.character_id = ?
    `;
    
    const params = [characterId];
    
    // Filtrování podle typu
    if (type) {
      query += ' AND m.type = ?';
      params.push(type);
    }
    
    // Filtrování podle tagů
    if (tags.length > 0) {
      query += ` AND m.id IN (
        SELECT memory_id FROM memory_tags 
        WHERE tag IN (${tags.map(() => '?').join(',')})
        GROUP BY memory_id
        HAVING COUNT(DISTINCT tag) = ?
      )`;
      
      // Přidání každého tagu jako parametr
      tags.forEach(tag => params.push(tag.toLowerCase().trim()));
      // Přidání počtu tagů jako poslední parametr
      params.push(tags.length);
    }
    
    // Seřazení a limit
    query += `
      GROUP BY m.id
      ORDER BY m.importance DESC, m.last_accessed DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    this.db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      
      // Zpracování výsledků
      const memories = rows.map(row => ({
        ...row,
        tags: row.tags ? row.tags.split(',') : []
      }));
      
      resolve(memories);
    });
  });
}
```

### Relevantní paměti pro konverzaci

```javascript
/**
 * Extrakce klíčových slov z konverzace a získání relevantních pamětí
 * 
 * @param {string} characterId - ID postavy
 * @param {Array} messages - Pole zpráv konverzace
 * @param {number} limit - Maximální počet pamětí k získání
 * @returns {Promise<Array>} - Relevantní paměti
 */
async getRelevantMemories(characterId, messages, limit = 5) {
  // Extrakce důležitých klíčových slov z posledních zpráv
  const recentMessages = messages.slice(-5);
  const userMessages = recentMessages.filter(m => m.sender === 'user');
  
  // Základní extrakce klíčových slov (může být vylepšena pomocí NLP)
  const text = userMessages.map(m => m.content).join(' ');
  const keywords = this._extractKeywords(text);
  
  // Získání pamětí relevantních k těmto klíčovým slovům
  const memories = await this.getMemories(characterId, {
    limit: limit * 2, // Získání více než potřebujeme pro filtrování
    tags: keywords
  });
  
  // Seřazení podle relevance a vrácení N nejlepších
  const scoredMemories = memories.map(memory => ({
    ...memory,
    relevance: this._calculateRelevance(memory, keywords)
  }));
  
  // Seřazení podle skóre relevance (vyšší je lepší)
  scoredMemories.sort((a, b) => b.relevance - a.relevance);
  
  // Aktualizace počtu přístupů pro získané paměti
  scoredMemories.slice(0, limit).forEach(memory => {
    this.updateMemoryAccess(memory.id).catch(console.error);
  });
  
  return scoredMemories.slice(0, limit);
}
```

### Extrakce klíčových slov a výpočet relevance

```javascript
/**
 * Základní funkce pro extrakci klíčových slov
 * Toto je jednoduchá implementace a může být vylepšena pomocí NLP
 * 
 * @param {string} text - Text, ze kterého se mají extrahovat klíčová slova
 * @returns {Array} - Seznam klíčových slov
 */
_extractKeywords(text) {
  // Převod na malá písmena a odstranění interpunkce
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
  
  // Rozdělení na slova
  const words = cleanText.split(/\s+/);
  
  // Filtrování běžných stop slov
  const stopWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by'];
  const filteredWords = words.filter(word => 
    word.length > 3 && !stopWords.includes(word)
  );
  
  // Počítání frekvence slov
  const wordCount = {};
  filteredWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Získání nejlepších klíčových slov
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1]) // Seřazení podle počtu
    .slice(0, 10) // Získání 10 nejlepších
    .map(entry => entry[0]); // Extrakce slova
}

/**
 * Výpočet skóre relevance pro paměť na základě klíčových slov
 * 
 * @param {object} memory - Objekt paměti
 * @param {Array} keywords - Seznam klíčových slov
 * @returns {number} - Skóre relevance
 */
_calculateRelevance(memory, keywords) {
  let score = 0;
  
  // Základní skóre z důležitosti
  score += memory.importance * 10;
  
  // Shoda klíčových slov v obsahu
  keywords.forEach(keyword => {
    if (memory.content.toLowerCase().includes(keyword)) {
      score += 10;
    }
  });
  
  // Shoda klíčových slov v tazích
  memory.tags.forEach(tag => {
    if (keywords.includes(tag)) {
      score += 15;
    }
  });
  
  // Faktor nedávnosti (nedávnější přístup = vyšší skóre)
  const lastAccessed = new Date(memory.last_accessed);
  const now = new Date();
  const daysSinceAccess = Math.floor((now - lastAccessed) / (1000 * 60 * 60 * 24));
  
  // Vyšší skóre pro nedávno přistupované paměti
  score += Math.max(0, 30 - daysSinceAccess);
  
  return score;
}
```

## Analýza konverzace pro nové paměti

```javascript
/**
 * Analýza konverzace pro potenciální nové paměti
 * 
 * @param {string} characterId - ID postavy
 * @param {Array} messages - Zprávy konverzace
 * @returns {Promise<Array>} - Navrhované nové paměti
 */
async analyzePotentialMemories(characterId, messages) {
  // Ideálně by to používalo sofistikovanější NLP,
  // ale pro jednoduchost se zaměříme na uživatelská prohlášení o preferencích
  const userMessages = messages.filter(m => m.sender === 'user');
  const potentialMemories = [];
  
  // Hledání vzorů preferencí
  const preferencePatterns = [
    /I (like|love|enjoy|prefer) (.+)/i,
    /My favorite (.+) is (.+)/i,
    /I (hate|dislike|don't like) (.+)/i
  ];
  
  userMessages.forEach(message => {
    preferencePatterns.forEach(pattern => {
      const match = message.content.match(pattern);
      if (match) {
        let type = 'preference';
        let content = '';
        
        // Formátování podle vzoru
        if (match[1].toLowerCase().match(/like|love|enjoy|prefer/)) {
          content = `User likes ${match[2].trim()}`;
        } else if (match[1].toLowerCase().match(/hate|dislike/)) {
          content = `User dislikes ${match[2].trim()}`;
        } else {
          content = `User's favorite ${match[1].trim()} is ${match[2].trim()}`;
        }
        
        potentialMemories.push({
          type,
          content,
          tags: ['preference', ...match[2].trim().split(/\s+/).filter(w => w.length > 3)]
        });
      }
    });
  });
  
  // Vzory pro osobní informace
  const infoPatterns = [
    /My name is (.+)/i,
    /I am (.+) years old/i,
    /I (work|live) in (.+)/i,
    /I am (a|an) (.+)/i
  ];
  
  userMessages.forEach(message => {
    infoPatterns.forEach(pattern => {
      const match = message.content.match(pattern);
      if (match) {
        let content = '';
        
        if (pattern.toString().includes('name')) {
          content = `User's name is ${match[1].trim()}`;
        } else if (pattern.toString().includes('years old')) {
          content = `User is ${match[1].trim()} years old`;
        } else if (pattern.toString().includes('work|live')) {
          content = `User ${match[1].toLowerCase()}s in ${match[2].trim()}`;
        } else if (pattern.toString().includes('a|an')) {
          content = `User is ${match[1].toLowerCase()} ${match[2].trim()}`;
        }
        
        potentialMemories.push({
          type: 'fact',
          content,
          tags: ['personal', 'user_info']
        });
      }
    });
  });
  
  return potentialMemories;
}
```

## Použití v kódu

```javascript
// Import a inicializace služby
const { MemoryService } = require('./memory-service');
const memoryService = new MemoryService(path.join(__dirname, 'database.sqlite'));

// Vytvoření nové paměti
const memory = await memoryService.createMemory(
  'character-123',
  'preference',
  'User likes chocolate ice cream',
  ['preference', 'food', 'ice cream', 'chocolate']
);

// Získání všech pamětí postavy
const memories = await memoryService.getMemories('character-123');

// Získání pamětí určitého typu
const preferences = await memoryService.getMemories('character-123', {
  type: 'preference'
});

// Získání pamětí podle tagů
const chocolateMemories = await memoryService.getMemories('character-123', {
  tags: ['chocolate']
});

// Získání relevantních pamětí pro konverzaci
const messages = [
  { sender: 'user', content: 'I really love chocolate cake.' },
  { sender: 'assistant', content: 'That sounds delicious!' }
];

const relevantMemories = await memoryService.getRelevantMemories(
  'character-123',
  messages
);

// Analýza konverzace pro potenciální nové paměti
const newMemories = await memoryService.analyzePotentialMemories(
  'character-123',
  messages
);

// Přidání navrhovaných pamětí
if (newMemories.length > 0) {
  for (const memoryData of newMemories) {
    await memoryService.createMemory(
      'character-123',
      memoryData.type,
      memoryData.content,
      memoryData.tags
    );
  }
}
```

## Optimalizace

MemoryService implementuje několik optimalizačních technik:

1. **Indexování tagů** - Umožňuje rychlé vyhledávání podle tagů
2. **Relevance scoring** - Prioritizuje důležité a kontextově relevantní paměti
3. **Sledování přístupů** - Sleduje, které paměti jsou často používány
4. **Extrakce klíčových slov** - Automaticky identifikuje důležitá slova v konverzaci

## Chybové stavy

Služba implementuje obsáhlé zpracování chyb:

1. Všechny databázové operace jsou obaleny v promises pro konzistentní zpracování chyb
2. Neexistující paměti nebo postavy jsou elegantně zpracovány
3. Neplatné vstupy jsou validovány před zpracováním

## Rozšiřitelnost

Memory Service může být rozšířena o:

1. Pokročilejší NLP pro lepší extrakci klíčových slov a analýzu konverzace
2. Vektorovou databázi pro sémantické vyhledávání místo tagů
3. Kontextově závislou důležitost - dynamické upravování důležitosti podle kontextu konverzace
4. Zapomínání - mechanismus pro snižování důležitosti starších a méně relevantních pamětí