# Push Demonstration - Current State

## Current Grid State (from screenshot):
- **Character at (4,3)**: Warrior/Knight - Already positioned perfectly!
- **Crates nearby**: 
  - Crate at (3,3) - 1 square to the left
  - Crate at (5,3) - 1 square to the right  
  - Crate at (5,4) - 1 square down-right

## Demonstration Steps:

### Step 1: Click Character at (4,3)
- **What happens**: Character gets gold highlight, shows valid moves
- **Expected**: Instructions say "STR 3+: Move next to a crate..."

### Step 2: Since already adjacent, crate should auto-select
- **What happens**: Crate at (3,3) or (5,3) should auto-highlight in orange
- **Expected**: Pale green tiles appear showing push destinations
- **Instructions update**: "🎯 Push Mode: Click a PALE GREEN tile to push the crate"

### Step 3: Click a pale green tile to push
- **Example**: Click tile (2,3) to push crate at (3,3) left
- **What happens**: Crate moves from (3,3) to (2,3)
- **Result**: Crate is pushed, character and crate deselect

## Visual Guide:
- **Gold = Selected Character**
- **Orange = Selected Crate (ready to push)**
- **Light Green = Valid moves**
- **Pale Green = Valid push destinations**

