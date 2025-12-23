---
name: Terminology Cleanup and Architecture Refactoring
overview: Refactor codebase to use Job/Scenario terminology and implement containment architecture where scenarios are configuration data fed into minigame instances. Create GridMiniGame base class hierarchy.
todos:
  - id: rename-core-types
    content: Rename Campaign→Job, EncounterDefinition→ScenarioDefinition in src/jobs/Job.ts. Add minigameType: 'combat' | 'obstacle' | 'trading' and optional config field to ScenarioDefinition.
    status: pending
    difficulty: 2
    testing: Update type imports in test files, verify TypeScript compilation
  - id: rename-encounter-types
    content: Rename EncounterType→ScenarioType, CombatEncounter→CombatScenario, ObstacleEncounter→ObstacleScenario, TradingEncounter→TradingScenario in src/types/Scenario.ts. Update all type guards and helper functions.
    status: pending
    difficulty: 2
    testing: Verify type guards work correctly, check TypeScript compilation
  - id: create-scenario-config-types
    content: Create src/types/ScenarioConfig.ts with GridScenarioConfig base interface, CombatScenarioConfig extends GridScenarioConfig, ObstacleScenarioConfig extends GridScenarioConfig, TradingScenarioConfig interfaces.
    status: pending
    difficulty: 1
    testing: Verify TypeScript compilation, test type assignments
  - id: rename-job-loader
    content: Rename CampaignLoader→JobLoader class, getAvailableCampaigns()→getAvailableJobs(), loadCampaign()→loadJob() in src/jobs/JobLoader.ts. Update all references.
    status: pending
    difficulty: 2
    dependencies:
      - rename-core-types
    testing: Update tests/e2e/jobs/job-loading.spec.ts, verify job loading works
  - id: update-base-minigame
    content: Update BaseMiniGame: encounterType→scenarioType, getEncounterType()→getScenarioType(), initialize() to accept config: unknown parameter.
    status: pending
    difficulty: 2
    dependencies:
      - rename-encounter-types
    testing: Verify all minigame classes still compile, test initialization
  - id: create-grid-minigame
    content: Create GridMiniGame abstract class extending BaseMiniGame. Include World, Grid, GridController (renamed from EncounterController), turn tracking, shared initialize(), executeAction(), getState(), checkWinCondition(). Add abstract methods for subclasses.
    status: pending
    difficulty: 4
    dependencies:
      - create-scenario-config-types
      - update-base-minigame
      - rename-encounter-controller
    testing: Create unit tests for GridMiniGame shared functionality, verify subclasses can extend properly
  - id: refactor-combat-minigame
    content: Refactor CombatMiniGame to extend GridMiniGame. Remove duplicate World/Grid/Controller code. Keep combat-specific checkWinConditionSpecific() (defeat enemies) and checkLossConditionSpecific() (party wipe). Update initialize() to accept CombatScenarioConfig.
    status: pending
    difficulty: 3
    dependencies:
      - create-grid-minigame
    testing: Run existing combat tests, verify combat scenarios still work correctly
  - id: refactor-obstacle-minigame
    content: Refactor ObstacleMiniGame to extend GridMiniGame. Remove duplicate code. Keep obstacle-specific logic: maxTurns support, checkWinConditionSpecific() (reach exit), checkLossConditionSpecific() (turn limit OR party wipe). Update initialize() to accept ObstacleScenarioConfig.
    status: pending
    difficulty: 3
    dependencies:
      - create-grid-minigame
    testing: Run existing obstacle tests, verify turn limits work, test win/loss conditions
  - id: rename-encounter-controller
    content: Rename EncounterController class→GridController in src/game-engine/encounters/EncounterController.ts (or move to grid-scenario/). Update all references throughout codebase including imports in minigame classes.
    status: pending
    difficulty: 3
    testing: Verify all references updated, run tests that use controller, check for broken imports
  - id: rename-encounter-factory
    content: Rename EncounterFactory→ScenarioFactory class, createFromDefinition()→createFromScenario(), EncounterDefinition→ScenarioDefinition parameter in src/scenarios/ScenarioFactory.ts. Update all references.
    status: pending
    difficulty: 2
    dependencies:
      - rename-core-types
    testing: Update tests that use factory, verify World/Grid creation still works
  - id: create-minigame-factory
    content: Create MiniGameFactory static class with createFromScenario() method. Switch on scenario.minigameType to create CombatMiniGame, ObstacleMiniGame, or TradingMiniGame. Initialize with scenario.config. Handle grid vs non-grid minigames.
    status: pending
    difficulty: 3
    dependencies:
      - refactor-combat-minigame
      - refactor-obstacle-minigame
      - rename-encounter-factory
    testing: Create tests for factory creating different minigame types, verify initialization with config
  - id: rename-encounter-view
    content: Rename EncounterView component→ScenarioView, file src/ui/components/EncounterView.tsx→ScenarioView.tsx. Update all "encounter" terminology to "scenario" in component. Update imports and references.
    status: pending
    difficulty: 3
    testing: Update E2E tests that reference EncounterView, verify UI still renders correctly
  - id: rename-encounter-components
    content: Rename directory src/ui/components/encounter/→scenario/. Rename EncounterGrid→ScenarioGrid, EncounterInfoPanel→ScenarioInfoPanel. Update all internal references and imports in parent components.
    status: pending
    difficulty: 2
    dependencies:
      - rename-encounter-view
    testing: Verify UI components render, check for broken imports, test grid and info panel functionality
  - id: update-gamestate
    content: Update GameState.tsx: activeCampaign→activeJob, currentEncounterIndex→currentScenarioIndex, startCampaign()→startJob(), nextEncounter()→nextScenario(), prepareCampaignCharacters()→prepareJobCharacters(). Update all references.
    status: pending
    difficulty: 3
    dependencies:
      - rename-core-types
    testing: Update tests that use GameState, verify job/scenario navigation works, test state transitions
  - id: rename-data-files
    content: Rename public/campaigns/→public/jobs/. Update manifest.json: campaigns→jobs array. Rename *-campaign.json→*-job.json files. Update scenario structure: encounters→scenarios array, add minigameType field, add config field.
    status: pending
    difficulty: 2
    dependencies:
      - rename-core-types
    testing: Verify job loading works, test scenario loading, check manifest parsing
  - id: update-tests
    content: Rename tests/e2e/campaigns/→tests/e2e/jobs/, tests/e2e/encounters/→tests/e2e/scenarios/. Rename campaign-loading.spec.ts→job-loading.spec.ts. Update all test files to use job/scenario terminology. Update encounter-helpers.ts→scenario-helpers.ts.
    status: pending
    difficulty: 3
    dependencies:
      - rename-data-files
      - rename-encounter-view
    testing: Run npm run test:e2e, verify all tests pass, fix any broken test references
  - id: update-imports
    content: Search and replace all imports: '../campaigns/Campaign'→'../jobs/Job', '../encounters/EncounterFactory'→'../scenarios/ScenarioFactory', './EncounterView'→'./ScenarioView'. Update all type imports throughout codebase.
    status: pending
    difficulty: 2
    dependencies:
      - rename-encounter-view
      - rename-encounter-components
      - rename-encounter-factory
      - rename-job-loader
    testing: Run npm run build to catch import errors, verify no broken imports
  - id: verify-build
    content: Run npm run build, fix any TypeScript errors, run npm run test:e2e to ensure all tests pass. Check for any remaining references to old terminology.
    status: pending
    difficulty: 1
    dependencies:
      - update-imports
      - update-tests
    testing: Full build verification, all E2E tests passing, no TypeScript errors
---

# Terminology Cleanup and Architecture Refactoring Plan

## Overview

Refactor the codebase to:
1. Rename Campaign → Job, Encounter → Scenario throughout
2. Implement containment architecture: scenarios are configuration data, minigames are behavior
3. Create GridMiniGame base class extending BaseMiniGame
4. Refactor CombatMiniGame and ObstacleMiniGame to extend GridMiniGame
5. Rename EncounterController → GridController

## Architecture

### Terminology Changes
- **Campaign** → **Job**: A job consists of one or more scenarios
- **Encounter** → **Scenario**: A scenario is a configuration of a minigame
- **EncounterDefinition** → **ScenarioDefinition**: Data structure describing a scenario
- **EncounterType** → **ScenarioType**: Type discriminator for scenario configurations

### Class Hierarchy

```
BaseMiniGame (abstract)
├── GridMiniGame (abstract) - handles grid-based logic
│   ├── CombatMiniGame extends GridMiniGame
│   └── ObstacleMiniGame extends GridMiniGame
└── TradingMiniGame extends BaseMiniGame (future, non-grid)
```

### Containment Pattern

**Scenario (Configuration/Data):**
- Defines what: grid size, entities, win conditions, minigame type
- Pure data structure loaded from JSON
- Specifies which minigame type to use

**MiniGame (Behavior/Logic):**
- Defines how: rules, actions, state management
- Receives scenario configuration via `initialize(config)`
- Contains the game logic

## Implementation Phases

### Phase 1: Type System Foundation
1. Rename core types (Campaign→Job, EncounterDefinition→ScenarioDefinition)
2. Rename encounter types (EncounterType→ScenarioType, etc.)
3. Create scenario configuration types
4. Update BaseMiniGame interface

**Dependencies:** None for initial type renames, but config types depend on type renames

### Phase 2: MiniGame Hierarchy
1. Create GridMiniGame base class
2. Refactor CombatMiniGame to extend GridMiniGame
3. Refactor ObstacleMiniGame to extend GridMiniGame

**Dependencies:** GridMiniGame requires scenario config types and GridController rename

### Phase 3: Supporting Systems
1. Rename EncounterController → GridController
2. Rename EncounterFactory → ScenarioFactory
3. Create MiniGameFactory

**Dependencies:** Factory depends on minigame refactoring, GridController needed by GridMiniGame

### Phase 4: UI Components
1. Rename EncounterView → ScenarioView
2. Rename encounter components directory and files
3. Update GameState with new terminology

**Dependencies:** UI renames can happen in parallel, GameState depends on core types

### Phase 5: Data and Tests
1. Rename data files and update structure
2. Update test files and helpers
3. Update all imports

**Dependencies:** Tests depend on data files and UI components

### Phase 6: Verification
1. Build verification
2. Test execution
3. Final cleanup

**Dependencies:** All previous phases

## Testing Strategy

### Unit Tests
- GridMiniGame shared functionality
- MiniGameFactory creating different minigame types
- Scenario configuration type assignments

### Integration Tests
- Job loading with new structure
- Scenario loading and initialization
- Minigame initialization with configuration
- Grid-based scenario execution

### E2E Tests
- Update existing tests to use new terminology
- Verify scenario loading works
- Test combat scenarios
- Test obstacle scenarios with turn limits
- Verify UI components render correctly
- Test job/scenario navigation

### Test Files to Update
- `tests/e2e/jobs/job-loading.spec.ts` (renamed from campaign-loading)
- `tests/e2e/scenarios/*.spec.ts` (renamed from encounters)
- `tests/e2e/helpers/scenario-helpers.ts` (renamed from encounter-helpers)
- All tests referencing EncounterView, Campaign, etc.

## Key Files

### Core Types
- `src/jobs/Job.ts` (renamed from Campaign.ts)
- `src/types/Scenario.ts` (renamed from Encounter.ts)
- `src/types/ScenarioConfig.ts` (new)

### MiniGame Classes
- `src/mini-games/BaseMiniGame.ts` (updated)
- `src/mini-games/GridMiniGame.ts` (new)
- `src/mini-games/CombatMiniGame.ts` (refactored)
- `src/mini-games/ObstacleMiniGame.ts` (refactored)
- `src/mini-games/MiniGameFactory.ts` (new)

### Supporting Systems
- `src/jobs/JobLoader.ts` (renamed from CampaignLoader.ts)
- `src/scenarios/ScenarioFactory.ts` (renamed from EncounterFactory.ts)
- `src/game-engine/grid-scenario/GridController.ts` (renamed from EncounterController.ts)

### UI Components
- `src/ui/components/ScenarioView.tsx` (renamed from EncounterView.tsx)
- `src/ui/components/scenario/ScenarioGrid.tsx` (renamed)
- `src/ui/components/scenario/ScenarioInfoPanel.tsx` (renamed)
- `src/game-engine/GameState.tsx` (updated)

### Data Files
- `public/jobs/manifest.json` (renamed, structure updated)
- `public/jobs/*-job.json` (renamed, structure updated)

## Risk Areas

1. **Breaking Changes**: Many files reference old terminology - need comprehensive search/replace
2. **Type Safety**: Ensure all type renames maintain type safety
3. **Test Coverage**: Many tests need updating - risk of missing test updates
4. **Configuration Pattern**: New config pattern needs careful design to support future minigames
5. **GridController Dependencies**: Many files depend on EncounterController - need to update all references

## Success Criteria

- All TypeScript compilation errors resolved
- All E2E tests pass
- No references to "Campaign" or "Encounter" in code (except in comments explaining migration)
- GridMiniGame successfully shared between Combat and Obstacle minigames
- Scenario configuration pattern working for both combat and obstacle scenarios
- Job loading and scenario initialization working correctly
- UI components render and function correctly with new terminology

