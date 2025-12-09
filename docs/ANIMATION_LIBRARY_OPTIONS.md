---
title: Animation Library Options Analysis
type: research
status: draft
last_updated: 2025-12-01
tags: [research, libraries, animations, sprites]
---

# Animation Library Options Analysis

This document analyzes popular open-source libraries and approaches for implementing sprite sheet animations in a React/TypeScript turn-based game.

## Top 5 Options

### 1. **PixiJS** ⭐ Most Popular
**npm**: `pixi.js`  
**Bundle Size**: ~500KB (minified)  
**GitHub Stars**: ~42k  
**License**: MIT

**Pros**:
- ✅ Industry standard for 2D web game rendering
- ✅ WebGL-accelerated (falls back to Canvas)
- ✅ Built-in sprite sheet support (`PIXI.Spritesheet`)
- ✅ Excellent performance with many sprites
- ✅ Active community and extensive documentation
- ✅ TypeScript support
- ✅ Animation system (`PIXI.AnimatedSprite`) built-in
- ✅ Texture caching and resource management

**Cons**:
- ❌ Large bundle size (~500KB) - may be overkill for simple sprite animations
- ❌ Requires WebGL context setup
- ❌ More complex API than needed for basic sprite sheets
- ❌ Not React-native (needs wrapper or integration layer)
- ❌ Designed for real-time games (may conflict with turn-based model)

**Integration Complexity**: Medium-Hard  
**Best For**: Games with many animated sprites, performance-critical rendering

**Example Usage**:
```typescript
import * as PIXI from 'pixi.js';

// Load sprite sheet
const sheet = await PIXI.Assets.load('warrior-walking.png');
const spritesheet = new PIXI.Spritesheet(sheet, {
  frames: { /* frame definitions */ },
  meta: { /* metadata */ }
});
await spritesheet.parse();

// Create animated sprite
const animatedSprite = new PIXI.AnimatedSprite(spritesheet.animations.walking);
animatedSprite.animationSpeed = 0.167; // 30ms per frame
animatedSprite.play();
```

---

### 2. **Phaser 3** ⭐ Full Game Framework
**npm**: `phaser`  
**Bundle Size**: ~800KB (minified)  
**GitHub Stars**: ~36k  
**License**: MIT

**Pros**:
- ✅ Complete game framework (physics, input, scenes, etc.)
- ✅ Excellent sprite sheet animation system (`anims.create()`)
- ✅ Built-in asset loading and caching
- ✅ Strong TypeScript support
- ✅ Well-documented with many examples
- ✅ Scene management system

**Cons**:
- ❌ Very large bundle size (~800KB) - massive overkill for just animations
- ❌ Full game framework - conflicts with existing ECS architecture
- ❌ Requires Phaser Scene/Game setup
- ❌ Not designed for React integration (needs wrapper)
- ❌ Turn-based execution model conflicts with Phaser's update loop

**Integration Complexity**: Hard  
**Best For**: Building entire game with Phaser (not suitable for this project)

**Example Usage**:
```typescript
import Phaser from 'phaser';

// In Phaser scene
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('warrior', { start: 0, end: 15 }),
  frameRate: 30,
  repeat: 0
});

sprite.play('walk');
```

---

### 3. **React-Konva** ⭐ React-Native Canvas
**npm**: `react-konva`  
**Bundle Size**: ~200KB (with Konva)  
**GitHub Stars**: ~3.5k  
**License**: MIT

**Pros**:
- ✅ React components for canvas rendering
- ✅ Declarative API (fits React patterns)
- ✅ Sprite support via `Image` component
- ✅ Animation support via `useAnimation` hook
- ✅ TypeScript support
- ✅ Smaller than PixiJS/Phaser

**Cons**:
- ❌ No built-in sprite sheet parser (need to implement frame extraction)
- ❌ Animation system is basic (need to manage frame timing manually)
- ❌ Canvas-based (no WebGL acceleration)
- ❌ Less performant than PixiJS for many sprites
- ❌ Animation hooks may conflict with turn-based model

**Integration Complexity**: Medium  
**Best For**: React-first approach with simple animations

**Example Usage**:
```typescript
import { Image } from 'react-konva';
import { useAnimation } from 'react-konva';

function AnimatedSprite({ spriteSheet, frameIndex }) {
  const frame = getFrameFromSheet(spriteSheet, frameIndex);
  return <Image image={frame} />;
}
```

---

### 4. **EaselJS / CreateJS** ⭐ Legacy but Stable
**npm**: `@createjs/easeljs`  
**Bundle Size**: ~150KB  
**GitHub Stars**: ~8k (EaselJS)  
**License**: MIT

**Pros**:
- ✅ Mature, battle-tested library
- ✅ Sprite sheet support (`SpriteSheet` class)
- ✅ Canvas-based rendering
- ✅ Animation utilities
- ✅ TypeScript definitions available

**Cons**:
- ❌ Older API (Flash-like, not modern)
- ❌ Less active development
- ❌ Not React-native (needs integration layer)
- ❌ Designed for Flash-like timeline animations
- ❌ May conflict with turn-based execution model

**Integration Complexity**: Medium  
**Best For**: Legacy projects or Flash developers

**Example Usage**:
```typescript
import { SpriteSheet, Sprite } from '@createjs/easeljs';

const spriteSheet = new SpriteSheet({
  images: ['warrior-walking.png'],
  frames: { width: 64, height: 64, count: 16 },
  animations: { walk: [0, 15] }
});

const sprite = new Sprite(spriteSheet, 'walk');
sprite.gotoAndPlay('walk');
```

---

### 5. **Custom Canvas Solution** ⭐ Lightweight & Flexible
**Approach**: Build custom sprite loader and animation controller  
**Bundle Size**: ~10-20KB (estimated)  
**Dependencies**: None (or minimal utilities)

**Pros**:
- ✅ Full control over implementation
- ✅ Minimal bundle size
- ✅ Perfect fit for turn-based execution model
- ✅ No conflicts with existing architecture
- ✅ Can optimize exactly for your use case
- ✅ Easy to test and debug
- ✅ No external dependencies

**Cons**:
- ❌ More development time (~63-77 hours estimated)
- ❌ Need to implement all features yourself
- ❌ No community support/documentation
- ❌ Need to handle edge cases yourself

**Integration Complexity**: Low (you control it)  
**Best For**: Turn-based games with specific requirements, minimal bundle size

**Example Usage** (from your architecture):
```typescript
// Custom implementation
const spriteLoader = SpriteLoader.getInstance();
const spriteSheet = await spriteLoader.loadSpriteSheet('warrior-walking.png', {
  frameWidth: 64,
  frameHeight: 64,
  frameCount: 16
});

const animationController = new AnimationController();
animationController.startAnimation(entityId, 'walking', spriteSheet);
```

---

## Comparison Matrix

| Feature | PixiJS | Phaser 3 | React-Konva | EaselJS | Custom |
|---------|--------|----------|-------------|---------|--------|
| **Bundle Size** | ~500KB | ~800KB | ~200KB | ~150KB | ~10-20KB |
| **Sprite Sheets** | ✅ Built-in | ✅ Built-in | ❌ Manual | ✅ Built-in | ⚙️ Custom |
| **Animation System** | ✅ Built-in | ✅ Built-in | ⚙️ Basic | ✅ Built-in | ⚙️ Custom |
| **React Integration** | ⚙️ Wrapper needed | ⚙️ Wrapper needed | ✅ Native | ⚙️ Wrapper needed | ✅ Native |
| **Turn-Based Friendly** | ⚙️ Possible | ❌ Conflicts | ⚙️ Possible | ⚙️ Possible | ✅ Perfect |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Learning Curve** | Medium | High | Low-Medium | Medium | Medium |
| **TypeScript** | ✅ Excellent | ✅ Excellent | ✅ Good | ⚙️ Available | ✅ Full control |
| **Maintenance** | ✅ Active | ✅ Active | ✅ Active | ⚙️ Slower | ⚙️ You maintain |

---

## Recommendation for This Project

### **Recommended: Custom Solution** (Option 5)

**Rationale**:

1. **Turn-Based Architecture**: Your game uses `GameEngine.executeTurn()` - a synchronous, non-realtime model. Most animation libraries are designed for continuous game loops, which would conflict with your architecture.

2. **Bundle Size**: Adding 200-800KB for sprite animations is significant overhead when you only need basic frame-by-frame sprite sheet playback.

3. **ECS Integration**: Your ECS architecture is already established. Integrating a full game framework (Phaser) or rendering engine (PixiJS) would require significant refactoring.

4. **Simplicity**: Your animation needs are straightforward:
   - Load sprite sheet
   - Extract frames
   - Play animation once per action
   - Render current frame to canvas
   
   This is achievable in ~60-80 hours vs. integrating and adapting a large library.

5. **Control**: Custom solution gives you:
   - Perfect integration with your ECS
   - No conflicts with turn-based execution
   - Easy testing and debugging
   - Future extensibility

### **Alternative: Hybrid Approach**

If you want to reduce development time, consider:

1. **Use a lightweight sprite sheet parser**: Libraries like `spritesheet-js` (~5KB) can handle sprite sheet parsing, then you build the animation controller yourself.

2. **Use PixiJS for rendering only**: Use PixiJS's `Spritesheet` class for parsing, but manage animations yourself and render to a canvas that you control.

3. **Start custom, migrate later**: Build the MVP custom solution, then evaluate if you need PixiJS for performance if you scale to many animated entities.

---

## Library-Specific Considerations

### If Choosing PixiJS:
- Need to wrap PixiJS in React component
- Disable automatic update loop (use manual updates)
- Integrate with ECS for entity rendering
- **Estimated Integration Time**: 15-20 hours

### If Choosing React-Konva:
- Need to implement sprite sheet frame extraction
- Need to build animation controller (similar to custom solution)
- Use Konva's `Image` component for rendering
- **Estimated Integration Time**: 20-25 hours (less than custom, but still significant)

### If Choosing Custom:
- Full control, perfect fit for architecture
- **Estimated Implementation Time**: 63-77 hours (as per implementation plan)

---

## Final Recommendation

**Proceed with Custom Solution** for the following reasons:

1. ✅ **Perfect architectural fit** - no conflicts with turn-based model
2. ✅ **Minimal bundle size** - important for web performance
3. ✅ **Full control** - easy to test, debug, and extend
4. ✅ **Reasonable effort** - 63-77 hours is acceptable for a core system
5. ✅ **Learning value** - understanding the system helps with future features

**Consider revisiting PixiJS** if:
- You need to render 100+ animated entities simultaneously
- Performance becomes a bottleneck
- You want to add particle effects or complex visual effects later

---

## References

- [PixiJS Documentation](https://pixijs.com/)
- [Phaser 3 Documentation](https://phaser.io/)
- [React-Konva Documentation](https://konvajs.org/docs/react/)
- [CreateJS Documentation](https://createjs.com/)
- [npm: pixi.js](https://www.npmjs.com/package/pixi.js)
- [npm: phaser](https://www.npmjs.com/package/phaser)
- [npm: react-konva](https://www.npmjs.com/package/react-konva)

