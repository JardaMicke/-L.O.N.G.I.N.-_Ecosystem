# Scripting Interface Documentation

## Přehled / Overview

Scripting Interface umožňuje vývojářům přidávat vlastní herní logiku k entitám bez nutnosti modifikovat jádro enginu. Systém je založen na **ScriptComponent**, který drží reference na registrované skripty.

The Scripting Interface allows developers to add custom game logic to entities without modifying the engine core. The system is based on **ScriptComponent**, which holds references to registered scripts.

## Klíčové Komponenty / Key Components

### 1. IScript Interface
Každý skript musí implementovat toto rozhraní (nebo jeho část).
Each script must implement this interface (or part of it).

```typescript
interface IScript {
    onStart?(entity: Entity, context: ScriptContext): void;
    onUpdate?(entity: Entity, dt: number, context: ScriptContext): void;
    onDestroy?(entity: Entity, context: ScriptContext): void;
}
```

### 2. ScriptContext
Poskytuje bezpečný přístup k funkcím enginu.
Provides safe access to engine functions.

- `log(message: string)`: Vypíše zprávu do konzole. / Logs a message.
- `getEntityById(id: string)`: Najde entitu podle ID. / Finds entity by ID.
- `getEntitiesWithComponent(name: string)`: Najde entity s danou komponentou. / Finds entities with component.
- `createEntity()`: Vytvoří novou entitu. / Creates a new entity.
- `destroyEntity(entity)`: Smaže entitu. / Destroys an entity.
- `isKeyDown(key: string)`: Zjistí stav klávesy. / Checks key state.
- `playSound(id: string)`: Přehraje zvuk. / Plays a sound.

### 3. ScriptComponent
Komponenta, kterou přidáte entitě. Může obsahovat více skriptů.
The component you add to an entity. Can contain multiple scripts.

```typescript
const scriptComp = new ScriptComponent();
scriptComp.addScript('MyCustomScript', { speed: 10 });
entity.addComponent(scriptComp);
```

## Příklad Použití / Usage Example

### Definice Skriptu / Script Definition

```typescript
class RotateScript implements IScript {
    onStart(entity: Entity, context: ScriptContext) {
        context.log(`Started rotation for ${entity.id}`);
    }

    onUpdate(entity: Entity, dt: number, context: ScriptContext) {
        const transform = entity.getComponent('Transform');
        if (transform) {
            // Získání rychlosti z properties (pokud existují)
            // Getting speed from properties (if exist)
            // Note: Properties access requires getting the ScriptComponent
            // const scriptComp = entity.getComponent('Script') as ScriptComponent;
            // const myScriptData = scriptComp.scripts.find(s => s.name === 'RotateScript');
            // const speed = myScriptData?.properties.speed || 1.0;
            
            transform.rotation += dt * 1.0;
        }
    }
}
```

### Registrace / Registration

```typescript
// V inicializaci hry / In game initialization
engine.scriptManager.registerScript('RotateScript', new RotateScript());
```

### Přidání Entitě / Adding to Entity

```typescript
const entity = engine.entityManager.createEntity();
const scriptComp = new ScriptComponent();
scriptComp.addScript('RotateScript', { speed: 5.0 });
entity.addComponent(scriptComp);
```

## Chybové Stavy / Error Handling

- Pokud skript vyhodí výjimku v `onStart` nebo `onUpdate`, je tato výjimka zachycena a zalogována jako Error.
- Daná instance skriptu je následně **deaktivována** (`active = false`), aby nezpůsobovala pády enginu v každém framu.
- If a script throws an exception in `onStart` or `onUpdate`, it is caught and logged.
- The script instance is then **deactivated** to prevent engine crashes.
