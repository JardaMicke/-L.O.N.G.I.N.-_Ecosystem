# Achievement Service - Dokumentace

`achievement-service.js` poskytuje komplexní systém ocenění a sledování pokroku uživatelů v aplikaci. Tato služba spravuje achievementy, statistiky a notifikace o odemčených úspěších.

## Architektura

AchievementService je implementována jako třída, která komunikuje s SQLite databází. Služba používá pozorovatelský návrhový vzor (Observer pattern) pro informování ostatních částí aplikace o odemčených achievementech.

## Hlavní komponenty

### Inicializace databáze

```javascript
/**
 * Inicializace databázového schématu pro achievementy
 */
initializeDatabase() {
  this.db.serialize(() => {
    // Definice achievementů
    this.db.run(`CREATE TABLE IF NOT EXISTS achievement_definitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT,
      category TEXT,
      points INTEGER DEFAULT 10,
      secret INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Udělené achievementy
    this.db.run(`CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, achievement_id),
      FOREIGN KEY (achievement_id) REFERENCES achievement_definitions (id)
    )`);

    // Uživatelské statistiky
    this.db.run(`CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT NOT NULL,
      stat_name TEXT NOT NULL,
      stat_value INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, stat_name)
    )`);

    // Sledování použití funkcí
    this.db.run(`CREATE TABLE IF NOT EXISTS feature_usage (
      user_id TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      used_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, feature_name)
    )`);

    console.log('Achievement database initialized');
    
    // Inicializace výchozích achievementů
    this._initializeDefaultAchievements();
  });
}
```

### Správa achievementů

#### Definice achievementů

```javascript
/**
 * Přidá novou definici achievementu
 * 
 * @param {Object} achievement - Objekt definice achievementu
 * @returns {Promise<Object>} - Vytvořený achievement
 */
async addAchievementDefinition(achievement) {
  return new Promise((resolve, reject) => {
    const { id, name, description, icon, category, points, secret } = achievement;
    
    this.db.run(
      `INSERT OR REPLACE INTO achievement_definitions 
       (id, name, description, icon, category, points, secret) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description, icon, category, points || 10, secret ? 1 : 0],
      function(err) {
        if (err) return reject(err);
        resolve({ ...achievement, id: id || this.lastID });
      }
    );
  });
}

/**
 * Získá všechny definice achievementů
 * 
 * @param {boolean} includeSecret - Zahrnout tajné achievementy
 * @returns {Promise<Array>} - Seznam definic achievementů
 */
async getAchievementDefinitions(includeSecret = true) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM achievement_definitions';
    
    if (!includeSecret) {
      query += ' WHERE secret = 0';
    }
    
    this.db.all(query, (err, rows) => {
      if (err) return reject(err);
      
      // Konverze mezi SQLite a JS boolean
      const achievements = rows.map(row => ({
        ...row,
        secret: row.secret === 1
      }));
      
      resolve(achievements);
    });
  });
}
```

#### Udělování achievementů

```javascript
/**
 * Udělí achievement uživateli
 * 
 * @param {string} userId - ID uživatele
 * @param {string} achievementId - ID achievementu
 * @returns {Promise<Object>} - Detaily uděleného achievementu
 */
async awardAchievement(userId, achievementId) {
  // Kontrola, zda uživatel už achievement nemá
  const hasAchievement = await this._userHasAchievement(userId, achievementId);
  if (hasAchievement) {
    return null; // Uživatel již achievement má
  }
  
  // Získání detailů achievementu
  const achievement = await this._getAchievementById(achievementId);
  if (!achievement) {
    throw new Error(`Achievement ${achievementId} not found`);
  }
  
  return new Promise((resolve, reject) => {
    this.db.run(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
      [userId, achievementId],
      (err) => {
        if (err) return reject(err);
        
        // Vytvoření objektu události
        const event = {
          userId,
          achievement,
          timestamp: new Date().toISOString()
        };
        
        // Informování posluchačů
        this._notifyListeners(event);
        
        resolve(event);
      }
    );
  });
}

/**
 * Získá všechny achievementy uživatele
 * 
 * @param {string} userId - ID uživatele
 * @returns {Promise<Array>} - Seznam odemčených achievementů s jejich detaily
 */
async getAchievements(userId) {
  return new Promise((resolve, reject) => {
    this.db.all(
      `SELECT a.*, ua.unlocked_at
       FROM user_achievements ua
       JOIN achievement_definitions a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?
       ORDER BY ua.unlocked_at DESC`,
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        
        // Konverze mezi SQLite a JS boolean
        const achievements = rows.map(row => ({
          ...row,
          secret: row.secret === 1
        }));
        
        resolve(achievements);
      }
    );
  });
}
```

### Statistiky a pokrok

```javascript
/**
 * Aktualizuje statistiku uživatele
 * 
 * @param {string} userId - ID uživatele
 * @param {string} statName - Název statistiky
 * @param {number} increment - Hodnota inkrementu (může být negativní)
 * @param {boolean} checkAchievements - Kontrolovat achievementy založené na této statistice
 * @returns {Promise<Object>} - Aktualizovaná statistika
 */
async updateStat(userId, statName, increment = 1, checkAchievements = false) {
  return new Promise((resolve, reject) => {
    // Nejprve získat aktuální hodnotu
    this.db.get(
      'SELECT stat_value FROM user_stats WHERE user_id = ? AND stat_name = ?',
      [userId, statName],
      (err, row) => {
        if (err) return reject(err);
        
        const currentValue = row ? row.stat_value : 0;
        const newValue = currentValue + increment;
        
        // Aktualizovat nebo vložit novou hodnotu
        this.db.run(
          `INSERT OR REPLACE INTO user_stats 
           (user_id, stat_name, stat_value, last_updated) 
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [userId, statName, newValue],
          async (err) => {
            if (err) return reject(err);
            
            // Kontrola achievementů založených na statistikách
            if (checkAchievements) {
              await this._checkStatBasedAchievements(userId, statName, newValue);
            }
            
            resolve({
              userId,
              statName,
              value: newValue,
              previousValue: currentValue
            });
          }
        );
      }
    );
  });
}

/**
 * Získá statistiky uživatele
 * 
 * @param {string} userId - ID uživatele
 * @returns {Promise<Object>} - Objekt se statistikami uživatele
 */
async getUserStats(userId) {
  return new Promise((resolve, reject) => {
    this.db.all(
      'SELECT stat_name, stat_value FROM user_stats WHERE user_id = ?',
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        
        // Převést řádky na objekt pro snadnější použití
        const stats = {};
        rows.forEach(row => {
          stats[row.stat_name] = row.stat_value;
        });
        
        resolve(stats);
      }
    );
  });
}
```

### Kontrola achievementů

```javascript
/**
 * Kontroluje achievementy založené na statistikách
 * 
 * @param {string} userId - ID uživatele
 * @param {string} statName - Název statistiky
 * @param {number} value - Hodnota statistiky
 * @private
 */
async _checkStatBasedAchievements(userId, statName, value) {
  // Mapování statistik na achievementy a prahové hodnoty
  const statAchievements = {
    'messages': [
      { id: 'first_message', threshold: 1, name: 'First Contact' },
      { id: 'chatty', threshold: 100, name: 'Chatty' },
      { id: 'conversation_master', threshold: 1000, name: 'Conversation Master' }
    ],
    'characters_created': [
      { id: 'character_creator', threshold: 1, name: 'Character Creator' },
      { id: 'character_collector', threshold: 5, name: 'Character Collector' },
      { id: 'character_maestro', threshold: 20, name: 'Character Maestro' }
    ],
    'memories_added': [
      { id: 'first_memory', threshold: 1, name: 'First Memory' },
      { id: 'memory_keeper', threshold: 10, name: 'Memory Keeper' },
      { id: 'memory_bank', threshold: 50, name: 'Memory Bank' }
    ],
    'conversations': [
      { id: 'conversation_starter', threshold: 1, name: 'Conversation Starter' },
      { id: 'social_butterfly', threshold: 10, name: 'Social Butterfly' }
    ],
    'images_generated': [
      { id: 'first_image', threshold: 1, name: 'Picture Perfect' },
      { id: 'image_creator', threshold: 10, name: 'Image Creator' },
      { id: 'artist', threshold: 50, name: 'Digital Artist' }
    ]
  };
  
  // Kontrola achievementů pro tuto statistiku
  const achievementsToCheck = statAchievements[statName] || [];
  
  for (const achievementDef of achievementsToCheck) {
    if (value >= achievementDef.threshold) {
      try {
        // Pokusit se udělit achievement
        await this.awardAchievement(userId, achievementDef.id);
      } catch (error) {
        console.error(`Error awarding achievement ${achievementDef.id}:`, error);
      }
    }
  }
}

/**
 * Kontroluje achievementy založené na čase
 * 
 * @param {string} userId - ID uživatele
 */
async checkTimeBasedAchievements(userId) {
  try {
    // Zjistit, kdy uživatel použil aplikaci poprvé
    const firstUsage = await this._getFirstFeatureUsage(userId);
    
    if (!firstUsage) return;
    
    const now = new Date();
    const firstUseDate = new Date(firstUsage.used_at);
    const daysSinceFirstUse = Math.floor((now - firstUseDate) / (1000 * 60 * 60 * 24));
    
    // Achievementy za používání aplikace
    if (daysSinceFirstUse >= 7) {
      await this.awardAchievement(userId, 'one_week');
    }
    
    if (daysSinceFirstUse >= 30) {
      await this.awardAchievement(userId, 'one_month');
    }
  } catch (error) {
    console.error('Error checking time-based achievements:', error);
  }
}
```

### Sledování použití funkcí

```javascript
/**
 * Zaznamenává použití funkce
 * 
 * @param {string} userId - ID uživatele
 * @param {string} featureName - Název funkce
 * @returns {Promise<boolean>} - Úspěch
 */
async recordFeatureUsed(userId, featureName) {
  return new Promise((resolve, reject) => {
    this.db.run(
      `INSERT OR REPLACE INTO feature_usage 
       (user_id, feature_name, used_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [userId, featureName],
      async (err) => {
        if (err) return reject(err);
        
        try {
          // Kontrola achievementů za první použití funkcí
          if (featureName === 'chat') {
            await this.awardAchievement(userId, 'first_chat');
          } else if (featureName === 'memory') {
            await this.awardAchievement(userId, 'memory_explorer');
          } else if (featureName === 'voice') {
            await this.awardAchievement(userId, 'voice_activated');
          } else if (featureName === 'image') {
            await this.awardAchievement(userId, 'image_wizard');
          } else if (featureName === 'roleplay') {
            await this.awardAchievement(userId, 'roleplay_beginner');
          }
          
          // Kontrola achievementu "Explorer" za použití všech funkcí
          await this._checkExplorerAchievement(userId);
        } catch (error) {
          console.error('Error checking feature achievements:', error);
        }
        
        resolve(true);
      }
    );
  });
}
```

## Listeners pro notifikace

```javascript
/**
 * Registruje posluchače událostí achievementů
 * 
 * @param {Function} listener - Funkce, která bude volána při udělení achievementu
 */
registerListener(listener) {
  this.listeners.push(listener);
}

/**
 * Odregistruje posluchače událostí achievementů
 * 
 * @param {Function} listener - Funkce k odregistrování
 */
unregisterListener(listener) {
  this.listeners = this.listeners.filter(l => l !== listener);
}

/**
 * Informuje všechny posluchače o události
 * 
 * @param {Object} event - Událost achievementu
 * @private
 */
_notifyListeners(event) {
  this.listeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in achievement listener:', error);
    }
  });
}
```

## Použití v kódu

```javascript
// Import a inicializace služby
const { AchievementService } = require('./achievement-service');
const achievementService = new AchievementService(path.join(__dirname, 'database.sqlite'));

// Registrace posluchače pro notifikace o odemčených achievementech
achievementService.registerListener((event) => {
  console.log(`Achievement unlocked: ${event.achievement.name}`);
  io.emit('achievement-unlocked', {
    userId: event.userId,
    achievement: event.achievement,
    timestamp: event.timestamp
  });
});

// Aktualizace statistik
await achievementService.updateStat('user-123', 'messages', 1, true);

// Zaznamenání použití funkce
await achievementService.recordFeatureUsed('user-123', 'chat');

// Kontrola časových achievementů
await achievementService.checkTimeBasedAchievements('user-123');

// Získání statistik uživatele
const stats = await achievementService.getUserStats('user-123');
console.log(stats);

// Získání odemčených achievementů
const achievements = await achievementService.getAchievements('user-123');
console.log(achievements);
```

## Výchozí achievementy

Služba definuje sadu výchozích achievementů rozdělených do kategorií:

1. **Postavy (Characters)**
   - Character Creator - Vytvoření první postavy
   - Character Collector - Vytvoření 5 postav
   - Character Maestro - Vytvoření 20 postav

2. **Konverzace (Conversations)**
   - First Contact - Odeslání první zprávy
   - Chatty - Odeslání 100 zpráv
   - Conversation Master - Odeslání 1000 zpráv
   - Conversation Starter - Zahájení první konverzace
   - Social Butterfly - Zahájení 10 konverzací

3. **Paměť (Memory)**
   - First Memory - Přidání první paměti
   - Memory Keeper - Přidání 10 pamětí
   - Memory Bank - Přidání 50 pamětí
   - Memory Explorer - První použití funkce paměti

4. **Multimédia (Multimedia)**
   - Voice Activated - První použití hlasové funkce
   - Picture Perfect - První vygenerování obrázku
   - Image Creator - Vygenerování 10 obrázků
   - Digital Artist - Vygenerování 50 obrázků

5. **Loajalita (Loyalty)**
   - One Week - Používání aplikace po dobu 1 týdne
   - One Month - Používání aplikace po dobu 1 měsíce

6. **Průzkumník (Explorer)**
   - Explorer - Použití všech hlavních funkcí aplikace

## Optimalizace

Služba implementuje tyto optimalizační techniky:

1. **Indexované dotazy** - Efektivní vyhledávání v achievementech a statistikách
2. **Dávkové kontroly** - Kontrola achievementů v jedné transakci
3. **Podmíněné kontroly** - Kontrola achievementů pouze když je to potřeba

## Chybové stavy

AchievementService řeší tyto chybové stavy:

1. Chyby při inicializaci databáze
2. Chyby při udělování achievementů
3. Chyby v posluchačích událostí
4. Neexistující achievementy nebo statistiky

## Rozšiřitelnost

Služba může být rozšířena o:

1. Více kategorií achievementů
2. Pokročilejší podmínky pro achievementy (kombinace více statistik)
3. Časově omezené achievementy (sezónní achievementy)
4. Systém úrovní a bodů zkušeností