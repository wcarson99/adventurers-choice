---
title: Animation System Implementation Plan
type: implementation-plan
status: draft
last_updated: 2025-12-01
tags: [implementation, animations, sprites, tasks]
---

# Animation System Implementation Plan

This document provides a detailed implementation plan for the animation system as specified in `ANIMATION_SYSTEM.md`. Tasks are organized by phase with dependencies and difficulty estimates.

## Difficulty Scale

- **Easy (E)**: 1-2 hours, straightforward implementation, minimal complexity
- **Medium (M)**: 3-5 hours, moderate complexity, may require integration with existing systems
- **Hard (H)**: 6+ hours, complex logic, multiple integrations, or significant architectural changes

## Phase 1: SpriteLoader Foundation

### Task 1.1: Create SpriteLoader class structure
**Difficulty**: Easy  
**Dependencies**: None  
**Description**: Create the `SpriteLoader` singleton class with basic structure, cache management, and type definitions.

**Subtasks**:
- Create `src/utils/SpriteLoader.ts`
- Define `SpriteSheet`, `FrameRect`, and `SpriteSheetMetadata` interfaces
- Implement singleton pattern with `getInstance()`
- Create cache Map for loaded sprite sheets
- Add `isLoaded(path: string): boolean` method

**Files to create**:
- `src/utils/SpriteLoader.ts`

**Files to modify**: None

---

### Task 1.2: Implement sprite sheet loading
**Difficulty**: Medium  
**Dependencies**: Task 1.1  
**Description**: Implement `loadSpriteSheet()` method to load images and parse metadata.

**Subtasks**:
- Implement image loading with Promise-based API
- Parse sprite sheet metadata (frame dimensions, count)
- Auto-calculate grid layout (rows/columns) if not provided
- Store loaded sprite sheet in cache
- Handle loading errors with fallback strategy

**Files to modify**:
- `src/utils/SpriteLoader.ts`

---

### Task 1.3: Implement frame extraction utilities
**Difficulty**: Easy  
**Dependencies**: Task 1.2  
**Description**: Implement `getFrame()` method and pre-calculate frame rectangles.

**Subtasks**:
- Calculate frame source rectangles based on grid layout
- Implement `getFrame(spriteSheet, frameIndex)` method
- Pre-calculate all frame rectangles when sprite sheet loads
- Store pre-calculated frames in SpriteSheet.frames array

**Files to modify**:
- `src/utils/SpriteLoader.ts`

---

### Task 1.4: Add preload functionality
**Difficulty**: Easy  
**Dependencies**: Task 1.3  
**Description**: Implement `preloadAnimations()` method for character types.

**Subtasks**:
- Create method to preload all animations for a character type
- Load walking, idle, push animations (if available)
- Handle missing animations gracefully (fallback to static sprite)
- Return Promise that resolves when all animations loaded

**Files to modify**:
- `src/utils/SpriteLoader.ts`

**Files to create**:
- `src/utils/spriteMetadata.ts` (optional: metadata configuration)

---

### Task 1.5: Unit tests for SpriteLoader
**Difficulty**: Medium  
**Dependencies**: Task 1.4  
**Description**: Write unit tests for SpriteLoader functionality.

**Subtasks**:
- Test image loading and caching
- Test frame calculation for different grid layouts (4x4, 2x1, etc.)
- Test error handling (missing images, invalid metadata)
- Test preload functionality
- Mock HTMLImageElement for testing

**Files to create**:
- `tests/unit/utils/SpriteLoader.test.ts`

---

## Phase 2: AnimationController Foundation

### Task 2.1: Create AnimationController class structure
**Difficulty**: Easy  
**Dependencies**: None  
**Description**: Create AnimationController class with state management.

**Subtasks**:
- Create `src/game-engine/animations/AnimationController.ts`
- Define `AnimationState` interface
- Create Map to track animation state per entity
- Implement basic lifecycle methods (start, stop, reset)

**Files to create**:
- `src/game-engine/animations/AnimationController.ts`
- `src/game-engine/animations/AnimationState.ts` (types)

---

### Task 2.2: Implement frame progression logic
**Difficulty**: Medium  
**Dependencies**: Task 2.1  
**Description**: Implement `update()` method to advance frames based on elapsed time.

**Subtasks**:
- Implement fixed frame duration (30ms per frame)
- Track elapsed time per animation
- Advance frame index when duration exceeded
- Handle animation completion (stop at last frame for non-looping)
- Support looping animations (for future idle animations)

**Files to modify**:
- `src/game-engine/animations/AnimationController.ts`

---

### Task 2.3: Implement animation query methods
**Difficulty**: Easy  
**Dependencies**: Task 2.2  
**Description**: Implement methods to query current animation state.

**Subtasks**:
- Implement `getCurrentFrame(entityId)`
- Implement `isPlaying(entityId)`
- Handle entities without active animations (return null/false)
- Add method to get current animation type

**Files to modify**:
- `src/game-engine/animations/AnimationController.ts`

---

### Task 2.4: Unit tests for AnimationController
**Difficulty**: Medium  
**Dependencies**: Task 2.3  
**Description**: Write unit tests for AnimationController timing and state management.

**Subtasks**:
- Test frame progression with fixed timing
- Test animation start/stop/reset
- Test looping vs non-looping animations
- Test multiple concurrent animations
- Mock time for deterministic testing

**Files to create**:
- `tests/unit/game-engine/animations/AnimationController.test.ts`

---

## Phase 3: ECS Integration

### Task 3.1: Create AnimationComponent
**Difficulty**: Easy  
**Dependencies**: None (but should align with existing Component structure)  
**Description**: Add AnimationComponent to ECS component system.

**Subtasks**:
- Add `AnimationComponent` to `src/game-engine/ecs/Component.ts`
- Define component interface with currentAnimation, spriteSheet, frameIndex, isPlaying
- Add 'Animation' to ComponentType union
- Ensure component is serializable (for future save/load)

**Files to modify**:
- `src/game-engine/ecs/Component.ts`

---

### Task 3.2: Integrate AnimationController with ECS World
**Difficulty**: Medium  
**Dependencies**: Task 2.3, Task 3.1  
**Description**: Connect AnimationController to ECS World for entity-based animation management.

**Subtasks**:
- Store AnimationController instance in GameEngine or World
- Update AnimationComponent when animations start/stop
- Sync AnimationController state with AnimationComponent
- Ensure AnimationComponent reflects current animation state

**Files to modify**:
- `src/game-engine/animations/AnimationController.ts`
- `src/game-engine/GameEngine.ts` (or appropriate system)

---

### Task 3.3: Trigger animations from MovementSystem
**Difficulty**: Medium  
**Dependencies**: Task 3.2, Task 1.4  
**Description**: Trigger walking animation when character moves.

**Subtasks**:
- Modify `MovementSystem.moveCharacter()` to trigger animation
- Load character's walking sprite sheet (if available)
- Start walking animation via AnimationController
- Handle animation completion (stop at last frame)
- Fallback to static sprite if animation not available

**Files to modify**:
- `src/game-engine/encounters/MovementSystem.ts`
- `src/game-engine/animations/AnimationController.ts`

---

### Task 3.4: Trigger animations from PushSystem
**Difficulty**: Medium  
**Dependencies**: Task 3.3  
**Description**: Trigger push animation when character pushes object.

**Subtasks**:
- Modify `PushSystem.pushObject()` to trigger push animation
- Load character's push sprite sheet (if available)
- Start push animation via AnimationController
- Handle animation completion
- Fallback to static sprite if animation not available

**Files to modify**:
- `src/game-engine/encounters/PushSystem.ts`

---

### Task 3.5: Integration tests for animation triggering
**Difficulty**: Medium  
**Dependencies**: Task 3.4  
**Description**: Write integration tests for animation triggering from actions.

**Subtasks**:
- Test walking animation triggers on movement
- Test push animation triggers on push action
- Test animation state updates in ECS
- Test fallback to static sprite when animation missing
- Test multiple characters animating simultaneously

**Files to create**:
- `tests/unit/game-engine/animations/animation-integration.test.ts`

---

## Phase 4: Canvas Rendering

### Task 4.1: Create SpriteRenderer component structure
**Difficulty**: Easy  
**Dependencies**: None  
**Description**: Create React component for canvas-based sprite rendering.

**Subtasks**:
- Create `src/ui/canvas/SpriteRenderer.tsx`
- Set up canvas element with ref
- Create rendering context
- Define component props interface

**Files to create**:
- `src/ui/canvas/SpriteRenderer.tsx`

---

### Task 4.2: Implement static sprite rendering
**Difficulty**: Medium  
**Dependencies**: Task 4.1  
**Description**: Implement rendering of static sprites (fallback when no animation).

**Subtasks**:
- Query entities with RenderableComponent and PositionComponent
- Draw static sprites from RenderableComponent.sprite
- Handle sprite positioning on grid
- Support fallback to character/color rendering if sprite missing

**Files to modify**:
- `src/ui/canvas/SpriteRenderer.tsx`

---

### Task 4.3: Implement animated sprite rendering
**Difficulty**: Hard  
**Dependencies**: Task 4.2, Task 3.2  
**Description**: Implement rendering of animated sprites using current frame from AnimationController.

**Subtasks**:
- Query AnimationComponent from ECS
- Get current frame from AnimationController
- Extract frame rectangle from SpriteSheet
- Draw sprite frame using `ctx.drawImage()` with source rectangle
- Handle frame updates (trigger re-render when frame changes)
- Support both animated and static sprites in same render pass

**Files to modify**:
- `src/ui/canvas/SpriteRenderer.tsx`

**Files to modify** (for frame update triggering):
- `src/ui/components/EncounterView.tsx` (may need to trigger re-renders)

---

### Task 4.4: Integrate SpriteRenderer into EncounterView
**Difficulty**: Medium  
**Dependencies**: Task 4.3  
**Description**: Replace current sprite rendering in EncounterView with SpriteRenderer component.

**Subtasks**:
- Replace `<img>` tags with SpriteRenderer component
- Pass necessary props (world, grid, entities)
- Ensure SpriteRenderer updates when animation frames change
- Maintain existing click handlers and selection logic
- Test visual rendering matches previous behavior

**Files to modify**:
- `src/ui/components/EncounterView.tsx`

---

### Task 4.5: Handle animation frame updates in React
**Difficulty**: Medium  
**Dependencies**: Task 4.4  
**Description**: Implement mechanism to trigger React re-renders when animation frames advance.

**Subtasks**:
- Create update loop that calls AnimationController.update()
- Use React state or effect to trigger re-renders
- Determine update frequency (consider performance)
- Ensure updates only happen when animations are playing
- Handle cleanup when component unmounts

**Files to modify**:
- `src/ui/components/EncounterView.tsx`
- `src/ui/canvas/SpriteRenderer.tsx`

**Note**: Since we can't use `requestAnimationFrame`, consider:
- Using `setInterval` with fixed update rate (e.g., 30ms for 30fps)
- Or triggering updates manually after action execution
- Or using React state updates when animation state changes

---

### Task 4.6: E2E test for animation playback
**Difficulty**: Medium  
**Dependencies**: Task 4.5  
**Description**: Write Playwright E2E test to verify animations play correctly.

**Subtasks**:
- Test that walking animation plays when character moves
- Test that push animation plays when character pushes
- Test animation completes and shows static sprite
- Test multiple characters can animate simultaneously
- Verify frame progression visually (may require screenshots or video)

**Files to create**:
- `tests/e2e/animations/animation-playback.spec.ts`

---

## Phase 5: Polish & Optimization

### Task 5.1: Add animation metadata configuration
**Difficulty**: Easy  
**Dependencies**: Task 1.4  
**Description**: Create configuration file for sprite sheet metadata.

**Subtasks**:
- Create `src/utils/spriteMetadata.ts` or JSON config
- Define metadata for all character animations
- Support different frame counts per animation type
- Make metadata easily extensible for new animations

**Files to create**:
- `src/utils/spriteMetadata.ts` (or `public/assets/animations/metadata.json`)

**Files to modify**:
- `src/utils/SpriteLoader.ts` (use metadata config)

---

### Task 5.2: Optimize rendering performance
**Difficulty**: Medium  
**Dependencies**: Task 4.5  
**Description**: Optimize canvas rendering for performance.

**Subtasks**:
- Only re-render when animation state actually changes
- Batch frame updates to avoid excessive re-renders
- Use canvas optimization techniques (dirty rectangles, if needed)
- Profile rendering performance with multiple animated entities
- Consider offscreen canvas for pre-rendering if needed

**Files to modify**:
- `src/ui/canvas/SpriteRenderer.tsx`
- `src/ui/components/EncounterView.tsx`

---

### Task 5.3: Add error handling and fallbacks
**Difficulty**: Easy  
**Dependencies**: All previous phases  
**Description**: Ensure robust error handling throughout animation system.

**Subtasks**:
- Handle missing sprite sheets gracefully
- Fallback to static sprites when animations fail to load
- Add error logging for debugging
- Handle edge cases (entity destroyed during animation, etc.)
- Ensure game continues to work if animation system fails

**Files to modify**:
- `src/utils/SpriteLoader.ts`
- `src/game-engine/animations/AnimationController.ts`
- `src/ui/canvas/SpriteRenderer.tsx`

---

### Task 5.4: Documentation and cleanup
**Difficulty**: Easy  
**Dependencies**: All previous phases  
**Description**: Document animation system usage and clean up code.

**Subtasks**:
- Add JSDoc comments to all public APIs
- Document animation triggering patterns
- Update ARCHITECTURE.md with animation system details
- Remove debug code and console.logs
- Ensure code follows project style guidelines

**Files to modify**:
- All animation system files
- `docs/ARCHITECTURE.md`

---

## Implementation Order Summary

### Sequential Dependencies (Must follow order)

1. **Phase 1** (SpriteLoader): Tasks 1.1 → 1.2 → 1.3 → 1.4 → 1.5
2. **Phase 2** (AnimationController): Tasks 2.1 → 2.2 → 2.3 → 2.4
3. **Phase 3** (ECS Integration): Tasks 3.1 → 3.2 → 3.3 → 3.4 → 3.5
4. **Phase 4** (Rendering): Tasks 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6
5. **Phase 5** (Polish): Tasks 5.1, 5.2, 5.3, 5.4 (can be done in parallel after Phase 4)

### Parallel Opportunities

- **Phase 1 and Phase 2** can be started in parallel (no dependencies)
- **Task 3.1** (AnimationComponent) can be done early, independently
- **Phase 5 tasks** can be done in parallel after Phase 4 is complete
- **Testing tasks** (1.5, 2.4, 3.5, 4.6) can be done alongside their respective phases

### Critical Path

The longest dependency chain is:
1.1 → 1.2 → 1.3 → 1.4 → 3.3 → 3.4 → 4.3 → 4.4 → 4.5

This represents the core functionality: loading sprites → triggering animations → rendering animations.

## Estimated Total Effort

- **Phase 1**: ~12-15 hours (E+E+M+E+M)
- **Phase 2**: ~10-12 hours (E+M+E+M)
- **Phase 3**: ~15-18 hours (E+M+M+M+M)
- **Phase 4**: ~18-22 hours (E+M+H+M+M+M)
- **Phase 5**: ~8-10 hours (E+M+E+E)

**Total**: ~63-77 hours

## Risk Areas

1. **Task 4.3 (Animated sprite rendering)**: Hard difficulty - complex integration of ECS, AnimationController, and canvas rendering
2. **Task 4.5 (Frame updates in React)**: Medium difficulty - need to solve update mechanism without `requestAnimationFrame`
3. **Task 3.3/3.4 (Animation triggering)**: Medium difficulty - need to integrate with existing MovementSystem/PushSystem without breaking functionality

## Notes

- All tasks should follow TDD: Write failing test first, implement minimum code, refactor
- Consider creating a simple test sprite sheet early (even if placeholder) to enable testing
- Animation system should be optional - game should work even if animations fail to load
- Future enhancements (variable timing, easing, idle animations) are explicitly out of scope for MVP

