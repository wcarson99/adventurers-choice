---
title: Game Design Document
type: design
status: mvp-complete
last_updated: 2025-12-01
tags: [game-design, mvp, roguelike, cooperative, turn-based]
---

# Game Name (TBD)

## 📋 Quick Reference (MVP Scope)

**Core Loop:** Town → Accept Mission → Travel (+ Encounters) → Destination → Complete Objective → Return → Collect Reward

**Key Numbers:**

- Party Size: 3-6 characters (MVP focus: 4 characters)
- Starting Resources: 20 Gold per character, 0 Food
- Travel/Food Cost: 1 Food per character per day
- Mission Rotation: 7 game days (unclaimed missions)
- Victory: 30 one-time missions completed (Normal Run)

**Core Systems:**

- **Deterministic Attribute Checks:** Meet requirement = 100% success
- **Death:** Party wipe = Game Over (no resurrection in MVP)
- **Recovery:** Full HP + Stamina restore between encounters
- **Encounters:** Opportunities (optional) + Obstacles (mandatory), 10×10 grid with border structure

**Tech Stack:** React + TypeScript + Canvas, ECS architecture, turn-based execution

**(See below for detailed mechanics)**

---

## � Implementation Status

| System                | Design Status | Implementation Status | Notes                   |
| :-------------------- | :-----------: | :-------------------: | :---------------------- |
| **Core Engine (ECS)** |  ✅ Complete  |      ⏳ Pending       | Basic setup needed      |
| **Map Generation**    |  ✅ Complete  |      ⏳ Pending       | Graph + Node types      |
| **Encounter Grid**    |  ✅ Complete  |      ⏳ Pending       | 10x10 Grid with border, Canvas render |
| **Turn System**       |  ✅ Complete  |      ⏳ Pending       | Queue + Execute logic   |
| **Attribute Checks**  |  ✅ Complete  |      ⏳ Pending       | Deterministic logic     |
| **Mission System**    |  ✅ Complete  |      ⏳ Pending       | Job board + Rotation    |
| **UI/UX**             |  ✅ Complete  |      ⏳ Pending       | React components        |

---

## �🕹️ Design Pillars

- **Core Experience:** Cooperative party adventure game centered on collaborative, attribute-driven mini-games, emphasizing multiple viable paths to survival.
- **Theme:** **Pre-Industrial Fantasy** (D&D style, low-magic resource feel with Tech-Magic hybrids, focusing on scarcity and documentation).
- **Player Count:** Designed for parties of 3-6 members.
- **Attribute Integration:** All six D&D attributes (STR, DEX, CON, INT, WIS, CHA) provide distinct, non-redundant mechanical value in every major mini-game.
- **Game Mode (MVP Focus):** **Roguelike Mode** (procedurally generated maps, high-stakes failure).
- **Core Tension:** Managing **Food Consumption** (the clock) against **Fatigue** (the penalty for pushing too far) to gain **Attribute Points (AP)**.

---

## 🗺️ Core Mechanics

### ⏳ Player-Controlled Turn Structure (The Survival Clock)

The game uses two resource-linked time scales: **Days** (narrative progress/major cost) and **Turns** (action economy/micro-cost).

| Activity Type              | Time Unit               | Food Cost (Per Character) | Food Cost (Party of 4)                  | Equivalence                                |
| :------------------------- | :---------------------- | :------------------------ | :-------------------------------------- | :----------------------------------------- |
| **Travel (Node Move)**     | 1 Day                   | **1 Unit of Food**        | **4 Units of Food**                     | Baseline daily cost.                       |
| **Preparation / Downtime** | 1 Day                   | **1 Unit of Food**        | **4 Units of Food**                     | Baseline daily cost.                       |
| **Recovery / Rest**        | 1 Day per Recovery Turn | **1 Unit of Food**        | **4 Units of Food** per Day of Recovery | Full rest consumes a full day's resources. |
| **Encounter Action**       | 1 Turn                  | **0.1 Units of Food**     | **0.4 Units of Food**                   | Micro-costing. 10 actions = 1 Day of Food. |

#### Survival Constraints

- **Food Consumption (Baseline):** **1 Unit of Food** supports **1 Character for 1 Day**. All macro-activities consume 1 Food per character.
- **Fatigue Mechanic (Final):** **1 stack of Fatigue** is gained for every **4 Units of Food** consumed by a single character.
  - **Penalty:** Each stack of Fatigue imposes a flat **-1 penalty to _all_ Attribute Checks** (STR, DEX, CON, INT, WIS, CHA).

#### Failure Condition: The Starvation Clock

- **Starvation State:** Triggered when the party attempts a Day-based activity (Travel/Town Action) without enough Food for all characters.
- **Starvation Penalty (During Encounter):** If a character in the Starvation State ends a turn with **0 Stamina**, they gain **1 stack of Fatigue**.
- **Irreducible HP Loss:** If a character gains a stack of Fatigue while already at **5 or more stacks**, they suffer **-1 Irreducible HP** loss.
- **Tactical Defeat:** Party Wipe (all HP $\le 0$) results in immediate Game Over.

### 💰 Economy and Resources

| Resource                      | Scope                         | Calculation/Constraint                                                                            | Purpose                                                     |
| :---------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------ | :---------------------------------------------------------- |
| **Attribute Scores**          | Individual                    | Randomly generated: sum of 18, max of 5. Average is 3.                                          | Prerequisite for skills and basis for checks.               |
| **HP (Hit Points)**           | Individual                    | Base 5 HP + **CON Score**.                                                                        | Damage resilience resource.                                 |
| **Stamina (Action Resource)** | Individual                    | Base 5 Stamina + **CON Score**. Cost 2-4 for core actions.                                        | Action pool, depleted during Encounters.                    |
| **Food Resource**             | Party Pool                    | **1 Unit of Food = 2 lbs.**.                                                                      | Primary survival resource. Consumed daily and tactically.   |
| **Gold**                      | Individual Pool (Carried)     | **1 Unit of Gold = 0.5 lbs.**. Starting amount: **20 Gold**.                                      | Used strictly for **Trade and Supplies** (no revival cost). |
| **Food Cost (Trade)**         | **1 Gold = 4 Units of Food.** | Sets the high-scarcity baseline economy. (1 Gold buys 4 Days of survival for a single character). |

#### Starting Resources

- **Gold:** Each character starts with **20 Gold** (party of 4 = 80 Gold total = 320 Food purchasing power).
- **Food:** TBD (likely a small starter amount, e.g., 10-20 Food).

#### Tactical Food Use (MVP)

- **Stamina Restoration:** Consuming **1 Unit of Food** during an encounter restores **+5 Stamina** (costs 1 action, 2 Stamina to consume, net +3)
- **Normal Travel:** Food is consumed automatically for daily sustenance (1 Food per character per day)
- **No Extra Costs:** Encounters during travel do not add extra Food costs (assumed to be part of daily routine)

**Post-MVP: Improvised Solutions (Backlog)**

- Use Food/consumables to bypass attribute requirements
- Example: "Use Explosives" (costs 1 Food) instead of "Push Boulder" (requires STR 3)

### 🗺️ Town and Overland Flow (The Core Loop)

- **Core Loop:** **Party Creation** $\rightarrow$ **Town** (Job Board/Store) $\rightarrow$ **Travel** (Day Cost, Random Encounter Check) $\rightarrow$ **Destination/Mission Completion** $\rightarrow$ **Return to Town**.
- **Initial State:** Party starts in a **Town Node**, where they can purchase resources and accept missions.
- **Town Actions:** Town actions (e.g., resting, crafting, researching) cost **1 Day's Activity** (1 Food per character).
- **Travel:** Missions involve **Travel** to destinations on a **Procedurally Generated Map**. The estimated travel time (X Days) defines the minimum required Food resource.
- **Random Encounters:** Occur during Travel. Two types:
  - **Opportunities** (Optional): Player can choose to engage (e.g., "You see a cave. Explore?"). May yield treasure, AP, or just experience.
  - **Obstacles** (Mandatory): Must be resolved to continue travel. Initial implementation uses tactical grid-based puzzle encounters.
- **Mission Reward Structure:** **AP is rewarded immediately** upon completing the destination objective. **Gold is rewarded only upon returning to the Quest Giver node.** The gold reward persists until collected.

### Encumbrance (Weight-Based Penalty)

| Encumbrance State      | Weight Threshold                | Mechanical Penalty (Encounter)                                                                   |
| :--------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------- |
| **Normal**             | Weight $\le$ **STR $\times 5$** | None.                                                                                            |
| **Encumbered**         | Weight $>$ **STR $\times 5$**   | **-1 penalty to all DEX Checks** and **loss of the DEX Free Step** action.                       |
| **Heavily Encumbered** | Weight $>$ **STR $\times 10$**  | **-2 penalty to all DEX/STR Checks** and **loss of DEX Free Step/STR Obstacle Forcing** actions. |

### Encounter Types

Encounters are categorized by player agency and resolution method:

| Encounter Type     | Player Choice                | Resolution                | Examples                                            | MVP Status                     |
| :----------------- | :--------------------------- | :------------------------ | :-------------------------------------------------- | :----------------------------- |
| **Opportunities**  | Optional ("Explore?" choice) | Tactical grid puzzle      | Treasure cave, mysterious shrine, abandoned cart    | ✅ Simple treasure opportunity |
| **Obstacles**      | Mandatory (blocks travel)    | Tactical grid puzzle      | Collapsed bridge, locked gate, environmental hazard | ✅ Simple puzzle obstacles     |
| **NPC Encounters** | Variable                     | Combat, trading, dialogue | Bandit ambush, merchant, quest giver                | ❌ Backlog                     |

### Mini-Game Structure (Tactical Encounters)

- **Structure:** **Node Exploration** on a $10 \times 10$ tactical grid with border structure.
  - **Grid Layout:** 10×10 total squares (100 squares)
  - **Border:** 36 squares forming outer ring
    - **Entrance Zone:** 4 squares (left side, rows 1-4) - characters start here
    - **Exit Zone:** 4 squares (right side, rows 6-9) - win condition (all characters reach here)
    - **Walls:** 28 squares (remaining border - top row, bottom row, and vertical borders excluding entrance/exit)
  - **Playable Area:** Interior 8×8 grid (rows 1-8, cols 1-8)
  - **Character Positioning:** Characters cannot share spaces (each needs unique square)
  - **Square Occupancy:** One entity per square maximum (characters, obstacles, items all follow this rule)
- **Turn Resolution:** **Two-Phase Planning with Atomic Execution.**
  1. **Free Action Phase:** Plan all character movements (free, no stamina)
  2. **Skill Action Phase:** Plan all skill-based actions (cost stamina) based on planned positions
  3. **Execute Phase:** Commit and execute all movements, then all actions
- **Planning Flexibility:** Players can return to movement phase to adjust if action planning reveals issues
- **Objective:** Clear a path from entrance to exit by pushing obstacles out of the way.
- **Pacing Constraint:** Each Encounter has a soft cap of **40 Total Party Actions**. After turn 20, all Stamina costs increase by +1. After turn 30, all Attribute Checks suffer a -1 penalty.

#### Grid Structure and Boundaries

- **Grid Size:** 10×10 squares (100 total)
- **Border Structure:**
  - **Entrance Zone:** Left side, rows 1-4 (4 squares) - characters start here
  - **Exit Zone:** Right side, rows 6-9 (4 squares) - win condition
  - **Walls:** All other border squares (top row, bottom row, vertical borders excluding entrance/exit)
- **Playable Area:** Interior 8×8 grid (rows 1-8, cols 1-8)
- **Square Occupancy Rules:**
  - **One entity per square:** Each square can contain at most one entity (character, obstacle, item, etc.)
  - **Characters cannot share spaces:** Each character needs a unique square
  - **Items cannot share squares:** Maximum one item per square
  - **Character and item cannot share squares:** Items must be placed on empty squares, not on squares with characters
- **Wall Behavior:** Impassable - characters and objects cannot move through walls

#### Visibility and Fog of War (FoW)

- **Visible Range:** Extends **3 squares** (manhattan distance) from the edge of the tile of any character. Allows full interaction.
- **Previously Seen (Grayed):** Shows geometry but does not allow object targeting or Attribute Checks.
- **Obscured (Dark):** Completely blocked/unvisited.
- **WIS Interaction:** **WIS (Scout Path)** can temporarily make a _Previously Seen_ area _Visible_ for 1 turn.

#### Fatigue Recovery

| Recovery Mechanic       | Constraint/Cost               | Effect                                                                                                                 |
| :---------------------- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Simple Rest**         | **1 Day** (1 Food/character)  | Removes **1 stack of Fatigue** from **all characters**.                                                                |
| **Intensive Rest**      | **2 Days** (2 Food/character) | Removes **3 stacks of Fatigue** from **all characters**.                                                               |
| **Respite (Town Only)** | **3 Days** (3 Food/character) | Removes **all stacks of Fatigue** from all characters and allows the party to change their **Tier 1 Skill** selection. |

### 🗺️ Map and Travel Structure

#### World Map Generation

- **Structure:** Procedurally generated directed graph of nodes and paths
- **Node Types:**
  - **Towns** (hub nodes): Job boards, general stores, rest/recovery services (3-5 per game)
  - **Mission Destinations** (objective nodes): Dungeons, caves, monasteries, castles (1 per mission)
  - **Encounter Nodes** (waypoints): Intermediate points on travel edges where Opportunities/Obstacles occur
- **Edges:** Travel paths between nodes (cost: X days = X Food per character)
- **MVP Scope:** Bidirectional edges only
- **Post-MVP:** One-way edges (e.g., "Descend cliff")

#### Map Reveal & Mission Discovery

- **Initial State:** Only starting town and nearby nodes are visible
- **Mission Acceptance:** Accepting a mission reveals its destination node and connecting path(s) on the map
- **Mission Rotation:** Unclaimed missions on the job board are replaced after **7 game days**
  - Allows players to grind repeatable missions while waiting for suitable one-time missions
  - Thematic justification: "Quest was claimed by another party"
- **Job Board Capacity:** 3-5 missions visible at any time (randomized from pool)

#### Mission Types

| Mission Type           | Repeatability | Rewards                     | Victory Progress         | Examples                                     |
| :--------------------- | :------------ | :-------------------------- | :----------------------- | :------------------------------------------- |
| **One-Time (Main)**    | Complete once | 10-20 Gold, 3-5 AP          | ✅ Counts toward victory | "Investigate ruins", "Rescue caravan"        |
| **Repeatable (Grind)** | Unlimited     | 2-5 Gold, 0-1 AP, 5-10 Food | ❌ Does not count        | "Gather herbs", "Repair bridge", "Hunt game" |

- **Victory Condition:** Complete 30 one-time missions (Normal Run)
- **Repeatable Purpose:** Safety valve for struggling parties, slow resource recovery

#### Mission Requirements (MVP)

- **Job Board Display:** Shows minimum attribute requirements for guaranteed solution
  - Example: "Recommended: STR 3, DEX 2" = party needs at least one character with STR ≥3 and one with DEX ≥2
- **If Requirements Met:** All encounters on that mission are solvable with basic attribute actions (no extra Food cost)
- **If Requirements Not Met:** Mission may be impossible or very difficult (MVP: players should avoid mismatched missions)
- **Post-MVP:** Implement alternate/improvised solutions (use Food/consumables to bypass attribute requirements)

#### Travel and Backtracking

- **Backtracking Allowed:** Players can travel back to previous towns before starting an obstacle
- **Point of No Return:** Once an obstacle encounter is started, backtracking is locked until completion or failure
- **Cost:** All travel costs Food (1 Food per character per day), including backtracking

### ⚙️ Attribute Check Mechanics

**MVP: Deterministic System**

- All attribute-based actions have visible requirements (e.g., "STR 3 Required")
- If character's attribute score meets or exceeds requirement: **100% success**
- If character's attribute score is below requirement: **Action unavailable/grayed out**
- UI clearly shows which characters can perform which actions
- **Design Goal:** Puzzle solving through optimal character + action selection, not RNG

**Post-MVP: Probabilistic Option (Backlog)**

- Characters below threshold can attempt actions with reduced success chance
- Example: STR 2 attempting STR 3 requirement = 80% success
- Allows risk/reward decisions and flexible play

### ⚰️ Death and HP Mechanics

**MVP: Simple Permadeath**

- **0 HP = Character Death:** Character is removed from the encounter and cannot act
- **Party Wipe = Game Over:** If all characters reach 0 HP, the game ends (true roguelike)
- **No Resurrection in MVP:** Death is permanent for the run
- **Design Goal:** High stakes, encourages careful play and resource management
- **HP Recovery:** Full HP restore between encounters (automatic rest/camping)

**Post-MVP: Resurrection System (Backlog)**

- Town-based resurrection (costs Gold + Time)
- "Carry the Fallen" mechanic (remains must be brought to town)
- Fatigue penalties and cost scaling
- See backlog for detailed design

### ⚡ Stamina System

**Stamina Pool:**

- **Formula:** Base 5 + CON Score
- **Example:** CON 3 character = 8 Stamina
- **Recovery:** Full Stamina restore between encounters (automatic rest/camping)

**Action Costs (MVP Starting Values):**

- **Movement:** Free (no stamina cost) - see Movement Mechanics below
- **Attribute Action** (STR push, DEX dodge, INT modify, etc.): 2-3 Stamina (varies by action)
- **Wait:** 0 Stamina (free action)
- **Consume Food:** 2 Stamina (restores +5 Stamina, net +3)

**Note:** These values can be tuned during playtesting.

### 🚶 Movement Mechanics

**See [FREE_ACTIONS.md](FREE_ACTIONS.md) for detailed movement system documentation.**

**Summary:**
- Movement is a **free action** (no stamina cost)
- Uses **manual path planning** with **step-by-step execution**
- DEX-based movement patterns unlock tactical options (orthogonal, diagonal, 2-square moves)
- Characters plan full paths, then execute step-by-step via "Execute Free Moves" button
- State changes apply after each step, affecting subsequent movement
- Full tactical control with simple iteration (click through complex movements)

### 🌳 Progression System: Consumable Attribute Points (AP)

| Progression Goal             | Resource Used         | Cost Structure (AP Consumed)                                                              | Prerequisite Gate                          |
| :--------------------------- | :-------------------- | :---------------------------------------------------------------------------------------- | :----------------------------------------- |
| **Increase Attribute Score** | Specific Attribute AP | **Progressive Cost:** 5 $\rightarrow$ 10 $\rightarrow$ 15 $\rightarrow$ 20 AP to gain +1. | None (other than maxing at 5).             |
| **Unlock Tier 1 Skill**      | Specific Attribute AP | **Flat Cost:** **5 AP** of the corresponding attribute.                                   | Must have the **Attribute Score $\ge 3$**. |

### 💥 Encounters: MVP Core Mechanics & Grid Elements

#### Core Grid Interactions

- **Move Object:** Handled by **STR** (Obstacle Forcing/Pushing).
- **Interact/Activate:** Handled by **DEX** (Evasion) and **INT** (Temporary Modification).
- **Tile Modification:** Handled by **WIS** (Scouting) and **CON** (Fortification).

| Attribute              | Core Mechanic (Active)     | Encounter Purpose                                                                                                                |
| :--------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Strength (STR)**     | **Obstacle Forcing**       | Push, pull, or destroy heavy/damaged grid objects. Requires STR 3+ (skill). Max weight = STR × 20 lb. Stamina cost = `Math.ceil(objectWeight / STR)`, minimum 1.                    |
| **Dexterity (DEX)**    | **Movement Patterns**      | Unlocks movement patterns (diagonal, 2-square moves) - see Movement Mechanics. Also handles evasion/trap disarming.              |
| **Constitution (CON)** | **Resilience Buffer**      | **Fortify Tile** to mitigate environmental damage and penalties for allies.                                                      |
| **Intelligence (INT)** | **Temporary Modification** | **Precise Activation** of mechanism nodes, temporarily locking their state for sequence puzzles (Interact/Activate interaction). |
| **Wisdom (WIS)**       | **Situational Awareness**  | **Scout Path** to temporarily reveal hidden hazards, traps, or safe tiles on the grid (Tile Modification/Scouting).              |
| **Charisma (CHA)**     | **Positional Rally**       | **Inspire/Rally** adjacent allies, granting them a temporary bonus to their next Attribute Check.                                |

**Pushing Mechanics (STR):**
- **Skill Requirement:** STR 3+ required to push (STR 1-2 cannot push - below average)
- **Max Pushable Weight:** `STR × 20` pounds
  - **STR 3:** Can push up to 60 lb (light to medium objects)
  - **STR 4:** Can push up to 80 lb (medium to heavy objects)
  - **STR 5:** Can push up to 100 lb (heavy objects)
- **Stamina Cost:** `Math.ceil(objectWeight / STR)`, minimum 1 stamina
  - **20 lb object, STR 3:** 20/3 = 7 stamina (light object, expensive)
  - **20 lb object, STR 4:** 20/4 = 5 stamina (light object, cheaper)
  - **20 lb object, STR 5:** 20/5 = 4 stamina (light object, efficient)
  - **60 lb object, STR 3:** 60/3 = 20 stamina (max for STR 3, very expensive)
  - **60 lb object, STR 4:** 60/4 = 15 stamina (cheaper than STR 3)
- **Direction:** Push away from character (character must be behind object, on side opposite push direction)
- **Turning:** Character automatically faces object as part of push action (no separate turn action needed)
- **Distance:** 1 square per push action
- **Requirements:**
  - Character has STR ≥ 3 (skill requirement)
  - Character adjacent to object (on side opposite push direction)
  - Object weight ≤ max pushable weight (STR × 20)
  - Target square must be empty (no wall, object, or character)
  - Character has enough stamina
- **Validation:** Push action available if all requirements met (deterministic - no RNG)
- **Multiple Characters:** Future consideration - multiple characters pushing together (reduces cost or enables heavier objects)

**Path Clearing:**
- **Clear Path Definition:** Unobstructed orthogonal path from entrance zone to exit zone
- **Win Condition:** All characters reach exit zone (4 squares on right side, rows 6-9)
- **Obstacle Placement:** Pushable objects block path but can be pushed away to clear it
- **Procedural Generation:** Reverse pathfinding approach - start with exit, work backwards to entrance, place obstacles that block path but are solvable

#### Hazard and Encounter Templates

| Name                          | Focus Attribute | Core Interaction/Puzzle                                                                                                                 | Fail State                                                |
| :---------------------------- | :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Collapsing Archway**        | STR             | **Moveable Objects:** Push debris (Size 3-5 Pillar) to clear a path (STR Check).                                                        | Minor damage and 1 stack of Fatigue.                      |
| **Hidden Pressure Plate**     | DEX             | **Trap Tile:** **DEX Check** (Evasion) to negate damage/Immobilized condition upon activation.                                          | 2 HP Damage and Immobilized condition.                    |
| **Derelict Mechanism Bypass** | INT             | **Static Mechanisms:** Use **INT (Temporary Modification)** to lock switch states in sequence.                                          | Stamina Drain/Feedback Damage.                            |
| **Toxic Gas Leak**            | CON             | **Ambient Field:** Use **CON (Fortify Tile)** to protect allies from end-of-turn **Toxic Debuff** and Stamina Drain.                    | Debuff Overload leads to Irreducible HP Loss.             |
| **The Grindstone Floor**      | STR/INT         | **Dynamic Floor Tiles:** Use **STR** to brace against push or **INT** to lock the regulator.                                            | Character/Object pushed into a wall suffers Crush Damage. |
| **State-Cycling Path**        | WIS/CON/DEX     | **Dynamic Floor Tiles:** **WIS** predicts the cycle, **DEX** moves efficiently, **CON** fortifies dangerous tiles.                      | Pit Immobilization and Irreducible HP loss risk.          |
| **Negotiation Lock**          | CHA             | **Positional Buff:** Use **CHA (Positional Rally)** to reduce the TN of the final Persuasion Check by ensuring party members are close. | Alarm triggered, +1 stack of Fatigue to all.              |

#### Procedural Generation Mechanisms (PCG)

- **1. The "Start-to-Goal Reverse Scramble":** Used for generating **Moveable Object** and **Sequential Activation** puzzles. Starts at the solution state and reverses a series of valid moves to create the initial puzzle state, guaranteeing solvability.
- **2. The "Guaranteed Safe Path Time Window":** Used for generating **Dynamic Floor Tile** hazards. Ensures the state cycles are aligned such that a perfect sequence of **DEX Free Steps** can cross the path without damage, proving the existence of a solution solvable via information (**WIS**) and speed (**DEX**).

### 🏆 Victory Conditions (Tiered Modes)

| Mode Name                | Victory Condition (Missions) | Estimated Real-World Duration | AP Goal                                                         |
| :----------------------- | :--------------------------- | :---------------------------- | :-------------------------------------------------------------- |
| **Quick Run**            | **10 Missions**              | $\approx 3.3$ hours           | Testing character builds/gaining early AP.                      |
| **Normal Run (Default)** | **30 Missions**              | $\approx 10$ hours            | Full experience run, allowing Tier 1 skill unlocks. (MVP Focus) |
| **Full Run (Expert)**    | **100 Missions**             | $\approx 33.3$ hours          | Endurance run, high-level attribute growth.                     |

---

## 🎨 Theme and Aesthetic

### Visual Style

- **Art Style:** Flat modern UI with simple cartoony art (Adventure Time/Brawl Stars simplicity)
- **View:** Top-down grid view for Encounters
- **Design Priority:** High contrast for tablet/small screen readability
- **Age Rating:** Appropriate for 10+ players

### Visual Elements

- **Characters:** Simple round shapes, minimal detail, distinct silhouettes
- **Grid Tiles:** Flat colors with icon overlays (no textures)
- **UI Panels:** Rounded rectangles, clean typography, ample spacing
- **Animations:** Sprite sheet-based animations (see [Animation System](../docs/ANIMATION_SYSTEM.md))
  - Turn-based: Play once per action (e.g., walking animation per square moved)
  - Frame-based: 64×64 pixel frames in grid layouts
  - Simple timing: Fixed frame duration for MVP

### Asset Requirements (Puzzle Phase)

**1. Interactive Mechanisms (Stateful)**

- **Levers/Switches**: Up (Off) and Down (On) sprites.
- **Pressure Plates**: Raised (Unpressed) and Lowered (Pressed).
- **Floor Buttons**: Colored buttons (Red, Blue, Green).

**2. Barriers & Doors**

- **Locked Doors**: Iron/Wood doors with visible keyholes.
- **Magic Barriers**: Glowing energy walls (Red/Blue/Green).
- **Breakable Walls**: Cracked stone textures.

**3. Key Items**

- **Keys**: Gold, Silver, Rusty, or Color-coded.
- **Gems/Crystals**: To be placed in statues.
- **Runes/Tablets**: Stone slabs with symbols.

**4. Movable Objects**

- **Pushable Blocks**: Crates or Boulders distinct from static walls.

**5. Hazards**

- **Spikes**: Retracted (Safe) and Extended (Danger).
- **Pits**: Dark holes in the floor.

### Color Palette

- **Warm Primary:** Friendly orange/yellow (adventure feel)
- **Cool Accent:** Tech-magic blue/purple for mechanisms and magic elements
- **Earth Tones:** Browns/greens for environment
- **High Contrast:** Dark backgrounds for visibility on small screens

### UI/UX Flow (Encounter Turn System)

#### Two-Phase Planning System

**Phase 1: Free Action Planning (Movement)**
1. **Movement Planning:** Player plans movement for all characters
   - Click character → Click tiles in sequence to build path (manual path planning)
   - Movement pattern based on character's DEX (orthogonal, diagonal, 2-square)
   - Show path preview (line connecting tiles with step numbers)
   - Prevent conflicts: Cannot select squares that would be occupied at that step
2. **Visual Feedback:** 
   - Selected character: Full path line with step numbers
   - All characters: Show start positions (grayed), end positions (full color), current step position (highlighted)
   - Occupied squares: Grayed out (cannot select)
3. **Execution:** 
   - "Execute Free Moves" button executes next step for all characters
   - Click repeatedly to step through entire movement
   - State changes apply after each step
   - Characters who complete or get blocked stop moving
4. **Navigation:** Continue to Action Phase or Clear All

**Phase 2: Skill Action Planning**
1. **Action Planning:** Player plans skill-based actions for all characters
   - See ghost positions from Phase 1
   - Click character → Choose action (Push, Wait, etc.)
   - Actions planned based on where characters will be after movement
2. **Backup/Adjustment:**
   - Can return to Movement Phase to adjust if action planning reveals issues
   - Clear individual character movements or all movements
3. **Visual Feedback:**
   - Show action previews (e.g., arrow showing push direction)
   - Highlight invalid actions (e.g., pushing when character in way)
   - Show predicted stamina costs

**Phase 3: Execution**
1. **Movement Execution:** "Execute Free Moves" button executes movements step-by-step
   - Each click advances all characters one step in their planned paths
   - State changes apply after each step
   - Characters stop if step becomes invalid (blocked, state change, etc.)
2. **Action Execution:** After movements complete, execute skill-based actions
   - Actions execute in player-chosen order or initiative-based
   - Sequential animation (1-5 seconds per action, TBD)
   - Playback controls: Speed toggle (1x/2x/4x), Skip to End, Pause
3. **Failure Handling:** If one character fails an action, all other characters still attempt their actions

#### Action Queue Visualization

- Sidebar/bottom panel showing:
  - Current phase indicator (Movement Planning / Action Planning)
  - Character portraits with planned movements (ghost positions)
  - Character portraits with planned actions
  - Predicted resource costs (Stamina per character)
  - Navigation buttons (← Back to Movements, Execute Turn)

#### Post-MVP Feature

- **Single-Step Mode:** Execute actions one at a time with player confirmation between each (see BACKLOG.md)

---

### Current Decisions Log (Complete Chronology)

... _(Log truncated for brevity, new entries below)_

### [Nov 30, 2025 - Mission Reward Structure]

- **Decision:** **AP is rewarded immediately** upon completing the destination objective. **Gold is rewarded only upon returning to the Quest Giver node.** The gold reward persists until collected.

### [Nov 30, 2025 - Core Encounter Mechanics (All 6 Attributes)]

- **Decision:** All six attributes are now mapped to unique, non-combat, cooperative grid interactions.

### [Nov 30, 2025 - Visibility and Fog of War]

- **Decision:** Encounters use a three-state Fog of War: **Visible (3 squares range)**, **Previously Seen (Grayed)**, and **Obscured (Dark)**.

### [Nov 30, 2025 - Atomic Turn Resolution]

- **Decision:** Encounter turn resolution will be **Atomic:** Player pre-commits all character actions, which then execute sequentially.

### [Nov 30, 2025 - Fatigue Recovery]

- **Decision:** Defined tiered recovery mechanics (**Simple, Intensive, Respite**) that cost **Days** and **Food** to remove Fatigue stacks.

### [Nov 30, 2025 - Hazard Definitions]

- **Decision:** Defined three core dynamic hazards: **Toxic Gas Leak (CON)**, **The Grindstone Floor (STR/INT)**, and **The State-Cycling Path (WIS/DEX/CON)**.

### [Nov 30, 2025 - Core Puzzle Elements]

- **Decision:** Refined the core grid elements into four categories: **Moveable Objects (STR)**, **Static Mechanisms (INT)**, **Dynamic Floor Tiles (WIS/CON)**, and **Trap/Hazard Tiles (DEX/WIS)**.

### [Nov 30, 2025 - Procedural Generation (PCG)]

- **Decision:** Defined two core generation mechanisms: **Start-to-Goal Reverse Scramble** (for positional puzzles) and **Guaranteed Safe Path Time Window** (for time-based puzzles), ensuring all generated Encounters are solvable.

### [Dec 1, 2025 - Theme and Aesthetic]

- **Decision:** Flat modern UI with simple cartoony art style (Adventure Time/Brawl Stars simplicity). Top-down view for MVP. High contrast color palette optimized for tablet readability. Age-appropriate for 10+ players.

### [Dec 1, 2025 - UI/UX Flow (Encounters)]

- **Decision:** Action selection flow: Player selects character → assigns action → moves to next character. Assignment order = execution order. Reordering via up/down buttons. Unassigned characters default to "Wait" action. Single "Execute Turn" button for all-or-nothing execution with 1-5 second animations per action. Failed actions don't prevent other characters from attempting their actions.
- **Post-MVP:** Single-step execution mode (backlog item).
- **Open Questions:** What encounter types exist beyond the tactical grid puzzles? How do combat encounters differ from puzzle encounters?

### [Dec 1, 2025 - Encounter Type Taxonomy]

- **Decision:** Encounters are categorized into three types: **Opportunities** (optional, player-initiated), **Obstacles** (mandatory, blocks travel), and **NPC Encounters** (backlog). MVP focuses on puzzle-based Opportunities and Obstacles using the tactical grid system.
- **MVP Scope:** Simple treasure opportunity encounter + simple obstacle puzzle encounters.

### [Dec 1, 2025 - Map Structure and Mission Types]

- **Decision:** Procedurally generated directed graph with towns as nodes, travel paths as edges. Bidirectional edges for MVP, one-way edges in backlog. Missions are town-specific.
- **Decision:** Two mission types: **One-Time** (main quests, count toward victory) and **Repeatable** (grind missions, safety valve for struggling parties).
- **Decision:** Players can backtrack before starting obstacles, but once engaged, must complete or fail.

### [Dec 1, 2025 - Attribute Check Mechanics]

- **Decision:** Deterministic attribute checks for MVP. Actions have visible requirements (e.g., "STR 3 Required"). If character meets requirement, action succeeds 100%. Below requirement = action unavailable.
- **Post-MVP:** Probabilistic option (threshold with falloff) for risk/reward decisions.

### [Dec 1, 2025 - Starting Resources]

- **Decision:** Each character starts with **20 Gold**, **0 Food**. Party must purchase provisions before departing on missions.

### [Dec 1, 2025 - Death Mechanics]

- **MVP Decision:** Party wipe (all characters 0 HP) = Game Over. No resurrection system in MVP (true roguelike).
- **Post-MVP:** Town-based resurrection system with "Carry the Fallen" mechanic (backlog).
- **HP Recovery:** Full HP restore between encounters (automatic rest/camping).

### [Dec 1, 2025 - Map Structure and Mission Discovery]

- **Decision:** Procedurally generated graph with three node types: Towns (hubs), Mission Destinations (objectives), Encounter Nodes (waypoints).
- **Decision:** Accepting a mission reveals its destination on the map. Unclaimed missions rotate out after 7 game days.
- **Decision:** 3-5 towns per game, 1 mission destination per mission, ~2 encounter nodes per mission route.

### [Dec 1, 2025 - Recovery and Stamina Costs]

- **Decision:** HP and Stamina fully restore between encounters (automatic rest/camping).
- **Stamina Costs (MVP):** Move = 1, Attribute Actions = 2-3, Wait = 0, Consume Food = 2 (restores +5, net +3).
- **Note:** Values subject to playtesting adjustment.

### [Dec 1, 2025 - Movement Mechanics and Turn Structure]

- **Decision:** Movement is free (no stamina cost). All characters can move to an adjacent square.
- **Decision:** DEX-based movement patterns unlock tactical options:
  - DEX 1-3: Horizontal/Vertical only (orthogonal movement)
  - DEX 4-6: Add diagonal movement
  - DEX 7-9: Add 2-square orthogonal movement
  - DEX 10+: Extended patterns TBD
- **Decision:** Two-phase turn structure:
  1. Free Action Phase: Plan all movements (preview/ghost positions)
  2. Skill Action Phase: Plan all skill-based actions (can backup to adjust movements)
  3. Execute Phase: Commit and execute all movements, then all actions
- **Decision:** Pushing mechanics: Stamina cost = `Math.ceil(objectWeight / STR)`, minimum 1.
- **Rationale:** Movement patterns provide tactical depth rather than just speed. Two-phase planning allows players to see board state before committing actions, with flexibility to adjust.

### [Date TBD] - Movement System Redesign

- **Problem:** Original tap-tap movement system was tedious (2 taps per move, no path planning)
- **Decision:** Manual path planning with step-by-step execution
- **Mechanic:**
  - Planning: Click character → click tiles in sequence to build path
  - Execution: "Execute Free Moves" button executes next step for all characters
  - Click repeatedly to step through entire movement
  - State changes apply after each step
- **Rationale:**
  - Full tactical control (plan exact paths for all characters)
  - Simple execution (one button, click through complex movements)
  - Handles state changes (step-by-step validation prevents invalid states)
  - Works for all DEX levels (low DEX can plan alternating moves)
  - Easy iteration (click through complex movements quickly)
- **See:** [FREE_ACTIONS.md](FREE_ACTIONS.md) for detailed documentation

### [Dec 1, 2025 - Grid Structure and Pushing Mechanics]

- **Decision:** Changed from 8×8 to 10×10 grid with border structure.
- **Decision:** Border contains entrance zone (4 squares, left side), exit zone (4 squares, right side), and walls (remaining border).
- **Decision:** Characters cannot share spaces (each needs unique square).
- **Decision:** Pushing direction: Push away from character (character must be behind object). Character automatically faces object as part of push action.
- **Decision:** Path clearing: Unobstructed orthogonal path from entrance to exit. Win condition is all characters reach exit zone.
- **Decision:** Procedural generation uses reverse pathfinding - start with exit, work backwards to entrance, place solvable obstacles.
- **Rationale:** 10×10 grid provides more space for puzzles while maintaining clear boundaries. Border structure clearly defines entrance/exit zones and prevents edge-of-map issues.

### [Dec 1, 2025 - Attribute Skill Thresholds]

- **Decision:** Average attribute score is 3. Skills require above-average attributes (4+) to unlock.
- **Decision:** STR 1-2 (below average): Cannot perform STR skills (cannot push).
- **Decision:** STR 3 (average): Can push light objects (up to 60 lb), but expensive stamina cost (weight/STR).
- **Decision:** STR 4+ (above average): Can push heavier objects (max = STR × 20 lb), with decreasing stamina cost as STR increases.
- **Decision:** Pushing formula: Max weight = STR × 20 lb, Stamina cost = `Math.ceil(objectWeight / STR)`, minimum 1.
- **Rationale:** Creates meaningful skill thresholds. Below average cannot use skills, average can attempt but inefficiently, above average unlocks efficient skill use. Applies to other attributes as well (DEX, INT, WIS, etc.).

### [Dec 1, 2025 - Square Occupancy Rules]

- **Decision:** One item per square maximum.
- **Decision:** Character and item cannot share the same square.
- **Decision:** All entity types (characters, obstacles, items) follow the "one entity per square" rule.
- **Rationale:** Ensures visual clarity, consistent rules, simpler implementation, and clear interactions. Supports deterministic encounter design for test campaigns.

**MVP Design Complete!** Ready for implementation.
