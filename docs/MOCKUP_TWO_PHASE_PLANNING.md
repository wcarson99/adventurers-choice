# Two-Phase Planning System - Visual Mockup

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  Clear the Goblin Cave                                              │
│  Objective: A local cave is infested with goblins. Clear them out.   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬──────────────────────────────┐
│                                      │  INFO PANEL                  │
│                                      │                              │
│         GRID (10×10)                 │  ┌────────────────────────┐  │
│                                      │  │ Instructions          │  │
│  [Grid tiles with characters,       │  │ "Click character..."   │  │
│   crates, walls, zones]              │  └────────────────────────┘  │
│                                      │                              │
│  - Blue entrance zone (left)         │  Turn: 3                    │
│  - Green exit zone (right)           │                              │
│  - Gray walls                        │  ┌────────────────────────┐  │
│  - Characters with ghost positions   │  │ CHARACTER STATS        │  │
│  - Crates                            │  │                        │  │
│                                      │  │ Name: Warrior          │  │
│                                      │  │ Archetype: Fighter    │  │
│                                      │  │                        │  │
│                                      │  │ STR: 4                 │  │
│                                      │  │ DEX: 3                 │  │
│                                      │  │ CON: 5                 │  │
│                                      │  │ INT: 2                 │  │
│                                      │  │ WIS: 2                 │  │
│                                      │  │ CHA: 2                 │  │
│                                      │  │                        │  │
│                                      │  │ HP: 10/10              │  │
│                                      │  │ Stamina: 8/10          │  │
│                                      │  │                        │  │
│                                      │  │ Gold: 20               │  │
│                                      │  │ Food: 4                │  │
│                                      │  └────────────────────────┘  │
│                                      │                              │
│                                      │  [Action Queue - if Phase 2]│
│                                      │                              │
└──────────────────────────────────────┴──────────────────────────────┘
```

## Phase 1: Movement Planning

### Visual State
```
┌──────────────────────────────────────┬──────────────────────────────┐
│  GRID                                │  INFO PANEL                  │
│                                      │                              │
│  [0,1] [1,1] [2,1] [3,1]            │  Instructions:               │
│   👤    [ghost]                      │  "Plan movements for all     │
│  (gray)                              │   characters, then click     │
│                                      │   'Plan Skill Actions'"      │
│  [0,3] [1,3] [2,3] [3,3]            │                              │
│   👤    [ghost]                      │  Turn: 3                    │
│  (gray)                              │                              │
│                                      │  ┌────────────────────────┐  │
│  [3,3] [4,3] [5,3]                  │  │ CHARACTER STATS        │  │
│   📦    👤    [ghost]                │  │ (Warrior - selected)   │  │
│        (gray)                        │  └────────────────────────┘  │
│                                      │                              │
│                                      │  [Clear All Movements]      │
│                                      │  [Plan Skill Actions]       │
│                                      │                              │
└──────────────────────────────────────┴──────────────────────────────┘
```

**Key Elements:**
- Original positions: Grayed out character sprites
- Ghost positions: Semi-transparent character sprites at destination
- Valid moves: Light green highlights when character selected
- Buttons: "Clear All Movements" and "Plan Skill Actions" (grayed if invalid)

## Phase 2: Skill Action Planning

### Visual State
```
┌──────────────────────────────────────┬──────────────────────────────┐
│  GRID                                │  INFO PANEL                  │
│                                      │                              │
│  [Characters in ghost positions]     │  Instructions:               │
│                                      │  "Select actions for each    │
│                                      │   character, then Execute"   │
│                                      │                              │
│                                      │  Turn: 3                    │
│                                      │                              │
│                                      │  ┌────────────────────────┐  │
│                                      │  │ CHARACTER STATS        │  │
│                                      │  │ (Warrior - selected)   │  │
│                                      │  └────────────────────────┘  │
│                                      │                              │
│                                      │  Select Action:              │
│                                      │  ○ Wait (0 stamina)         │
│                                      │  ○ Push (STR 3+, 10 stam)   │
│                                      │                              │
│                                      │  ACTION QUEUE:              │
│                                      │  1. Warrior: Push Crate     │
│                                      │     (10 stamina) [↑] [↓]     │
│                                      │  2. Cleric: Wait            │
│                                      │     (0 stamina) [↑] [↓]     │
│                                      │  3. Thief: [Not planned]    │
│                                      │                              │
│                                      │  [Back to Movements]        │
│                                      │  [Execute Turn]             │
│                                      │                              │
└──────────────────────────────────────┴──────────────────────────────┘
```

**Key Elements:**
- Action selection: Radio buttons or dropdown
- Action queue: Ordered list with reorder buttons
- Shows which characters are planned vs not planned
- "Back" clears skill actions, returns to movement phase

## Item Selection Flow

### When Item is Selected
```
┌──────────────────────────────────────┬──────────────────────────────┐
│  GRID                                │  INFO PANEL                  │
│                                      │                              │
│  [Character next to crate]           │  Instructions:              │
│   👤 📦                               │  "Select action for crate"  │
│                                      │                              │
│                                      │  Turn: 3                    │
│                                      │                              │
│                                      │  ┌────────────────────────┐  │
│                                      │  │ ITEM STATS             │  │
│                                      │  │                        │  │
│                                      │  │ Type: Crate            │  │
│                                      │  │ Weight: 30 lb          │  │
│                                      │  │ Pushable: Yes          │  │
│                                      │  └────────────────────────┘  │
│                                      │                              │
│                                      │  Select Action:              │
│                                      │  ○ Push (STR 3+, 10 stam)   │
│                                      │                              │
│                                      │  ACTION QUEUE:              │
│                                      │  1. Warrior: Push Crate     │
│                                      │     (10 stamina) [↑] [↓]     │
│                                      │                              │
└──────────────────────────────────────┴──────────────────────────────┘
```

## Questions for Resolution

### 1. Info Panel Width
- **Option A**: Fixed width (e.g., 300px)
- **Option B**: Percentage (e.g., 30% of screen)
- **Option C**: Flexible (min-width, max-width)

**Recommendation**: Option B (30% of screen width, min 250px, max 400px)

### 2. Action Selection UI
- **Option A**: Radio buttons (vertical list)
- **Option B**: Dropdown select
- **Option C**: Button group

**Recommendation**: Option A (Radio buttons) - easier to see all options

### 3. Action Queue Display
- **Option A**: Simple list with up/down arrows
- **Option B**: Drag-and-drop reordering
- **Option C**: Numbered list with buttons

**Recommendation**: Option A for MVP, Option B for polish

### 4. Stats Display Format
- **Option A**: Card layout (as shown)
- **Option B**: Table format
- **Option C**: Compact list

**Recommendation**: Option A (Card layout) - matches existing style

### 5. Grid Size Calculation
- **Option A**: Fixed tile size (64px), grid scales
- **Option B**: Calculate tile size to fill available space
- **Option C**: Responsive breakpoints

**Recommendation**: Option B (Calculate to fill) - maximizes grid size

### 6. Phase Indicator
- **Option A**: Text in instructions
- **Option B**: Tab/button indicator
- **Option C**: Visual separator

**Recommendation**: Option A (in instructions) - simple and clear

### 7. Invalid State Feedback
- **Option A**: Grayed button with tooltip
- **Option B**: Error message in info panel
- **Option C**: Visual highlight on grid

**Recommendation**: Option A + B (grayed button + message)

### 8. Execution Feedback
- **Option A**: Instant (no animation yet)
- **Option B**: Simple fade/slide
- **Option C**: Full animation (future)

**Recommendation**: Option A for MVP, Option C for future

## Implementation Priority

1. **High Priority** (Core functionality):
   - Layout restructure
   - Movement planning phase
   - Basic skill action planning
   - Info panel with stats

2. **Medium Priority** (UX polish):
   - Action queue reordering
   - Better visual feedback
   - Validation messages

3. **Low Priority** (Future):
   - Animations
   - Drag-and-drop
   - Advanced action types

