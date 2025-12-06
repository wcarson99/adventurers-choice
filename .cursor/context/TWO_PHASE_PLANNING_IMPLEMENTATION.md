# Two-Phase Planning System Implementation Plan

## Overview

Implement a two-phase planning system with a new layout: grid on left, info panel on right. Players plan all free actions (movements) first, then plan skill actions for each character.

## Layout Changes

### New Structure
- **Left Side**: Grid (fills vertical space, maximizes size)
- **Right Side**: Info Panel (takes remaining horizontal space)
  - Instructions at top (always visible)
  - Turn counter
  - Character/Item stats (when selected)
  - Action queue (during skill action planning)

## Phase 1: Movement Planning (Free Actions)

### State Management
- Track planned movements: `Map<characterId, { from: Position, to: Position }>`
- Track original positions for all characters
- Track current planning phase: `'movement' | 'skill' | 'executing'`

### UI Behavior
1. **Character Selection**:
   - Click character → shows valid moves (light green)
   - Character highlights in gold

2. **Movement Planning**:
   - Click valid destination → character shows ghost at new position
   - Original position grayed out (but still visible)
   - Click grayed original position → undo move, can select new move

3. **Visual Feedback**:
   - Ghost positions: Semi-transparent character sprite at destination
   - Original positions: Grayed out but visible
   - Valid moves: Light green highlights

4. **Controls**:
   - "Clear All Movements" button (clears all planned moves)
   - "Plan Skill Actions" button (grayed if invalid state - overlapping characters)

5. **Validation**:
   - Check for overlapping characters after each move
   - Disable "Plan Skill Actions" if invalid
   - Characters can "Wait" (stay in place) as free action

## Phase 2: Skill Action Planning

### State Management
- Track planned actions: `Array<{ characterId, action, targetId?, cost }>`
- Track action order (can be reordered)
- Track selected character for current action planning

### UI Behavior
1. **Action Selection Flow**:
   - Select character → shows available actions in dropdown/radio
   - Actions show: "Action Name (Requirement, Cost)"
   - Only valid actions shown
   - Can select "Wait" (empty state)

2. **Item-Targeted Actions**:
   - Select character → select item → shows item-targeted actions
   - Or: Select action that requires item → shows valid items

3. **Action Queue Display**:
   - Shows in info panel: "1. Character Name: Action (Cost)"
   - Up/Down buttons to reorder
   - Can remove actions

4. **Controls**:
   - "Back" button → clears all skill actions, returns to movement phase
   - "Execute" button → performs all planned actions

## Info Panel Components

### Always Visible
- Instructions text (top)
- Turn counter: "Turn: X"

### Conditional Display
- **Character Selected (no item)**: Character stats panel
- **Item Selected**: Item stats panel
- **Skill Action Planning**: Action queue

### Stats Display Format

**Character Stats:**
- Name
- Archetype
- STR, DEX, CON, INT, WIS, CHA
- HP (current/max)
- Stamina (current/max)
- Gold
- Food

**Item Stats:**
- Type (Crate, etc.)
- Weight
- Pushable status
- Other relevant properties

## Action System

### Action Types

**Free Actions (Phase 1):**
- Move (DEX-based patterns)
- Wait

**Skill Actions (Phase 2):**
- Wait (always available)
- Push (STR 3+, requires item, shows cost)
- Future: INT Modify, DEX Disarm, etc.

### Action Display Format
- Dropdown/Radio buttons
- Format: "Action Name (Requirement, Cost)"
- Example: "Push (STR 3+, 10 stamina)"
- Only show valid actions

## Execution Phase

### Execution Order
1. All movements execute first (simultaneously or in order)
2. All skill actions execute in planned order
3. Turn counter increments
4. Check win/loss conditions

### Future: Animations
- Movement: Character slides to destination
- Push: Character and item slide together to destination

## Implementation Steps

### Step 1: Layout Restructure
- [ ] Create new layout component (grid left, panel right)
- [ ] Move instructions to info panel top
- [ ] Add turn counter component
- [ ] Make grid fill vertical space

### Step 2: Movement Planning Phase
- [ ] Add movement planning state
- [ ] Implement ghost position rendering
- [ ] Implement gray-out original positions
- [ ] Add "Clear All Movements" button
- [ ] Add "Plan Skill Actions" button
- [ ] Implement validation (overlapping check)

### Step 3: Skill Action Planning Phase
- [ ] Add skill action planning state
- [ ] Create action selection UI (dropdown/radio)
- [ ] Implement action queue display
- [ ] Add reordering (up/down buttons)
- [ ] Add "Back" and "Execute" buttons

### Step 4: Info Panel Components
- [ ] Character stats display
- [ ] Item stats display
- [ ] Action queue display
- [ ] Conditional rendering logic

### Step 5: Execution System
- [ ] Execute movements
- [ ] Execute skill actions in order
- [ ] Update turn counter
- [ ] Handle execution errors

### Step 6: Integration
- [ ] Replace current click-to-move with planning system
- [ ] Test full flow
- [ ] Polish UI/UX

## State Structure

```typescript
interface EncounterState {
  phase: 'movement' | 'skill' | 'executing';
  turn: number;
  
  // Movement planning
  plannedMovements: Map<number, { from: Position, to: Position }>;
  originalPositions: Map<number, Position>;
  
  // Skill action planning
  plannedActions: Array<{
    characterId: number;
    action: string;
    targetId?: number;
    cost: number;
  }>;
  actionOrder: number[]; // Character IDs in execution order
  
  // Selection
  selectedCharacter?: number;
  selectedItem?: number;
}
```

## Files to Create/Modify

### New Files
- `src/ui/components/EncounterInfoPanel.tsx` - Info panel component
- `src/ui/components/MovementPlanningPhase.tsx` - Movement planning UI
- `src/ui/components/SkillActionPlanningPhase.tsx` - Skill action planning UI
- `src/ui/components/ActionQueue.tsx` - Action queue display
- `src/ui/components/CharacterStats.tsx` - Character stats display
- `src/ui/components/ItemStats.tsx` - Item stats display
- `src/game-engine/encounters/EncounterState.ts` - State management

### Modified Files
- `src/ui/components/EncounterView.tsx` - Main encounter view (layout restructure)
- `src/ui/pages/MissionView.tsx` - May need updates for new layout

