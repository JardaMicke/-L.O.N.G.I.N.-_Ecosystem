# API Reference

This document provides a reference for the core modules and classes of the Game Engine.

## Core Modules

### Engine
The central class that manages the game loop, systems, and global state.

**Location:** `src/core/engine.ts`

**Key Properties:**
- `entityManager: EntityManager` - Manages all game entities.
- `systemRegistry: SystemRegistry` - Manages ECS systems.
- `resourceManager: ResourceManager` - Handles asset loading (images, audio).
- `inputHandler: InputHandler` - Manages keyboard and mouse input.
- `scriptManager: ScriptManager` - Manages game scripts.
- `debugOverlay: DebugOverlay` - Renders debug statistics.

**Key Methods:**
- `start()`: Starts the game loop.
- `stop()`: Stops the game loop.

### EntityManager
Manages the lifecycle of entities and their components.

**Location:** `src/ecs/entity-manager.ts`

**Key Methods:**
- `createEntity(): Entity`: Creates and registers a new entity.
- `removeEntity(id: string): void`: Destroys an entity by ID.
- `getEntity(id: string): Entity | undefined`: Retrieves an entity.
- `getEntitiesWithComponents(componentNames: string[]): Entity[]`: Finds entities having all specified components.

### Entity
Represents a game object in the ECS architecture.

**Location:** `src/ecs/entity.ts`

**Key Methods:**
- `addComponent(component: Component): void`: Attaches a component.
- `removeComponent(componentName: string): void`: Removes a component.
- `getComponent<T>(componentName: string): T | undefined`: Retrieves a component.
- `hasComponent(componentName: string): boolean`: Checks existence of a component.

## Systems

### ScriptSystem
Executes attached scripts on entities.

**Location:** `src/scripting/script-system.ts`

**Description:**
Iterates over entities with `ScriptComponent` and executes their lifecycle methods (`onStart`, `onUpdate`, `onDestroy`). Handles error isolation to prevent script crashes from stopping the engine.

### PhysicsSystem
Updates physical properties (position, velocity) based on physics components.

**Location:** `src/physics/physics-system.ts`

**Description:**
Applies velocity to position, handles gravity (if enabled), and resolves simple collisions.

### RenderSystem
Renders entities with visual components (Sprite, Shape) to the canvas.

**Location:** `src/graphics/render-system.ts`

## Scripting API

See [SCRIPTING_API.md](./SCRIPTING_API.md) for detailed documentation on writing scripts.

**Key Interfaces:**
- `IScript`: Interface for custom scripts.
- `ScriptContext`: Facade for accessing engine features from scripts safely.

## Tools & Debugging

### Profiler
Tracks performance metrics.

**Location:** `src/debug/profiler.ts`

**Key Properties:**
- `fps`: Current Frames Per Second.
- `frameTime`: Time taken to process the last frame (ms).
- `updateTime`: Time spent in update logic (ms).
- `renderTime`: Time spent in rendering (ms).

### DebugOverlay
Visualizes performance stats on screen.

**Location:** `src/debug/debug-overlay.ts`

**Usage:**
Can be toggled to show FPS, Entity count, and Memory usage.

### MapEditor
Tool for creating and modifying tilemaps.

**Location:** `src/tools/map-editor.ts`

**Key Methods:**
- `setTool(tool: 'brush' | 'eraser' | 'fill')`: Selects the active tool.
- `setTileId(id: number)`: Selects the tile to paint.
- `saveMap(name: string, author: string)`: Saves the current map to the backend.
- `loadMap(id: string)`: Loads a map from the backend.
- `undo() / redo()`: History management.

## Managers

### ScriptManager
Manages registration and retrieval of script definitions.

**Location:** `src/scripting/script-manager.ts`

**Key Methods:**
- `registerScript(name: string, script: IScript): void`: Registers a script definition.
- `getScript(name: string): IScript | undefined`: Retrieves a registered script.

### ResourceManager
Handles loading and caching of assets.

**Location:** `src/core/resource-manager.ts`

**Key Methods:**
- `loadImage(key: string, url: string): Promise<HTMLImageElement>`
- `loadAudio(key: string, url: string): Promise<void>`
