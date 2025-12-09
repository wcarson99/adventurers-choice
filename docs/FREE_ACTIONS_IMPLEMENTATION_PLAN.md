# Free Actions Implementation Plan: Movement System

## Overview

This document outlines the implementation plan for the manual path planning and step-by-step execution movement system. The system replaces the current tap-tap movement with a more flexible, tactical approach.

## Implementation Phases

### Phase 1: Core Data Structures and Path Planning Logic
### Phase 2: Occupancy Validation System
### Phase 3: Planning UI and Visual Feedback
### Phase 4: Execution System
### Phase 5: State Change Integration
### Phase 6: UI Polish and Edge Cases

---

## Phase 1: Core Data Structures and Path Planning Logic

### Task 1.1: Create Path Data Structure
**Description:** Define TypeScript interfaces and classes for storing planned movement paths.

**Requirements:**
- `PlannedPath` interface: `{ characterId: number; steps: GridPosition[]; currentStepIndex: number; status: 'planning' | 'ready' | 'executing' | 'complete' | 'blocked' }`
- `MovementPlan` class: Manages all characters' planned paths
- Methods: `addPath()`, `removePath()`, `getPath()`, `clearAll()`, `getAllPaths()`

**Dependencies:** None

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/PlannedPath.ts` (new)
- `src/game-engine/encounters/MovementPlan.ts` (new)

---

### Task 1.2: Extend MovementSystem for Path Validation
**Description:** Add methods to MovementSystem to validate individual path steps against DEX patterns.

**Requirements:**
- `validatePathStep()`: Check if a step is valid for a character's DEX
- `canMoveFromTo()`: Check if character can move from position A to B (respects DEX patterns)
- Update existing `getMovementPatterns()` if needed

**Dependencies:** Task 1.1

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/MovementSystem.ts` (modify)

---

### Task 1.3: Path Building Logic
**Description:** Create utility functions for building paths step-by-step.

**Requirements:**
- `addStepToPath()`: Add a step to a character's path
- `removeLastStep()`: Remove last step from path (undo)
- `validatePathContinuity()`: Ensure path steps are valid transitions
- `getPathLength()`: Get total number of steps

**Dependencies:** Task 1.1, Task 1.2

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/PathBuilder.ts` (new)

---

## Phase 2: Occupancy Validation System

### Task 2.1: Occupancy Map Generator
**Description:** Create system to calculate which squares are occupied at each step across all planned paths.

**Requirements:**
- `OccupancyMap` class: Tracks occupancy at each step
- `calculateOccupancyAtStep()`: Determine which squares are occupied at step N
- Consider: current positions, planned positions, completed paths
- Handle path length mismatches (characters complete at different steps)

**Dependencies:** Task 1.1

**Difficulty:** Medium

**Estimated Time:** 4-5 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/OccupancyMap.ts` (new)

---

### Task 2.2: Conflict Detection
**Description:** Detect conflicts when planning new paths (swapping, multiple characters to same square).

**Requirements:**
- `checkSwapConflict()`: Detect if path would cause character swap
- `checkOccupancyConflict()`: Check if target square is occupied at that step
- `getConflictingCharacters()`: Return list of characters that would conflict
- Integration with OccupancyMap

**Dependencies:** Task 2.1

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/ConflictDetector.ts` (new)

---

### Task 2.3: Valid Destination Calculator
**Description:** Calculate which squares are valid destinations for a character at a given step.

**Requirements:**
- `getValidDestinationsAtStep()`: Return valid squares for step N
- Consider: DEX patterns, walls, obstacles, occupancy, conflicts
- Used by UI to gray out invalid squares

**Dependencies:** Task 1.2, Task 2.1, Task 2.2

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/ValidDestinationCalculator.ts` (new)

---

## Phase 3: Planning UI and Visual Feedback

### Task 3.1: Path Planning State Management
**Description:** Add React state management for path planning in EncounterView.

**Requirements:**
- State: `selectedCharacter`, `planningMode`, `movementPlan` (MovementPlan instance)
- State: `currentStepIndex` (for execution)
- Handlers: `handleCharacterClick()`, `handleTileClick()`, `enterPlanningMode()`, `exitPlanningMode()`

**Dependencies:** Task 1.1

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 3.2: Tile Click Handler for Path Building
**Description:** Implement tile click logic to build paths step-by-step.

**Requirements:**
- When character selected and in planning mode, clicking tile adds step to path
- Validate step before adding (DEX patterns, occupancy)
- Show immediate feedback (path preview)
- Handle "Done" or deselect to commit path

**Dependencies:** Task 3.1, Task 1.3, Task 2.3

**Difficulty:** Medium

**Estimated Time:** 4-5 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 3.3: Visual Feedback - Path Preview
**Description:** Render path preview lines and step numbers on grid.

**Requirements:**
- Draw line connecting path steps for selected character
- Show step numbers on path (1, 2, 3, etc.)
- Update in real-time as path is built
- Use Canvas or CSS overlays

**Dependencies:** Task 3.1

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)
- `src/ui/canvas/PathRenderer.ts` (new, if using Canvas)

---

### Task 3.4: Visual Feedback - Position Indicators
**Description:** Show start positions (grayed), end positions (full), current step positions (highlighted).

**Requirements:**
- Start positions: Gray/transparent overlay
- End positions: Full color overlay
- Current step: Highlighted overlay (different color)
- Update as paths are planned and executed

**Dependencies:** Task 3.1

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 3.5: Visual Feedback - Invalid Squares
**Description:** Gray out or highlight squares that cannot be selected.

**Requirements:**
- Show invalid squares (occupied, out of DEX range, etc.)
- Visual distinction: Gray overlay, red border, or similar
- Update in real-time as paths are planned

**Dependencies:** Task 3.1, Task 2.3

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 3.6: Planning UI Controls
**Description:** Add UI buttons and controls for path planning.

**Requirements:**
- "Clear All" button (reset all paths)
- "Done" button or click character again to commit path
- Character selection UI (show which character is being planned)
- Path status indicators (planning, ready, etc.)

**Dependencies:** Task 3.1

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

## Phase 4: Execution System

### Task 4.1: Step Execution Logic
**Description:** Implement logic to execute one step for all characters.

**Requirements:**
- `executeNextStep()`: Execute next step for all characters
- For each character: validate step, move if valid, mark as blocked if invalid
- Update `currentStepIndex` for each character
- Return execution results (who moved, who blocked, etc.)

**Dependencies:** Task 1.1, Task 1.2

**Difficulty:** Medium

**Estimated Time:** 4-5 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/MovementExecutor.ts` (new)

---

### Task 4.2: Step Validation During Execution
**Description:** Validate steps during execution (walls, obstacles, state changes, occupancy).

**Requirements:**
- `validateStepExecution()`: Check if step is still valid at execution time
- Consider: walls, obstacles, other characters (at current step), state changes
- Return validation result with reason if invalid

**Dependencies:** Task 4.1, Task 1.2

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/MovementExecutor.ts` (modify)

---

### Task 4.3: Execution State Management
**Description:** Track execution state (which characters are moving, complete, blocked).

**Requirements:**
- Update character status: 'executing' → 'complete' or 'blocked'
- Track execution progress (current step index for all characters)
- Determine when all movements are done

**Dependencies:** Task 4.1

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/MovementExecutor.ts` (modify)

---

### Task 4.4: "Execute Free Moves" Button
**Description:** Implement UI button to execute next step.

**Requirements:**
- Button enabled when paths are planned
- Click executes next step for all characters
- Show progress: "Execute Free Moves (Step 3/5)" or similar
- Disable when all paths complete or blocked
- Handle rapid clicks (debounce or queue)

**Dependencies:** Task 4.1, Task 3.1

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 4.5: Execution Visual Feedback
**Description:** Show character movement during execution.

**Requirements:**
- Animate characters moving to next step
- Update position indicators (current step positions)
- Show blocked characters (red indicator)
- Show completed characters (green indicator)
- Status messages: "Character X blocked: [reason]"

**Dependencies:** Task 4.1, Task 3.4

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

## Phase 5: State Change Integration

### Task 5.1: State Change Detection
**Description:** Detect state changes after each step (pressure plates, switches, doors).

**Requirements:**
- `detectStateChanges()`: Check for state-changing interactions after step
- Identify which tiles changed state
- Return list of state changes with affected tiles

**Dependencies:** Task 4.1

**Difficulty:** Hard (depends on state change system implementation)

**Estimated Time:** 4-6 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/StateChangeDetector.ts` (new)
- Integration with existing state change systems

---

### Task 5.2: State Change Application
**Description:** Apply state changes after each step execution.

**Requirements:**
- `applyStateChanges()`: Update grid state based on detected changes
- Update door states, pressure plate states, hazard states, etc.
- Notify systems that depend on state changes

**Dependencies:** Task 5.1

**Difficulty:** Hard (depends on state change system implementation)

**Estimated Time:** 4-6 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/StateChangeApplier.ts` (new)
- Integration with existing state change systems

---

### Task 5.3: State Change Impact on Next Steps
**Description:** Re-validate next steps after state changes.

**Requirements:**
- After state change, check if next steps are still valid
- Mark characters as blocked if state change blocks their next step
- Show appropriate messages

**Dependencies:** Task 5.2, Task 4.2

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/MovementExecutor.ts` (modify)

---

## Phase 6: UI Polish and Edge Cases

### Task 6.1: Path Editing
**Description:** Allow players to modify paths (remove last step, clear path, start over).

**Requirements:**
- "Undo Last Step" button or gesture
- "Clear Path" button for individual character
- "Clear All" button (already planned)
- Update visual feedback immediately

**Dependencies:** Task 3.2

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 6.2: Path Length Mismatch Handling
**Description:** Handle characters with different path lengths executing simultaneously.

**Requirements:**
- Characters who complete stay at destination
- Their destination is occupied for subsequent steps
- Other characters' paths must avoid completed characters' destinations
- Update occupancy map as characters complete

**Dependencies:** Task 2.1, Task 4.1

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/OccupancyMap.ts` (modify)
- `src/game-engine/encounters/MovementExecutor.ts` (modify)

---

### Task 6.3: Swapping Prevention
**Description:** Prevent characters from swapping positions in a single turn.

**Requirements:**
- Validate during planning: cannot select another character's start as destination
- Validate during planning: cannot select destination if your start is another's destination
- Show clear error messages or gray out invalid destinations

**Dependencies:** Task 2.2, Task 3.2

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/game-engine/encounters/ConflictDetector.ts` (modify)
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 6.4: Blocked Character Handling
**Description:** Handle characters who get blocked mid-execution.

**Requirements:**
- Character stops at last valid position
- Mark as "Blocked" with reason
- Show status message: "Character X blocked: [reason]"
- Allow replanning from current position next turn
- Update visual indicators

**Dependencies:** Task 4.1, Task 4.5

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 6.5: Character Status Display
**Description:** Show character movement status in UI panel.

**Requirements:**
- List all characters with their path status
- Show: Planning, Ready, Executing, Complete, Blocked
- Show path length: "5 steps"
- Show current step: "Step 3/5"
- Click to select/modify path

**Dependencies:** Task 3.1, Task 4.3

**Difficulty:** Easy

**Estimated Time:** 2-3 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 6.6: Mobile Touch Optimization
**Description:** Optimize for mobile/tablet touch interactions.

**Requirements:**
- Larger touch targets (76px tiles are good)
- Prevent accidental path modifications
- Clear visual feedback for touch interactions
- Handle touch cancellation (finger leaves screen)
- Test on mobile devices

**Dependencies:** Task 3.2

**Difficulty:** Medium

**Estimated Time:** 3-4 hours

**Files to Create/Modify:**
- `src/ui/components/EncounterView.tsx` (modify)

---

### Task 6.7: Error Handling and Edge Cases
**Description:** Handle edge cases and error conditions.

**Requirements:**
- Invalid path steps (out of bounds, invalid DEX pattern)
- Empty paths (character with no path planned)
- Paths that become invalid during planning
- Rapid clicking during execution
- Network/state sync issues (if multiplayer)

**Dependencies:** All previous tasks

**Difficulty:** Medium

**Estimated Time:** 4-5 hours

**Files to Create/Modify:**
- All relevant files (add error handling)

---

## Testing Strategy

### Unit Tests
- Path data structures
- Occupancy map calculations
- Conflict detection
- Step validation
- Execution logic

### Integration Tests
- Path planning → execution flow
- State changes during execution
- Multiple characters with different path lengths
- Conflict resolution

### E2E Tests (Playwright)
- Complete path planning workflow
- Step-by-step execution
- State change interactions
- Mobile touch interactions
- Error scenarios

---

## Dependencies Summary

### Critical Path (Must be done in order):
1. Phase 1: Core Data Structures → Phase 2: Occupancy Validation → Phase 3: Planning UI → Phase 4: Execution → Phase 5: State Changes → Phase 6: Polish

### Parallel Work Opportunities:
- Task 3.3, 3.4, 3.5 (Visual feedback) can be done in parallel
- Task 6.1, 6.2, 6.3, 6.4 (Edge cases) can be done in parallel after Phase 4

### External Dependencies:
- State change system (for Phase 5)
- Grid system (already exists)
- ECS World/Component system (already exists)

---

## Estimated Total Time

- **Phase 1:** 7-10 hours
- **Phase 2:** 10-13 hours
- **Phase 3:** 15-20 hours
- **Phase 4:** 14-18 hours
- **Phase 5:** 11-16 hours (depends on state change system)
- **Phase 6:** 18-25 hours

**Total:** 75-102 hours (~2-3 weeks for one developer)

---

## Risk Assessment

### High Risk:
- **State Change Integration (Phase 5):** Depends on state change system implementation. May require significant refactoring.
- **Occupancy Validation (Phase 2):** Complex logic, many edge cases. May need iteration.

### Medium Risk:
- **Visual Feedback (Phase 3):** Performance concerns with multiple path previews. May need optimization.
- **Execution System (Phase 4):** Complex state management. May need refactoring.

### Low Risk:
- **Data Structures (Phase 1):** Straightforward implementation.
- **UI Polish (Phase 6):** Mostly incremental improvements.

---

## Notes

- This plan assumes the state change system exists or will be implemented in parallel
- Some tasks may need to be broken down further during implementation
- Consider implementing a "fast forward" option (execute all steps at once) as a future enhancement
- Mobile testing should be done throughout, not just at the end
- Consider performance optimization if path previews cause lag with many characters

