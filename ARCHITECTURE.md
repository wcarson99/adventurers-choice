# Architecture Documentation

## Technology Stack

- **Language**: TypeScript
- **Frontend Framework**: React
- **Rendering**: HTML5 Canvas API (for game board visualization)
- **UI**: React Components (for menus, character sheets, lobby)
- **Build Tool**: Vite
- **Testing**: Playwright (E2E), Vitest (unit tests - optional for MVP)
- **State Management**: ECS-based game state + React state for UI

## Core Design Principles

### Turn-Based Execution Model (CRITICAL)

The game is **non-realtime and event-driven**. There is no traditional game loop.

- **Single Entry Point**: `GameEngine.executeTurn(action: Action)` - synchronous method that processes a single player action
- **No `requestAnimationFrame`** or Web Workers
- **State Integrity**: All game state transitions are predictable and synchronous
- **Event-Driven**: Game responds to player actions, not time-based ticks

### Entity Component System (ECS)

The game uses an ECS architecture for game logic:

- **Entities**: Unique identifiers for game objects (characters, traps, obstacles, devices, monsters)
- **Components**: Pure data containers (no logic)
- **Systems**: Logic that operates on entities with specific component combinations

#### Entity Scope

Entities represent all interactive game objects:
- **Characters**: Party members (3-6 characters controlled by single player)
- **Traps/Obstacles**: Environmental hazards in puzzles
- **Devices**: Deployable items created during encounters
- **Monsters**: Summoned creatures (if applicable)
- **Items**: Interactive objects (if needed for MVP)

**Game State** (turn count, puzzle metadata, world map state) is managed separately as a singleton, not as entities.

#### Core Components (MVP - The Gauntlet)

```typescript
// Character Components
AttributeComponent {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

PositionComponent {
  x: number;
  y: number;
}

StaminaComponent {
  current: number;
  max: number; // CON-based
}

SkillComponent {
  skills: Map<SkillName, SkillLevel>;
}

// Trap/Obstacle Components
TrapComponent {
  type: TrapType;
  difficulty: number;
  state: 'active' | 'disarmed' | 'triggered';
  detectionDC: number; // WIS-based
  disarmDC: number;    // DEX/INT-based
}

// Game State Components
TurnComponent {
  currentTurn: number;
  maxTurns?: number; // For turn-limited puzzles
  activePlayer: EntityId;
}
```

#### Core Systems (MVP - The Gauntlet)

```typescript
// Core Systems
TurnSystem {
  - Manages turn order
  - Enforces turn limits
  - Tracks active player/character
}

ActionSystem {
  - Processes player actions (move, disarm, interact)
  - Validates action legality
  - Applies action results
}

GauntletSystem {
  - Mini-game specific logic
  - Trap detection (WIS-based)
  - Trap disarming (DEX/INT-based)
  - Movement rules
  - Win/loss conditions
}

AttributeSystem {
  - Calculates attribute modifiers
  - Handles attribute-based rolls/checks
  - Applies attribute effects
}
```

### State Management

- **Game State**: Managed by ECS and `GameEngine` singleton
- **UI State**: React state for menus, character sheets, etc.
- **Separation**: Game logic is framework-agnostic TypeScript, React only handles presentation

### Turn-Based Mechanics

- **Turn Structure**: Player selects action for one or more party members → `GameEngine.executeTurn(action)` → State updates → UI reflects changes
- **Time Pressure**: Some puzzles have turn limits (must complete within X turns)
- **Skill Gating**: Some puzzles can be attempted, failed, and returned to after skill progression (deferred to backlog)
- **Action Types**: Move, Disarm, Interact, Use Skill, etc.

## Project Structure

```
src/
  entities/           # Entity definitions and factories
  components/         # ECS Components (pure data)
  systems/           # ECS Systems (logic)
  mini-games/        # Mini-game implementations
    gauntlet/        # The Gauntlet mini-game
  game-engine/       # Core GameEngine, TurnSystem, ActionSystem
  world/             # WorldMap, Node management (forward-only for MVP)
  ui/                # React components
    components/      # Reusable UI components
    pages/           # Page-level components
    canvas/          # Canvas rendering components
  types/             # TypeScript types/interfaces
  utils/             # Helper functions
  constants/         # Game constants (attribute names, etc.)

tests/
  e2e/               # Playwright E2E tests
    gauntlet/        # Gauntlet-specific tests
  unit/               # Vitest unit tests (optional for MVP)
    systems/         # System tests
    components/      # Component tests

public/              # Static assets
```

## Game Engine Architecture

### GameEngine Class

```typescript
class GameEngine {
  private ecs: ECS;
  private worldMap: WorldMap;
  
  executeTurn(action: Action): GameState {
    // 1. Validate action
    // 2. Process action through relevant systems
    // 3. Update game state
    // 4. Return new game state
  }
  
  getState(): GameState {
    // Return current game state snapshot
  }
}
```

### Action System

All player interactions are represented as `Action` objects:

```typescript
type Action = 
  | MoveAction { entityId: EntityId; targetX: number; targetY: number }
  | DisarmTrapAction { entityId: EntityId; trapId: EntityId }
  | UseSkillAction { entityId: EntityId; skill: SkillName; target?: EntityId }
  | EndTurnAction
```

## World Map System (MVP - Simplified)

- **Forward-Only Progression**: Linear sequence of nodes/encounters
- **Node Types**: Gauntlet, Combat, Social, etc.
- **State Tracking**: Unvisited, In-Progress, Completed, Failed
- **No Backtracking**: MVP does not support returning to previous encounters
- **Future**: Backtracking and partial puzzle state persistence will be added later

## Mini-Game: The Gauntlet (MVP Focus)

### Structure: Daily Loop Within The Gauntlet

The Gauntlet is not a single encounter, but a sequence of days. Each day follows this loop:

```
while not won() and not lost():
  Day Loop:
    1. Prepare Phase
       - Party selects and executes Downtime projects
       - Uses: Preparation Phase mini-game
       - Focus: INT (Research), STR (Labor), CHA (Recruitment)
    
    2. Travel Phase
       - Party moves through the gauntlet path
       - Uses: Survival Ledger mini-game
       - Focus: WIS (Gathering), CON (Endurance), INT (Research)
       - Manages survival meters (Food, Water, Pace)
    
    3. Encounter Phase
       - Party resolves trap/obstacle challenge
       - Uses: Core Gauntlet mechanics (grid-based trap solving)
       - Focus: DEX (Evasion), WIS (Detection), all attributes
    
    4. Recovery Phase
       - Party restores resources
       - Uses: Preparation Phase mini-game (Healing Focus)
       - May include Triage Choice in Roguelike Mode
```

### Requirements

- **Grid-Based**: Characters and traps exist on a grid (exact dimensions TBD)
- **Turn-Based**: Player selects actions for party members
- **Time Pressure**: Some Gauntlets have turn limits (day limits or turn limits within encounters)
- **Daily Loop**: Each day cycles through Prepare → Travel → Encounter → Recover
- **State Machine**: Gauntlet tracks current phase and day number
- **Attribute Integration**: All six attributes provide mechanical value:
  - **STR**: Force-based solutions (breaking obstacles)
  - **DEX**: Movement speed, trap disarming, evasion
  - **CON**: Stamina pool, endurance checks
  - **INT**: Trap analysis, puzzle solving
  - **WIS**: Trap detection, environmental awareness
  - **CHA**: Team coordination, morale (if applicable)

### Win/Loss Conditions

- **Win**: Complete The Gauntlet (reach end) within day/turn limit (if applicable)
- **Loss**: Party wipe (all characters incapacitated) OR day/turn limit exceeded

## Testing Strategy (MVP)

- **Primary**: Playwright E2E tests for all user-facing functionality
- **Unit Tests**: Optional for MVP, can be added later for complex game logic
- **Test Data**: Fixtures for character attributes, game states, reproducible scenarios

## Serialization & Persistence

- **Entity State**: All entities must be serializable for save/load (future feature)
- **Game State**: `GameEngine.getState()` returns serializable state snapshot
- **MVP**: May not need persistence, but architecture supports it

## Development Workflow

1. **TDD Cycle**: RED → GREEN → REFACTOR
2. **Vertical Slicing**: Smallest end-to-end user-facing feature
3. **Incremental**: Build one mini-game (The Gauntlet) fully before adding others
4. **Framework-Agnostic Logic**: Game logic in pure TypeScript, React only for UI

## Constraints & Non-Goals (MVP)

- ❌ No real-time timers or `requestAnimationFrame`
- ❌ No multiplayer networking (single player controls party)
- ❌ No backtracking to previous encounters
- ❌ No save/load system (unless needed for MVP)
- ❌ No other mini-games beyond The Gauntlet
- ✅ Turn-based, synchronous state transitions
- ✅ ECS architecture for game logic
- ✅ React + Canvas for UI/rendering
- ✅ TypeScript for type safety

## Future Considerations (Post-MVP)

- World map with backtracking
- Partial puzzle state persistence
- Additional mini-games (Positional Skirmish, Court of Whispers, etc.)
- Skill progression system
- Campaign vs. Roguelike modes
- Save/load system
- Equipment and modifiers for attributes

