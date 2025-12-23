---
name: Action Class Refactoring Sprint
overview: Convert Action from a simple type to a class hierarchy where each action type encapsulates its own availability restrictions, cost, validation, and execution logic in class methods.
todos:
  - id: create-action-base-class
    content: Create Action base class with abstract methods (canExecute, execute, getCost, getName, getRequirements) and ActionContext interface. Create unit tests for base class structure. Verify tests pass.
    status: pending
    difficulty: 2
  - id: create-action-context-types
    content: Define ActionContext interface with all required context (world, grid, characterId, apSystem, turnSystem, etc.) and ActionRequirements interface. Create unit tests for type definitions. Verify tests pass.
    status: pending
    difficulty: 1
    dependencies:
      - create-action-base-class
  - id: create-move-action-class
    content: Create MoveAction class extending Action. Implement canExecute (checks AP, valid position, not wall, not occupied), execute (delegates to ActionExecutionSystem), getCost, getName, getRequirements. Store targetPos. Create unit tests. Verify tests pass.
    status: pending
    difficulty: 3
    dependencies:
      - create-action-context-types
  - id: create-push-action-class
    content: Create PushAction class extending Action. Implement canExecute (checks PWR >= 3, AP, facing target, pushable), execute (delegates to ActionExecutionSystem), getCost, getName, getRequirements. Store targetId. Create unit tests. Verify tests pass.
    status: pending
    difficulty: 4
    dependencies:
      - create-action-context-types
  - id: create-turn-action-class
    content: Create TurnAction class extending Action. Implement canExecute (checks AP), execute (delegates to ActionExecutionSystem), getCost, getName, getRequirements. Store direction. Create unit tests. Verify tests pass.
    status: pending
    difficulty: 2
    dependencies:
      - create-action-context-types
  - id: create-pass-action-class
    content: Create PassAction class extending Action. Implement canExecute (always true or checks turn), execute (delegates to ActionExecutionSystem), getCost (0), getName, getRequirements. Create unit tests. Verify tests pass.
    status: pending
    difficulty: 2
    dependencies:
      - create-action-context-types
  - id: create-action-factory
    content: Create ActionFactory with helper functions (createMoveAction, createPushAction, createTurnAction, createPassAction) to instantiate action classes from data. Create unit tests. Verify tests pass.
    status: pending
    difficulty: 2
    dependencies:
      - create-move-action-class
      - create-push-action-class
      - create-turn-action-class
      - create-pass-action-class
  - id: update-action-execution-system
    content: Add executeAction(action: Action, context: ActionContext) method to ActionExecutionSystem that calls action.execute(context). Keep existing methods for backward compatibility. Create unit tests. Verify tests pass.
    status: pending
    difficulty: 3
    dependencies:
      - create-action-factory
  - id: update-encounter-controller-actions
    content: Update EncounterController to use Action classes. Add methods to create action instances, update canAffordAction to accept Action and call canExecute, update executeActionImmediate to accept Action. Run npm run test:e2e tests/e2e/encounters/ and verify tests pass.
    status: pending
    difficulty: 4
    dependencies:
      - update-action-execution-system
  - id: update-ui-get-available-actions
    content: Refactor getAvailableActions in ScenarioView to create Action instances, filter by canExecute, return action instances or UI-friendly format. Run npm run test:e2e tests/e2e/encounters/ and verify tests pass.
    status: pending
    difficulty: 4
    dependencies:
      - update-encounter-controller-actions
  - id: update-ui-action-execution
    content: Update UI action execution handlers to create Action instances and call action.execute(context) instead of string-based action types. Run npm run test:e2e tests/e2e/encounters/ and verify tests pass.
    status: pending
    difficulty: 3
    dependencies:
      - update-ui-get-available-actions
  - id: update-game-engine
    content: Update GameEngine.executeTurn to accept Action class instance. The action's execute method handles execution. Create unit tests. Verify tests pass.
    status: pending
    difficulty: 2
    dependencies:
      - update-ui-action-execution
  - id: create-action-class-tests
    content: Create comprehensive E2E tests for action classes: action-availability.spec.ts (tests canExecute logic), action-execution.spec.ts (tests execute logic), action-requirements.spec.ts (tests attribute/situational requirements). Run npm run test:e2e and verify all tests pass.
    status: pending
    difficulty: 4
    dependencies:
      - update-game-engine
  - id: remove-old-action-type
    content: Remove or deprecate old Action type definition. Update all remaining references. Run npm run test:e2e (full suite) and verify ALL tests pass.
    status: pending
    difficulty: 2
    dependencies:
      - create-action-class-tests
---

# Action Class Refactoring Sprint

## Overview

Convert the `Action` type system to use classes instead of plain types. Each action class will encapsulate:
- Availability restrictions (AP costs, attribute requirements, situational checks)
- Cost calculation
- Validation logic
- Action-specific data

This allows actions to be self-describing and makes it easier to add new action types without spreading availability logic across multiple files.

## Current State

- `Action` is a simple type: `{ type: string; [key: string]: unknown }`
- Availability logic is scattered across:
  - `getAvailableActions()` function in `ScenarioView.tsx` (checks AP affordability, attributes, situational conditions)
  - `canAffordAction()` in `EncounterController` and `GridController` (switch statement on action type)
  - `ActionExecutionSystem` methods (executeMoveAction, executePushAction, etc.)
- Action costs are in constants file (`ACTION_COSTS`)
- Attribute requirements (e.g., PWR >= 3 for Push) are hardcoded in UI components
- Action execution uses string-based action types passed to switch statements

## Target Architecture

```typescript
// Abstract base class
abstract class Action {
  abstract canExecute(context: ActionContext): boolean;
  abstract execute(context: ActionContext): ActionExecutionResult;
  abstract getCost(): number;
  abstract getName(): string;
  abstract getRequirements(): ActionRequirements;
}

// Concrete implementations
class MoveAction extends Action {
  constructor(public targetPos: { x: number; y: number }) {}
  canExecute(context: ActionContext): boolean { /* checks AP, valid position, not wall, not occupied */ }
  execute(context: ActionContext): ActionExecutionResult { /* delegates to ActionExecutionSystem */ }
  getCost(): number { return ACTION_COSTS.MOVE; }
  getName(): string { return 'Move'; }
  getRequirements(): ActionRequirements { return {}; }
}

class PushAction extends Action {
  constructor(public targetId: number) {}
  canExecute(context: ActionContext): boolean { /* checks PWR >= 3, AP, facing target, pushable */ }
  execute(context: ActionContext): ActionExecutionResult { /* delegates to ActionExecutionSystem */ }
  getCost(): number { return ACTION_COSTS.PUSH; }
  getName(): string { return 'Push'; }
  getRequirements(): ActionRequirements { return { attributes: { pwr: 3 } }; }
}

// Similar for TurnAction, PassAction, etc.
```

## Implementation Steps

### Phase 1: Foundation - Base Classes and Types

#### 1. Create Action Base Class and Context Types

**File: `src/types/Action.ts`** (convert to classes)

- Define `ActionContext` interface containing:
  - `world: World`
  - `grid: Grid`
  - `characterId: number`
  - `apSystem: ActionPointSystem`
  - `turnSystem: TurnSystem`
  - Any other contextual data needed for validation
- Define `ActionRequirements` interface for attribute/situational requirements:
  - `attributes?: { [key: string]: number }` (e.g., `{ pwr: 3 }`)
  - `situational?: string[]` (e.g., `['facingTarget', 'pushableObject']`)
- Create abstract `Action` base class with methods:
  - `canExecute(context: ActionContext): boolean`
  - `execute(context: ActionContext): ActionExecutionResult`
  - `getCost(): number`
  - `getName(): string`
  - `getRequirements(): ActionRequirements`

### Phase 2: Concrete Action Classes

#### 2. Create MoveAction Class

**File: `src/game-engine/actions/MoveAction.ts`**

- Extends `Action`
- Constructor: `constructor(public targetPos: { x: number; y: number })`
- `canExecute(context: ActionContext)`: 
  - Checks if character can afford move (via `apSystem.canAffordMove(characterId)`)
  - Validates target position (valid, not wall, not occupied)
  - Returns boolean
- `execute(context: ActionContext)`: 
  - Delegates to `ActionExecutionSystem.executeMoveAction()`
  - Returns `ActionExecutionResult`
- `getCost()`: returns `ACTION_COSTS.MOVE` (15)
- `getName()`: returns `'Move'`
- `getRequirements()`: returns `{}` (no attribute requirements)

#### 3. Create PushAction Class

**File: `src/game-engine/actions/PushAction.ts`**

- Extends `Action`
- Constructor: `constructor(public targetId: number)`
- `canExecute(context: ActionContext)`:
  - Checks attribute requirement: PWR >= 3 (from character's AttributesComponent)
  - Checks if character can afford push (via `apSystem.canAffordPush(characterId)`)
  - Validates character is facing target (checks DirectionComponent)
  - Validates target is pushable (uses PushSystem.canPush)
  - Returns boolean
- `execute(context: ActionContext)`:
  - Delegates to `ActionExecutionSystem.executePushAction()`
  - Returns `ActionExecutionResult`
- `getCost()`: returns `ACTION_COSTS.PUSH` (25)
- `getName()`: returns `'Push'`
- `getRequirements()`: returns `{ attributes: { pwr: 3 } }`

#### 4. Create TurnAction Class

**File: `src/game-engine/actions/TurnAction.ts`**

- Extends `Action`
- Constructor: `constructor(public direction: { dx: number; dy: number })`
- `canExecute(context: ActionContext)`:
  - Checks if character can afford turn (via `apSystem.canAffordTurn(characterId)`)
  - Validates direction (must be -1, 0, or 1 for each component, at least one non-zero)
  - Returns boolean
- `execute(context: ActionContext)`:
  - Delegates to `ActionExecutionSystem.executeTurnAction()`
  - Returns `ActionExecutionResult`
- `getCost()`: returns `ACTION_COSTS.TURN` (5)
- `getName()`: returns `'Turn'`
- `getRequirements()`: returns `{}` (no attribute requirements)

#### 5. Create PassAction Class

**File: `src/game-engine/actions/PassAction.ts`**

- Extends `Action`
- Constructor: `constructor()` (no parameters needed)
- `canExecute(context: ActionContext)`:
  - Always returns true (or checks if it's character's turn via `turnSystem`)
  - Returns boolean
- `execute(context: ActionContext)`:
  - Delegates to `ActionExecutionSystem.executePassAction()`
  - Returns `ActionExecutionResult`
- `getCost()`: returns `ACTION_COSTS.PASS` (0)
- `getName()`: returns `'Pass'`
- `getRequirements()`: returns `{}` (no attribute requirements)

#### 6. Create Action Index and Factory

**File: `src/game-engine/actions/index.ts`**

- Export all action classes
- Export `ActionFactory` class with static methods:
  - `createMoveAction(targetPos: { x: number; y: number }): MoveAction`
  - `createPushAction(targetId: number): PushAction`
  - `createTurnAction(direction: { dx: number; dy: number }): TurnAction`
  - `createPassAction(): PassAction`

### Phase 3: Integration with Existing Systems

#### 7. Update ActionExecutionSystem

**File: `src/game-engine/encounters/ActionExecutionSystem.ts`**

- Add new method: `executeAction(action: Action, context: ActionContext): ActionExecutionResult`
  - This calls `action.execute(context)`, which internally delegates to the existing specific methods
- Keep existing methods (executeMoveAction, executePushAction, etc.) for backward compatibility
- These existing methods can be called by Action.execute() implementations

#### 8. Update EncounterController

**File: `src/game-engine/encounters/EncounterController.ts`**

- Update `canAffordAction()` to accept `Action` instance and call `action.canExecute(context)`
  - Or add new method: `canExecuteAction(action: Action, context: ActionContext): boolean`
- Update `executeActionImmediate()` to accept `Action` instance instead of actionType string
  - Create Action instance from parameters if needed
  - Or add new method: `executeAction(action: Action, context: ActionContext): ActionExecutionResult`
- Alternatively, keep string-based API but convert internally to Action instances

### Phase 4: Update UI Components

#### 9. Update ScenarioView getAvailableActions

**File: `src/ui/components/scenario/ScenarioView.tsx`**

- Refactor `getAvailableActions()` to:
  1. Create instances of all possible actions for the character (Move, Turn, Push if PWR >= 3, Pass)
  2. Filter by calling `action.canExecute(context)` on each
  3. Return action instances (or convert to UI-friendly format like `{ action: Action, name: string, cost: number }`)
- Build ActionContext from available data (world, grid, characterId, apSystem, turnSystem, etc.)

#### 10. Update UI Action Execution Handlers

**File: `src/ui/components/scenario/ScenarioView.tsx`**

- Update action execution handlers to:
  - Create `Action` instance (using ActionFactory)
  - Build `ActionContext`
  - Call `action.execute(context)` instead of string-based action execution
- Update handlers for Move, Push, Turn, Pass actions

### Phase 5: Update GameEngine

#### 11. Update GameEngine

**File: `src/game-engine/GameEngine.ts`**

- Update `executeTurn(action: Action)` to accept `Action` class instance
- The Action's `execute()` method handles the actual execution
- Build ActionContext as needed

### Phase 6: Testing and Cleanup

#### 12. Create Comprehensive Action Class Tests

**File: `tests/e2e/encounters/action-availability.spec.ts`** (NEW)

- Test `canExecute()` logic for each action type
- Test cases:
  - Move: Can execute when affordable and valid target, cannot when insufficient AP, cannot when target invalid/occupied/wall
  - Push: Can execute when PWR >= 3 and affordable and facing target, cannot when PWR < 3, cannot when not facing target, cannot when insufficient AP
  - Turn: Can execute when affordable, cannot when insufficient AP
  - Pass: Always can execute (or when it's character's turn)

**File: `tests/e2e/encounters/action-execution.spec.ts`** (NEW)

- Test `execute()` logic for each action type
- Test cases:
  - Move: Executes correctly, deducts AP, updates position, updates direction
  - Push: Executes correctly, deducts AP, moves object and character
  - Turn: Executes correctly, deducts AP, updates direction
  - Pass: Executes correctly, ends turn, resets AP

**File: `tests/e2e/encounters/action-requirements.spec.ts`** (NEW)

- Test `getRequirements()` for each action type
- Test attribute requirements (e.g., Push requires PWR >= 3)
- Test that actions with unmet requirements are not available
- Test that actions with met requirements are available

#### 13. Remove Old Action Type

**File: `src/types/Action.ts`**

- Remove or deprecate the old `Action` type definition
- Update all remaining references to use Action classes
- Ensure no code uses the old type

## Benefits

1. **Encapsulation**: Each action type knows its own requirements
2. **Extensibility**: Adding new actions is easier - just create a new class
3. **Type Safety**: Better TypeScript support with classes vs. discriminated unions
4. **Maintainability**: Availability logic is co-located with action logic
5. **Testability**: Each action class can be unit tested independently
6. **Single Responsibility**: Each action class handles its own validation and execution

## File Structure After Refactoring

```
src/
  types/
    Action.ts                    # REFACTORED: Action base class, ActionContext, ActionRequirements
  game-engine/
    actions/
      Action.ts                  # NEW: Base Action class (or keep in types/Action.ts)
      MoveAction.ts              # NEW: MoveAction class
      PushAction.ts              # NEW: PushAction class
      TurnAction.ts              # NEW: TurnAction class
      PassAction.ts              # NEW: PassAction class
      ActionFactory.ts           # NEW: Factory for creating actions
      index.ts                   # NEW: Exports all actions
    encounters/
      ActionExecutionSystem.ts   # UPDATED: Add executeAction(action, context)
      EncounterController.ts     # UPDATED: Use Action classes
  ui/
    components/
      scenario/
        ScenarioView.tsx         # UPDATED: Use Action classes in getAvailableActions
```

## Difficulty Scale

**1 = Easy** - Straightforward task, minimal complexity

**2 = Medium-Easy** - Simple logic, clear requirements

**3 = Medium** - Moderate complexity, some design decisions needed

**4 = Medium-Hard** - Complex logic extraction, careful refactoring required

**5 = Hard** - High complexity, multiple dependencies, integration challenges

## Dependency Graph

### Phase 1: Foundation

```
create-action-base-class (2) ──> create-action-context-types (1)
```

### Phase 2: Concrete Actions (Can be done in parallel after Phase 1)

```
create-action-context-types (1) ──┬──> create-move-action-class (3)
                                   ├──> create-push-action-class (4)
                                   ├──> create-turn-action-class (2)
                                   └──> create-pass-action-class (2)
```

### Phase 3: Factory and Integration

```
create-move-action-class (3) ──┐
create-push-action-class (4) ──┼──> create-action-factory (2) ──> update-action-execution-system (3)
create-turn-action-class (2) ──┤
create-pass-action-class (2) ──┘
```

### Phase 4: Controller and UI Integration

```
update-action-execution-system (3) ──> update-encounter-controller-actions (4) ──> update-ui-get-available-actions (4) ──> update-ui-action-execution (3)
```

### Phase 5: GameEngine and Final Integration

```
update-ui-action-execution (3) ──> update-game-engine (2)
```

### Phase 6: Testing and Cleanup

```
update-game-engine (2) ──> create-action-class-tests (4) ──> remove-old-action-type (2)
```

## Implementation Order

### Recommended Sequence (by dependencies and difficulty)

**IMPORTANT**: Each step includes running tests and verifying they pass before moving to the next step.

**Batch 1: Foundation** (Can start immediately)

1. `create-action-base-class` (2) - Implement → Create unit tests → Verify tests pass
2. `create-action-context-types` (1) - Implement → Create unit tests → Verify tests pass

**Batch 2: Concrete Actions** (After Batch 1, can do in parallel)

3. `create-move-action-class` (3) - Implement → Create unit tests → Verify tests pass
4. `create-turn-action-class` (2) - Implement → Create unit tests → Verify tests pass
5. `create-pass-action-class` (2) - Implement → Create unit tests → Verify tests pass
6. `create-push-action-class` (4) - Implement → Create unit tests → Verify tests pass (most complex, do last in batch)

**Batch 3: Factory and System Integration** (After Batch 2)

7. `create-action-factory` (2) - Implement → Create unit tests → Verify tests pass
8. `update-action-execution-system` (3) - Implement → Create unit tests → Verify tests pass

**Batch 4: Controller Integration** (After Batch 3)

9. `update-encounter-controller-actions` (4) - Implement → Run `npm run test:e2e tests/e2e/encounters/` → Verify tests pass

**Batch 5: UI Integration** (After Batch 4)

10. `update-ui-get-available-actions` (4) - Implement → Run `npm run test:e2e tests/e2e/encounters/` → Verify tests pass
11. `update-ui-action-execution` (3) - Implement → Run `npm run test:e2e tests/e2e/encounters/` → Verify tests pass

**Batch 6: GameEngine and Final Integration** (After Batch 5)

12. `update-game-engine` (2) - Implement → Create unit tests → Verify tests pass

**Batch 7: Testing and Cleanup** (After Batch 6)

13. `create-action-class-tests` (4) - Create E2E tests → Run `npm run test:e2e` → Verify ALL tests pass
14. `remove-old-action-type` (2) - Remove old code → Run `npm run test:e2e` (full suite) → Verify ALL tests pass

### Estimated Timeline

*Note: Time includes implementation + testing + verification for each step*

- **Batch 1** (2 tasks): ~1-1.5 hours
  - `create-action-base-class`: ~30-45 minutes
  - `create-action-context-types`: ~15-30 minutes
- **Batch 2** (4 tasks): ~3-4 hours (can parallelize)
  - `create-move-action-class`: ~1 hour
  - `create-turn-action-class`: ~30-45 minutes
  - `create-pass-action-class`: ~30-45 minutes
  - `create-push-action-class`: ~1-1.5 hours (most complex)
- **Batch 3** (2 tasks): ~1.5-2 hours
  - `create-action-factory`: ~30-45 minutes
  - `update-action-execution-system`: ~1 hour
- **Batch 4** (1 task): ~1.5-2 hours
  - `update-encounter-controller-actions`: ~1.5-2 hours
- **Batch 5** (2 tasks): ~2.5-3.5 hours
  - `update-ui-get-available-actions`: ~1.5-2 hours
  - `update-ui-action-execution`: ~1-1.5 hours
- **Batch 6** (1 task): ~30-45 minutes
  - `update-game-engine`: ~30-45 minutes
- **Batch 7** (2 tasks): ~3-4 hours
  - `create-action-class-tests`: ~2-3 hours
  - `remove-old-action-type`: ~1 hour

**Total Estimated Time**: ~13-17 hours (depending on complexity, debugging, and test fixes)

**Testing Time Breakdown**:
- Unit test creation: ~15-30 minutes per class
- E2E test creation: ~30-60 minutes per test file
- Quick test run: ~30 seconds - 1 minute
- Full test suite: ~2-5 minutes
- Debugging failed tests: Variable (can add significant time)

Each phase can be done incrementally with tests passing throughout. **No step is complete until its tests pass.**

## Testing Strategy

### Testing Philosophy

Following the project's TDD approach and existing Playwright E2E testing patterns:
- **Unit tests for classes** - Test action classes in isolation
- **E2E tests for integration** - Test actions in the full game context
- **Test incrementally** - Run tests after each major change
- **Keep existing tests passing** - Update tests to match new behavior, don't break functionality
- **Use EncounterHelpers** - Leverage existing test helpers for consistency

### Unit Testing Strategy

#### Action Base Class Tests

**File: `src/types/Action.test.ts`** (NEW - if using Vitest)

- Test that Action is abstract (cannot be instantiated directly)
- Test that concrete implementations must implement all abstract methods
- Test ActionContext and ActionRequirements type definitions

#### Concrete Action Class Tests

**File: `src/game-engine/actions/MoveAction.test.ts`** (NEW)

- Test `canExecute()`:
  - Returns true when character can afford and target is valid
  - Returns false when insufficient AP
  - Returns false when target is wall
  - Returns false when target is occupied
  - Returns false when target is out of bounds
- Test `execute()`:
  - Calls ActionExecutionSystem.executeMoveAction correctly
  - Returns ActionExecutionResult
- Test `getCost()`: returns ACTION_COSTS.MOVE
- Test `getName()`: returns 'Move'
- Test `getRequirements()`: returns empty object

**Similar test files for PushAction, TurnAction, PassAction**

### E2E Testing Strategy

#### New Test Files

**File: `tests/e2e/encounters/action-availability.spec.ts`** (NEW)

Test `canExecute()` logic in game context:

```typescript
test('Move action canExecute checks AP affordability', async ({ page }) => {
  // Setup: Load encounter with character that has 50 AP
  // Action: Try to move (should be available)
  // Assert: Move action is available
  // Action: Move 4 times (should use 60 AP, but only 50 available)
  // Assert: After 3 moves, move action is not available (only 5 AP left, need 15)
});

test('Push action canExecute checks PWR requirement', async ({ page }) => {
  // Setup: Load encounter with character that has PWR < 3
  // Assert: Push action is not available
  // Setup: Load encounter with character that has PWR >= 3
  // Assert: Push action is available (if other conditions met)
});

test('Push action canExecute checks character is facing target', async ({ page }) => {
  // Setup: Character with PWR >= 3, pushable object, but not facing it
  // Assert: Push action is not available
  // Action: Turn to face object
  // Assert: Push action becomes available
});
```

**File: `tests/e2e/encounters/action-execution.spec.ts`** (NEW)

Test `execute()` logic in game context:

```typescript
test('Move action execute updates position and deducts AP', async ({ page }) => {
  // Setup: Character at position (0, 0) with 50 AP
  // Action: Execute MoveAction to (1, 0)
  // Assert: Character is at (1, 0)
  // Assert: Character has 35 AP remaining (50 - 15)
  // Assert: Character is facing direction of movement
});

test('Push action execute moves object and character', async ({ page }) => {
  // Setup: Character facing pushable object
  // Action: Execute PushAction
  // Assert: Object moves in push direction
  // Assert: Character moves to object's old position
  // Assert: AP deducted correctly (25)
});
```

**File: `tests/e2e/encounters/action-requirements.spec.ts`** (NEW)

Test action requirements:

```typescript
test('Actions with unmet requirements are not available', async ({ page }) => {
  // Setup: Character with PWR 2 (below Push requirement of 3)
  // Assert: Push action is not in available actions list
  // Assert: Move, Turn, Pass actions are available
});

test('Actions with met requirements are available', async ({ page }) => {
  // Setup: Character with PWR 3 (meets Push requirement)
  // Setup: Character facing pushable object with sufficient AP
  // Assert: Push action is in available actions list
});
```

### Test Files to Update

#### Existing Tests (Update to work with Action classes)

1. **`tests/e2e/encounters/path-planning.spec.ts`**
   - **Current**: Tests movement with string-based actions
   - **Update**: Tests movement with MoveAction instances
   - **Changes**: Update helpers to use Action classes
   - **Key assertions**: Movement still works, AP deducted correctly

2. **`tests/e2e/encounters/push-action.spec.ts`**
   - **Current**: Tests push actions with string-based actions
   - **Update**: Tests push actions with PushAction instances
   - **Changes**: Update helpers to use Action classes
   - **Key assertions**: Push still works, requirements checked correctly

3. **`tests/e2e/encounters/action-points.spec.ts`** (if exists)
   - **Update**: Verify AP system works with Action classes
   - **Key assertions**: AP deducted correctly for each action type

### Test Helpers to Update

**`tests/e2e/helpers/encounter-helpers.ts`**

Update or add helper methods:
- `createMoveAction(targetPos): MoveAction` - Create move action instance
- `createPushAction(targetId): PushAction` - Create push action instance
- `createTurnAction(direction): TurnAction` - Create turn action instance
- `createPassAction(): PassAction` - Create pass action instance
- `buildActionContext(characterId): ActionContext` - Build action context for tests
- `getAvailableActions(characterId): Action[]` - Get available actions for character
- `executeAction(action: Action, context: ActionContext)` - Execute action

### Test Execution Strategy

#### During Refactoring

1. **After each action class creation**:
   - Create unit tests for the class
   - Run unit tests: `npm run test:unit` (if using Vitest)
   - Verify unit tests pass
   - Create simple E2E test to verify class works in game context
   - Run E2E test: `npm run test:e2e tests/e2e/encounters/action-availability.spec.ts`
   - Verify E2E test passes

2. **After system integration**:
   - Run existing encounter tests: `npm run test:e2e tests/e2e/encounters/`
   - Fix any broken tests immediately
   - Don't proceed until tests pass

3. **After UI integration**:
   - Run full encounter test suite: `npm run test:e2e tests/e2e/encounters/`
   - Verify all tests pass
   - Test manually in browser to verify UI works correctly

#### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run only encounter tests
npm run test:e2e tests/e2e/encounters/

# Run specific test file
npm run test:e2e tests/e2e/encounters/action-availability.spec.ts

# Run unit tests (if using Vitest)
npm run test:unit

# Run with UI (for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### Test Data Attributes Needed

Ensure UI components have test-friendly attributes for action classes:

- **Action buttons**: `data-testid="action-{actionName}"` (e.g., `action-move`, `action-push`, `action-turn`, `action-pass`)
- **Action availability**: Actions should be disabled/hidden when `canExecute()` returns false
- **Action cost display**: Show cost from `getCost()` method
- **Action requirements display**: Show requirements from `getRequirements()` method

### Success Criteria

All tests must pass:
- ✅ All action class unit tests passing
- ✅ All new E2E tests for action classes passing
- ✅ All existing E2E tests updated and passing
- ✅ No regressions in action execution
- ✅ No regressions in action availability logic
- ✅ Visual behavior matches expectations (manual verification)
- ✅ Action requirements correctly enforced
- ✅ AP costs correctly deducted
- ✅ Old Action type removed (or deprecated with migration path)

### Debugging Failed Tests

1. **Run with UI**: `npm run test:e2e:ui` - Step through test execution
2. **Check screenshots**: Automatic on failure in `test-results/`
3. **Check console logs**: Debug logs from action classes and systems
4. **Use Playwright Inspector**: Step through test line by line
5. **Verify action context**: Ensure ActionContext is built correctly
6. **Verify action instances**: Ensure actions are created correctly with proper data

## Migration Strategy

### Backward Compatibility (Optional)

During migration, we can support both old and new approaches:

1. **Keep old Action type temporarily** (deprecated)
2. **ActionFactory can accept old format** and convert to new classes
3. **Controllers can accept both** string-based and class-based actions
4. **Gradually migrate** code to use classes
5. **Remove old code** once migration complete

### Breaking Changes

After migration complete:
- `Action` type is now a class (not a type)
- Action execution uses classes instead of string types
- `getAvailableActions()` returns Action instances (or UI-friendly format with Action instances)
- Controllers accept Action instances instead of action type strings

### Code Update Checklist

- [ ] Update `src/types/Action.ts` - Convert to class hierarchy
- [ ] Create `src/game-engine/actions/` directory and action classes
- [ ] Update `ActionExecutionSystem` - Add executeAction(action, context)
- [ ] Update `EncounterController` - Use Action classes
- [ ] Update `ScenarioView.getAvailableActions()` - Use Action classes
- [ ] Update UI action execution handlers - Use Action classes
- [ ] Update `GameEngine.executeTurn()` - Accept Action class
- [ ] Update all tests - Use Action classes
- [ ] Remove old Action type - No remaining references

## Key Design Decisions

### 1. Action Execution Delegation

Actions delegate execution to `ActionExecutionSystem` rather than implementing execution logic directly. This maintains separation of concerns:
- Actions handle validation and requirements
- ActionExecutionSystem handles actual game state manipulation

### 2. ActionContext Parameter

All action methods receive `ActionContext` parameter rather than accessing systems globally. This:
- Makes actions testable (can mock context)
- Makes dependencies explicit
- Allows different contexts for different scenarios

### 3. Factory Pattern

`ActionFactory` provides convenient methods to create actions. This:
- Simplifies action creation in UI
- Can handle conversion from old format
- Provides a single place to change action instantiation

### 4. Requirements Interface

`ActionRequirements` interface allows actions to declare their requirements. This:
- Enables UI to show requirements
- Allows requirement checking without executing action
- Makes requirements discoverable

## Future Extensibility

With this class-based approach, adding new actions is straightforward:

1. Create new action class extending `Action`
2. Implement all abstract methods
3. Add factory method in `ActionFactory`
4. Add to `getAvailableActions()` logic (or make it dynamic)
5. Add tests

Example: Adding a "Disarm Trap" action:

```typescript
class DisarmTrapAction extends Action {
  constructor(public trapId: number) {}
  
  canExecute(context: ActionContext): boolean {
    // Check DEX >= trap difficulty, sufficient AP, character adjacent to trap
  }
  
  execute(context: ActionContext): ActionExecutionResult {
    // Delegate to ActionExecutionSystem.executeDisarmTrapAction()
  }
  
  getCost(): number { return ACTION_COSTS.DISARM_TRAP; }
  getName(): string { return 'Disarm Trap'; }
  getRequirements(): ActionRequirements {
    return { attributes: { dex: 4 }, situational: ['adjacentToTrap'] };
  }
}
```

No changes needed to core systems - just add the new class and wire it up!

