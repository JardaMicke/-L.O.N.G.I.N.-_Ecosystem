# Vývojářská dokumentace Candy AI Clone

## Obsah
1. Architektura projektu
2. Technologický stack
3. Lokální vývoj
4. Komponenty backendu
5. Komponenty frontendu
6. AI Integrace
7. Pokročilé funkce
8. Testování
9. Deployment
10. Kontribuce

## 1. Architektura projektu

Candy AI Clone používá architekturu klient-server s následujícími hlavními komponenty:

### Backend
- Express.js REST API server
- SQLite databáze pro persistenci dat
- Socket.IO pro real-time komunikaci
- Služby pro integraci s AI modely

### Frontend
- Electron pro desktopovou aplikaci
- React pro uživatelské rozhraní
- Chakra UI pro komponenty

### AI služby (Docker)
- Ollama pro běh LLM modelů
- Stable Diffusion WebUI pro generování obrázků
- Coqui TTS pro hlasový výstup

## 2. Technologický stack

### Backend
- **Node.js & Express**: API server
- **SQLite**: Databáze
- **Socket.IO**: Real-time komunikace
- **Axios**: HTTP klient pro komunikaci s AI službami

### Frontend
- **Electron**: Multiplatformní desktop framework
- **React**: UI knihovna
- **Chakra UI**: Komponentová knihovna
- **React Router**: Routing
- **Context API**: State management

### AI & Docker
- **Docker & Docker Compose**: Kontejnerizace
- **Ollama**: Běh LLM modelů
- **Stable Diffusion WebUI**: Generování obrázků
- **Coqui TTS**: Text-to-speech

## 3. Lokální vývoj

### Příprava prostředí
1. Nainstalujte Docker a Docker Compose
2. Nainstalujte Node.js a npm
3. Naklonujte repozitář: `git clone https://github.com/username/candy-ai-clone.git`

### Spuštění vývojového prostředí
1. Spusťte Docker kontejnery:
   ```bash
   cd docker
   docker-compose up -d
   ```

2. Spusťte backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Spusťte frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Vývojové workflow
1. Vytvořte novou větev pro váš feature
2. Implementujte změny
3. Spusťte testy: `npm run test`
4. Commitněte změny a vytvořte pull request

## 4. Komponenty backendu

### Server (server.js)
Hlavní soubor, který inicializuje Express aplikaci, připojuje middleware a routy.

### API Routes
- `/api/characters` - CRUD operace pro postavy
- `/api/chat` - Endpointy pro konverzace
- `/api/models` - Správa AI modelů
- `/api/voice` - Hlasový výstup
- `/api/memory` - Paměťový systém
- `/api/achievements` - Systém achievementů

### Služby
- **memory-service.js**: Spravuje paměť postav a kontexty konverzací
- **model-service.js**: Komunikuje s Ollama API a spravuje modely
- **voice-service.js**: Integruje Coqui TTS pro hlasový výstup
- **achievement-service.js**: Implementuje systém achievementů
- **story-engine.js**: Implementuje role-playing engine s větvením příběhů

### Databáze
SQLite databáze s následujícími tabulkami:
- `characters` - Postavy
- `conversations` - Konverzace
- `messages` - Zprávy
- `memories` - Paměti postav
- `achievements` - Achievementy uživatele

## 5. Komponenty frontendu

### Adresářová struktura
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   ├── App.js           # Main App component
│   └── index.js         # Entry point
└── public/              # Static assets
```

### Hlavní komponenty
- **App.js**: Hlavní komponenta aplikace
- **CharactersPage.js**: Stránka se seznamem postav
- **ChatPage.js**: Stránka s chatovacím rozhraním
- **RolePlayingPage.js**: Stránka pro role-playing
- **SettingsPage.js**: Stránka s nastavením

### UI Komponenty
- **CharacterCard.js**: Karta postavy
- **MessageBubble.js**: Bublina zprávy v chatu
- **RolePlaying.js**: Komponenty pro role-playing
- **VoicePlayer.js**: Přehrávač hlasového výstupu
- **Achievements.js**: Zobrazení achievementů
- **MemoryManager**: Komponenty pro správu paměti
- **Header.js**: Hlavička aplikace
- **Sidebar.js**: Boční panel
- **ProgressTracker.js**: Sledování postupu

### Utility
- **ApiClient.js**: Třída pro komunikaci s backend API
- **ImageOptimizer.js**: Optimalizace obrázků
- **PerformanceMonitor.js**: Monitorování výkonu

## 6. AI Integrace

### Ollama API
Backend komunikuje s Ollama API pro generování odpovědí:

```javascript
// Příklad volání Ollama API z model-service.js
async function generateResponse(prompt, model, context) {
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: model,
    prompt: prompt,
    context: context,
    stream: false
  });
  
  return response.data;
}
```

### Stable Diffusion
Pro generování avatarů a obrázků je použit Stable Diffusion WebUI API:

```javascript
// Příklad generování obrázku
async function generateImage(prompt) {
  const response = await axios.post('http://localhost:7860/sdapi/v1/txt2img', {
    prompt: prompt,
    negative_prompt: "nsfw, bad quality",
    steps: 30,
    width: 512,
    height: 512
  });
  
  return response.data;
}
```

### Coqui TTS
Pro generování hlasového výstupu:

```javascript
// Příklad TTS volání
async function textToSpeech(text, voice_id) {
  const response = await axios.post('http://localhost:5002/api/tts', {
    text: text,
    voice_id: voice_id
  });
  
  return response.data;
}
```

## 7. Pokročilé funkce

### Memory System
Systém paměti postavy používá vektorovou databázi pro ukládání a vyhledávání relevantních vzpomínek:

```javascript
// Příklad přidání vzpomínky do paměti postavy
async function addMemory(characterId, text, importance) {
  // Vytvoří vektor z textu pomocí embeddings
  const vector = await createEmbedding(text);
  
  // Uloží vzpomínku do databáze
  await db.run(`
    INSERT INTO memories (character_id, text, vector, importance, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `, [characterId, text, JSON.stringify(vector), importance]);
}
```

### Role-Playing Engine
Engine pro role-playing podporuje větvení příběhu a dynamické scenáře:

```javascript
// Příklad vytvoření větvení příběhu
function createStoryBranch(storyId, currentNodeId, choices) {
  // Pro každou volbu vytvoří nový uzel v grafu příběhu
  return choices.map(choice => {
    const newNodeId = generateUniqueId();
    storyGraph[storyId].nodes[newNodeId] = {
      text: choice.text,
      isChoice: false
    };
    
    // Připojí nový uzel k aktuálnímu uzlu
    storyGraph[storyId].edges[currentNodeId] = [
      ...(storyGraph[storyId].edges[currentNodeId] || []),
      { to: newNodeId, condition: choice.condition }
    ];
    
    return newNodeId;
  });
}
```

### Achievement System
Systém pro sledování a odemykání achievementů:

```javascript
// Příklad kontroly podmínek pro achievement
function checkAchievementConditions(userId, achievementId) {
  const achievement = ACHIEVEMENTS[achievementId];
  
  switch (achievement.type) {
    case 'message_count':
      return checkMessageCount(userId, achievement.threshold);
    case 'character_creation':
      return checkCharacterCreationCount(userId, achievement.threshold);
    case 'story_completion':
      return checkStoryCompletion(userId, achievement.storyId);
    default:
      return false;
  }
}
```

## 8. Testování

### Unit testy
Projekt používá Jest pro unit testy:

```bash
# Spuštění unit testů
npm run test

# Spuštění testů s coverage reportem
npm run test:coverage
```

### End-to-end testy
Pro E2E testy je použit Playwright:

```bash
# Spuštění E2E testů
npm run test:e2e
```

### Manuální testování
Manuální testovací scénáře jsou k dispozici v `/docs/testing/manual-test-scenarios.md`

## 9. Deployment

### Vytvoření instalačního balíčku
Pro vytvoření instalačního balíčku pro Windows:

```bash
# Ve složce frontend
npm run build
node ../scripts/build-installer.js --win
```

### CI/CD
Projekt používá GitHub Actions pro automatizaci buildů a testů:
- **Pull Requests**: Spouští testy
- **Master Branch**: Vytváří produkční build a instalační balíčky

## 10. Kontribuce

### Guidelines
1. Vytvořte issue s popisem feature/bugfixu
2. Vytvořte branch z master větve
3. Implementujte změny a přidejte testy
4. Vytvořte pull request
5. Po code review a schválení bude PR sloučen do master větve

### Code Style
Projekt používá ESLint a Prettier pro zajištění konzistence kódu:

```bash
# Kontrola stylu kódu
npm run lint

# Automatické opravy
npm run lint:fix
```

### Dokumentace
Při přidávání nových funkcí vždy aktualizujte příslušnou dokumentaci:
- API dokumentaci v `/docs/api-reference.md`
- Uživatelskou příručku v `/docs/user-guide.md`
- Vývojářskou dokumentaci v `/docs/developer-guide.md`