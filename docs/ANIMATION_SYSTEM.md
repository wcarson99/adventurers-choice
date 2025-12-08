---
title: Animation System Architecture
type: architecture
status: design-complete
last_updated: 2025-12-01
tags: [architecture, animations, sprites, canvas, rendering]
---

# Animation System Architecture

## Overview

The animation system provides sprite-based animations for turn-based game actions. Animations are event-driven, playing once per action execution (e.g., walking animation plays once per square moved).

## Design Principles

- **Framework-Agnostic Core**: Animation logic is pure TypeScript, independent of React
- **Turn-Based**: Animations trigger on action execution, not continuous loops (except idle)
- **Performance**: Preload all animations, pre-calculate frame data
- **Simplicity**: Fixed timing for MVP, extensible for future needs

## Asset Structure

### Directory Organization

```
public/assets/animations/
  characters/
    warrior-walking.png    # 16 frames, 64x64 each, 4x4 grid (256x256 total)
    warrior-idle.png       # Animation frames
    warrior-push.png       # Animation frames
    thief-walking.png
    ...
  items/
    crate-static.png       # Single frame or 1-frame sheet
    crate-pushed.png       # Single frame or 1-frame sheet
  mechanisms/
    lever-states.png       # 2 frames: up/down
    pressure-plate-states.png # 2 frames: raised/lowered
```

### Sprite Sheet Format

- **Layout**: Grid-based (rows × columns)
- **Frame Size**: 64×64 pixels (standard)
- **Frame Count**: Variable (16 for walking, 2 for state changes, etc.)
- **Grid Calculation**: For 16 frames = 4×4 grid (256×256 total image)

## Architecture Components

### 1. SpriteLoader (Asset Loading)

**Location**: `src/utils/SpriteLoader.ts`

**Responsibilities**:
- Load and cache sprite sheet images
- Parse spritesheet metadata (frame dimensions, count, layout)
- Pre-calculate frame source rectangles
- Provide frame extraction utilities

**API Design**:
```typescript
class SpriteLoader {
  static getInstance(): SpriteLoader;
  
  loadSpriteSheet(path: string, metadata: SpriteSheetMetadata): Promise<SpriteSheet>;
  getFrame(spriteSheet: SpriteSheet, frameIndex: number): FrameRect;
  preloadAnimations(characterType: string): Promise<void>;
  isLoaded(path: string): boolean;
}
```

**Data Structures**:
```typescript
interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  gridColumns: number;
  gridRows: number;
  frames: Array<FrameRect>; // Pre-calculated source rectangles
}

interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpriteSheetMetadata {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  gridColumns?: number; // Auto-calculated if not provided
  gridRows?: number;    // Auto-calculated if not provided
}
```

**Loading Strategy**:
- **Preload**: All character animations loaded at game start (after character creation)
- **Caching**: Singleton cache prevents duplicate loads
- **Error Handling**: Fallback to static sprite if animation fails to load

### 2. AnimationController (Timing & State)

**Location**: `src/game-engine/animations/AnimationController.ts`

**Responsibilities**:
- Manage animation state per entity
- Advance frames based on elapsed time
- Handle animation lifecycle (start, play, complete)
- Reset animations when actions complete

**API Design**:
```typescript
class AnimationController {
  startAnimation(entityId: EntityId, animationType: string, spriteSheet: SpriteSheet): void;
  update(deltaTime: number): void;
  getCurrentFrame(entityId: EntityId): number | null;
  isPlaying(entityId: EntityId): boolean;
  stopAnimation(entityId: EntityId): void;
  reset(entityId: EntityId): void;
}
```

**Animation State**:
```typescript
interface AnimationState {
  entityId: EntityId;
  spriteSheet: SpriteSheet;
  currentFrame: number;
  elapsedTime: number;
  frameDuration: number; // 30ms per frame (MVP: fixed)
  isPlaying: boolean;
  loop: boolean; // false for action animations, true for idle
}
```

**Timing**:
- **Frame Duration**: 30ms per frame (MVP: fixed)
- **Walking Animation**: 16 frames × 30ms = 480ms total
- **Action Animations**: Play once, stop at last frame
- **Idle Animations**: Loop continuously (future)

### 3. Animation Component (ECS Integration)

**Location**: `src/components/AnimationComponent.ts` (or in existing component structure)

**Component Data**:
```typescript
interface AnimationComponent {
  currentAnimation: string | null; // 'walking', 'push', 'idle', etc.
  spriteSheet: SpriteSheet | null;
  frameIndex: number;
  isPlaying: boolean;
}
```

**Integration with ECS**:
- Animation state stored as ECS component
- Systems update animation state based on actions
- Renderer queries animation component for current frame

### 4. SpriteRenderer (Canvas Rendering)

**Location**: `src/ui/canvas/SpriteRenderer.tsx` (React component)

**Responsibilities**:
- Query animation state from ECS
- Get current frame from AnimationController
- Draw sprite frame to canvas using `drawImage()`
- Handle static sprites (fallback when no animation)

**Rendering Flow**:
1. Query entity's AnimationComponent
2. If animation playing: get current frame from AnimationController
3. Extract frame rectangle from SpriteSheet
4. Draw to canvas: `ctx.drawImage(spriteSheet.image, srcX, srcY, srcW, srcH, destX, destY, destW, destH)`
5. If no animation: draw static sprite

## Animation Flow

### Turn-Based Action Animation

1. **Action Execution**: Player moves character → `MoveAction` executed
2. **Animation Trigger**: ActionSystem triggers `AnimationController.startAnimation(entityId, 'walking', spriteSheet)`
3. **Frame Progression**: Each render frame, `AnimationController.update(deltaTime)` advances frame index
4. **Rendering**: `SpriteRenderer` queries current frame and draws it
5. **Completion**: Animation completes (reaches last frame) → stops, character shows static sprite

### Animation States

- **Idle**: No animation, static sprite (future: looping idle animation)
- **Walking**: 16-frame animation, plays once per square moved
- **Pushing**: Animation plays once per push action
- **Other Actions**: Action-specific animations (future)

## File Structure

```
src/
  utils/
    SpriteLoader.ts              # Asset loading & caching (framework-agnostic)
  game-engine/
    animations/
      AnimationController.ts     # Timing & frame progression
      AnimationState.ts           # Animation state types
  components/
    AnimationComponent.ts         # ECS component for animation state
  ui/
    canvas/
      SpriteRenderer.tsx         # Canvas drawing (React component)
```

## Implementation Phases

### Phase 1: SpriteLoader (MVP)
- Load sprite sheet images
- Parse grid layout (4×4 for 16 frames)
- Pre-calculate frame rectangles
- Cache loaded images

### Phase 2: AnimationController (MVP)
- Track animation state per entity
- Advance frames based on fixed timing (30ms/frame)
- Handle animation start/stop

### Phase 3: ECS Integration
- Add AnimationComponent
- Integrate with ActionSystem to trigger animations
- Update animation state in systems

### Phase 4: Canvas Rendering
- Implement SpriteRenderer component
- Query animation state
- Draw current frame to canvas
- Fallback to static sprite

## Future Enhancements

- **Variable Timing**: Configurable frame duration per animation
- **Easing**: Frame timing curves (slow start, fast middle, slow end)
- **Animation Sequences**: Chain multiple animations (walk → push → walk)
- **JSON Metadata**: External config files for sprite sheet metadata
- **Idle Animations**: Looping animations for stationary characters
- **Effect Animations**: Particle effects, damage indicators, etc.

## Constraints

- **No `requestAnimationFrame`**: Animations update based on React render cycle or explicit update calls
- **Turn-Based**: Animations play once per action, not continuous loops
- **Framework-Agnostic**: Core logic must work without React
- **Performance**: Preload all assets, minimize runtime calculations

## Testing Considerations

- Unit tests for SpriteLoader (image loading, frame calculation)
- Unit tests for AnimationController (timing, frame progression)
- Integration tests for animation triggering from actions
- E2E tests for visual animation playback (Playwright)

