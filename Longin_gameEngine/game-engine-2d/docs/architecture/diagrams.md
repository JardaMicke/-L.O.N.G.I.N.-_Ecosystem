# Architektonické Diagramy (Architecture Diagrams)

Tento dokument obsahuje diagramy klíčových procesů v `game-engine-2d`. Diagramy jsou definovány v syntaxi **Mermaid**.

## 1. Životní cyklus Enginu (Engine Lifecycle)

Tento diagram popisuje inicializaci, herní smyčku a ukončení aplikace.

```mermaid
flowchart TD
    A([Start]) --> B[Engine Constructor]
    B --> C[Initialize Config & Logger]
    C --> D[Initialize Core Systems\n(Events, Audio, ECS)]
    D --> E[Register Components]
    E --> F[Register Systems]
    F --> G[Initialize Renderer & Inputs]
    G --> H{Game Loop Running?}
    
    H -- Yes --> I[Update Phase]
    I --> J[Calculate DeltaTime]
    J --> K[Update Inputs]
    K --> L[Update GameState]
    L --> M[Update Systems (ECS)]
    M --> N[Render Phase]
    N --> O[Clear Screen]
    O --> P[Render Scene & Entities]
    P --> Q[Render UI & Debug]
    Q --> H
    
    H -- No --> R[Stop Loop]
    R --> S([End])
```

## 2. Event System (Observer Pattern)

Sekvenční diagram ukazující, jak komponenty komunikují přes centrální EventSystem.

```mermaid
sequenceDiagram
    participant P as Publisher (e.g., InputHandler)
    participant ES as EventSystem
    participant S as Subscriber (e.g., PlayerController)

    Note over S: 1. Subscribe to event
    S->>ES: on('input:jump', callback)
    ES-->>S: Listener Registered

    Note over P: 2. Event Occurs
    P->>ES: emit('input:jump', data)
    
    activate ES
    Note over ES: 3. Notify Subscribers
    ES->>S: callback(data)
    deactivate ES
    
    Note over S: 4. Execute Logic
    S->>S: Jump()
```

## 3. Entity Component System (ECS) Struktura

Vztahy mezi Entitami, Komponentami a Systémy.

```mermaid
classDiagram
    class Entity {
        +string id
        +addComponent(Component)
        +getComponent(ComponentType)
        +removeComponent(ComponentType)
    }

    class Component {
        <<interface>>
        +string type
    }

    class System {
        <<abstract>>
        +update(dt)
    }

    class EntityManager {
        +createEntity()
        +getEntities()
        +query(ComponentType[])
    }

    class SystemRegistry {
        +registerSystem(System)
        +update(dt)
    }

    Entity "1" *-- "*" Component : contains
    EntityManager "1" o-- "*" Entity : manages
    SystemRegistry "1" o-- "*" System : manages
    System ..> EntityManager : queries entities
    System ..> Component : modifies data
```

## 4. Načítání zdrojů (Resource Loading)

Proces načítání assetů přes ResourceManager.

```mermaid
flowchart LR
    Request[Game Request Asset] --> Check{In Cache?}
    Check -- Yes --> Return[Return Cached Asset]
    Check -- No --> Load[Load from URL]
    Load --> Type{Asset Type}
    
    Type -- Image --> NewImg[new Image()]
    Type -- Sound --> AudioMgr[AudioManager.load]
    Type -- JSON --> Fetch[fetch API]
    
    NewImg --> OnLoad[onload Event]
    OnLoad --> Cache[Store in Map]
    AudioMgr --> Cache
    Fetch --> Cache
    
    Cache --> Return
```

## 5. AI Behavior Tree Vyhodnocení (Evaluation)

Proces rozhodování agenta pomocí Behavior Tree.

```mermaid
sequenceDiagram
    participant System as SmartAgentSystem
    participant Agent as Entity
    participant Comp as SmartAgentComponent
    participant Tree as BehaviorTree
    participant Node as BehaviorNode

    System->>System: update(dt)
    loop Every Agent
        System->>Agent: getComponent('SmartAgent')
        activate Comp
        
        Note over Comp: Check Tree Switching Rules
        Comp->>Comp: checkRules()
        alt Rule Matches
            Comp->>Comp: switchTree(newTreeId)
        end
        
        Comp->>Tree: tick(context)
        deactivate Comp
        
        activate Tree
        Tree->>Node: execute(context)
        activate Node
        Node-->>Tree: Status (SUCCESS/FAILURE/RUNNING)
        deactivate Node
        
        alt Status is RUNNING
            Tree->>Tree: Maintain State
        else Status is SUCCESS/FAILURE
            Tree->>Tree: Reset Node State
        end
        deactivate Tree
    end
```

## 6. Síťová Komunikace (Network Flow)

Proces připojení a synchronizace přes NetworkManager.

```mermaid
sequenceDiagram
    participant Game as GameEngine
    participant Net as NetworkManager
    participant IO as Socket.IO Client
    participant Server as Game Server
    participant Events as EventSystem

    Note over Game: Connect Request
    Game->>Net: connect()
    Net->>IO: io(url)
    activate IO
    IO->>Server: Handshake
    Server-->>IO: Connection Accepted
    IO-->>Net: 'connect' event
    
    Net->>Events: emit('network:connected', socketId)
    Events-->>Game: Handle Connection
    
    loop Game State Sync
        Server->>IO: 'game:update' (state)
        IO->>Net: on('game:update')
        Net->>Events: emit('network:game:update', state)
        Events-->>Game: Apply State
    end
    
    Game->>Net: send('player:action', data)
    Net->>IO: emit('player:action', data)
    IO->>Server: Process Action
    deactivate IO
```

## 7. Logika Přiřazování Úkolů (Task Assignment)

Rozhodovací strom pro TaskComponent.

```mermaid
flowchart TD
    Start([Assign Task]) --> HasCurrent{Has Current Task?}
    
    HasCurrent -- No --> SetCurrent[Set as Current Task]
    SetCurrent --> Execute[Execute Task Logic]
    
    HasCurrent -- Yes --> AddQueue[Add to Queue]
    AddQueue --> Sort[Sort Queue by Priority]
    Sort --> Wait[Wait for Current Task]
    
    Wait --> TaskDone{Current Task Done?}
    TaskDone -- Yes --> PopQueue[Pop Highest Priority Task]
    PopQueue --> SetCurrent
    
    TaskDone -- No --> CheckInterrupt{New Task Priority > Current?}
    CheckInterrupt -- Yes --> Interrupt[Interrupt Current Task]
    Interrupt --> Requeue[Requeue Old Task]
    Requeue --> SetCurrent
    
    CheckInterrupt -- No --> Continue[Continue Current Task]
```
