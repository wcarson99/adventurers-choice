# Encounter System Implementation Plan

## Overview

This plan implements the tactical grid-based encounter system as specified in `DESIGN.md`. The encounter system is the core gameplay mechanic where players solve puzzles using their party's attributes on a 10×10 grid.

## Current State Analysis

### ✅ What Exists
- Basic ECS structure (`World`, `Component`, `Entity`, `System`)
- Basic `Grid` class (8×8, needs upgrade to 10×10 with border structure)
- `EncounterView` component (basic placeholder, needs complete rewrite)
- Character system with attributes (`Attributes` interface)
- Mission system with `startMission()` that creates a basic world
- Basic `Action` type system
- Playwright E2E testing setup

### ❌ What's Missing
- 10×10 grid with border structure (entrance/exit zones, walls)
- Two-phase turn planning system (Movement → Action → Execute)
- DEX-based movement patterns
- STR-based pushing mechanics
- Fog of War system
- Attribute-based action validation
- Encounter win/loss conditions
- Canvas rendering (currently using DOM grid)
- Turn tracking and action queue
- All 6 attribute actions (STR push, DEX evade, INT modify, WIS scout, CON fortify, CHA rally)

## Implementation Strategy

### Testing Approach (Addressing Browser Visibility Concern)

Since we can't see the browser, we'll use a **state-first testing strategy**:

1. **State Assertions Over Visual Checks**: Test game state changes via `page.evaluate()` rather than visual elements
2. **Console Logging**: Add strategic `console.log()` statements that Playwright can capture
3. **Screenshot on Failure**: Configure Playwright to take screenshots on test failures
4. **DOM Structure Tests**: Test for specific data attributes and classes that indicate state
5. **Incremental Validation**: Test each system in isolation before integration

**Example Test Pattern:**
```typescript
// Instead of: expect(visual element).toBeVisible()
// We'll do:
const gridState = await page.evaluate(() => {
  const { world, grid } = window.gameState;
  return {
    characterPositions: getCharacterPositions(world),
    gridSize: { width: grid.width, height: grid.height },
    // ... other state
  };
});
expect(gridState.gridSize).toEqual({ width: 10, height: 10 });
```

### Phase 1: Foundation (Grid & Basic Structure)

**Goal**: Establish the 10×10 grid with border structure and basic entity placement.

#### Slice 1.1: Grid Structure Upgrade
- **Test**: Verify 10×10 grid with correct border zones
- **Implementation**:
  - Update `Grid` class to support 10×10 with border structure
  - Add methods: `isEntranceZone()`, `isExitZone()`, `isWall()`, `isPlayableArea()`
  - Update `GameState.startMission()` to use 10×10 grid
- **Validation**: Test grid coordinates and zone detection

#### Slice 1.2: Character Placement
- **Test**: All party members spawn in entrance zone (left side, rows 1-4)
- **Implementation**:
  - Create character entities with `PositionComponent` in entrance zone
  - Ensure no two characters share a space
- **Validation**: Verify all characters are in valid entrance positions

#### Slice 1.3: Exit Zone Detection
- **Test**: Win condition triggers when all characters reach exit zone
- **Implementation**:
  - Add exit zone check to encounter system
  - Update win condition logic
- **Validation**: Test win condition triggers correctly

### Phase 2: Movement System

**Goal**: Implement DEX-based movement patterns and two-phase planning.

#### Slice 2.1: Movement Patterns (DEX-based)
- **Test**: Characters with different DEX scores have correct movement options
  - DEX 1-3: Orthogonal only
  - DEX 4-6: Add diagonal
  - DEX 7-9: Add 2-square orthogonal
- **Implementation**:
  - Create `MovementSystem` to calculate valid moves
  - Add `getValidMoves(characterId, dex)` method
- **Validation**: Test movement pattern calculation for each DEX range

#### Slice 2.2: Movement Planning Phase
- **Test**: Player can plan movements for all characters, see ghost positions
- **Implementation**:
  - Add `MovementPlan` type to track planned movements
  - Create UI for movement planning (click character → click destination)
  - Show ghost/preview positions
- **Validation**: Test movement plan storage and preview

#### Slice 2.3: Movement Validation
- **Test**: Invalid moves are rejected (occupied squares, out of range, through walls)
- **Implementation**:
  - Add collision detection
  - Validate movement patterns
  - Check wall boundaries
- **Validation**: Test all invalid move scenarios

### Phase 3: Action System

**Goal**: Implement attribute-based actions with deterministic checks.

#### Slice 3.1: Action Planning Phase
- **Test**: Player can plan actions for all characters after movement
- **Implementation**:
  - Add `ActionPlan` type
  - Create action selection UI
  - Actions planned based on post-movement positions
- **Validation**: Test action plan storage

#### Slice 3.2: STR Push Action
- **Test**: Character with STR ≥3 can push objects, STR <3 cannot
- **Implementation**:
  - Create `PushableComponent` for grid objects
  - Implement push validation (STR requirement, weight limit, stamina cost)
  - Push formula: `staminaCost = Math.ceil(objectWeight / STR)`, max weight = `STR × 20`
- **Validation**: Test push requirements and costs

#### Slice 3.3: Pushable Objects
- **Test**: Objects can be pushed, block path, and clear path when moved
- **Implementation**:
  - Create obstacle entities with `PushableComponent`
  - Implement push execution (move object 1 square)
  - Update path clearing logic
- **Validation**: Test object movement and path clearing

#### Slice 3.4: Other Attribute Actions (MVP: Placeholders)
- **Test**: Action buttons show/hide based on attribute requirements
- **Implementation**:
  - Add action types: DEX (Evade), INT (Modify), WIS (Scout), CON (Fortify), CHA (Rally)
  - Implement deterministic attribute checks (meet requirement = available, else grayed out)
  - Placeholder implementations (full mechanics in post-MVP)
- **Validation**: Test action availability based on attributes

### Phase 4: Turn Execution

**Goal**: Implement atomic turn execution with sequential action resolution.

#### Slice 4.1: Turn Queue System
- **Test**: All planned movements and actions are queued correctly
- **Implementation**:
  - Create `TurnQueue` to store movement and action plans
  - Add "Execute Turn" button
- **Validation**: Test queue storage and retrieval

#### Slice 4.2: Atomic Execution
- **Test**: All movements execute first, then all actions, sequentially
- **Implementation**:
  - Execute all movements (simultaneously or in order)
  - Execute all actions in player-chosen order
  - Update entity positions and states
- **Validation**: Test execution order and state updates

#### Slice 4.3: Action Failure Handling
- **Test**: Failed actions don't prevent other actions from executing
- **Implementation**:
  - Validate actions before execution
  - Handle failures gracefully (log, continue with other actions)
- **Validation**: Test failure scenarios

### Phase 5: Fog of War & Visibility

**Goal**: Implement visibility system with 3-square range.

#### Slice 5.1: Visibility Calculation
- **Test**: Tiles within 3 squares of any character are visible
- **Implementation**:
  - Add `VisibilityComponent` or visibility state to grid
  - Calculate visible tiles (Manhattan distance ≤ 3)
  - Three states: Visible, Previously Seen (grayed), Obscured (dark)
- **Validation**: Test visibility calculation

#### Slice 5.2: Visibility Rendering
- **Test**: UI shows correct visibility states (visible, grayed, dark)
- **Implementation**:
  - Update `EncounterView` to render visibility states
  - Gray out previously seen tiles
  - Darken obscured tiles
- **Validation**: Test visual representation (via DOM classes/data attributes)

### Phase 6: Canvas Rendering (Optional for MVP)

**Goal**: Replace DOM grid with Canvas for better performance and visuals.

#### Slice 6.1: Canvas Setup
- **Test**: Canvas renders 10×10 grid correctly
- **Implementation**:
  - Create `EncounterCanvas` component
  - Draw grid, borders, zones
  - Replace DOM grid with canvas
- **Validation**: Test canvas rendering (via screenshot or canvas data)

#### Slice 6.2: Entity Rendering on Canvas
- **Test**: Characters and objects render correctly on canvas
- **Implementation**:
  - Draw entities at their positions
  - Handle sprites vs. colored circles
  - Update on state changes
- **Validation**: Test entity rendering

### Phase 7: Encounter Generation

**Goal**: Simple procedural generation for MVP (reverse pathfinding).

#### Slice 7.1: Simple Obstacle Placement
- **Test**: Generated encounters have solvable paths
- **Implementation**:
  - Basic reverse pathfinding: start at exit, work backwards
  - Place obstacles that block path but are pushable
  - Ensure at least one solution exists
- **Validation**: Test generated encounters are solvable

#### Slice 7.2: Encounter Templates
- **Test**: Can generate different encounter types (simple obstacle, treasure opportunity)
- **Implementation**:
  - Create encounter template system
  - Simple obstacle encounter (push blocks to clear path)
  - Simple treasure opportunity (optional, reward on completion)
- **Validation**: Test encounter generation and completion

### Phase 8: Integration & Polish

**Goal**: Integrate all systems and add polish.

#### Slice 8.1: Turn Counter & Pacing
- **Test**: Turn counter increments, pacing penalties apply after turn 20/30
- **Implementation**:
  - Track total party actions
  - Apply stamina cost increase after turn 20
  - Apply attribute check penalty after turn 30
- **Validation**: Test pacing mechanics

#### Slice 8.2: Stamina System
- **Test**: Actions consume stamina, characters can't act with 0 stamina
- **Implementation**:
  - Add `StaminaComponent` (current, max = 5 + CON)
  - Consume stamina on actions
  - Block actions if insufficient stamina
- **Validation**: Test stamina consumption and blocking

#### Slice 8.3: Food Consumption (Tactical)
- **Test**: Consuming food during encounter restores stamina
- **Implementation**:
  - Add "Consume Food" action (costs 2 stamina, restores +5, net +3)
  - Update food resource tracking
- **Validation**: Test food consumption mechanics

#### Slice 8.4: UI/UX Polish
- **Test**: UI clearly shows phase, planned actions, resource costs
- **Implementation**:
  - Action queue visualization sidebar
  - Phase indicator
  - Character portraits with planned actions
  - Resource cost display
- **Validation**: Test UI clarity and information display

## File Structure

```
src/
  game-engine/
    ecs/
      Component.ts (extend with new components)
      Entity.ts (existing)
      System.ts (existing)
      World.ts (existing)
    grid/
      Grid.ts (upgrade to 10×10)
      GridZones.ts (new: zone detection)
    encounters/
      EncounterSystem.ts (new: encounter logic)
      MovementSystem.ts (new: movement patterns)
      ActionSystem.ts (new: action validation/execution)
      TurnSystem.ts (new: turn queue and execution)
      VisibilitySystem.ts (new: fog of war)
      EncounterGenerator.ts (new: procedural generation)
    GameEngine.ts (extend: integrate encounter systems)
  ui/
    canvas/
      EncounterCanvas.tsx (new: canvas rendering)
    components/
      EncounterView.tsx (rewrite: two-phase planning UI)
      ActionQueue.tsx (new: action queue sidebar)
      CharacterActionPanel.tsx (new: character action selection)
  types/
    Action.ts (extend: movement and action types)
    Encounter.ts (new: encounter state types)
```

## Testing Strategy Details

### Test Organization

```
tests/
  e2e/
    encounters/
      grid-structure.spec.ts (Phase 1)
      movement.spec.ts (Phase 2)
      actions.spec.ts (Phase 3)
      turn-execution.spec.ts (Phase 4)
      visibility.spec.ts (Phase 5)
      generation.spec.ts (Phase 7)
      integration.spec.ts (Phase 8)
```

### Test Helpers

Create test utilities for common operations:

```typescript
// tests/e2e/helpers/encounter-helpers.ts
export async function getEncounterState(page) {
  return await page.evaluate(() => {
    // Access game state and return structured data
    const { world, grid, encounterState } = window.gameState;
    return {
      characters: getCharacters(world),
      obstacles: getObstacles(world),
      grid: { width: grid.width, height: grid.height },
      turn: encounterState.turn,
      // ... etc
    };
  });
}

export async function planMovement(page, characterId, targetX, targetY) {
  // Helper to plan a movement via UI or direct state manipulation
}

export async function executeTurn(page) {
  // Helper to click "Execute Turn" button
}
```

### Debugging Without Browser

1. **Console Logging**: Add `console.log()` in key functions, capture via Playwright
2. **State Snapshots**: Use `page.evaluate()` to get full state snapshots
3. **Screenshot on Failure**: Configure Playwright to auto-screenshot failures
4. **DOM Inspection**: Test for data attributes that indicate state
5. **Test Isolation**: Each test should be independent and verify specific behavior

## Risk Mitigation

### Risk: Complex State Management
- **Mitigation**: Start with simple state, add complexity incrementally
- **Approach**: Test state transitions explicitly, not just final state

### Risk: Canvas Rendering Issues
- **Mitigation**: Start with DOM grid, migrate to canvas later (Phase 6 is optional)
- **Approach**: Test state first, rendering second

### Risk: Two-Phase Planning Complexity
- **Mitigation**: Implement phases sequentially, test each independently
- **Approach**: Movement phase first, then action phase, then integration

### Risk: Attribute Action Balance
- **Mitigation**: Start with STR push (most defined), add others as placeholders
- **Approach**: MVP focuses on path clearing puzzles (STR primary)

## Success Criteria

1. ✅ 10×10 grid with correct border structure
2. ✅ All party members can move using DEX-based patterns
3. ✅ Characters with STR ≥3 can push obstacles
4. ✅ Two-phase planning works (movement → action → execute)
5. ✅ Win condition triggers when all characters reach exit
6. ✅ Fog of War shows/hides tiles correctly
7. ✅ Simple encounters can be generated and solved
8. ✅ All tests pass and can be run without manual browser inspection

## Next Steps

1. Review this plan with team/stakeholders
2. Start with Phase 1, Slice 1.1 (Grid Structure Upgrade)
3. Follow TDD: Write failing test → Implement → Refactor
4. Iterate through phases incrementally
5. Test each slice before moving to next

## Notes

- **Canvas is Optional for MVP**: Can use DOM grid initially, migrate later
- **Full Attribute Actions are Post-MVP**: MVP focuses on STR push for path clearing
- **Procedural Generation is Simple**: Reverse pathfinding is sufficient for MVP
- **Testing is State-First**: Focus on game state, not visuals (though we'll test both)

