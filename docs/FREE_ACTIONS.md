# Free Actions System

## Overview

Free Actions are character actions that cost no Stamina and are separate from skill-based actions. This document focuses on the **Movement** free action system. Other free actions (Wait, Focus, etc.) are planned for future implementation.

## Movement System

### Core Mechanics

Movement is a **free action** (no stamina cost) that allows characters to reposition on the 8×8 playable grid during encounters. The system uses **manual path planning** with **step-by-step execution** to provide full tactical control while handling state-changing tiles and obstacles.

### DEX-Based Movement Patterns

Movement patterns unlock based on DEX score, providing tactical options rather than just speed:

| DEX Range | Movement Pattern | Description |
|:---------:|:----------------:|:-----------|
| **1-3** | **Horizontal/Vertical** | Can move 1 square: ↑ ↓ ← → (orthogonal only) |
| **4-6** | **Add Diagonal** | Can move 1 square in any direction: ↑ ↓ ← → ↗ ↘ ↖ ↙ |
| **7-9** | **Add 2-Square Orthogonal** | Can move 1 square any direction OR 2 squares: ↑↑ ↓↓ ←← →→ |
| **10+** | **Extended Patterns** | Additional patterns TBD (e.g., 2-square diagonal, knight moves, etc.) |

**Movement Rules:**
- Movement is free (no stamina cost)
- Cannot move through occupied squares (unless specified by special abilities)
- 2-square moves require clear path (cannot move through obstacles)
- Characters cannot share spaces (each needs unique square)

### Planning Phase

**Manual Path Planning:**
1. Click character → enters path planning mode
2. Click tiles in sequence to build path (manual path planning)
3. Show path preview (line connecting tiles with step numbers)
4. Prevent conflicts: Cannot select squares that would be occupied at that step
5. Click "Done" or character again → path committed
6. Repeat for all characters

**Occupancy Validation:**
- Steps can always be added to paths during planning (no blocking)
- Validation happens at execution time, not planning time
- Only the next step (the one about to be executed) is validated
- When first step is added for a character, validate that step and enable/disable "Execute Free Moves" button
- After each execution, validate the next step for all characters and update button state
- Future steps cannot be validated because the environment can change (doors, obstacles, other characters)

**Visual Feedback:**
- **Selected character:** Full path line with step numbers
- **All characters:** Show start positions (grayed), end positions (full color), current step position (highlighted)
- **Path preview:** Line connecting tiles, step numbers visible
- **Invalid next steps:** Highlighted in red (steps that cannot be executed due to conflicts or invalid moves)
- **Error messages:** Show why "Execute Free Moves" is disabled (conflicts, invalid moves, etc.)

### Execution Phase

**Step-by-Step Execution:**
- "Execute Free Moves" button executes the **next step** for all characters
- Click repeatedly to step through the entire movement
- Each click = all characters move one step forward in their planned paths
- State changes apply after each step

**Execution Logic:**
```
For each character:
- If current step index < path length:
  - Try to execute next step
  - If valid: Move, increment step index
  - If invalid: Stop, mark as Blocked
- If current step index >= path length:
  - Mark as Complete (already at destination)
```

**Step Validation (Execution Time Only):**
- Only validate the next step (the one about to be executed)
- Check if target square is valid:
  - Not a wall
  - Not occupied by another character (at current step)
  - Not blocked by state change
  - Within bounds
  - Respects DEX movement patterns
- Future steps are not validated because environment can change
- After each step execution, re-validate the next step for all characters

**Failure Handling:**
- If step becomes invalid (state change, obstacle, etc.):
  - Character stops at last valid position
  - Mark as "Blocked"
  - Other characters continue
  - Next turn: Character can replan from current position

### State Changes During Execution

**How State Changes Affect Movement:**
- After each step, apply state changes (pressure plates, switches, doors, etc.)
- Next step uses updated state
- If state change blocks next step, character stops

**Example:**
- Step 1: Character A moves to pressure plate → activates door
- Step 2: Character B's next step requires going through door
  - If door is now open: Character B can move
  - If door is now closed: Character B's movement is blocked

### UI Flow

**Planning Phase:**
1. Click character → enter path planning mode
2. Click tiles in sequence → build path
3. Show path preview with step numbers
4. Prevent conflicts (gray out occupied squares)
5. Click "Done" or character again → commit path
6. Repeat for other characters
7. "Clear All" button to reset all paths

**Execution Phase:**
1. "Execute Free Moves" button (enabled when paths are planned)
2. Click once → all characters move one step
3. State changes apply
4. Click again → all characters move next step
5. Continue until all complete or blocked
6. Button shows progress: "Execute Free Moves (Step 3/5)" or similar

**Visual Display:**
- **Start positions:** Grayed out (original positions)
- **End positions:** Full color (destinations)
- **Current step positions:** Highlighted (where everyone is at current step)
- **Planned paths:** Lines connecting tiles (optional, may be cluttered with multiple characters)
- **Blocked characters:** Red indicator or "Blocked" text
- **Completed characters:** Green indicator or "Complete" text

### Edge Cases

**Path Length Mismatches:**
- Characters with different path lengths execute simultaneously
- Characters who complete their path stay at destination
- Their destination is occupied for subsequent steps
- Other characters' paths must avoid completed characters' destinations

**Blocked Mid-Path:**
- If character's path becomes invalid mid-execution:
  - Character stops at last valid position
  - Mark as "Blocked"
  - Show message: "Character [Name] blocked: [reason]"
  - Next turn: Character can replan from current position

**Swapping Prevention:**
- Characters cannot swap positions in a single turn
- Validation prevents selecting another character's start position as destination
- Also prevents selecting destination if your start position is another character's destination

## Design Philosophy

- **Full Tactical Control:** Manual path planning gives players exact control over character routes
- **Step-by-Step Execution:** Allows state changes to affect movement dynamically
- **Simple Iteration:** One button click advances all characters one step
- **Handles Complexity:** Works with state-changing tiles, obstacles, and multi-character coordination
- **Mobile-Friendly:** 8×8 grid makes manual planning manageable on touch screens

## Future Free Actions (Backlog)

### Wait
- Do nothing (0 stamina, free action)
- Character remains in place
- Useful for timing coordination or skipping a turn

### Focus
- Free action that grants bonus to next skill action
- Scales with `max(INT, WIS)`
- Planned for future implementation (see BACKLOG.md)

## Related Systems

- **Turn Structure:** See `DESIGN.md` - Two-Phase Planning System
- **Skill Actions:** See `DESIGN.md` - Skill Action Planning Phase
- **State Changes:** See `DESIGN.md` - Hazard and Encounter Templates
- **Grid System:** See `DESIGN.md` - Grid Structure and Boundaries

## Decision Log

### [Date TBD] - Movement System Redesign

- **Problem:** Original tap-tap movement system was tedious (2 taps per move)
- **Solution:** Manual path planning with step-by-step execution
- **Rationale:**
  - Full tactical control (plan exact paths)
  - Simple execution (one button, click through)
  - Handles state changes (step-by-step validation)
  - Works for all DEX levels (low DEX can plan alternating moves)
  - Easy iteration (click through complex movements quickly)
- **Implementation:**
  - Planning: Click character → click tiles in sequence → build path
  - Execution: "Execute Free Moves" button executes next step for all characters
  - Validation: Prevent conflicts during planning, handle state changes during execution
- **Open Questions:**
  - Should paths be editable mid-execution? (Currently: No, must complete/block before replanning)
  - How detailed should "blocked" messages be? (Currently: Show reason)
  - Should there be a "fast forward" option to execute all steps at once? (Future consideration)

