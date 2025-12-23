# Turn Structure Refactoring Plan

## Overview

Refactor the codebase to break down large files (especially EncounterView.tsx at 1770 lines) into smaller, focused modules. This will improve maintainability and keep context focused for future turn structure changes.

## Current Issues

1. **EncounterView.tsx** (1770 lines) - Massive file handling:
   - Phase management (movement, skill, executing)
   - Movement planning UI
   - Skill action planning UI
   - Action execution logic
   - Win condition checking (duplicated in 3+ places)
   - Grid rendering
   - Info panel rendering
   - State management

2. **GameState.tsx** (412 lines) - Mixed concerns:
   - React context management
   - Mission/campaign state
   - Character management
   - Encounter initialization

3. **Turn/Round Management** - Scattered:
   - Hardcoded "Turn: 1" in UI
   - GameEngine has unused turn counter
   - No centralized turn/round system

4. **Win Condition Checking** - Duplicated in:
   - Movement execution path
   - Skill execution path
   - Legacy execution path

## Refactoring Strategy

### Phase 1: Extract Core Systems

#### 1.1 Create Turn/Round System
- **File**: `src/game-engine/encounters/TurnSystem.ts`
- Extract turn/round tracking from scattered locations
- Manage turn counter, round counter, phase transitions
- Provide clean API: `getCurrentTurn()`, `incrementTurn()`, `resetTurn()`

#### 1.2 Create Win Condition System
- **File**: `src/game-engine/encounters/WinConditionSystem.ts`
- Centralize all win condition checks
- Single method: `checkWinCondition(world, grid): boolean`
- Remove duplicate checks from EncounterView

#### 1.3 Create Encounter Phase Manager
- **File**: `src/game-engine/encounters/EncounterPhaseManager.ts`
- Manage phase state: 'movement' | 'skill' | 'executing'
- Handle phase transitions
- Validate phase transitions

#### 1.4 Create Action Execution System
- **File**: `src/game-engine/encounters/ActionExecutionSystem.ts`
- Extract action execution logic from EncounterView
- Execute planned actions (movement, push, wait)
- Handle action validation and errors

### Phase 2: Extract UI Components

#### 2.1 Extract Grid Component
- **File**: `src/ui/components/encounter/EncounterGrid.tsx`
- Extract grid rendering logic (lines ~635-822 in EncounterView)
- Handle tile rendering, entity rendering, path visualization
- Props: `grid`, `world`, `onTileClick`, `selectedCharacter`, etc.

#### 2.2 Extract Info Panel Component
- **File**: `src/ui/components/encounter/EncounterInfoPanel.tsx`
- Extract info panel rendering (lines ~825-1766 in EncounterView)
- Handle instructions, turn counter, character stats, action queue
- Props: `phase`, `turn`, `selectedCharacter`, `plannedActions`, etc.

#### 2.3 Extract Movement Planning UI
- **File**: `src/ui/components/encounter/MovementPlanningPhase.tsx`
- Extract movement phase UI (lines ~901-1302 in EncounterView)
- Handle character selection, path planning, execution controls
- Props: `movementPlan`, `onExecuteMoves`, `onPlanSkills`, etc.

#### 2.4 Extract Skill Planning UI
- **File**: `src/ui/components/encounter/SkillPlanningPhase.tsx`
- Extract skill phase UI (lines ~1304-1691 in EncounterView)
- Handle action queue, action selection, execution
- Props: `plannedActions`, `onAddAction`, `onExecute`, etc.

### Phase 3: Extract State Management

#### 3.1 Create Encounter State Manager
- **File**: `src/game-engine/encounters/EncounterStateManager.ts`
- Manage encounter-specific state (not React state)
- Track: selectedCharacter, selectedObject, validMoves, plannedActions
- Provide methods to update state

#### 3.2 Create Encounter Controller
- **File**: `src/game-engine/encounters/EncounterController.ts`
- Orchestrate encounter systems
- Coordinate: TurnSystem, WinConditionSystem, PhaseManager, ActionExecution
- Single entry point for encounter logic

### Phase 4: Refactor EncounterView

#### 4.1 Simplify EncounterView
- **File**: `src/ui/components/EncounterView.tsx` (target: ~200-300 lines)
- Use extracted components and systems
- Focus only on:
  - Composing sub-components
  - React state for UI-only concerns
  - Event handlers that delegate to systems

#### 4.2 Update GameState.tsx
- Extract encounter-related state management
- Keep only React context concerns
- Delegate encounter logic to EncounterController

## File Structure After Refactoring

```
src/
  game-engine/
    encounters/
      TurnSystem.ts                    # NEW: Turn/round tracking
      WinConditionSystem.ts            # NEW: Win condition checks
      EncounterPhaseManager.ts         # NEW: Phase management
      ActionExecutionSystem.ts         # NEW: Action execution
      EncounterStateManager.ts         # NEW: State management
      EncounterController.ts            # NEW: Orchestration
      MovementSystem.ts                # EXISTING
      PushSystem.ts                    # EXISTING
      MovementPlan.ts                  # EXISTING
      ...
  ui/
    components/
      encounter/
        EncounterView.tsx              # REFACTORED: ~200-300 lines
        EncounterGrid.tsx              # NEW: Grid rendering
        EncounterInfoPanel.tsx         # NEW: Info panel
        MovementPlanningPhase.tsx      # NEW: Movement phase UI
        SkillPlanningPhase.tsx         # NEW: Skill phase UI
```

## Benefits

1. **Smaller Files**: Each file < 300 lines, focused on single responsibility
2. **Better Testability**: Systems can be unit tested independently
3. **Easier Maintenance**: Changes isolated to specific files
4. **Clearer Architecture**: Separation of concerns (logic vs UI)
5. **Future-Proof**: Easy to add new turn structure features

## Testing Requirement (CRITICAL)

**Every step must include testing before it is considered complete.**

### Testing Workflow for Each Step

1. **Implement the change** (create system, extract component, etc.)
2. **Run relevant tests** (as specified in each todo's content)
3. **Verify tests pass** - All existing tests must continue to pass
4. **Fix any regressions** - If tests fail, fix issues before proceeding
5. **Only then** - Mark the step as complete and move to next step

### Test Commands Reference

- **Full test suite**: `npm run test:e2e`
- **All encounter tests**: `npm run test:e2e tests/e2e/encounters/`
- **Specific test file**: `npm run test:e2e tests/e2e/encounters/path-planning.spec.ts`
- **With UI (debugging)**: `npm run test:e2e:ui`
- **Headed mode**: `npm run test:e2e:headed`

### What "Tests Pass" Means

- ✅ All existing E2E tests pass (no regressions)
- ✅ No new test failures introduced
- ✅ Visual behavior matches expectations (manual verification if needed)
- ✅ Console shows no errors (check browser console)

**If tests fail, the step is NOT complete. Fix issues before proceeding.**

## Task List

### Phase 1: Core Systems

1. **create-turn-system**: Create TurnSystem.ts to manage turn/round tracking and provide clean API. Then run `npm run test:e2e` and verify all existing tests pass.
   - Dependencies: None

2. **create-win-condition-system**: Create WinConditionSystem.ts to centralize all win condition checks. Then run `npm run test:e2e tests/e2e/encounters/win-condition-direct.spec.ts` and verify tests pass.
   - Dependencies: None

3. **create-phase-manager**: Create EncounterPhaseManager.ts to manage phase state and transitions. Then run `npm run test:e2e` and verify all existing tests pass.
   - Dependencies: None

4. **create-action-execution-system**: Create ActionExecutionSystem.ts to extract action execution logic from UI. Then run `npm run test:e2e tests/e2e/encounters/push-action.spec.ts` and verify tests pass.
   - Dependencies: create-win-condition-system

5. **create-encounter-state-manager**: Create EncounterStateManager.ts for encounter-specific state management. Then run `npm run test:e2e` and verify all existing tests pass.
   - Dependencies: None

### Phase 2: UI Components

6. **extract-grid-component**: Extract EncounterGrid.tsx component for grid rendering. Then run `npm run test:e2e tests/e2e/encounters/grid-structure.spec.ts tests/e2e/encounters/path-planning.spec.ts` and verify tests pass.
   - Dependencies: None

7. **extract-info-panel**: Extract EncounterInfoPanel.tsx component for info panel rendering. Then run `npm run test:e2e` and verify all existing tests pass.
   - Dependencies: create-turn-system

8. **extract-movement-planning-ui**: Extract MovementPlanningPhase.tsx component for movement phase UI. Then run `npm run test:e2e tests/e2e/encounters/path-planning.spec.ts` and verify tests pass.
   - Dependencies: extract-grid-component

9. **extract-skill-planning-ui**: Extract SkillPlanningPhase.tsx component for skill phase UI. Then run `npm run test:e2e tests/e2e/encounters/push-action.spec.ts` and verify tests pass.
   - Dependencies: extract-info-panel

### Phase 3: Integration

10. **create-encounter-controller**: Create EncounterController.ts to orchestrate encounter systems. Then run `npm run test:e2e tests/e2e/encounters/` and verify all encounter tests pass.
    - Dependencies: create-turn-system, create-win-condition-system, create-phase-manager, create-action-execution-system, create-encounter-state-manager

11. **refactor-encounter-view**: Refactor EncounterView.tsx to use extracted components and systems (~200-300 lines). Then run `npm run test:e2e` and verify ALL tests pass (full test suite).
    - Dependencies: extract-grid-component, extract-info-panel, extract-movement-planning-ui, extract-skill-planning-ui, create-encounter-controller

### Phase 4: Testing

12. **test-turn-system**: Create E2E test for TurnSystem (turn-system.spec.ts). Verify test passes.
    - Dependencies: create-turn-system

13. **test-phase-transitions**: Create E2E test for phase transitions (phase-transitions.spec.ts). Verify test passes.
    - Dependencies: create-phase-manager

14. **verify-existing-tests**: Final verification - Run `npm run test:e2e` and confirm ALL tests pass. This is the final gate before considering refactoring complete.
    - Dependencies: refactor-encounter-view, test-turn-system, test-phase-transitions

## Difficulty Scale

**1 = Easy** - Straightforward task, minimal complexity

**2 = Medium-Easy** - Simple logic, clear requirements

**3 = Medium** - Moderate complexity, some design decisions needed

**4 = Medium-Hard** - Complex logic extraction, careful refactoring required

**5 = Hard** - High complexity, multiple dependencies, integration challenges

## Dependency Graph

### Phase 1: Core Systems (Can be done in parallel)

```
create-turn-system (2) ──┐
create-win-condition-system (3) ──┐
create-phase-manager (3) ─────────┼──> create-encounter-controller (5)
create-encounter-state-manager (3) ─┘
create-action-execution-system (4) ──┘
  └─ depends on: create-win-condition-system
```

### Phase 2: UI Components (Sequential extraction)

```
extract-grid-component (3) ──> extract-movement-planning-ui (4)
create-turn-system (2) ──> extract-info-panel (4) ──> extract-skill-planning-ui (4)
```

### Phase 3: Integration

```
[All Phase 1 systems] ──> create-encounter-controller (5)
[All Phase 2 components] ──┐
                           ├──> refactor-encounter-view (5)
create-encounter-controller (5) ──┘
```

### Phase 4: Testing

```
create-turn-system (2) ──> test-turn-system (2)
create-phase-manager (3) ──> test-phase-transitions (3)
refactor-encounter-view (5) ──> verify-existing-tests (1)
```

## Implementation Order

### Recommended Sequence (by dependencies)

**IMPORTANT**: Each step includes running tests and verifying they pass before moving to the next step.

**Batch 1: Independent Systems** (Can start immediately, do in parallel)
*Each step: Implement → Run tests → Verify pass → Mark complete*

1. `create-turn-system` - Implement → Run `npm run test:e2e` → Verify pass
2. `create-win-condition-system` - Implement → Run win-condition test → Verify pass
3. `create-phase-manager` - Implement → Run `npm run test:e2e` → Verify pass
4. `create-encounter-state-manager` - Implement → Run `npm run test:e2e` → Verify pass
5. `extract-grid-component` - Implement → Run grid/path-planning tests → Verify pass

**Batch 2: Dependent Systems** (After Batch 1)
*Each step: Implement → Run tests → Verify pass → Mark complete*

6. `create-action-execution-system` - Implement → Run push-action test → Verify pass
7. `extract-info-panel` - Implement → Run `npm run test:e2e` → Verify pass
8. `extract-movement-planning-ui` - Implement → Run path-planning test → Verify pass

**Batch 3: Further Dependencies** (After Batch 2)
*Each step: Implement → Run tests → Verify pass → Mark complete*

9. `extract-skill-planning-ui` - Implement → Run push-action test → Verify pass
10. `create-encounter-controller` - Implement → Run all encounter tests → Verify pass

**Batch 4: Final Integration** (After Batch 3)
*Implement → Run FULL test suite → Verify ALL pass*

11. `refactor-encounter-view` - Implement → Run `npm run test:e2e` (full suite) → Verify ALL pass

**Batch 5: Additional Testing** (After Batch 4)
*Create new tests for new systems*

12. `test-turn-system` - Create test → Verify test passes
13. `test-phase-transitions` - Create test → Verify test passes
14. `verify-existing-tests` - Final verification → Run full suite → Confirm ALL pass

### Estimated Timeline

*Note: Time includes implementation + testing + verification for each step*

- **Batch 1** (5 tasks): ~3-4 hours (can parallelize, but each needs testing)
- **Batch 2** (3 tasks): ~3-4 hours (testing after each step)
- **Batch 3** (2 tasks): ~2-3 hours (testing after each step)
- **Batch 4** (1 task): ~2-3 hours (full test suite verification)
- **Batch 5** (3 tasks): ~1-2 hours (creating new tests)

**Total Estimated Time**: ~11-16 hours (depending on parallelization, complexity, and test debugging)

**Testing Time Breakdown**:
- Quick test run: ~30 seconds - 1 minute
- Full test suite: ~2-5 minutes
- Debugging failed tests: Variable (can add significant time)

Each phase can be done incrementally with tests passing throughout. **No step is complete until its tests pass.**

## Testing Strategy

### Testing Philosophy

The project uses **Playwright E2E tests as the primary testing method** (per TESTING_STRATEGY.md). During refactoring, we'll:

1. **Keep existing E2E tests passing** - All refactoring must maintain backward compatibility
2. **Test incrementally** - Run tests after each major change
3. **Use existing test patterns** - Leverage `EncounterHelpers` and campaign-based setup
4. **Add unit tests for new systems** (optional) - For pure logic systems that can be tested in isolation

### Test Coverage by Phase

#### Phase 1: Core Systems (No UI Changes)

**Testing Approach**: Create systems alongside existing code, wire them up incrementally

**For Each New System**:

- **TurnSystem**: 
  - E2E test: Verify turn counter increments correctly
  - Test file: `tests/e2e/encounters/turn-system.spec.ts` (NEW)
  - Test: Turn counter displays correctly, increments after round completion

- **WinConditionSystem**:
  - E2E test: Verify win condition detection works
  - Test file: `tests/e2e/encounters/win-condition-direct.spec.ts` (EXISTING - verify still passes)
  - Test: Characters in exit zone triggers win condition

- **EncounterPhaseManager**:
  - E2E test: Verify phase transitions work
  - Test file: `tests/e2e/encounters/phase-transitions.spec.ts` (NEW)
  - Test: Movement → Skill → Executing transitions correctly

- **ActionExecutionSystem**:
  - E2E test: Verify actions execute correctly
  - Test file: `tests/e2e/encounters/push-action.spec.ts` (EXISTING - verify still passes)
  - Test: Push actions execute, movement actions execute

**Test Execution**:

```bash
# After creating each system, run existing tests to ensure nothing broke
npm run test:e2e

# Run specific encounter tests
npx playwright test tests/e2e/encounters/
```

#### Phase 2: Extract UI Components (Keep EncounterView Working)

**Testing Approach**: Extract components while maintaining exact same behavior

**For Each Extracted Component**:

- **EncounterGrid**: 
  - Verify: Grid renders correctly, tiles clickable, entities display
  - Test: Existing `grid-structure.spec.ts` should still pass
  - Test: Existing `path-planning.spec.ts` should still pass

- **EncounterInfoPanel**:
  - Verify: Info panel displays correctly, turn counter shows
  - Test: Visual verification via E2E (check elements are visible)

- **MovementPlanningPhase**:
  - Verify: Movement planning works identically
  - Test: Existing `path-planning.spec.ts` should still pass
  - Test: All movement planning features work

- **SkillPlanningPhase**:
  - Verify: Skill planning works identically
  - Test: Existing `push-action.spec.ts` should still pass
  - Test: Action queue works correctly

**Test Execution**:

```bash
# After each component extraction, run all encounter tests
npm run test:e2e tests/e2e/encounters/

# Verify no regressions
npm run test:e2e
```

#### Phase 3: Extract State Management

**Testing Approach**: Refactor state handling while maintaining behavior

**For State Management**:

- **EncounterStateManager**:
  - Verify: State updates work correctly
  - Test: Existing tests should still pass (state changes are internal)

- **EncounterController**:
  - Verify: Controller orchestrates systems correctly
  - Test: All existing encounter tests should pass
  - Test: Win conditions, phase transitions, action execution all work

**Test Execution**:

```bash
# Run full test suite after state management refactor
npm run test:e2e

# Focus on encounter tests
npx playwright test tests/e2e/encounters/
```

#### Phase 4: Simplify EncounterView

**Testing Approach**: Final cleanup - all tests must pass

**Final Verification**:

- All existing E2E tests pass
- No visual regressions
- All functionality preserved

**Test Execution**:

```bash
# Full test suite
npm run test:e2e

# All encounter tests
npx playwright test tests/e2e/encounters/

# All campaign tests
npx playwright test tests/e2e/campaigns/
```

### Test Files to Create/Update

#### New Test Files

1. `tests/e2e/encounters/turn-system.spec.ts` - Turn counter and round management
2. `tests/e2e/encounters/phase-transitions.spec.ts` - Phase transition logic

#### Existing Test Files (Verify Still Pass)

1. `tests/e2e/encounters/win-condition-direct.spec.ts` - Win condition detection
2. `tests/e2e/encounters/path-planning.spec.ts` - Movement planning
3. `tests/e2e/encounters/push-action.spec.ts` - Push action execution
4. `tests/e2e/encounters/grid-structure.spec.ts` - Grid rendering
5. `tests/e2e/encounters/encounter-completion.spec.ts` - Encounter completion flow

### Testing Workflow

1. **Before Each Change**:
   - Run existing tests: `npm run test:e2e`
   - Note any failures (baseline)

2. **During Refactoring**:
   - Make incremental changes
   - Run tests after each logical unit of work
   - Fix any regressions immediately

3. **After Each Phase**:
   - Run full test suite
   - Verify all existing tests pass
   - Add new tests for new functionality if needed

4. **Before Committing**:
   - Run full test suite
   - Verify in UI mode: `npm run test:e2e:ui`
   - Check for visual regressions

### Test Helpers

**Existing Helpers** (continue using):

- `EncounterHelpers` - Grid interactions, entity queries
- Campaign setup helpers - Load campaigns, start encounters

**New Helpers** (if needed):

- `TurnSystemHelpers` - Turn counter queries, round management
- `PhaseHelpers` - Phase state queries, phase transitions

### Debugging Failed Tests

1. **Run with UI**: `npm run test:e2e:ui` - Step through test execution
2. **Run in headed mode**: `npm run test:e2e:headed` - See browser
3. **Check screenshots**: Automatic on failure in `test-results/`
4. **Check console logs**: Debug logs from systems
5. **Use Playwright Inspector**: Step through test line by line

### Success Criteria

- ✅ All existing E2E tests pass
- ✅ No visual regressions
- ✅ All functionality preserved
- ✅ New systems are testable (can be unit tested if desired)
- ✅ Code is more maintainable (smaller files, clearer structure)


