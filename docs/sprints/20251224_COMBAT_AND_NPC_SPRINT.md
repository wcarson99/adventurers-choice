---
name: Combat Minigame Prototype
overview: ""
todos:
  - id: abandon-button-ui
    content: Add Abandon button to ScenarioInfoPanel (visible only for obstacle scenarios, at bottom of panel)
    status: pending
  - id: abandon-wiring
    content: Wire up Abandon functionality in ScenarioView (pass scenario type, add onAbandon callback that returns to town)
    status: pending
    dependencies:
      - abandon-button-ui
  - id: abandon-test
    content: Test Abandon button - verify it appears for obstacle scenarios, returns to town, doesn't complete mission
    status: pending
    dependencies:
      - abandon-wiring
  - id: npc-component
    content: Add NPCComponent to Component.ts to mark NPC entities (StatsComponent already has hp/maxHp)
    status: pending
  - id: npc-factory
    content: Extend ScenarioFactory to create NPC entities (enemy/npc type) with all required components
    status: pending
    dependencies:
      - npc-component
  - id: npc-factory-test
    content: Test NPC creation - verify NPCs are created with correct components and distinct visuals
    status: pending
    dependencies:
      - npc-factory
  - id: turn-system-npcs
    content: Update TurnSystem.startRound() to accept and include NPCs in turn order (ordered by MOV)
    status: pending
    dependencies:
      - npc-component
  - id: grid-minigame-npcs
    content: Update GridMiniGame to include NPCs in turn order (modify getPlayerCharacters or create getAllCharacters)
    status: pending
    dependencies:
      - turn-system-npcs
  - id: npc-turn-order-test
    content: Test NPC turn order - verify NPCs appear in turn order alongside players, ordered by MOV
    status: pending
    dependencies:
      - grid-minigame-npcs
  - id: attack-action
    content: Create AttackAction class (extends Action, requires adjacent target, costs 20 AP, deals PWR-based damage)
    status: pending
    dependencies:
      - npc-component
  - id: attack-execution
    content: Add executeAttackAction() to ActionExecutionSystem (damage calculation, HP reduction)
    status: pending
    dependencies:
      - attack-action
  - id: attack-integration
    content: Integrate AttackAction into ActionFactory, GridController, and action exports
    status: pending
    dependencies:
      - attack-execution
  - id: attack-test
    content: Test attack action - verify attacks work, deal damage, reduce HP, cost AP correctly
    status: pending
    dependencies:
      - attack-integration
  - id: ai-system
    content: Create AISystem with simple logic (find nearest player, move toward, attack if adjacent, pass if no actions)
    status: pending
    dependencies:
      - attack-action
      - turn-system-npcs
  - id: ai-integration
    content: Integrate AI into ScenarioView - auto-execute NPC turns after player passes
    status: pending
    dependencies:
      - ai-system
  - id: ai-test
    content: Test AI behavior - verify NPCs move toward players and attack when adjacent
    status: pending
    dependencies:
      - ai-integration
  - id: combat-win-condition
    content: Implement checkWinConditionSpecific() in CombatMiniGame (all NPCs defeated - HP <= 0)
    status: pending
    dependencies:
      - npc-component
      - attack-action
  - id: combat-loss-condition
    content: Implement checkLossConditionSpecific() in CombatMiniGame (all players defeated - HP <= 0)
    status: pending
    dependencies:
      - npc-component
      - attack-action
  - id: win-loss-test
    content: Test win/loss conditions - verify scenario ends correctly when all enemies/players defeated
    status: pending
    dependencies:
      - combat-win-condition
      - combat-loss-condition
  - id: combat-grid
    content: Add combat grid support to Grid.ts (4x6 interior with walls on borders, configurable)
    status: pending
  - id: combat-grid-integration
    content: Use combat grid in CombatMiniGame initialization
    status: pending
    dependencies:
      - combat-grid
  - id: combat-grid-test
    content: Test combat grid - verify 4x6 layout with walls, characters can move within bounds
    status: pending
    dependencies:
      - combat-grid-integration
  - id: flee-config
    content: "Add allowFleeing?: boolean to CombatScenarioConfig"
    status: pending
  - id: flee-button-ui
    content: Add Flee button to ScenarioInfoPanel (visible only for combat scenarios with allowFleeing=true)
    status: pending
    dependencies:
      - flee-config
  - id: flee-functionality
    content: Implement flee handling in ScenarioView (end scenario as 'fled' state, return to town)
    status: pending
    dependencies:
      - flee-button-ui
  - id: flee-test
    content: Test Flee button - verify it appears for combat scenarios, ends scenario as fled, returns to town
    status: pending
    dependencies:
      - flee-functionality
  - id: npc-rendering
    content: Update ScenarioGrid to render NPCs with distinct visuals (different color/sprite from players)
    status: pending
    dependencies:
      - npc-factory
  - id: npc-selection
    content: Update ScenarioView to prevent selecting NPCs for player actions
    status: pending
    dependencies:
      - npc-component
  - id: npc-ui-test
    content: Test NPC UI - verify NPCs render distinctly, cannot be selected for player actions
    status: pending
    dependencies:
      - npc-rendering
      - npc-selection
  - id: combat-test-scenario
    content: Create combat-test-job.json with 1-2 players, 1-2 NPCs, 4x6 grid, allowFleeing=true
    status: pending
    dependencies:
      - npc-factory
      - combat-grid
      - flee-config
  - id: combat-e2e-test
    content: Create E2E test for combat (NPCs in turn order, AI behavior, win/loss, flee button)
    status: pending
    dependencies:
      - combat-test-scenario
      - ai-integration
      - win-loss-test
      - flee-test
---

# Combat Minigame Prototype

## Overview

Prototype the combat minigame with NPCs that participate in turn order, attack player characters, and can be defeated. The combat minigame differs from obstacle minigames in:

- NPCs run by computer that participate in turn order and attack players
- Grid may have different shape (default 4x6 surrounded by walls)
- Some combat scenarios allow fleeing
- Win condition: defeat all enemies

## Difficulty Scale

- **1 (Easy)**: Simple UI changes, adding props, basic component updates
- **2 (Moderate)**: Logic changes requiring understanding of existing systems, moderate complexity
- **3 (Medium)**: New systems with multiple integration points, moderate testing requirements
- **4 (Hard)**: Complex systems with many dependencies, significant testing, potential edge cases
- **5 (Very Hard)**: Core system changes affecting multiple subsystems, extensive testing required

## Phase 1: Abandon Button for Obstacle Scenarios

### Step 1.1: Add Abandon Button to ScenarioInfoPanel

- **File**: `src/ui/components/scenario/ScenarioInfoPanel.tsx`
- Add an "Abandon" button at the bottom of the info panel
- Button should only be visible for obstacle scenarios
- On click, call a callback to return to town
- Button styling should be distinct (e.g., red/warning color)

### Step 1.2: Wire Up Abandon Functionality

- **File**: `src/ui/components/ScenarioView.tsx`
- Pass scenario type (obstacle/combat) to `ScenarioInfoPanel`
- Add `onAbandon` callback that calls `setView('TOWN')` or `completeMission()`
- Ensure abandoning doesn't mark mission as complete

## Phase 2: Combat Minigame Core Features

### Step 2.1: Extend Component System for NPCs

- **File**: `src/game-engine/ecs/Component.ts`
- Add `NPCComponent` or `EnemyComponent` to mark NPC entities
- Add `StatsComponent` (HP) if not already present (check existing StatsComponent)
- Add `HealthComponent` or extend `StatsComponent` for HP tracking

### Step 2.2: Extend ScenarioFactory for NPC Creation

- **File**: `src/scenarios/ScenarioFactory.ts`
- Add `enemy` or `npc` entity type handling
- Create NPC entities with:
  - Position, Renderable, Attributes, Stats (HP), Direction components
  - NPC/Enemy component to mark them
  - Different sprite/color to distinguish from players

### Step 2.3: Update TurnSystem to Include NPCs

- **File**: `src/game-engine/encounters/TurnSystem.ts`
- Modify `startRound()` to accept both player and NPC characters
- Order all characters (players + NPCs) by MOV for turn order
- Ensure NPCs participate in turn rotation

### Step 2.4: Update GridMiniGame to Include NPCs in Turn Order

- **File**: `src/mini-games/GridMiniGame.ts`
- Modify `getPlayerCharacters()` to return all characters (players + NPCs)
- Or create separate `getAllCharacters()` that includes NPCs
- Update `initialize()` to pass all characters to `startRound()`

### Step 2.5: Create Simple AI System

- **File**: `src/game-engine/encounters/AISystem.ts` (NEW)
- Implement simple AI that:
  - Finds nearest player character
  - Moves toward nearest player (if AP allows)
  - Attacks if adjacent to player
  - Passes if no valid actions
- AI should use existing action system (MoveAction, AttackAction)

### Step 2.6: Create Attack Action

- **File**: `src/game-engine/actions/AttackAction.ts` (NEW)
- Extend `Action` class
- Attack action:
  - Requires adjacent target (melee) or within range (ranged)
  - Costs AP (e.g., 20 AP)
  - Deals damage based on PWR attribute
  - Reduces target's HP
- **File**: `src/game-engine/encounters/ActionExecutionSystem.ts`
- Add `executeAttackAction()` method
- Handle damage calculation and HP reduction

### Step 2.7: Update ActionFactory and Action System

- **File**: `src/game-engine/actions/ActionFactory.ts`
- Add `createAttackAction(targetId: number)` method
- **File**: `src/game-engine/actions/index.ts`
- Export `AttackAction`
- **File**: `src/game-engine/encounters/GridController.ts`
- Add attack action support to `executeActionImmediate()`

### Step 2.8: Implement Combat Win Condition

- **File**: `src/mini-games/CombatMiniGame.ts`
- Implement `checkWinConditionSpecific()`:
  - Check if all NPCs/enemies are defeated (HP <= 0)
  - Return true when all enemies defeated
- **File**: `src/game-engine/encounters/WinConditionSystem.ts`
- Add method to check "all enemies defeated" condition

### Step 2.9: Implement Combat Loss Condition

- **File**: `src/mini-games/CombatMiniGame.ts`
- Implement `checkLossConditionSpecific()`:
  - Check if all player characters are defeated (HP <= 0)
  - Return true when all players defeated

### Step 2.10: Add Combat-Specific Grid (4x6 with Walls)

- **File**: `src/game-engine/grid/Grid.ts`
- Add method to create combat grid (4x6 with walls)
- Or add constructor parameter for grid type
- Default combat grid: 4x6 interior with walls on borders
- **File**: `src/mini-games/CombatMiniGame.ts`
- Use combat grid when initializing

### Step 2.11: Add Flee Button for Combat Scenarios

- **File**: `src/ui/components/scenario/ScenarioInfoPanel.tsx`
- Add "Flee" button (similar to Abandon, but for combat)
- Only visible when scenario type is 'combat' and fleeing is allowed
- **File**: `src/types/ScenarioConfig.ts`
- Add `allowFleeing?: boolean` to `CombatScenarioConfig`
- **File**: `src/ui/components/ScenarioView.tsx`
- Handle flee action: end scenario as "fled" (special loss state)

### Step 2.12: Update UI to Show NPCs

- **File**: `src/ui/components/scenario/ScenarioGrid.tsx`
- Ensure NPCs render with different visual (different color/sprite)
- **File**: `src/ui/components/ScenarioView.tsx`
- Update `getPlayerCharacters()` to distinguish players from NPCs
- Don't allow selecting NPCs for player actions

### Step 2.13: Handle NPC Turns Automatically

- **File**: `src/ui/components/ScenarioView.tsx`
- After player passes, check if next character is NPC
- If NPC, automatically execute AI actions until NPC passes
- Continue until player character's turn or round complete

## Phase 3: Testing and Refinement

### Step 3.1: Create Test Combat Scenario

- **File**: `public/jobs/combat-test-job.json` (NEW)
- Create simple combat scenario with:
  - 1-2 player characters
  - 1-2 NPC enemies
  - 4x6 grid
  - `allowFleeing: true`
- **File**: `public/jobs/manifest.json`
- Add combat test job to manifest

### Step 3.2: Update E2E Tests

- **File**: `tests/e2e/scenarios/combat.spec.ts` (NEW)
- Test basic combat flow:
  - NPCs appear in turn order
  - NPCs move and attack
  - Win condition (defeat all enemies)
  - Loss condition (all players defeated)
  - Flee button appears and works

## Implementation Notes

- **NPC Identification**: Use component-based approach (`NPCComponent`) rather than checking attributes
- **Turn Order**: All characters (players + NPCs) ordered by MOV, NPCs get turns just like players
- **AI Simplicity**: Start with simple "move toward nearest player and attack" logic
- **Attack Range**: Start with melee (adjacent only), can extend to ranged later
- **Grid Default**: Combat uses 4x6 grid with walls, but can be configured per scenario
- **Fleeing**: Party flees together (not individual), ends scenario as "fled" state
- **HP System**: Use existing `StatsComponent` with `hp` and `maxHp` fields

## Files to Modify/Create

### New Files:

- `src/game-engine/encounters/AISystem.ts`
- `src/game-engine/actions/AttackAction.ts`
- `public/jobs/combat-test-job.json`
- `tests/e2e/scenarios/combat.spec.ts`

### Modified Files:

- `src/game-engine/ecs/Component.ts` - Add NPC/Enemy component
- `src/scenarios/ScenarioFactory.ts` - Handle NPC entity creation
- `src/game-engine/encounters/TurnSystem.ts` - Include NPCs in turn order
- `src/mini-games/GridMiniGame.ts` - Include NPCs in turn order
- `src/game-engine/encounters/ActionExecutionSystem.ts` - Add attack execution
- `src/game-engine/actions/ActionFactory.ts` - Add attack action creation
- `src/game-engine/actions/index.ts` - Export AttackAction
- `src/game-engine/encounters/GridController.ts` - Support attack actions
- `src/mini-games/CombatMiniGame.ts` - Implement win/loss conditions, combat grid
- `src/game-engine/grid/Grid.ts` - Add combat grid support
- `src/types/ScenarioConfig.ts` - Add `allowFleeing` to combat config
- `src/ui/components/scenario/ScenarioInfoPanel.tsx` - Add Abandon and Flee buttons
- `src/ui/components/ScenarioView.tsx` - Handle abandon/flee, auto-execute NPC turns

## Task Difficulty Estimates and Testing Requirements

### Phase 1: Abandon Button (Total: Easy-Moderate)

| Task ID | Difficulty | Testing Requirement |
|---------|-----------|---------------------|
| `abandon-button-ui` | 1 (Easy) | Manual: Verify button appears at bottom of info panel for obstacle scenarios only |
| `abandon-wiring` | 2 (Moderate) | Manual: Verify button calls callback, returns to town, doesn't complete mission |
| `abandon-test` | 1 (Easy) | E2E: Test that abandon button works end-to-end |

### Phase 2: Combat Core Features (Total: Medium-Hard)

| Task ID | Difficulty | Testing Requirement |
|---------|-----------|---------------------|
| `npc-component` | 1 (Easy) | Unit/Manual: Verify component type added, can be attached to entities |
| `npc-factory` | 2 (Moderate) | Unit/Manual: Verify NPCs created with all required components, distinct visuals |
| `npc-factory-test` | 1 (Easy) | Manual: Load scenario with NPCs, verify they appear correctly |
| `turn-system-npcs` | 3 (Medium) | Unit/E2E: Verify NPCs included in turn order, ordered by MOV correctly |
| `grid-minigame-npcs` | 2 (Moderate) | Unit: Verify getAllCharacters includes NPCs, passed to startRound |
| `npc-turn-order-test` | 2 (Moderate) | E2E: Verify NPCs appear in turn order, can take turns |
| `attack-action` | 3 (Medium) | Unit: Verify AttackAction class, canExecute logic, AP costs |
| `attack-execution` | 3 (Medium) | Unit: Verify damage calculation, HP reduction, edge cases (0 HP, etc.) |
| `attack-integration` | 2 (Moderate) | Unit: Verify AttackAction integrated into ActionFactory, GridController |
| `attack-test` | 2 (Moderate) | E2E: Verify attacks work, deal damage, reduce HP, cost AP |
| `ai-system` | 4 (Hard) | Unit: Verify AI finds nearest player, moves toward, attacks when adjacent |
| `ai-integration` | 3 (Medium) | Integration: Verify AI executes automatically after player passes |
| `ai-test` | 2 (Moderate) | E2E: Verify NPCs move toward players and attack when adjacent |
| `combat-win-condition` | 2 (Moderate) | Unit/E2E: Verify win condition triggers when all NPCs HP <= 0 |
| `combat-loss-condition` | 2 (Moderate) | Unit/E2E: Verify loss condition triggers when all players HP <= 0 |
| `win-loss-test` | 2 (Moderate) | E2E: Verify scenario ends correctly for win/loss conditions |
| `combat-grid` | 3 (Medium) | Unit: Verify 4x6 grid with walls, wall detection, boundary checks |
| `combat-grid-integration` | 1 (Easy) | Manual: Verify CombatMiniGame uses combat grid |
| `combat-grid-test` | 2 (Moderate) | E2E: Verify 4x6 layout, walls, characters can move within bounds |
| `flee-config` | 1 (Easy) | Manual: Verify allowFleeing field added to CombatScenarioConfig |
| `flee-button-ui` | 1 (Easy) | Manual: Verify Flee button appears for combat scenarios with allowFleeing=true |
| `flee-functionality` | 2 (Moderate) | Manual: Verify flee ends scenario as 'fled', returns to town |
| `flee-test` | 1 (Easy) | E2E: Verify Flee button works end-to-end |
| `npc-rendering` | 2 (Moderate) | Manual: Verify NPCs render with distinct color/sprite from players |
| `npc-selection` | 2 (Moderate) | Manual: Verify NPCs cannot be selected for player actions |
| `npc-ui-test` | 1 (Easy) | E2E: Verify NPC rendering and selection prevention |
| `combat-test-scenario` | 1 (Easy) | Manual: Verify combat test scenario loads correctly |
| `combat-e2e-test` | 4 (Hard) | E2E: Comprehensive test of all combat features together |

### Testing Strategy

**Before marking any task complete:**

1. **Code Review**: Ensure code follows architecture patterns (ECS, turn-based)
2. **Manual Testing**: Test the feature manually in the browser
3. **Unit Tests** (where applicable): Test individual functions/classes
4. **E2E Tests** (for user-facing features): Test complete user flows
5. **Integration Testing**: Verify feature works with existing systems

**Test Execution:**

- Run `npm run test:e2e` for E2E tests
- Run `npm run dev` for manual testing
- Check browser console for errors
- Verify no regressions in existing functionality

### Critical Path Dependencies

The following tasks are on the critical path and should be completed in order:

1. **NPC Foundation**: `npc-component` → `npc-factory` → `npc-factory-test`
2. **Turn System**: `turn-system-npcs` → `grid-minigame-npcs` → `npc-turn-order-test`
3. **Attack System**: `attack-action` → `attack-execution` → `attack-integration` → `attack-test`
4. **AI System**: `ai-system` (depends on `attack-action`, `turn-system-npcs`) → `ai-integration` → `ai-test`
5. **Win/Loss**: `combat-win-condition` + `combat-loss-condition` → `win-loss-test`
6. **Combat Grid**: `combat-grid` → `combat-grid-integration` → `combat-grid-test`
7. **Flee System**: `flee-config` → `flee-button-ui` → `flee-functionality` → `flee-test`

### Estimated Total Effort

- **Phase 1 (Abandon)**: ~2-3 hours (Easy tasks)
- **Phase 2 (Combat Core)**: ~20-30 hours (Mix of Easy to Hard tasks)
- **Phase 3 (Testing)**: ~4-6 hours (E2E test creation and refinement)

**Total**: ~26-39 hours of development time

### Risk Areas

**High Risk (Requires careful attention):**

- `ai-system` (Difficulty 4): Complex logic, many edge cases
- `turn-system-npcs` (Difficulty 3): Core system change, affects many components
- `combat-e2e-test` (Difficulty 4): Comprehensive testing of all systems together

**Medium Risk:**

- `attack-action` and `attack-execution` (Difficulty 3): New action type, damage calculation
- `combat-grid` (Difficulty 3): Grid system changes, wall detection logic

