/**
 * Motor pro generování příběhů
 * Umožňuje generovat interaktivní příběhy na základě uživatelských vstupů
 */
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const modelService = require('./model-service');

class StoryEngine {
  /**
   * Vytvoří novou instanci motoru pro generování příběhů
   * @param {string} dbPath - Cesta k SQLite databázi
   * @param {object} memoryService - Instance MemoryService pro ukládání příběhů
   */
  constructor(dbPath, memoryService) {
    this.db = new sqlite3.Database(dbPath);
    this.memoryService = memoryService;
    this.initDatabase();
  }

  /**
   * Inicializuje databázové tabulky pro příběhy
   */
  initDatabase() {
    this.db.serialize(() => {
      // Vytvoření tabulky pro příběhy
      this.db.run(`CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        length TEXT NOT NULL,
        genre TEXT,
        is_public BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (character_id) REFERENCES characters(id)
      )`);

      // Vytvoření tabulky pro kapitoly příběhu
      this.db.run(`CREATE TABLE IF NOT EXISTS story_chapters (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (story_id) REFERENCES stories(id)
      )`);

      // Vytvoření tabulky pro zpětnou vazbu k příběhům
      this.db.run(`CREATE TABLE IF NOT EXISTS story_feedback (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (story_id) REFERENCES stories(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Vytvoření indexů pro rychlejší vyhledávání
      this.db.run('CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_stories_character ON stories(character_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_story_chapters_story ON story_chapters(story_id)');
    });
  }

  /**
   * Generuje nový příběh na základě promptu
   * @param {string} prompt - Vstupní prompt pro příběh
   * @param {object} options - Možnosti pro generování
   * @returns {Promise<object>} - Vygenerovaný příběh
   */
  async generateStory(prompt, options = {}) {
    const {
      userId,
      characterId = null,
      length = 'medium',
      genre = null
    } = options;

    try {
      // Sestavení kontextu pro generování příběhu
      let storyContext = '';
      
      // Různé délky příběhu
      const lengthGuide = {
        short: 'Vygeneruj krátký příběh o délce přibližně 300-500 slov.',
        medium: 'Vygeneruj středně dlouhý příběh o délce přibližně 800-1200 slov.',
        long: 'Vygeneruj delší příběh o délce přibližně 2000-3000 slov.'
      };

      storyContext += `${lengthGuide[length] || lengthGuide.medium} `;
      
      // Přidání žánru, pokud je specifikován
      if (genre) {
        storyContext += `Příběh by měl být v žánru ${genre}. `;
      }
      
      // Základní instrukce pro příběh
      storyContext += `Vytvoř poutavý příběh na základě následujícího zadání. Příběh by měl mít jasný začátek, střed a konec. Používej bohatý popis prostředí, postav a děje. Používej přímou řeč pro dialogy postav. Zaměř se na rozvoj postav a zajímavou zápletku.\n\n`;
      
      // Pokud je k dispozici postava, přidejte ji do kontextu
      if (characterId) {
        // Získání informací o postavě
        const character = await this.getCharacter(characterId);
        
        if (character) {
          storyContext += `Hlavní postavou příběhu je ${character.name}. `;
          storyContext += `Charakter této postavy je: ${character.personality}. `;
          
          if (character.appearance) {
            storyContext += `Vzhled této postavy je: ${character.appearance}. `;
          }
          
          // Získání vzpomínek pro lepší kontext
          const memories = await this.memoryService.getMemoriesForCharacter(userId, characterId, { limit: 5 });
          
          if (memories && memories.length > 0) {
            storyContext += `Zde jsou některé předchozí interakce s touto postavou pro kontext:\n`;
            
            memories.forEach(memory => {
              storyContext += `- Uživatel: "${memory.userMessage}"\n`;
              storyContext += `- ${character.name}: "${memory.characterResponse}"\n\n`;
            });
          }
        }
      }
      
      // Přidání uživatelského promptu
      storyContext += `Zadání příběhu: ${prompt}\n\n`;
      storyContext += `Začni psát příběh:`;
      
      // Generování příběhu pomocí AI modelu
      const storyContent = await modelService.generateResponse(storyContext, {
        maxTokens: length === 'short' ? 1000 : (length === 'medium' ? 2000 : 3000),
        temperature: 0.8
      });
      
      // Generování názvu příběhu
      const titlePrompt = `Na základě následujícího příběhu vytvoř krátký a poutavý název (maximálně 5-7 slov):\n\n${storyContent.substring(0, 1000)}\n\nNázev:`;
      
      const title = await modelService.generateResponse(titlePrompt, {
        maxTokens: 30,
        temperature: 0.7
      });
      
      // Uložení příběhu do databáze
      const storyId = uuidv4();
      const now = Date.now();
      
      await new Promise((resolve, reject) => {
        this.db.run(
          'INSERT INTO stories (id, user_id, character_id, title, prompt, content, created_at, updated_at, length, genre, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [storyId, userId, characterId, title.trim(), prompt, storyContent, now, now, length, genre, 0],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
      
      // Aktualizace statistik uživatele
      try {
        this.db.run(
          'UPDATE user_stats SET stories_generated = stories_generated + 1 WHERE user_id = ?',
          [userId]
        );
      } catch (error) {
        console.warn('Nepodařilo se aktualizovat statistiky uživatele:', error);
      }
      
      return {
        id: storyId,
        userId,
        characterId,
        title: title.trim(),
        prompt,
        content: storyContent,
        createdAt: now,
        updatedAt: now,
        length,
        genre
      };
    } catch (error) {
      console.error('Chyba při generování příběhu:', error);
      throw new Error('Nepodařilo se vygenerovat příběh');
    }
  }

  /**
   * Získá příběh podle ID
   * @param {string} storyId - ID příběhu
   * @returns {Promise<object>} - Příběh
   */
  async getStory(storyId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM stories WHERE id = ?', [storyId], (err, story) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!story) {
          resolve(null);
          return;
        }
        
        // Získání kapitol příběhu, pokud existují
        this.db.all(
          'SELECT * FROM story_chapters WHERE story_id = ? ORDER BY chapter_number ASC',
          [storyId],
          (err, chapters) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              id: story.id,
              userId: story.user_id,
              characterId: story.character_id,
              title: story.title,
              prompt: story.prompt,
              content: story.content,
              createdAt: story.created_at,
              updatedAt: story.updated_at,
              length: story.length,
              genre: story.genre,
              isPublic: story.is_public === 1,
              chapters: chapters.map(chapter => ({
                id: chapter.id,
                storyId: chapter.story_id,
                title: chapter.title,
                content: chapter.content,
                chapterNumber: chapter.chapter_number,
                createdAt: chapter.created_at
              }))
            });
          }
        );
      });
    });
  }

  /**
   * Získá seznam příběhů uživatele
   * @param {string} userId - ID uživatele
   * @returns {Promise<Array>} - Seznam příběhů
   */
  async getUserStories(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM stories WHERE user_id = ? ORDER BY updated_at DESC',
        [userId],
        (err, stories) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(stories.map(story => ({
            id: story.id,
            userId: story.user_id,
            characterId: story.character_id,
            title: story.title,
            prompt: story.prompt,
            summary: this.generateSummary(story.content),
            createdAt: story.created_at,
            updatedAt: story.updated_at,
            length: story.length,
            genre: story.genre,
            isPublic: story.is_public === 1
          })));
        }
      );
    });
  }

  /**
   * Generuje pokračování příběhu
   * @param {string} storyId - ID příběhu
   * @param {string} prompt - Vstupní prompt pro pokračování
   * @returns {Promise<object>} - Nová kapitola příběhu
   */
  async generateContinuation(storyId, prompt) {
    try {
      const story = await this.getStory(storyId);
      
      if (!story) {
        throw new Error('Příběh nebyl nalezen');
      }
      
      // Získání poslední kapitoly nebo hlavního obsahu
      let lastContent = '';
      
      if (story.chapters && story.chapters.length > 0) {
        const lastChapter = story.chapters[story.chapters.length - 1];
        lastContent = lastChapter.content;
      } else {
        lastContent = story.content;
      }
      
      // Sestavení kontextu pro generování pokračování
      const continuationContext = `Následující text je část existujícího příběhu. Napiš pokračování tohoto příběhu na základě zadání. Pokračování by mělo navazovat na poslední událost v příběhu a rozvíjet zápletku dále. Používej stejný styl a atmosféru jako původní příběh.

Název příběhu: ${story.title}
Původní zadání: ${story.prompt}

Poslední část příběhu:
${lastContent.substring(lastContent.length - 1000)}

Nové zadání pro pokračování: ${prompt}

Pokračování příběhu:`;
      
      // Generování pokračování
      const continuationContent = await modelService.generateResponse(continuationContext, {
        maxTokens: 2000,
        temperature: 0.8
      });
      
      // Generování názvu kapitoly
      const titlePrompt = `Na základě následujícího textu vytvoř krátký a výstižný název kapitoly (maximálně 5-7 slov):\n\n${continuationContent.substring(0, 1000)}\n\nNázev kapitoly:`;
      
      const chapterTitle = await modelService.generateResponse(titlePrompt, {
        maxTokens: 30,
        temperature: 0.7
      });
      
      // Uložení nové kapitoly
      const chapterId = uuidv4();
      const now = Date.now();
      const chapterNumber = story.chapters ? story.chapters.length + 1 : 1;
      
      await new Promise((resolve, reject) => {
        this.db.run(
          'INSERT INTO story_chapters (id, story_id, title, content, chapter_number, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [chapterId, storyId, chapterTitle.trim(), continuationContent, chapterNumber, now],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
      
      // Aktualizace času poslední úpravy příběhu
      this.db.run('UPDATE stories SET updated_at = ? WHERE id = ?', [now, storyId]);
      
      return {
        id: chapterId,
        storyId,
        title: chapterTitle.trim(),
        content: continuationContent,
        chapterNumber,
        createdAt: now
      };
    } catch (error) {
      console.error('Chyba při generování pokračování příběhu:', error);
      throw new Error('Nepodařilo se vygenerovat pokračování příběhu');
    }
  }

  /**
   * Přidá zpětnou vazbu k příběhu
   * @param {string} storyId - ID příběhu
   * @param {string} userId - ID uživatele
   * @param {number} rating - Hodnocení (1-5)
   * @param {string} comment - Komentář
   * @returns {Promise<object>} - Přidaná zpětná vazba
   */
  async addFeedback(storyId, userId, rating, comment = null) {
    if (rating < 1 || rating > 5) {
      throw new Error('Hodnocení musí být v rozmezí 1-5');
    }
    
    return new Promise((resolve, reject) => {
      // Nejprve zkontrolujeme, zda uživatel již nepřidal zpětnou vazbu
      this.db.get(
        'SELECT * FROM story_feedback WHERE story_id = ? AND user_id = ?',
        [storyId, userId],
        (err, existingFeedback) => {
          if (err) {
            reject(err);
            return;
          }
          
          const feedbackId = existingFeedback ? existingFeedback.id : uuidv4();
          const now = Date.now();
          
          if (existingFeedback) {
            // Aktualizace existující zpětné vazby
            this.db.run(
              'UPDATE story_feedback SET rating = ?, comment = ?, created_at = ? WHERE id = ?',
              [rating, comment, now, feedbackId],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                
                resolve({
                  id: feedbackId,
                  storyId,
                  userId,
                  rating,
                  comment,
                  createdAt: now
                });
              }
            );
          } else {
            // Vytvoření nové zpětné vazby
            this.db.run(
              'INSERT INTO story_feedback (id, story_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
              [feedbackId, storyId, userId, rating, comment, now],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                
                resolve({
                  id: feedbackId,
                  storyId,
                  userId,
                  rating,
                  comment,
                  createdAt: now
                });
              }
            );
          }
        }
      );
    });
  }

  /**
   * Získá informace o postavě
   * @param {string} characterId - ID postavy
   * @returns {Promise<object>} - Informace o postavě
   */
  async getCharacter(characterId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM characters WHERE id = ?', [characterId], (err, character) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!character) {
          resolve(null);
          return;
        }
        
        resolve({
          id: character.id,
          userId: character.user_id,
          name: character.name,
          personality: character.personality,
          appearance: character.appearance,
          voiceId: character.voice_id
        });
      });
    });
  }

  /**
   * Vygeneruje krátké shrnutí příběhu
   * @param {string} content - Obsah příběhu
   * @returns {string} - Krátké shrnutí
   */
  generateSummary(content) {
    if (!content) return '';
    
    // Jednoduchá implementace - vrátí prvních 200 znaků
    let summary = content.substring(0, 200).trim();
    
    // Přidání trojtečky, pokud je text zkrácen
    if (content.length > 200) {
      summary += '...';
    }
    
    return summary;
  }

  /**
   * Změní viditelnost příběhu (veřejný/soukromý)
   * @param {string} storyId - ID příběhu
   * @param {boolean} isPublic - Příznak veřejného příběhu
   * @returns {Promise<boolean>} - True, pokud byla změna úspěšná
   */
  async setStoryVisibility(storyId, isPublic) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE stories SET is_public = ? WHERE id = ?',
        [isPublic ? 1 : 0, storyId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Získá seznam veřejných příběhů
   * @param {object} options - Možnosti pro filtrování a stránkování
   * @returns {Promise<Array>} - Seznam veřejných příběhů
   */
  async getPublicStories(options = {}) {
    const {
      limit = 10,
      offset = 0,
      genre = null,
      sortBy = 'updated_at',
      sortOrder = 'DESC'
    } = options;
    
    let query = 'SELECT * FROM stories WHERE is_public = 1';
    const params = [];
    
    if (genre) {
      query += ' AND genre = ?';
      params.push(genre);
    }
    
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, stories) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(stories.map(story => ({
          id: story.id,
          userId: story.user_id,
          characterId: story.character_id,
          title: story.title,
          prompt: story.prompt,
          summary: this.generateSummary(story.content),
          createdAt: story.created_at,
          updatedAt: story.updated_at,
          length: story.length,
          genre: story.genre
        })));
      });
    });
  }

  /**
   * Zavře připojení k databázi
   */
  close() {
    this.db.close();
  }
}

module.exports = StoryEngine;