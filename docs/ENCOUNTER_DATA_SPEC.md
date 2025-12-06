---
title: Encounter Data Specification
type: specification
status: draft
last_updated: 2025-12-01
tags: [specification, data-format, encounters]
---

# Encounter Data Specification

## Overview

This specification defines the data structure for encounter definitions used in test campaigns and encounter persistence. Encounters represent static puzzle definitions that can be loaded and played by a party of characters.

**Scope:**
- Encounter puzzle definitions (grid layout, items, objectives)
- Square/tile type definitions and configurations
- Item definitions and properties
- Encounter metadata

**Out of Scope:**
- Character definitions (campaign-level)
- Party state (campaign-level)
- Dynamic encounter state during play

## Type Definitions

### Encounter

The root structure representing a complete encounter definition.

```typescript
interface Encounter {
  title: string;
  description: string;
  grid: Square[][];  // 10x10 nested array (grid[y][x])
  items: Item[];
  turnLimit?: TurnLimit;
}
```

### Square

Represents a single square/tile on the encounter grid.

```typescript
interface Square {
  type: SquareType;
  config: SquareConfig;
}

type SquareType = "floor" | "wall" | "cycle-floor";

interface SquareConfig {
  // For "floor" type:
  subtype?: FloorSubtype;
  zone?: ZoneType;
  sprite?: string;  // Optional override for sprite path
  
  // For "cycle-floor" type:
  turns_per_state?: number;
  states?: string[];
  
  // For "wall" type:
  // config is empty {}
}

type FloorSubtype = "stone";  // Future: "grass", "dirt", etc.
type ZoneType = "entrance" | "exit";
```

### Item

Represents an item, obstacle, or object placed on the encounter grid.

```typescript
interface Item {
  id?: string;  // Optional unique identifier
  position: Position;
  type: string;  // e.g., "crate", "loot", "treasure"
  weight?: number;  // Weight in pounds (for pushable items)
  sprite?: string;  // Path to sprite image
  color?: string;  // Fallback color if no sprite
  name?: string;  // Display name
  description?: string;  // Flavor text
}

interface Position {
  x: number;  // 0-9 (column)
  y: number;  // 0-9 (row)
}
```

### TurnLimit

Optional turn limit configuration for encounter pacing.

```typescript
interface TurnLimit {
  maxTurns?: number;  // Hard limit (game over if exceeded)
  staminaPenaltyTurn?: number;  // Turn when stamina costs increase by +1
  attributePenaltyTurn?: number;  // Turn when attribute checks get -1 penalty
}
```

## Field Descriptions

### Encounter Fields

**`title`** (required, string)
- Name of the encounter
- Used for display and identification

**`description`** (required, string)
- Brief narrative or objective description
- Provides context for the encounter

**`grid`** (required, Square[][])
- 10×10 nested array representing the encounter grid
- Access pattern: `grid[y][x]` where y is row (0-9) and x is column (0-9)
- Must contain exactly 100 squares (10 rows × 10 columns)

**`items`** (required, Item[])
- Array of items placed on the encounter grid
- Includes obstacles (crates, boulders) and collectible items
- Must follow square occupancy rules (one entity per square)

**`turnLimit`** (optional, TurnLimit)
- Optional turn limit and pacing configuration
- If omitted, uses default pacing rules (soft cap at 40 actions, penalties at turns 20/30)

### Square Fields

**`type`** (required, SquareType)
- Base type of the square
- Values: `"floor"`, `"wall"`, `"cycle-floor"`

**`config`** (required, SquareConfig)
- Type-specific configuration object
- Structure depends on `type`:
  - **`floor`**: May contain `subtype`, `zone`, `sprite`
  - **`cycle-floor`**: May contain `turns_per_state`, `states`
  - **`wall`**: Empty object `{}`

### SquareConfig Fields

**`subtype`** (optional, FloorSubtype)
- Floor variant (e.g., `"stone"`)
- Only valid for `type: "floor"`
- Current values: `"stone"` (future: `"grass"`, `"dirt"`, etc.)

**`zone`** (optional, ZoneType)
- Special location marker for floor squares
- Values: `"entrance"` or `"exit"`
- Only valid for `type: "floor"`
- Entrance zone: left side (x=0), rows 1-4 (y: 1, 2, 3, 4)
- Exit zone: right side (x=9), rows 5-8 (y: 5, 6, 7, 8)

**`sprite`** (optional, string)
- Override path to sprite image
- If omitted, sprite is derived using naming convention (see Conventions)
- Format: Path string (e.g., `"/assets/items/stone-floor.png"`)

**`turns_per_state`** (optional, number)
- Number of turns before state change
- Only valid for `type: "cycle-floor"`
- Must be positive integer

**`states`** (optional, string[])
- Array of state names that cycle through
- Only valid for `type: "cycle-floor"`
- Examples: `["normal", "spikes", "fire"]`
- States cycle in order, repeating

### Item Fields

**`id`** (optional, string)
- Unique identifier for the item
- Useful for references or scripting
- If omitted, item is identified by position

**`position`** (required, Position)
- Grid coordinates where item is placed
- Must be within valid grid bounds (0-9 for both x and y)
- Must not conflict with other entities (see Validation Rules)

**`type`** (required, string)
- Category of the item
- Examples: `"crate"`, `"loot"`, `"treasure"`, `"boulder"`
- Used to determine behavior and rendering

**`weight`** (optional, number)
- Weight in pounds
- Required for pushable items (obstacles)
- Used for STR push calculations: `staminaCost = Math.ceil(weight / STR)`
- Max pushable weight: `STR × 20` pounds

**`sprite`** (optional, string)
- Path to sprite image
- Format: Path string (e.g., `"/assets/items/crate.png"`)

**`color`** (optional, string)
- Fallback color if sprite is not available
- Format: CSS color string (e.g., `"#8B4513"`)

**`name`** (optional, string)
- Display name for the item
- Used in UI tooltips or descriptions

**`description`** (optional, string)
- Flavor text or additional information
- Used in UI tooltips or descriptions

### Position Fields

**`x`** (required, number)
- Column coordinate (0-9)
- 0 = leftmost column, 9 = rightmost column

**`y`** (required, number)
- Row coordinate (0-9)
- 0 = top row, 9 = bottom row

### TurnLimit Fields

**`maxTurns`** (optional, number)
- Hard turn limit
- If exceeded, encounter fails (game over)
- If omitted, no hard limit (soft cap only)

**`staminaPenaltyTurn`** (optional, number)
- Turn number when stamina costs increase by +1
- Applies to all stamina-consuming actions
- If omitted, defaults to turn 20

**`attributePenaltyTurn`** (optional, number)
- Turn number when attribute checks get -1 penalty
- Applies to all attribute-based actions
- If omitted, defaults to turn 30

## Validation Rules

### Grid Validation

1. **Dimensions**: Grid must be exactly 10×10 (100 squares total)
2. **Structure**: Must be nested array: `Square[][]` (10 rows, each containing 10 squares)
3. **Bounds**: All square positions must be within 0-9 for both x and y

### Square Occupancy Rules

1. **One Entity Per Square**: Each square can contain at most one entity (character or item)
2. **Character-Item Separation**: Characters and items cannot share squares
3. **Character-Character Separation**: Characters cannot share squares

### Zone Validation

1. **Entrance Zone**: Must be at positions where x=0 and y ∈ {1, 2, 3, 4}
2. **Exit Zone**: Must be at positions where x=9 and y ∈ {5, 6, 7, 8}
3. **Zone Type Restriction**: `zone` property only valid for `type: "floor"`
4. **Zone Position Match**: If `zone: "entrance"`, position must be in entrance zone
5. **Zone Position Match**: If `zone: "exit"`, position must be in exit zone

### Item Validation

1. **Position Bounds**: Item position must be within grid bounds (0 ≤ x ≤ 9, 0 ≤ y ≤ 9)
2. **Unique Positions**: No two items can share the same position
3. **Weight Requirement**: Pushable items (obstacles) must have `weight` property
4. **Valid Positions**: Items cannot be placed on walls (must be on floor squares)

### Type-Specific Validation

**Floor Squares:**
- `subtype` is optional but recommended
- `zone` only valid for entrance/exit positions
- Cannot have both `turns_per_state` and `states` (those are for cycle-floor)

**Cycle-Floor Squares:**
- Must have `turns_per_state` (positive integer)
- Must have `states` (non-empty array)
- Cannot have `subtype` or `zone`

**Wall Squares:**
- `config` must be empty object `{}`
- Cannot have any config properties

## Conventions

### Sprite Naming Convention

Sprites are determined using the following convention (with optional override):

**Default Derivation:**
- **Floor squares**: `{subtype}-{type}.png` (e.g., `"stone-floor.png"`)
- **Wall squares**: `{type}.png` (e.g., `"wall.png"`)
- **Cycle-floor squares**: `{type}.png` (e.g., `"cycle-floor.png"`)

**Override:**
- If `sprite` is specified in `config`, use that path instead
- Override allows custom sprites or special cases

**Examples:**
- `type: "floor"`, `subtype: "stone"` → `"stone-floor.png"` (default)
- `type: "floor"`, `subtype: "stone"`, `sprite: "/custom/path.png"` → use override
- `type: "wall"` → `"wall.png"` (default)
- `type: "cycle-floor"` → `"cycle-floor.png"` (default)

### Grid Coordinate System

- **Origin**: Top-left corner is (0, 0)
- **X-axis**: Increases left-to-right (0 = left, 9 = right)
- **Y-axis**: Increases top-to-bottom (0 = top, 9 = bottom)
- **Access Pattern**: `grid[y][x]` (row first, then column)

### Zone Definitions

**Entrance Zone:**
- Left side of grid (x = 0)
- Rows 1-4 (y: 1, 2, 3, 4)
- Total: 4 squares
- Characters spawn here at encounter start

**Exit Zone:**
- Right side of grid (x = 9)
- Rows 5-8 (y: 5, 6, 7, 8)
- Total: 4 squares
- Win condition: all characters must reach exit zone

**Wall Squares:**
- Border squares excluding entrance/exit zones
- Top row (y = 0): all squares are walls
- Bottom row (y = 9): all squares are walls
- Left side (x = 0): walls except entrance zone
- Right side (x = 9): walls except exit zone

**Playable Area:**
- Interior 8×8 grid (x: 1-8, y: 1-8)
- 64 squares total
- Where most gameplay occurs

### Win Conditions

**Default Win Condition:**
- All characters must reach the exit zone
- Win condition is not configurable in encounter data
- Encounter is considered complete when all party members are in exit zone squares

### Turn Limits

**Default Pacing (if `turnLimit` omitted):**
- Soft cap: 40 total party actions
- Stamina penalty: Turn 20 (all stamina costs +1)
- Attribute penalty: Turn 30 (all attribute checks -1)

**Custom Pacing (if `turnLimit` specified):**
- Override default values with specified turn numbers
- `maxTurns` provides hard limit (game over if exceeded)

## Notes

- **Characters are NOT part of encounter data**: Characters are campaign-level entities. Encounters are puzzle definitions only.
- **Encounter is static**: This spec defines the initial state. Dynamic state (character positions during play, item collection) is not persisted in encounter data.
- **Square types are extensible**: New square types can be added in the future (e.g., `"hazard-floor"`, `"mechanism"`).
- **Floor subtypes are extensible**: New floor subtypes can be added (e.g., `"grass"`, `"dirt"`, `"wood"`).

