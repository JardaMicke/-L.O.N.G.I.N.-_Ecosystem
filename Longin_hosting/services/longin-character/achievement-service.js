/**
 * Služba pro práci s úspěchy (achievements)
 * Zpracovává odemykání a sledování úspěchů uživatelů
 */
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

class AchievementService {
  /**
   * Vytvoří novou instanci služby pro práci s úspěchy
   * @param {string} dbPath - Cesta k SQLite databázi
   */
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
    this.initDatabase();
    this.achievementDefinitions = this.getAchievementDefinitions();
  }

  /**
   * Inicializuje databázové tabulky pro úspěchy
   */
  initDatabase() {
    this.db.serialize(() => {
      // Vytvoření tabulky pro úspěchy uživatelů
      this.db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Vytvoření tabulky pro statistiky uživatelů
      this.db.run(`CREATE TABLE IF NOT EXISTS user_stats (
        user_id TEXT PRIMARY KEY,
        messages_sent INTEGER DEFAULT 0,
        conversations_started INTEGER DEFAULT 0,
        characters_created INTEGER DEFAULT 0,
        days_active INTEGER DEFAULT 0,
        last_active_date TEXT,
        stories_generated INTEGER DEFAULT 0,
        images_uploaded INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Vytvoření indexů pro rychlejší vyhledávání
      this.db.run('CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id)');
      this.db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_unique ON achievements(user_id, achievement_id)');
    });
  }

  /**
   * Definuje všechny dostupné úspěchy v aplikaci
   * @returns {Object} - Seznam všech úspěchů
   */
  getAchievementDefinitions() {
    return {
      // Úspěchy pro konverzace
      FIRST_CONVERSATION: {
        id: 'FIRST_CONVERSATION',
        name: 'První krok',
        description: 'Zahájili jste svou první konverzaci',
        icon: 'chat',
        points: 10
      },
      CONVERSATION_MASTER: {
        id: 'CONVERSATION_MASTER',
        name: 'Mistr konverzace',
        description: 'Odeslali jste 100 zpráv',
        icon: 'chat_bubble',
        points: 50,
        condition: (stats) => stats.messages_sent >= 100
      },
      CONVERSATION_GRANDMASTER: {
        id: 'CONVERSATION_GRANDMASTER',
        name: 'Velmistr konverzace',
        description: 'Odeslali jste 1000 zpráv',
        icon: 'forum',
        points: 200,
        condition: (stats) => stats.messages_sent >= 1000
      },

      // Úspěchy pro postavy
      FIRST_CHARACTER: {
        id: 'FIRST_CHARACTER',
        name: 'Tvůrce postav',
        description: 'Vytvořili jste svou první postavu',
        icon: 'person_add',
        points: 20
      },
      CHARACTER_COLLECTOR: {
        id: 'CHARACTER_COLLECTOR',
        name: 'Sběratel postav',
        description: 'Vytvořili jste 5 různých postav',
        icon: 'people',
        points: 50,
        condition: (stats) => stats.characters_created >= 5
      },
      CHARACTER_MAESTRO: {
        id: 'CHARACTER_MAESTRO',
        name: 'Maestro postav',
        description: 'Vytvořili jste 10 různých postav',
        icon: 'diversity_3',
        points: 100,
        condition: (stats) => stats.characters_created >= 10
      },

      // Úspěchy pro aktivitu
      WEEKLY_ACTIVE: {
        id: 'WEEKLY_ACTIVE',
        name: 'Týdenní návštěvník',
        description: 'Byli jste aktivní 7 dní',
        icon: 'calendar_month',
        points: 30,
        condition: (stats) => stats.days_active >= 7
      },
      MONTHLY_ACTIVE: {
        id: 'MONTHLY_ACTIVE',
        name: 'Měsíční návštěvník',
        description: 'Byli jste aktivní 30 dní',
        icon: 'event_available',
        points: 100,
        condition: (stats) => stats.days_active >= 30
      },

      // Úspěchy pro příběhy
      STORYTELLER: {
        id: 'STORYTELLER',
        name: 'Vypravěč',
        description: 'Vygenerovali jste svůj první příběh',
        icon: 'auto_stories',
        points: 20
      },
      STORY_MASTER: {
        id: 'STORY_MASTER',
        name: 'Mistr příběhů',
        description: 'Vygenerovali jste 10 příběhů',
        icon: 'menu_book',
        points: 50,
        condition: (stats) => stats.stories_generated >= 10
      },

      // Úspěchy pro obrázky
      FIRST_IMAGE: {
        id: 'FIRST_IMAGE',
        name: 'Fotograf',
        description: 'Nahráli jste svůj první obrázek',
        icon: 'add_photo_alternate',
        points: 10
      },
      IMAGE_COLLECTOR: {
        id: 'IMAGE_COLLECTOR',
        name: 'Sběratel obrázků',
        description: 'Nahráli jste 10 obrázků',
        icon: 'collections',
        points: 30,
        condition: (stats) => stats.images_uploaded >= 10
      }
    };
  }

  /**
   * Odemkne úspěch pro uživatele
   * @param {string} userId - ID uživatele
   * @param {string} achievementId - ID úspěchu
   * @returns {Promise<object|null>} - Informace o odemčeném úspěchu nebo null, pokud už byl odemčen
   */
  async unlockAchievement(userId, achievementId) {
    const achievement = this.achievementDefinitions[achievementId];
    
    if (!achievement) {
      throw new Error(`Neplatné ID úspěchu: ${achievementId}`);
    }

    return new Promise((resolve, reject) => {
      // Nejprve zkontrolujeme, zda uživatel již tento úspěch nemá
      this.db.get(
        'SELECT * FROM achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievementId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            // Úspěch již byl odemčen
            resolve(null);
            return;
          }

          const now = Date.now();
          const id = uuidv4();

          this.db.run(
            'INSERT INTO achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)',
            [id, userId, achievementId, now],
            (err) => {
              if (err) {
                reject(err);
                return;
              }

              resolve({
                id,
                userId,
                achievementId,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                points: achievement.points,
                unlockedAt: now
              });
            }
          );
        }
      );
    });
  }

  /**
   * Získá všechny úspěchy uživatele
   * @param {string} userId - ID uživatele
   * @returns {Promise<Array>} - Seznam odemčených úspěchů
   */
  async getUserAchievements(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          const achievements = rows.map(row => {
            const achievementDef = this.achievementDefinitions[row.achievement_id] || {
              name: 'Neznámý úspěch',
              description: 'Tento úspěch již není dostupný',
              icon: 'help',
              points: 0
            };

            return {
              id: row.id,
              userId: row.user_id,
              achievementId: row.achievement_id,
              name: achievementDef.name,
              description: achievementDef.description,
              icon: achievementDef.icon,
              points: achievementDef.points,
              unlockedAt: row.unlocked_at
            };
          });

          resolve(achievements);
        }
      );
    });
  }

  /**
   * Zkontroluje a aktualizuje statistiky uživatele
   * @param {string} userId - ID uživatele
   * @param {object} statsUpdate - Aktualizace statistik
   * @returns {Promise<object>} - Aktualizované statistiky
   */
  async updateUserStats(userId, statsUpdate) {
    return new Promise((resolve, reject) => {
      // Nejprve zkontrolujeme, zda uživatel již má záznam statistik
      this.db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const now = new Date().toISOString().split('T')[0]; // Aktuální datum ve formátu YYYY-MM-DD
        let updates = [];
        let params = [];

        // Vytvoření aktualizačních příkazů podle poskytnutých statistik
        Object.entries(statsUpdate).forEach(([key, value]) => {
          if (key in statsUpdate) {
            updates.push(`${key} = ${key} + ?`);
            params.push(value);
          }
        });

        // Přidání aktualizace posledního aktivního dne
        updates.push('last_active_date = ?');
        params.push(now);

        // Aktualizace počtu aktivních dnů, pokud je to nový den
        if (row && row.last_active_date !== now) {
          updates.push('days_active = days_active + 1');
        } else if (!row) {
          // Pokud záznam neexistuje, nastavíme days_active na 1
          updates.push('days_active = 1');
        }

        params.push(userId);

        if (row) {
          // Aktualizace existujícího záznamu
          this.db.run(
            `UPDATE user_stats SET ${updates.join(', ')} WHERE user_id = ?`,
            params,
            function(err) {
              if (err) {
                reject(err);
                return;
              }

              // Získání aktualizovaných statistik
              this.db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId], (err, updatedRow) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve(updatedRow);
              });
            }.bind(this)
          );
        } else {
          // Vytvoření nového záznamu
          const initialStats = {
            user_id: userId,
            messages_sent: 0,
            conversations_started: 0,
            characters_created: 0,
            days_active: 1,
            last_active_date: now,
            stories_generated: 0,
            images_uploaded: 0
          };

          // Aktualizace počátečních hodnot podle poskytnutých statistik
          Object.entries(statsUpdate).forEach(([key, value]) => {
            if (key in initialStats) {
              initialStats[key] = value;
            }
          });

          const columns = Object.keys(initialStats).join(', ');
          const placeholders = Object.keys(initialStats).map(() => '?').join(', ');
          const values = Object.values(initialStats);

          this.db.run(
            `INSERT INTO user_stats (${columns}) VALUES (${placeholders})`,
            values,
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              resolve(initialStats);
            }
          );
        }
      });
    });
  }

  /**
   * Získá statistiky uživatele
   * @param {string} userId - ID uživatele
   * @returns {Promise<object>} - Statistiky uživatele
   */
  async getUserStats(userId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          // Pokud uživatel nemá záznam, vytvoříme základní statistiky
          const initialStats = {
            user_id: userId,
            messages_sent: 0,
            conversations_started: 0,
            characters_created: 0,
            days_active: 0,
            last_active_date: null,
            stories_generated: 0,
            images_uploaded: 0
          };

          resolve(initialStats);
          return;
        }

        resolve(row);
      });
    });
  }

  /**
   * Zkontroluje nové úspěchy, které by uživatel mohl odemknout
   * @param {string} userId - ID uživatele
   * @returns {Promise<Array>} - Seznam nově odemčených úspěchů
   */
  async checkForNewAchievements(userId) {
    // Získání aktuálních statistik uživatele
    const stats = await this.getUserStats(userId);
    
    // Získání již odemčených úspěchů
    const existingAchievements = await this.getUserAchievements(userId);
    const unlockedIds = existingAchievements.map(a => a.achievementId);
    
    // Seznam nově odemčených úspěchů
    const newAchievements = [];
    
    // Procházení všech definic úspěchů a kontrola podmínek
    for (const [achievementId, achievement] of Object.entries(this.achievementDefinitions)) {
      // Přeskočení již odemčených úspěchů
      if (unlockedIds.includes(achievementId)) {
        continue;
      }
      
      // Kontrola, zda uživatel splňuje podmínky pro odemčení
      if (!achievement.condition || achievement.condition(stats)) {
        const unlocked = await this.unlockAchievement(userId, achievementId);
        if (unlocked) {
          newAchievements.push(unlocked);
        }
      }
    }
    
    return newAchievements;
  }

  /**
   * Zavře připojení k databázi
   */
  close() {
    this.db.close();
  }
}

module.exports = { AchievementService };