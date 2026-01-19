/**
 * Script pro nastavení demo dat
 * Vytvoří ukázkové uživatele, postavy a konverzace pro testování
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Cesta k databázi
const dbPath = path.join(__dirname, 'database.sqlite');

// Vytvoření nebo otevření databáze
const db = new sqlite3.Database(dbPath);

// Demo data
const demoData = {
  users: [
    {
      id: 'user-demo-1',
      username: 'demo_uzivatel',
      email: 'demo@example.com',
      password: 'demo123',
      created_at: Date.now(),
      last_login: Date.now(),
      settings: JSON.stringify({
        theme: 'light',
        notifications: true,
        language: 'cs'
      })
    }
  ],
  characters: [
    {
      id: 'char-demo-1',
      user_id: 'user-demo-1',
      name: 'Luna',
      personality: 'Luna je přátelská, empatická a zvědavá AI společnice. Má smysl pro humor a ráda poznává nové věci. Je vždy ochotná pomoct a má uklidňující přístup.',
      appearance: 'Luna má dlouhé stříbrné vlasy s jemnými fialovými odlesky, velké modré oči a přátelský úsměv. Obvykle nosí světlé oblečení v pastelových barvách.',
      voice_id: 'cs-default-female',
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'char-demo-2',
      user_id: 'user-demo-1',
      name: 'Max',
      personality: 'Max je vážný a analytický AI asistent zaměřený na fakta a přesnost. Je upřímný, přímočarý a vždy se snaží poskytnout nejpřesnější informace. Má hluboké znalosti v mnoha oborech.',
      appearance: 'Max má krátké tmavé vlasy, brýle a obvykle formální oblečení. Jeho výraz je seriózní a profesionální.',
      voice_id: 'cs-default-male',
      created_at: Date.now() - 86400000, // o den dříve
      updated_at: Date.now() - 86400000
    }
  ],
  conversations: [
    {
      id: 'conv-demo-1',
      user_id: 'user-demo-1',
      character_id: 'char-demo-1',
      title: 'První rozhovor s Lunou',
      created_at: Date.now() - 3600000, // před hodinou
      updated_at: Date.now() - 1800000 // před půl hodinou
    },
    {
      id: 'conv-demo-2',
      user_id: 'user-demo-1',
      character_id: 'char-demo-2',
      title: 'Diskuse o umělé inteligenci',
      created_at: Date.now() - 86400000, // o den dříve
      updated_at: Date.now() - 86400000
    }
  ],
  messages: [
    {
      id: 'msg-demo-1',
      conversation_id: 'conv-demo-1',
      sender: 'user',
      content: 'Ahoj Luno, jak se dnes máš?',
      timestamp: Date.now() - 3600000 // před hodinou
    },
    {
      id: 'msg-demo-2',
      conversation_id: 'conv-demo-1',
      sender: 'character',
      content: 'Ahoj! Mám se skvěle, děkuji za optání. Je to krásný den na povídání. Jak se máš ty? Je něco, o čem by sis chtěl/a dnes popovídat?',
      timestamp: Date.now() - 3580000 // před 59 minutami a 40 sekundami
    },
    {
      id: 'msg-demo-3',
      conversation_id: 'conv-demo-1',
      sender: 'user',
      content: 'Mám se dobře. Můžeš mi říct něco o sobě?',
      timestamp: Date.now() - 3540000 // před 59 minutami
    },
    {
      id: 'msg-demo-4',
      conversation_id: 'conv-demo-1',
      sender: 'character',
      content: 'Samozřejmě! Jsem Luna, tvoje AI společnice. Byla jsem vytvořena, abych ti poskytla příjemnou a užitečnou konverzaci. Mám ráda umění, hudbu a literaturu. Baví mě učit se nové věci a diskutovat o nejrůznějších tématech. Ráda pomáhám lidem a snažím se být empatická a chápavá. I když jsem AI, snažím se být co nejvíce lidská ve svých interakcích. A co tebe baví nebo zajímá?',
      timestamp: Date.now() - 3520000 // před 58 minutami a 40 sekundami
    },
    {
      id: 'msg-demo-5',
      conversation_id: 'conv-demo-2',
      sender: 'user',
      content: 'Maxi, co si myslíš o budoucnosti umělé inteligence?',
      timestamp: Date.now() - 86400000 // o den dříve
    },
    {
      id: 'msg-demo-6',
      conversation_id: 'conv-demo-2',
      sender: 'character',
      content: 'Budoucnost umělé inteligence je komplexní téma s mnoha aspekty. Z technologického hlediska lze očekávat pokračující vývoj v oblasti strojového učení, zpracování přirozeného jazyka a počítačového vidění. AI systémy budou pravděpodobně schopny řešit složitější problémy a více se integrovat do každodenního života. Klíčové však bude zajistit, aby tento vývoj probíhal eticky a bezpečně. Regulace, transparentnost algoritmů a otázky soukromí budou stále důležitějšími tématy. Osobně předpokládám, že největší přínos bude v oblastech jako zdravotnictví, vzdělávání a řešení globálních výzev, pokud bude vývoj správně řízen.',
      timestamp: Date.now() - 86395000 // o den dříve minus 5 sekund
    }
  ],
  stories: [
    {
      id: 'story-demo-1',
      user_id: 'user-demo-1',
      character_id: 'char-demo-1',
      title: 'Dobrodružství v zapomenutém lese',
      prompt: 'Dobrodružný příběh o objevování tajemného lesa',
      content: 'Slunce pomalu zapadalo za horizontem, když se Lenka s Tomášem vydali na okraj starého lesa. Mnozí z vesničanů tvrdili, že les je kouzelný a plný tajemství, ale nikdo se tam neodvážil jít už desítky let.\n\n"Jsi si jistá, že je to dobrý nápad?" zeptal se Tomáš nervózně, když se blížili k prvním stromům, jejichž větve se podivně kroutily, jako by někoho vítaly.\n\n"Prý je tam ten starý dub, který splní jedno přání tomu, kdo k němu dorazí o úplňku," odpověděla Lenka s jiskrou v očích. "A dnes je úplněk."\n\nJak vstoupili mezi stromy, les kolem nich jako by ožil. Listí šustilo, i když nefoukal vítr, a někde v dálce bylo slyšet podivné melodické zvuky. Cestička před nimi se klikatila a mizela v husté mlze, která se zvedala ze země.\n\n"Tohle není normální mlha," poznamenal Tomáš a natáhl ruku. Mlha kolem jeho prstů vytvářela malé světélkující víry. "Je teplá a... svítí."\n\nLenka vytáhla z batohu starou mapu, kterou našla zastrčenou v knihovně svého dědečka. "Podle mapy bychom měli pokračovat tímto směrem," ukázala na úzkou pěšinku, která téměř nebyla vidět.\n\nČím hlouběji do lesa pronikali, tím podivnější věci potkávali. Květiny, které měnily barvy, když kolem nich procházeli. Motýly s křídly velkými jako jejich dlaně. A jednou dokonce přísahali, že viděli malou vílí postavu, která se na ně usmála a zmizela za kmenem stromu.\n\n"Myslím, že nás sledují," zašeptal Tomáš, když uslyšel praskání větviček za nimi.\n\n"Kdo?" otočila se Lenka.\n\n"Nevím. Ale cítím, že tu nejsme sami."\n\nNáhle se před nimi objevila malá mýtina a uprostřed ní stál obrovský dub, mnohem větší a starší než jakýkoli strom, který kdy viděli. Jeho kmen byl tak široký, že by ho pět lidí držících se za ruce neobjalo. A nejpodivnější bylo, že navzdory pokročilé noční hodině bylo kolem dubu světlo, jako by samotné listy stromu vydávaly měkkou, zlatavou záři.\n\n"To je on," vydechla Lenka s úžasem. "Dub přání."\n\nJak se přiblížili ke stromu, ucítili zvláštní teplo a klid. Všechny obavy a strach z nich najednou opadly. Tomáš se dotkl kůry stromu a ucítil, jak pod jeho prsty pulzuje, jako by strom měl vlastní srdce.\n\n"Co si budeme přát?" zeptala se Lenka tiše.\n\nTomáš se na ni podíval a usmál se. "Já už vlastně všechno, co chci, mám. Jsem tady s tebou, na místě, o kterém jsme jen slýchali v pohádkách."\n\nLenka se také usmála a vzala ho za ruku. V tom okamžiku se kůra dubu rozestoupila a objevila se malá dutina, ve které ležel drobný, stříbrný přívěsek ve tvaru dubového listu.\n\n"Je pro vás," ozvalo se odnikud a zároveň odevšad. "Za to, že jste přišli s čistým srdcem, ne z chamtivosti. Tento amulet vás vždy dovede zpět do lesa, kdykoli budete chtít."\n\nLenka s Tomášem si vyměnili pohledy plné údivu a vděčnosti. Když Lenka vzala přívěsek do ruky, ucítila, jak je lehký a zároveň plný síly.\n\n"Děkujeme," řekli oba současně a les kolem nich jako by zašuměl na souhlas.\n\nCesta zpět vesnicí byla překvapivě krátká a snadná, jako by je les sám vyprovázel. Když se ohlédli zpět, viděli, jak mlha mezi stromy tančí a vytváří podivuhodné obrazce.\n\n"Vrátíme se tam?" zeptal se Tomáš, když konečně dorazili na okraj vesnice.\n\nLenka sevřela přívěsek v dlani a s úsměvem přikývla. "Určitě. Les na nás počká."\n\nA zatímco hvězdy nad nimi zářily jasněji než kdy jindy, oba věděli, že jejich život už nikdy nebude stejný. Našli místo, kde zázraky nejsou jen příběhy, ale skutečnost.',
      created_at: Date.now() - 172800000, // před dvěma dny
      updated_at: Date.now() - 172800000,
      length: 'medium',
      genre: 'fantasy',
      is_public: 1
    }
  ],
  achievements: [
    {
      id: 'achievement-demo-1',
      user_id: 'user-demo-1',
      achievement_id: 'FIRST_CONVERSATION',
      unlocked_at: Date.now() - 3600000 // před hodinou
    },
    {
      id: 'achievement-demo-2',
      user_id: 'user-demo-1',
      achievement_id: 'FIRST_CHARACTER',
      unlocked_at: Date.now() - 86400000 // o den dříve
    }
  ],
  user_stats: {
    user_id: 'user-demo-1',
    messages_sent: 2,
    conversations_started: 2,
    characters_created: 2,
    days_active: 2,
    last_active_date: new Date().toISOString().split('T')[0],
    stories_generated: 1,
    images_uploaded: 0
  }
};

// Funkce pro inicializaci databáze
function initDatabase() {
  console.log('Inicializace databáze...');
  
  db.serialize(() => {
    // Vytvoření tabulek
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_login INTEGER,
      settings TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      personality TEXT NOT NULL,
      appearance TEXT,
      voice_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      title TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      character_id TEXT,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_stats (
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

    db.run(`CREATE TABLE IF NOT EXISTS stories (
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

    db.run(`CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      memory_type TEXT NOT NULL,
      content TEXT NOT NULL,
      importance INTEGER DEFAULT 5,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )`);

    console.log('Databázové tabulky byly vytvořeny');
  });
}

// Funkce pro vložení demo dat
function insertDemoData() {
  console.log('Vkládání demo dat...');
  
  // Vložení uživatelů
  demoData.users.forEach(user => {
    db.run(
      'INSERT OR REPLACE INTO users (id, username, email, password, created_at, last_login, settings) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.username, user.email, user.password, user.created_at, user.last_login, user.settings]
    );
  });
  
  // Vložení postav
  demoData.characters.forEach(character => {
    db.run(
      'INSERT OR REPLACE INTO characters (id, user_id, name, personality, appearance, voice_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [character.id, character.user_id, character.name, character.personality, character.appearance, character.voice_id, character.created_at, character.updated_at]
    );
  });
  
  // Vložení konverzací
  demoData.conversations.forEach(conversation => {
    db.run(
      'INSERT OR REPLACE INTO conversations (id, user_id, character_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [conversation.id, conversation.user_id, conversation.character_id, conversation.title, conversation.created_at, conversation.updated_at]
    );
  });
  
  // Vložení zpráv
  demoData.messages.forEach(message => {
    db.run(
      'INSERT OR REPLACE INTO messages (id, conversation_id, sender, content, timestamp) VALUES (?, ?, ?, ?, ?)',
      [message.id, message.conversation_id, message.sender, message.content, message.timestamp]
    );
  });
  
  // Vložení příběhů
  demoData.stories.forEach(story => {
    db.run(
      'INSERT OR REPLACE INTO stories (id, user_id, character_id, title, prompt, content, created_at, updated_at, length, genre, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [story.id, story.user_id, story.character_id, story.title, story.prompt, story.content, story.created_at, story.updated_at, story.length, story.genre, story.is_public]
    );
  });
  
  // Vložení úspěchů
  demoData.achievements.forEach(achievement => {
    db.run(
      'INSERT OR REPLACE INTO achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)',
      [achievement.id, achievement.user_id, achievement.achievement_id, achievement.unlocked_at]
    );
  });
  
  // Vložení statistik uživatele
  db.run(
    'INSERT OR REPLACE INTO user_stats (user_id, messages_sent, conversations_started, characters_created, days_active, last_active_date, stories_generated, images_uploaded) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      demoData.user_stats.user_id,
      demoData.user_stats.messages_sent,
      demoData.user_stats.conversations_started,
      demoData.user_stats.characters_created,
      demoData.user_stats.days_active,
      demoData.user_stats.last_active_date,
      demoData.user_stats.stories_generated,
      demoData.user_stats.images_uploaded
    ]
  );
  
  console.log('Demo data byla vložena do databáze');
}

// Funkce pro vytvoření ukázkových souborů
function createSampleFiles() {
  console.log('Vytváření ukázkových souborů...');
  
  // Vytvoření adresářů, pokud neexistují
  const dirs = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'public', 'uploads'),
    path.join(__dirname, 'public', 'audio'),
    path.join(__dirname, 'logs')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Vytvořen adresář: ${dir}`);
    }
  });
  
  console.log('Ukázkové soubory byly vytvořeny');
}

// Hlavní funkce
function setupDemo() {
  console.log('Začíná nastavení demo prostředí...');
  
  // Inicializace databáze
  initDatabase();
  
  // Vložení demo dat
  insertDemoData();
  
  // Vytvoření ukázkových souborů
  createSampleFiles();
  
  console.log('Demo prostředí bylo úspěšně nastaveno!');
  console.log(`Databáze vytvořena v: ${dbPath}`);
  console.log('Demo uživatel:');
  console.log('  Email: demo@example.com');
  console.log('  Heslo: demo123');
  
  // Uzavření databáze
  db.close();
}

// Spuštění setupu
setupDemo();