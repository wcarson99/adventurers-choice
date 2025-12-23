---
name: Action Point Turn Structure
overview: Refactor the turn structure from a phase-based system (movement/skill/executing) to an action point-based system where characters take turns ordered by MOV, each with 50 AP per turn, executing actions immediately when selected.
todos:
  - id: define-action-costs
    content: Define action cost constants (MOVE=15, PUSH=25, PASS=0) and integrate throughout codebase
    status: completed
    difficulty: 1
  - id: create-action-point-system
    content: Create ActionPointSystem.ts to track AP per character (default 50), deduct AP on actions, check affordability, reset AP at turn start
    status: completed
    difficulty: 2
    dependencies:
      - define-action-costs
  - id: refactor-turn-system
    content: Refactor TurnSystem.ts to track current active character, character turn order (by MOV), round management, and turn advancement (nextCharacter, passTurn, startRound)
    status: completed
    difficulty: 4
  - id: update-action-execution-ap
    content: Update ActionExecutionSystem.ts to deduct AP on action execution (move=15, push=25), support immediate execution, add executePassAction
    status: completed
    difficulty: 3
    dependencies:
      - create-action-point-system
      - define-action-costs
  - id: update-encounter-controller
    content: Update EncounterController.ts to remove phase management, integrate ActionPointSystem, add turn order management, add executeActionImmediate method
    status: completed
    difficulty: 5
    dependencies:
      - create-action-point-system
      - refactor-turn-system
      - update-action-execution-ap
  - id: refactor-encounter-view-ui
    content: Refactor EncounterView.tsx to remove phase-based UI, add current character turn display, add AP display, show only affordable actions, execute actions immediately, add Pass button
    status: completed
    difficulty: 5
    dependencies:
      - update-encounter-controller
  - id: update-action-ui-components
    content: Update action UI components to show action costs, disable/hide unaffordable actions, show current AP remaining, execute immediately on selection
    status: pending
    difficulty: 3
    dependencies:
      - refactor-encounter-view-ui
  - id: update-tests
    content: Update existing E2E tests (path-planning, encounter-completion, grid-structure) to work with new turn structure. Create new test files: action-points.spec.ts, turn-order.spec.ts, immediate-execution.spec.ts, action-affordability.spec.ts. Update EncounterHelpers with new methods. Run npm run test:e2e and verify all tests pass.
    status: pending
    difficulty: 4
    dependencies:
      - refactor-encounter-view-ui
  - id: remove-deprecated-code
    content: Remove or deprecate EncounterPhaseManager, MovementPlan usage, and phase-related state
    status: pending
    difficulty: 2
    dependencies:
      - refactor-encounter-view-ui
      - update-tests
---

# Action Point Turn Structure Refactoring

## Overview

Refactor the encounter turn structure from a phase-based planning system to an action point (AP) based system where:
- Each character has 50 AP per turn (resets at start of their turn)
- Rounds consist of each character taking a turn, ordered by MOV stat
- Characters execute actions immediately when selected (move=15 AP, push=25 AP, pass=0 AP ends turn)
- Only affordable actions are shown in the UI

## Current State

- **TurnSystem**: Tracks turn/round but uses old phase-based model
- **EncounterPhaseManager**: Manages movement/skill/executing phases (to be removed)
- **ActionExecutionSystem**: Executes batched planned actions
- **EncounterView**: Complex phase-based UI with movement planning and skill planning phases

## Architecture Changes

### New Systems

1. **ActionPointSystem** (`src/game-engine/encounters/ActionPointSystem.ts`)
   - Track AP for each character (default 50 at turn start)
   - Deduct AP when actions execute
   - Check if character can afford action
   - Reset AP to 50 at start of character's turn

2. **Refactored TurnSystem** (`src/game-engine/encounters/TurnSystem.ts`)
   - Track current round number
   - Track current active character (whose turn it is)
   - Order characters by MOV at round start
   - Advance to next character when they pass
   - Advance to next round when all characters have passed
   - Remove phase-based logic

### Modified Systems

3. **ActionExecutionSystem** (`src/game-engine/encounters/ActionExecutionSystem.ts`)
   - Execute actions immediately (not batched)
   - Deduct AP when executing
   - Support "pass" action that ends turn
   - Remove dependency on planned actions queue

4. **EncounterController** (`src/game-engine/encounters/EncounterController.ts`)
   - Remove phase management
   - Add AP system integration
   - Add character turn order management
   - Update action execution to be immediate

5. **EncounterView** (`src/ui/components/EncounterView.tsx`)
   - Remove phase-based UI (movement/skill/executing)
   - Show current character's turn
   - Show available AP
   - Show only affordable actions
   - Execute actions immediately when selected
   - Show "Pass" button (always available)

### Removed/Deprecated

- **EncounterPhaseManager**: No longer needed (phases removed)
- **MovementPlan**: No longer needed (actions execute immediately)
- **PlannedAction queue**: Actions execute immediately, no planning phase

## Implementation Plan

### Phase 1: Foundation (Difficulty: 1-4)

1. **Define Action Costs** (Difficulty: 1)
   - Create constants file: `ACTION_COSTS = { MOVE: 15, PUSH: 25, PASS: 0 }`
   - Export from appropriate location (e.g., `src/game-engine/encounters/constants.ts`)
   - No dependencies

2. **Create ActionPointSystem** (Difficulty: 2, Depends on: define-action-costs)
   - Track AP per character (Map<characterId, number>)
   - Methods: `getAP(characterId)`, `deductAP(characterId, amount)`, `resetAP(characterId)`, `canAfford(characterId, cost)`
   - Default AP: 50
   - Use ACTION_COSTS for affordability checks

3. **Refactor TurnSystem** (Difficulty: 4, No dependencies)
   - Add `currentActiveCharacter: number | null`
   - Add `characterTurnOrder: number[]` (ordered by MOV)
   - Add `getCurrentActiveCharacter()`, `getCharacterTurnOrder()`
   - Add `startRound(getPlayerCharacters, world)` - orders characters by MOV
   - Add `nextCharacter()` - moves to next character in order
   - Add `passTurn()` - ends current character's turn, moves to next
   - Add `isRoundComplete()` - checks if all characters have passed

### Phase 2: Core Systems Integration (Difficulty: 3-5)

4. **Update ActionExecutionSystem** (Difficulty: 3, Depends on: create-action-point-system, define-action-costs)
   - Add AP deduction on action execution
   - Support immediate execution (not batched)
   - Add `executeMoveAction(world, grid, characterId, targetPos, apSystem)` - deducts 15 AP
   - Add `executePushAction(world, grid, characterId, targetId, apSystem)` - deducts 25 AP
   - Add `executePassAction(characterId, turnSystem, apSystem)` - ends turn, resets AP
   - Use ACTION_COSTS constants

5. **Update EncounterController** (Difficulty: 5, Depends on: create-action-point-system, refactor-turn-system, update-action-execution-ap)
   - Remove phase manager integration
   - Add ActionPointSystem instance
   - Add methods: `getCurrentActiveCharacter()`, `getCharacterAP(characterId)`, `canAffordAction(characterId, actionType)`
   - Add `startRound(getPlayerCharacters, world)` - initializes turn order
   - Add `executeActionImmediate(world, grid, actionType, characterId, target?)` - executes action immediately
   - Add `passTurn()` - ends current character's turn
   - Update `reset()` to reset AP system and turn system

### Phase 3: UI Refactoring (Difficulty: 3-5)

6. **Refactor EncounterView** (Difficulty: 5, Depends on: update-encounter-controller)
   - Remove phase state (`movement`, `skill`, `executing`)
   - Remove MovementPlan usage
   - Remove planned actions queue
   - Add current character turn display
   - Add AP display for current character
   - Add action selection UI (only show affordable actions)
   - Add "Pass" button
   - Execute actions immediately when selected
   - Update `getAvailableActions()` to filter by AP affordability
   - Remove movement planning phase UI
   - Remove skill planning phase UI

7. **Update Action UI Components** (Difficulty: 3, Depends on: refactor-encounter-view-ui)
   - Show action costs (e.g., "Move (15 AP)", "Push (25 AP)", "Pass (0 AP)")
   - Disable/hide actions character can't afford
   - Show current AP remaining
   - Update action buttons to execute immediately

### Phase 4: Testing & Cleanup (Difficulty: 2-4)

8. **Update Tests** (Difficulty: 4, Depends on: refactor-encounter-view-ui)
   - Update existing E2E tests to work with new turn structure
   - Remove phase-based test expectations
   - Add tests for AP system
   - Add tests for character turn order (MOV-based)
   - Add tests for immediate action execution
   - Add tests for action affordability

9. **Remove Deprecated Code** (Difficulty: 2, Depends on: refactor-encounter-view-ui, update-tests)
   - Remove EncounterPhaseManager (or mark as deprecated)
   - Remove MovementPlan usage
   - Clean up phase-related state in EncounterView

## Key Files to Modify

- `src/game-engine/encounters/TurnSystem.ts` - Refactor for character turns
- `src/game-engine/encounters/ActionPointSystem.ts` - NEW: AP tracking
- `src/game-engine/encounters/ActionExecutionSystem.ts` - Immediate execution + AP
- `src/game-engine/encounters/EncounterController.ts` - Remove phases, add AP/turn management
- `src/ui/components/EncounterView.tsx` - Remove phase UI, add AP/turn UI
- `src/ui/components/encounter/EncounterInfoPanel.tsx` - Update to show AP and current turn
- `src/ui/components/encounter/useMovementPlanning.ts` - May be removed or simplified
- `src/ui/components/encounter/useSkillPlanning.ts` - May be removed or simplified

## Action Cost Constants

```typescript
export const ACTION_COSTS = {
  MOVE: 15,
  PUSH: 25,
  PASS: 0,
} as const;
```

## Turn Flow

1. **Round Start**: Order characters by MOV (highest first), set first character as active, reset their AP to 50
2. **Character Turn**: 
   - Show available actions (only those character can afford)
   - Player selects action → executes immediately → AP deducted
   - Repeat until player selects "Pass"
3. **Pass**: Current character's turn ends, AP resets to 50, move to next character
4. **Round End**: When all characters have passed, start new round (re-order by MOV)

## Win Condition

Win condition checking remains the same - check after each action execution (or at end of round, as appropriate).

## Difficulty Scale

**1 = Easy** - Straightforward task, minimal complexity

**2 = Medium-Easy** - Simple logic, clear requirements

**3 = Medium** - Moderate complexity, some design decisions needed

**4 = Medium-Hard** - Complex logic extraction, careful refactoring required

**5 = Hard** - High complexity, multiple dependencies, integration challenges

## Dependency Graph

### Phase 1: Foundation (Can be done in parallel)

```
define-action-costs (1) ──> create-action-point-system (2)
refactor-turn-system (4) ──┐
```

### Phase 2: Core Systems Integration

```
create-action-point-system (2) ──┐
define-action-costs (1) ─────────┼──> update-action-execution-ap (3)
                                  │
update-action-execution-ap (3) ──┼──┐
create-action-point-system (2) ───┘  │
refactor-turn-system (4) ────────────┼──> update-encounter-controller (5)
                                     │
```

### Phase 3: UI Refactoring

```
update-encounter-controller (5) ──> refactor-encounter-view-ui (5) ──> update-action-ui-components (3)
```

### Phase 4: Testing & Cleanup

```
refactor-encounter-view-ui (5) ──┐
                                  ├──> update-tests (4) ──┐
                                  │                      │
                                  └──────────────────────┼──> remove-deprecated-code (2)
                                                         │
                                                         └──> (depends on update-tests)
```

## Implementation Order

### Recommended Sequence (by dependencies and difficulty)

**Batch 1: Foundation** (Can start immediately, do in parallel)
*Each step: Implement → Run tests → Verify pass → Mark complete*

1. `define-action-costs` (1) - Define constants → No tests needed (constants)
2. `create-action-point-system` (2) - Implement → Create unit tests → Verify pass
3. `refactor-turn-system` (4) - Implement → Create unit tests → Verify pass

**Batch 2: Core Integration** (After Batch 1)
*Each step: Implement → Run tests → Verify pass → Mark complete*

4. `update-action-execution-ap` (3) - Implement → Run existing encounter tests → Verify pass
5. `update-encounter-controller` (5) - Implement → Run existing encounter tests → Verify pass

**Batch 3: UI Refactoring** (After Batch 2)
*Each step: Implement → Run tests → Verify pass → Mark complete*

6. `refactor-encounter-view-ui` (5) - Implement → Run `npm run test:e2e` → Verify pass
7. `update-action-ui-components` (3) - Implement → Run `npm run test:e2e` → Verify pass

**Batch 4: Testing & Cleanup** (After Batch 3)
*Implement → Run FULL test suite → Verify ALL pass*

8. `update-tests` (4) - Update/create tests → Run `npm run test:e2e` (full suite) → Verify ALL pass
9. `remove-deprecated-code` (2) - Remove deprecated code → Run `npm run test:e2e` → Verify ALL pass

### Estimated Timeline

*Note: Time includes implementation + testing + verification for each step*

- **Batch 1** (3 tasks): ~3-4 hours
  - `define-action-costs`: ~15 minutes
  - `create-action-point-system`: ~1 hour
  - `refactor-turn-system`: ~2-3 hours
- **Batch 2** (2 tasks): ~4-5 hours
  - `update-action-execution-ap`: ~1.5-2 hours
  - `update-encounter-controller`: ~2.5-3 hours
- **Batch 3** (2 tasks): ~5-7 hours
  - `refactor-encounter-view-ui`: ~3-4 hours
  - `update-action-ui-components`: ~2-3 hours
- **Batch 4** (2 tasks): ~4-5 hours
  - `update-tests`: ~3-4 hours
  - `remove-deprecated-code`: ~1 hour

**Total Estimated Time**: ~16-21 hours (depending on complexity, debugging, and test fixes)

**Testing Time Breakdown**:
- Quick test run: ~30 seconds - 1 minute
- Full test suite: ~2-5 minutes
- Debugging failed tests: Variable (can add significant time)

Each phase can be done incrementally with tests passing throughout. **No step is complete until its tests pass.**

## Testing Strategy

### Testing Philosophy

Following the project's TDD approach and existing Playwright E2E testing patterns:
- **E2E tests are primary** - Test user-facing behavior end-to-end
- **Test incrementally** - Run tests after each major change
- **Keep existing tests passing** - Update tests to match new behavior, don't break functionality
- **Use EncounterHelpers** - Leverage existing test helpers for consistency

### Test Files to Update

#### Existing Tests (Update to work with new turn structure)

1. **`tests/e2e/encounters/path-planning.spec.ts`**
   - **Current**: Tests movement planning phase (plan path, then execute)
   - **Update**: Test immediate movement execution with AP costs
   - **Changes**: Remove "plan then execute" flow, test immediate movement, verify AP deduction
   - **Key assertions**: Character moves immediately, AP decreases by 15, can't move if insufficient AP

2. **`tests/e2e/encounters/encounter-completion.spec.ts`**
   - **Current**: Tests win condition after movement execution
   - **Update**: Test win condition after immediate actions
   - **Changes**: Update to use new action execution flow
   - **Key assertions**: Win condition still works with immediate execution

3. **`tests/e2e/encounters/grid-structure.spec.ts`**
   - **Current**: Tests grid rendering and interactions
   - **Update**: Verify grid still works with new turn structure
   - **Changes**: Minimal - grid structure unchanged
   - **Key assertions**: Grid renders correctly, tiles clickable

### New Test Files to Create

4. **`tests/e2e/encounters/action-points.spec.ts`** (NEW)
   - Test AP system functionality
   - **Test cases**:
     - Character starts with 50 AP at turn start
     - Move action deducts 15 AP
     - Push action deducts 25 AP
     - Pass action deducts 0 AP and ends turn
     - AP resets to 50 when character's turn starts again
     - Character cannot perform action if insufficient AP
     - Multiple actions in one turn deduct AP correctly

5. **`tests/e2e/encounters/turn-order.spec.ts`** (NEW)
   - Test character turn order based on MOV
   - **Test cases**:
     - Characters ordered by MOV (highest first) at round start
     - First character in order gets first turn
     - After pass, next character in order gets turn
     - After all characters pass, new round starts with re-ordering
     - Current active character is displayed correctly

6. **`tests/e2e/encounters/immediate-execution.spec.ts`** (NEW)
   - Test immediate action execution (no planning phase)
   - **Test cases**:
     - Move action executes immediately when selected
     - Push action executes immediately when selected
     - Character position updates immediately after move
     - Object position updates immediately after push
     - Actions are not queued/batched

7. **`tests/e2e/encounters/action-affordability.spec.ts`** (NEW)
   - Test that only affordable actions are shown
   - **Test cases**:
     - With 50 AP: Move and Push actions visible
     - After move (35 AP remaining): Move and Push still visible
     - After two moves (20 AP remaining): Only Move visible, Push hidden
     - After three moves (5 AP remaining): No actions visible except Pass
     - Pass always visible (costs 0 AP)

### Test Helpers to Update

**`tests/e2e/helpers/encounter-helpers.ts`**

Add new helper methods:
- `getCurrentActiveCharacter()` - Get character whose turn it is
- `getCharacterAP(characterId)` - Get remaining AP for character
- `clickPassButton()` - Click pass button to end turn
- `waitForTurnChange()` - Wait for turn to advance to next character
- `getActionButton(actionName)` - Get action button (Move, Push, Pass)
- `isActionVisible(actionName)` - Check if action is visible/enabled
- `executeMoveAction(x, y)` - Execute move action immediately
- `executePushAction(targetId)` - Execute push action immediately

Remove/update deprecated methods:
- `clickPlanSkills()` - Remove (no skill planning phase)
- `clickExecute()` - Remove (actions execute immediately)
- `clickBack()` - May remove (no back button in new flow)

### Test Execution Strategy

#### During Refactoring

1. **After each phase**:
   - Run `npm run test:e2e` to verify no regressions
   - Fix any broken tests immediately
   - Don't proceed until tests pass

2. **Incremental test updates**:
   - Update tests as you modify systems
   - Don't wait until end to update all tests
   - Keep tests passing throughout refactoring

3. **New test creation**:
   - Create new test files as new systems are implemented
   - Test new functionality immediately after implementation
   - Use TDD approach: write test first, then implement

#### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run only encounter tests
npm run test:e2e tests/e2e/encounters/

# Run specific test file
npm run test:e2e tests/e2e/encounters/action-points.spec.ts

# Run with UI (for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### Test Data Attributes Needed

Ensure UI components have test-friendly attributes:

- **Current character turn**: `data-testid="current-active-character"`
- **AP display**: `data-testid="character-ap-{characterId}"` or `data-testid="current-ap"`
- **Action buttons**: `data-testid="action-{actionName}"` (e.g., `action-move`, `action-push`, `action-pass`)
- **Round display**: `data-testid="current-round"`
- **Turn order display**: `data-testid="turn-order"` (optional, for debugging)

### Test Campaign Setup

Use existing campaign setup pattern:
- Load campaign via dropdown selection
- Navigate through character creation
- Start encounter
- Use `EncounterHelpers` for interactions

### Success Criteria

All tests must pass:
- ✅ All existing E2E tests updated and passing
- ✅ New AP system tests passing
- ✅ New turn order tests passing
- ✅ New immediate execution tests passing
- ✅ New action affordability tests passing
- ✅ No regressions in win condition checking
- ✅ No regressions in grid interactions
- ✅ Visual behavior matches expectations (manual verification)

### Debugging Failed Tests

1. **Run with UI**: `npm run test:e2e:ui` - Step through test execution
2. **Check screenshots**: Automatic on failure in `test-results/`
3. **Check console logs**: Debug logs from systems
4. **Use Playwright Inspector**: Step through test line by line
5. **Verify data attributes**: Ensure test selectors match UI

