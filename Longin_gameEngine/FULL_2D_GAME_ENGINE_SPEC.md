# 🎮 KOMPLETNÍ 2D RTS/RPG ENGINE FRAMEWORK
## PLNOHODNOTNÝ GAME ENGINE PRO TOPDOWN 2D HRY

**Verze:** 2.0 - FULL GAME ENGINE  
**Typ:** Generický framework pro 2D RTS/RPG top-down  
**Cíl:** Kompletní engine se VŠEMI herními systémy  
**Tech Stack:** Node.js + TypeScript + React/Puck + Canvas/WebGL  
**Status:** READY FOR FULL IMPLEMENTATION

---

## 📋 CO JE V TOMTO ENGINU

### CORE SYSTÉMY (Musí tam být)
✅ ECS Engine (Entity-Component-System)  
✅ 60 Hz Deterministic Game Loop  
✅ Game State Management  
✅ Event System (Pub/Sub)  
✅ Plugin/Mod System (JSON-based)  

### HERNÍ SYSTÉMY (Ty chyběly v předchozím)
✅ **Pathfinding** (A*, HPA*, Jump Point Search)  
✅ **Terrain Generation** (Procedural, Perlin Noise, Voronoi)  
✅ **Tilemap System** (Rendering, collisions, layers)  
✅ **Building/Construction System** (Placement, validation, rotation)  
✅ **Inventory System** (RTS + RPG, slots, weight, UI)  
✅ **Asset/Sprite Management** (Loading, atlasing, animation)  
✅ **Pixel Art Editor** (In-game sprite/tile creator)  
✅ **Map Editor** (Level design, spawn points, assets)  

### NÁSTROJE & EDITORY
✅ **Menu System** (Puck + Canvas overlay)  
✅ **Lobby System** (Multiplayer, player list, game settings)  
✅ **Mod Manager** (Load, unload, hot-reload)  
✅ **UI Builder** (Puck integration for custom menus)  
✅ **Sprite/Tile Editor** (Built-in pixel art tool)  
✅ **Map Generator** (Procedural + manual)  

### DATABASE & NETWORK
✅ Database Framework (PostgreSQL, MongoDB, Redis)  
✅ Network Framework (WebSocket, delta compression)  
✅ Save/Load System (Game state persistence)  
✅ Multiplayer State Sync  

### GRAPHICS & RENDERING
✅ Sprite System (Animation, atlasing)  
✅ Particle System  
✅ Lighting/Shadows  
✅ Camera System (Follow, zoom, pan)  
✅ Layer System (Terrain, units, buildings, effects, UI)  

---

## 📦 FOLDER STRUKTURA (KOMPLETNÍ)

```
game-engine/
├── src/
│   ├── core/                           # Core engine
│   │   ├── engine.ts                   # Main engine class
│   │   ├── game-loop.ts                # 60 Hz deterministic
│   │   ├── game-state.ts               # Game state manager
│   │   ├── event-system.ts             # Pub/sub events
│   │   ├── config-manager.ts           # Config/env
│   │   └── resource-manager.ts         # Asset loading
│   │
│   ├── ecs/                            # Entity Component System
│   │   ├── entity.ts                   # Entity class
│   │   ├── component.ts                # Component base
│   │   ├── system.ts                   # System base
│   │   ├── entity-manager.ts           # Lifecycle + querying
│   │   └── system-registry.ts          # System registration
│   │
│   ├── graphics/                       # Rendering & visual
│   │   ├── renderer.ts                 # Main renderer (Canvas/WebGL)
│   │   ├── sprite-manager.ts           # Sprite loading + animation
│   │   ├── tilemap-renderer.ts         # Tilemap rendering
│   │   ├── camera.ts                   # Camera system
│   │   ├── layers.ts                   # Layer management
│   │   ├── particle-system.ts          # Particle effects
│   │   └── lighting-system.ts          # Lights + shadows
│   │
│   ├── world/                          # World/terrain systems
│   │   ├── tilemap.ts                  # Tilemap data structure
│   │   ├── terrain-generator.ts        # Perlin Noise, Voronoi
│   │   ├── tile-manager.ts             # Tile properties, collisions
│   │   └── chunk-system.ts             # Chunk-based loading
│   │
│   ├── gameplay/                       # Core gameplay systems
│   │   ├── unit-system.ts              # Unit movement, control
│   │   ├── building-system.ts          # Building placement, destruction
│   │   ├── pathfinding-manager.ts      # A*, HPA*, JPS
│   │   ├── collision-system.ts         # Spatial hashing, queries
│   │   ├── inventory-system.ts         # Inventory slots, items
│   │   ├── resource-system.ts          # Resources (gold, wood, etc)
│   │   ├── research-system.ts          # Tech tree, upgrades
│   │   ├── ai-system.ts                # AI controller
│   │   └── action-system.ts            # Action queuing, execution
│   │
│   ├── editor/                         # Built-in editors
│   │   ├── sprite-editor.ts            # Pixel art editor
│   │   ├── map-editor.ts               # Level design tool
│   │   ├── tile-editor.ts              # Tile property editor
│   │   ├── building-editor.ts          # Building definition editor
│   │   └── editor-ui.ts                # Editor UI components
│   │
│   ├── ui/                             # UI system
│   │   ├── ui-manager.ts               # View lifecycle
│   │   ├── view-manager.ts             # Navigation stack
│   │   ├── widget-factory.ts           # Widget creation
│   │   ├── input-handler.ts            # Input routing
│   │   ├── puck-integration.ts         # Puck editor integration
│   │   └── state-binding.ts            # UI ↔ Game state
│   │
│   ├── network/                        # Multiplayer
│   │   ├── network-manager.ts          # Server/Client abstraction
│   │   ├── message-serializer.ts       # Message format
│   │   ├── delta-compression.ts        # State sync
│   │   ├── connection-handler.ts       # Connection lifecycle
│   │   └── lobby-system.ts             # Multiplayer lobbies
│   │
│   ├── database/                       # Persistence
│   │   ├── database-adapter.ts         # Abstract interface
│   │   ├── postgres-connection.ts      # SQL database
│   │   ├── mongo-connection.ts         # NoSQL database
│   │   ├── redis-connection.ts         # Cache layer
│   │   ├── repository.ts               # CRUD pattern
│   │   └── save-system.ts              # Game save/load
│   │
│   ├── plugin/                         # Plugin/Mod system
│   │   ├── plugin-loader.ts            # Load plugins
│   │   ├── plugin-validator.ts         # Validate JSON
│   │   ├── plugin-registry.ts          # Plugin management
│   │   ├── entity-registry.ts          # Custom entities
│   │   ├── component-registry.ts       # Custom components
│   │   ├── system-registry.ts          # Custom systems
│   │   ├── asset-registry.ts           # Custom assets
│   │   └── dependency-resolver.ts      # Dependency injection
│   │
│   ├── utils/                          # Utilities
│   │   ├── logger.ts                   # Logging
│   │   ├── timer.ts                    # Performance monitoring
│   │   ├── math-utils.ts               # Math helpers (vectors, matrices)
│   │   ├── pathfinding-utils.ts        # Pathfinding helpers
│   │   ├── serialization.ts            # Serialize/deserialize
│   │   └── type-helpers.ts             # Type utilities
│   │
│   └── types/                          # TypeScript interfaces
│       ├── ecs.interfaces.ts           # Entity, Component, System
│       ├── game-state.interfaces.ts    # Game state
│       ├── gameplay.interfaces.ts      # Unit, Building, Inventory
│       ├── graphics.interfaces.ts      # Sprite, Tilemap, Camera
│       ├── network.interfaces.ts       # Network messages
│       ├── database.interfaces.ts      # Database operations
│       ├── plugin.interfaces.ts        # Plugin system
│       └── world.interfaces.ts         # Terrain, tilemap
│
├── plugins/                            # Plugin examples
│   ├── example-game/                   # Example game plugin
│   │   ├── config.json                 # Plugin metadata
│   │   ├── entities.json               # Entity definitions
│   │   ├── components.json             # Component definitions
│   │   ├── systems.json                # System definitions
│   │   ├── assets/                     # Game sprites/tiles
│   │   ├── scripts/                    # Custom logic (TypeScript)
│   │   └── maps/                       # Predefined maps
│   │
│   └── ui-plugin/                      # UI customization plugin
│       ├── config.json
│       ├── views.json
│       └── assets/
│
├── assets/                             # Engine default assets
│   ├── sprites/
│   ├── tiles/
│   ├── fonts/
│   └── sounds/
│
├── configs/                            # Configuration files
│   ├── .env                            # Environment variables
│   ├── engine.config.ts                # Engine configuration
│   ├── database.config.ts              # Database configuration
│   ├── network.config.ts               # Network configuration
│   └── ports.config.ts                 # Port definitions
│
├── docker/
│   ├── Dockerfile                      # Docker image
│   ├── docker-compose.yml              # Multi-service setup
│   └── .dockerignore
│
├── package.json
├── tsconfig.json
├── webpack.config.js
├── README.md
└── .gitignore
```

---

## 🔧 CORE GAME SYSTEMS (DETAILNĚ)

### 1. PATHFINDING SYSTEM
```
src/gameplay/pathfinding-manager.ts

ALGORITMY:
├─ A* (Standard, heuristic-based)
│  └─ Ideální pro malé mapy (<100x100)
│  └─ Složitost: O(n log n)
│
├─ HPA* (Hierarchical Pathfinding A*)
│  └─ Cluster mapa do 16x16 (konfigurovatelné)
│  └─ Preprocessing: O(n²)
│  └─ Query: 10x rychlejší než A*
│  └─ Ideální pro velké mapy (500x500+)
│
└─ Jump Point Search (JPS)
   └─ Optimalizace A* pro grid-based
   └─ Skips symetrické cesty
   └─ 2-10x rychlejší než A*

KOMPONENTY:
├─ PathfindingComponent
│  ├─ position: Vector2
│  ├─ destination: Vector2
│  ├─ path: Vector2[]
│  ├─ isPathfinding: boolean
│  └─ speed: number
│
├─ CollisionMap (precomputed)
│  └─ Grid[x][y] = boolean (walkable)
│
└─ PathCache
   ├─ Cache frequent paths
   ├─ Key: from_x_y_to_x_y
   └─ TTL: 1 minute
```

### 2. TERRAIN & TILEMAP SYSTEM
```
src/world/terrain-generator.ts
src/graphics/tilemap-renderer.ts

GENERATION ALGORITHMS:
├─ Perlin Noise
│  ├─ Smooth gradual changes
│  ├─ Configurable octaves
│  └─ Biome support
│
├─ Voronoi Diagrams
│  ├─ Random cells
│  ├─ Good for regions
│  └─ Biome generation
│
└─ Cellular Automata
   ├─ Cave generation
   └─ Natural patterns

TILEMAP STRUCTURE:
├─ Tiles Grid[x][y]
│  ├─ terrainType: string (grass, water, forest)
│  ├─ height: number (for elevation)
│  ├─ walkable: boolean
│  ├─ resourceAmount: number
│  └─ spriteId: string
│
├─ Chunk System
│  ├─ Load 16x16 tiles per chunk
│  ├─ Async streaming
│  └─ Memory optimization
│
└─ Layer System
   ├─ Layer 0: Terrain
   ├─ Layer 1: Decorations
   ├─ Layer 2: Units/Buildings
   └─ Layer 3: Effects/Particles
```

### 3. BUILDING/CONSTRUCTION SYSTEM
```
src/gameplay/building-system.ts

BUILDING PLACEMENT:
├─ BuildingComponent
│  ├─ buildingType: string
│  ├─ position: Vector2
│  ├─ rotation: number
│  ├─ owner: PlayerId
│  ├─ health: number
│  ├─ resources: Map<string, number>
│  └─ productionQueue: ActionBlock[]
│
├─ Placement Validation
│  ├─ Check walkability
│  ├─ Check overlap (other buildings)
│  ├─ Check fog of war
│  └─ Check builder in range
│
├─ Construction Queue
│  ├─ Pre-place (blueprinting)
│  ├─ Building (progress bar)
│  └─ Complete (functional)
│
└─ Building Destruction
   ├─ Remove from world
   ├─ Drop resources
   └─ Update minimap
```

### 4. INVENTORY SYSTEM (RTS + RPG)
```
src/gameplay/inventory-system.ts

TYPES:
├─ Unit Inventory (RPG)
│  ├─ Slots: 20
│  ├─ Weight limit: 100 kg
│  ├─ Items: Weapon, Armor, Consumable, Quest
│  └─ Equipped: Head, Chest, Legs, Feet, Hands
│
├─ Storage Inventory (RTS)
│  ├─ Slots: unlimited (building)
│  ├─ Resources only
│  └─ Type-specific containers
│
└─ Trade Inventory
   ├─ Buy/Sell items
   ├─ NPC shop
   └─ Price system

INVENTORY COMPONENT:
├─ slots: InventorySlot[]
│  ├─ itemId: string
│  ├─ quantity: number
│  ├─ metadata: object
│  └─ equipped: boolean
│
├─ weight: number (current)
├─ maxWeight: number (limit)
└─ operations
   ├─ add(item, quantity): boolean
   ├─ remove(slotId, quantity): boolean
   ├─ move(fromSlot, toSlot): boolean
   └─ equip(slotId): boolean
```

### 5. ASSET/SPRITE MANAGEMENT
```
src/graphics/sprite-manager.ts

ASSET REGISTRY:
├─ Sprites
│  ├─ spriteId: unique identifier
│  ├─ path: asset location
│  ├─ size: { width, height }
│  ├─ frames: Frame[] (animation)
│  └─ metadata: { walkable, collidable }
│
├─ Sprite Atlases
│  ├─ Multiple sprites in one image
│  ├─ Reduced draw calls
│  └─ Automatic packing
│
├─ Animation System
│  ├─ Frame-based
│  ├─ Speed: FPS
│  ├─ Loop/Ping-pong
│  └─ Event triggers
│
└─ Asset Loading
   ├─ Async loading with promise
   ├─ Caching layer
   ├─ Fallback textures
   └─ Error handling
```

### 6. PIXEL ART EDITOR (IN-GAME)
```
src/editor/sprite-editor.ts

FEATURES:
├─ Canvas Editor
│  ├─ Grid-based pixels
│  ├─ Color palette (16-256 colors)
│  ├─ Tools: Pencil, Eraser, Bucket Fill, Line, Rectangle
│  └─ Export as PNG/JSON
│
├─ Animation Creator
│  ├─ Frame sequencing
│  ├─ Preview animation
│  └─ Optimize frames
│
├─ Tileset Editor
│  ├─ Create tiles
│  ├─ Set collision masks
│  └─ Set walkability per tile
│
└─ Asset Assignment
   ├─ Link sprite to entity type
   ├─ Link sprite to building type
   └─ Store in plugin JSON

SAVED AS:
├─ Pixel data: base64 in JSON
├─ Metadata: colors, frames, collision
└─ References: entityId, buildingId
```

### 7. MAP EDITOR
```
src/editor/map-editor.ts

FEATURES:
├─ Tilemap Placement
│  ├─ Brush tools
│  ├─ Bucket fill terrain
│  └─ Erase/clear areas
│
├─ Object Placement
│  ├─ Place buildings
│  ├─ Place spawn points
│  ├─ Place resources
│  └─ Place NPCs/Triggers
│
├─ Layer Editing
│  ├─ Toggle visibility
│  ├─ Lock/unlock layers
│  ├─ Reorder layers
│  └─ Name layers
│
├─ Save & Export
│  ├─ Save to JSON
│  ├─ Export tilemap image
│  └─ Generate collision map
│
└─ Previewer
   ├─ Real-time preview
   ├─ Zoom/pan
   └─ Collision visualization
```

---

## 🎨 GAME MENU & LOBBY (PUCK INTEGRATION)

### Menu Structure
```
Main Menu
├─ New Game
│  ├─ Select Game Mode
│  ├─ Configure Players
│  ├─ Map Selection
│  └─ Difficulty/Settings
│
├─ Multiplayer
│  ├─ Create Lobby
│  ├─ Join Lobby
│  └─ My Lobbies
│
├─ Mods
│  ├─ List installed
│  ├─ Enable/disable
│  ├─ Import from file
│  └─ Download from workshop
│
├─ Settings
│  ├─ Graphics
│  ├─ Audio
│  ├─ Input/Controls
│  └─ Accessibility
│
└─ Exit

In-Game Menu
├─ Resume
├─ Settings
├─ Save Game
├─ Load Game
├─ Map Editor
├─ Sprite Editor
└─ Exit to Menu
```

### Puck Integration
```
src/ui/puck-integration.ts

CONFIG:
{
  "components": {
    "Button": { props: { label, onClick } },
    "Panel": { props: { title, children } },
    "ListBox": { props: { items, selected, onChange } },
    "Slider": { props: { min, max, value, onChange } },
    "Image": { props: { src, width, height } },
    "Text": { props: { content, size, color } }
  },
  "layouts": [
    { id: "main-menu", path: "menus/main.json" },
    { id: "lobby", path: "menus/lobby.json" },
    { id: "hud", path: "menus/hud.json" }
  ]
}

RENDERING:
├─ Puck generates page JSON
├─ Custom renderer (Canvas overlay)
├─ Bind to game state
└─ Handle events
```

---

## 📊 GAME CONFIGURATION SYSTEM

### Ports Configuration
```yaml
# configs/ports.config.ts

PORTS:
├─ Frontend: 3000
├─ Backend API: 3001
├─ WebSocket: 3002
├─ Database
│  ├─ PostgreSQL: 5432
│  ├─ MongoDB: 27017
│  └─ Redis: 6379
└─ Admin Panel: 3100
```

### Engine Configuration
```typescript
// configs/engine.config.ts

export const engineConfig = {
  // Game Loop
  tickRate: 60, // Hz
  
  // Graphics
  rendering: {
    type: 'canvas', // or 'webgl'
    width: 1920,
    height: 1080,
    pixelRatio: 1,
  },
  
  // Pathfinding
  pathfinding: {
    algorithm: 'HPA*', // A*, HPA*, JPS
    gridSize: 16,
    cacheSize: 1000,
  },
  
  // Terrain
  terrain: {
    chunkSize: 16,
    loadDistance: 5,
    algorithm: 'perlin', // perlin, voronoi, cellular
  },
  
  // UI
  ui: {
    puckEnabled: true,
    editorEnabled: true,
    debugMode: false,
  },
  
  // Network
  network: {
    tickRate: 20, // Server tick
    compressionEnabled: true,
  },
  
  // Database
  database: {
    postgres: { host, port, database, user },
    mongodb: { uri },
    redis: { host, port },
  },
};
```

---

## 🎮 GAMEPLAY FLOW (TOP-DOWN RTS/RPG)

### Game Loop Sequence
```
EVERY TICK (60 Hz):

1. INPUT COLLECTION
   ├─ Mouse input (click, drag)
   ├─ Keyboard input (WASD, etc)
   └─ Touch input (mobile)

2. COMMAND GENERATION
   ├─ Unit movement commands
   ├─ Building placement
   ├─ Research/production
   ├─ Inventory operations
   └─ Spell/ability usage

3. PATHFINDING
   ├─ Generate paths for moving units
   ├─ Validate destination walkability
   └─ Update path caches

4. SYSTEM EXECUTION
   ├─ Movement system (animate units along path)
   ├─ Building system (construction progress)
   ├─ Resource system (gathering, producing)
   ├─ Research system (tech tree progression)
   ├─ Combat system (if exists)
   ├─ AI system (NPC decisions)
   └─ Inventory system (drop items, pickup)

5. COLLISION DETECTION
   ├─ Unit-terrain collisions
   ├─ Unit-building collisions
   ├─ Unit-unit collisions
   └─ Update spatial hash grid

6. VISIBILITY/FOG OF WAR (optional)
   ├─ Calculate visible tiles per player
   ├─ Update minimap
   └─ Cull off-screen entities

7. RENDERING
   ├─ Camera update
   ├─ Terrain rendering (visible chunks)
   ├─ Entity rendering (units, buildings)
   ├─ Effect rendering (particles, animations)
   └─ UI rendering (HUD, tooltips)

8. NETWORK SYNC (multiplayer)
   ├─ Collect state changes (delta)
   ├─ Compress data
   ├─ Send to clients
   └─ Receive remote actions

9. DATABASE SAVE (periodic)
   ├─ Every 10 minutes save game state
   └─ Persist player progress

10. EVENT FLUSH
    └─ Process all events from this tick
```

---

## 📦 PLUGIN/MOD SYSTEM (JSON-BASED)

### Plugin Structure
```
plugins/my-game/
├─ config.json                    # Plugin metadata
├─ entities.json                  # Entity definitions
├─ components.json                # Component definitions
├─ systems.json                   # System definitions
├─ buildings.json                 # Building types
├─ units.json                     # Unit types
├─ items.json                     # Inventory items
├─ maps.json                      # Map definitions
├─ assets/
│  ├─ sprites/
│  ├─ tiles/
│  └─ sounds/
└─ scripts/
   ├─ custom-system.ts            # Custom system code
   └─ ai-behavior.ts              # AI logic
```

### entities.json Example
```json
{
  "entities": [
    {
      "id": "hero",
      "type": "unit",
      "displayName": "Hero",
      "components": [
        "position",
        "sprite",
        "inventory",
        "health",
        "moveable"
      ],
      "props": {
        "maxHealth": 100,
        "speed": 5,
        "spriteId": "hero-idle",
        "inventorySize": 20,
        "weight": 80
      }
    },
    {
      "id": "farm",
      "type": "building",
      "displayName": "Farm",
      "components": [
        "position",
        "sprite",
        "inventory",
        "production"
      ],
      "props": {
        "spriteId": "farm-building",
        "productionTime": 300,
        "produces": "wheat",
        "storage": 1000
      }
    }
  ]
}
```

### systems.json Example
```json
{
  "systems": [
    {
      "id": "custom-gathering",
      "enabled": true,
      "priority": 50,
      "type": "custom",
      "file": "scripts/gathering-system.ts",
      "queryComponents": [
        "position",
        "gatheringTarget",
        "inventory"
      ]
    }
  ]
}
```

---

## 💾 DATABASE SCHEMAS

### PostgreSQL (Players & Sessions)
```sql
-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP,
  last_login TIMESTAMP,
  
  -- Game stats
  games_played INT,
  games_won INT,
  total_playtime INT
);

-- Game Sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  player_id UUID REFERENCES players(id),
  game_plugin_id VARCHAR(255),
  save_data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_multiplayer BOOLEAN
);

-- Multiplayer Lobbies
CREATE TABLE lobbies (
  id UUID PRIMARY KEY,
  host_id UUID REFERENCES players(id),
  name VARCHAR(255),
  max_players INT,
  game_plugin_id VARCHAR(255),
  settings JSONB,
  created_at TIMESTAMP
);

-- Lobby Players
CREATE TABLE lobby_players (
  id UUID PRIMARY KEY,
  lobby_id UUID REFERENCES lobbies(id),
  player_id UUID REFERENCES players(id),
  team INT,
  ready BOOLEAN,
  joined_at TIMESTAMP
);
```

### MongoDB (Game Data)
```javascript
// Entities Collection
db.entities.insertOne({
  gameSessionId: "session-123",
  entities: [
    {
      id: "entity-1",
      type: "hero",
      position: { x: 100, y: 200 },
      components: {
        health: { current: 100, max: 100 },
        inventory: {
          slots: [
            { itemId: "sword-1", quantity: 1, equipped: true },
            { itemId: "potion", quantity: 5, equipped: false }
          ]
        },
        sprite: { id: "hero-idle", frameIndex: 0 }
      }
    }
  ]
});

// Game State Collection
db.game_states.insertOne({
  gameSessionId: "session-123",
  tick: 12000,
  players: [
    { playerId: "player-1", color: "red", resources: { gold: 500 } }
  ],
  globalState: {
    timeOfDay: 0.5,
    weather: "clear"
  }
});

// Map Data Collection
db.maps.insertOne({
  id: "map-1",
  name: "Forest",
  width: 128,
  height: 128,
  tilemap: [/* tile data */],
  objects: [/* building/resource positions */]
});
```

### Redis (Cache & Realtime)
```
// Player sessions
SET session:{playerId} "{gameSessionData}"
TTL: 1 hour

// Active lobbies (pub/sub)
SUBSCRIBE lobby:{lobbyId}
PUBLISH lobby:123 "{playerJoined}"

// Path cache
SET path:{from_x}_{from_y}_{to_x}_{to_y} "[path array]"
TTL: 1 minute

// Active games
SET game:{gameSessionId}:tick 12000
```

---

## 🎯 IMPLEMENTAČNÍ ROADMAP (45+ KROKŮ)

### FÁZE 1: CORE ENGINE (Kroky 1-8) - ~40 hodin
```
1. Project setup + TypeScript config
2. Type definitions + interfaces
3. Event system
4. Logger + Config manager
5. Entity & Component classes
6. System & Registry
7. Entity manager
8. Game state + Game loop (60 Hz)
```

### FÁZE 2: GRAPHICS & RENDERING (Kroky 9-15) - ~50 hodin
```
9. Canvas/WebGL setup
10. Sprite manager + animation
11. Tilemap renderer
12. Camera system
13. Layer system
14. Particle system
15. UI renderer (Puck integration)
```

### FÁZE 3: WORLD & TERRAIN (Kroky 16-22) - ~45 hodin
```
16. Tilemap data structure
17. Terrain generator (Perlin Noise)
18. Voronoi terrain generation
19. Chunk system + streaming
20. Collision map system
21. Tile properties + walkability
22. Resource spawning
```

### FÁZE 4: GAMEPLAY SYSTEMS (Kroky 23-30) - ~60 hodin
```
23. Pathfinding system (A*)
24. HPA* implementation
25. Jump Point Search (JPS)
26. Building system + placement
27. Unit movement + animation
28. Inventory system
29. Resource system
30. Action/command system
```

### FÁZE 5: EDITORS (Kroky 31-36) - ~40 hodin
```
31. Pixel art sprite editor
32. Tilemap editor
33. Map editor + painter
34. Building placement editor
35. Animation frame editor
36. Asset management UI
```

### FÁZE 6: NETWORKING & MULTIPLAYER (Kroky 37-42) - ~50 hodin
```
37. WebSocket setup
38. Message serialization
39. Delta compression
40. Lobby system
41. Multiplayer state sync
42. Save/Load system
```

### FÁZE 7: PLUGIN SYSTEM & DATABASE (Kroky 43-50) - ~50 hodin
```
43. Plugin loader
44. Plugin validator + JSON schema
45. Entity/Component/System registry
46. Asset registry
47. PostgreSQL integration
48. MongoDB integration
49. Redis integration
50. Dependency resolver + hot reload
```

**CELKEM: ~335 hodin práce (~8 týdnů na jednoho vývojáře)**

---

## 🏗️ ARCHITEKTURA - DETAILNÍ DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME ENGINE ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      INPUT LAYER                             │
│  (Mouse, Keyboard, Touch)                                    │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                   GAME LOOP (60 Hz)                          │
│  1. Collect Input  2. Process Commands  3. Execute Systems   │
│  4. Collision      5. Visibility        6. Network Sync      │
│  7. Render         8. Database Tick                          │
└──────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    ECS       │  │  GRAPHICS    │  │  GAMEPLAY    │
│              │  │              │  │              │
│ Entity Mgr   │  │ Sprite Mgr   │  │ Pathfinding  │
│ Component    │  │ Tilemap      │  │ Building     │
│ System Reg   │  │ Camera       │  │ Inventory    │
│              │  │ Particle     │  │ Resource     │
└──────────────┘  │ Lighting     │  │ AI           │
                  └──────────────┘  │ Action Queue │
                                    └──────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   WORLD      │  │  NETWORK     │  │  DATABASE    │
│              │  │              │  │              │
│ Terrain Gen  │  │ Message Ser  │  │ PostgreSQL   │
│ Tilemap      │  │ Delta Comp   │  │ MongoDB      │
│ Chunk Mgr    │  │ Lobby System │  │ Redis        │
│              │  │ Replication  │  │ Repository   │
└──────────────┘  └──────────────┘  └──────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    PLUGIN SYSTEM                             │
│  Entity Registry | Component Registry | System Registry      │
│  Asset Registry | Dependency Resolver                        │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ VALIDAČNÍ CHECKLIST PO IMPLEMENTACI

### Po Fázi 1 (Core Engine)
- [ ] ECS plně funkční
- [ ] Game loop běží na 60 Hz
- [ ] Entity se vytváří, mažou, queryují
- [ ] Komponenty se přidávají/odebírají
- [ ] Systémy se registrují a spouštějí
- [ ] Event emitting funguje
- [ ] Config se načítá ze .env
- [ ] Logger pracuje

### Po Fázi 2 (Graphics)
- [ ] Canvas/WebGL renderuje
- [ ] Sprity se loadují a animují
- [ ] Tilemap se renderuje
- [ ] Camera se pohybuje
- [ ] Layers fungují (3+ vrstvy)
- [ ] Particles se vytvářejí a animují

### Po Fázi 3 (World)
- [ ] Terrain se generuje (Perlin + Voronoi)
- [ ] Tilemap se spravuje
- [ ] Chunks se loadují/unloadují
- [ ] Collision mapa je precomputed
- [ ] Resource spawning funguje
- [ ] Tile properties jsou nastavovatelné

### Po Fázi 4 (Gameplay)
- [ ] Pathfinding vrací platné cesty
- [ ] HPA* je 10x rychlejší než A*
- [ ] Buildings se umisťují a validují
- [ ] Jednotky se pohybují po mapě
- [ ] Inventář se přidává/odebírá
- [ ] Akce se frontují a vykonávají

### Po Fázi 5 (Editors)
- [ ] Sprite editor kreslí pixely
- [ ] Map editor umisťuje objekty
- [ ] Tile editor nastavuje vlastnosti
- [ ] Animation editor sekvencuje frames
- [ ] Export do JSON funguje

### Po Fázi 6 (Network)
- [ ] WebSocket se připojuje
- [ ] Zprávy se serializují
- [ ] Delta compression funguje
- [ ] Lobby systém funguje
- [ ] Multiplayer sync je synchronní

### Po Fázi 7 (Plugin + DB)
- [ ] Plugin se loaduje z JSON
- [ ] Custom entity se vytváří
- [ ] Custom komponenty se registrují
- [ ] Databáze se připojují
- [ ] Save/Load funguje
- [ ] Hot reload funguje

---

## 🎁 CO MÁTE NA KONCI

**KOMPLETNÍ 2D RTS/RPG ENGINE S:**

✅ Profesionální ECS architekturou  
✅ 60 Hz deterministic game loop  
✅ Pokročilým pathfindingem (HPA*)  
✅ Procedurální generací terénu  
✅ Building & construction systémem  
✅ Inventory systémem (RTS + RPG)  
✅ Pixel art editorem  
✅ Map editorem  
✅ Puck UI integrací  
✅ Multiplayer infrastrukturou  
✅ Database abstrakční vrstvou  
✅ Plugin/mod systémem  

**Bez jakéhokoliv herního obsahu - čistý, universální engine.**

---

## 🚀 DALŠÍ KROKY

1. **Vytvoř DETAILNÍ IMPLEMENTAČNÍ PLÁN** (kroky 1-50 s pseudokódem)
2. **Vytvoř VŠECHNY TypeScript interfaces** (50+ souborů)
3. **Vytvoř EXAMPLE PLUGIN** (demonstrace fungování)
4. **Vytvoř DOCKER SETUP** (PostgreSQL + MongoDB + Redis)
5. **Vytvoř TESTING SUITE** (unit + integration testy)

---

**Verze:** 2.0 - COMPLETE GAME ENGINE  
**Status:** READY FOR IMPLEMENTATION  
**Doba implementace:** 8 týdnů (1 vývojář)  

🎮 **NYNÍ TO JE SKUTEČNÝ GAME ENGINE!** 🎮