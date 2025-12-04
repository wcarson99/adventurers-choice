# Push Mechanic Demonstration

## Current State
- Encounter is loaded with 3 crates at positions (3,3), (5,4), and (7,5)
- Characters are in the entrance zone (left side, rows 1-4)
- Exit zone is on the right (rows 5-8, all light green)

## Step-by-Step Push Demonstration

### Step 1: Select a Character
- **Action**: Click on a character (they appear as character sprites in the entrance zone)
- **Result**: Character gets highlighted in **gold** with a thick gold border
- **Visual**: Valid movement tiles show in **light green**

### Step 2: Move Next to a Crate
- **Action**: Click on a light green tile to move the character adjacent to a crate
- **Example**: Move character from (0,1) to (2,3) to be next to crate at (3,3)
- **Result**: 
  - Character moves to new position
  - If adjacent to a crate, the crate **auto-selects** (orange highlight)
  - **Pale green tiles** appear showing valid push destinations
  - Instructions update to: "🎯 Push Mode: Click a PALE GREEN tile to push the crate"

### Step 3: Push the Crate
- **Action**: Click on one of the **pale green tiles** (valid push destination)
- **Result**: 
  - Crate moves 1 square in that direction
  - Character and crate deselect
  - Grid updates to show new crate position

## Visual Indicators

- **Gold highlight + thick gold border**: Selected character
- **Orange highlight + thick orange border**: Selected crate (ready to push)
- **Light green tiles**: Valid movement destinations
- **Pale green tiles**: Valid push destinations (where crate can be pushed)
- **Brown "C" tiles**: Crates (pushable objects)

## Requirements

- Character must have **STR ≥ 3** to push
- Character must be **adjacent** to the crate
- Character must be **behind** the crate (opposite side of push direction)
- Target square must be **empty** (no wall, no other object, no character)
- Crate weight (30 lb) must be ≤ STR × 20

## Stamina Costs

- **STR 3**: 10 stamina (Math.ceil(30/3) = 10)
- **STR 4**: 8 stamina (Math.ceil(30/4) = 8)
- **STR 5**: 6 stamina (Math.ceil(30/5) = 6)

