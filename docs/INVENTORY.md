# Inventarizace Komponent LONGIN Ecosystemu

## 1. Microservisy a Backendové Služby

### **Longin Core (Command Center)**
- **Umístění**: `Longin_hosting/services/longin-core`
- **Technologie**: Node.js, TypeScript, Express (pravděpodobně), TypeORM (dle `.entity.ts`).
- **Databáze**: PostgreSQL 15, Redis 7.
- **Funkce**:
  - Správa uživatelů a autentizace (JWT).
  - Správa deploymentů (Docker orchestrace).
  - GitHub integrace (Webhooks).
  - Monitoring metrik.
- **API**: REST + WebSocket (Port 3001/3002).

### **Longin Character Backend**
- **Umístění**: `Longin_character/backend`
- **Technologie**: Node.js, Express (JavaScript).
- **Funkce**:
  - Mozek AI charakteru.
  - Správa paměti a příběhu (`story-engine.js`).
  - Integrace LLM (`model-service.js`).
- **Závislosti**: `socket.io`, `axios`, `multer`.

### **Longin Bridge Backend**
- **Umístění**: `Longin_bridge/src`
- **Technologie**: Python (Flask).
- **Funkce**:
  - Lokální most pro Chrome extenzi.
  - Zpracování WebRTC/SocketIO.
- **Závislosti**: `Flask-SocketIO`, `SQLAlchemy`.

### **Longin Game Engine Server**
- **Umístění**: `Longin_gameEngine/game-engine-2d`
- **Technologie**: Node.js, TypeScript.
- **Funkce**:
  - Multiplayer herní server.
- **Závislosti**: `socket.io`, `express`, `pg`, `redis`.

## 2. Frontendové Aplikace

### **Longin UI (Dashboard)**
- **Umístění**: `Longin_hosting/services/longin-ui`
- **Technologie**: React, Vite, TypeScript.
- **Funkce**:
  - Ovládací panel pro Longin Core.
  - Vizualizace metrik, terminál, správa aplikací.

### **Longin Character Frontend**
- **Umístění**: `Longin_character/frontend`
- **Technologie**: React, Electron.
- **Funkce**:
  - Desktopové rozhraní pro AI avatara.

### **Chrome Extension**
- **Umístění**: `Longin_bridge/chrome-extension`
- **Technologie**: JavaScript (Manifest V3).
- **Funkce**:
  - Interakce s prohlížečem, capture obsahu.

## 3. Nástroje a Frameworky (Tools)

### **Stagehand**
- **Umístění**: `Tools/stagehand`
- **Popis**: AI agent pro ovládání prohlížeče.
- **Stav**: Framework pro automatizaci.

### **Puck**
- **Umístění**: `Tools/puck-main`
- **Popis**: Visual Editor pro React (Page Builder).

## 4. LLM Integrace

- **Implementace**: `Longin_character/backend/model-service.js`
- **Podporované Modely**:
  - **Local**: Ollama (endpoint: `localhost:11434`).
  - **Cloud**: OpenAI (GPT), Anthropic (Claude).
- **Funkcionalita**:
  - Automatický fallback (Primary -> Secondary -> Fallback).
  - Pattern matching cache.

## 5. Herní Moduly

- **2D Engine**: Vlastní TypeScript engine (`Longin_gameEngine`).
- **Stav**: Obsahuje UI (HUD), základní smyčku, fyziku (simplex-noise).
