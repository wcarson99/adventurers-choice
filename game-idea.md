# Game Name (TBD)

## 🕹️ Design Pillars

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
- **Starvation Penalty (During Gauntlet):** If a character in the Starvation State ends a turn with **0 Stamina**, they gain **1 stack of Fatigue**.
- **Irreducible HP Loss:** If a character gains a stack of Fatigue while already at **5 or more stacks**, they suffer **-1 Irreducible HP** loss.
- **Tactical Defeat:** Party Wipe (all HP $\le 0$) results in immediate Game Over.

### 💰 Economy and Resources

| Resource                      | Scope                         | Calculation/Constraint                                                                            | Purpose                                                     |
| :---------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------ | :---------------------------------------------------------- |
| **Attribute Scores**          | Individual                    | Randomly generated: sum of 18, max of 5.                                                          | Prerequisite for skills and basis for checks.               |
| **HP (Hit Points)**           | Individual                    | Base 5 HP + **CON Score**.                                                                        | Damage resilience resource.                                 |
| **Stamina (Action Resource)** | Individual                    | Base 5 Stamina + **CON Score**. Cost 2-4 for core actions.                                        | Action pool, depleted during Encounters.                    |
| **Food Resource**             | Party Pool                    | **1 Unit of Food = 2 lbs.**.                                                                      | Primary survival resource. Consumed daily and tactically.   |
| **Gold**                      | Individual Pool (Carried)     | **1 Unit of Gold = 0.5 lbs.**.                                                                    | Used strictly for **Trade and Supplies** (no revival cost). |
| **Food Cost (Trade)**         | **1 Gold = 4 Units of Food.** | Sets the high-scarcity baseline economy. (1 Gold buys 4 Days of survival for a single character). |

#### Tactical Food Use

- **Stamina Restoration:** Consuming **1 Unit of Food** counts as an action during an Encounter and restores **+5 Stamina**.

### 🗺️ Town and Overland Flow (The Core Loop)

- **Core Loop:** **Party Creation** $\rightarrow$ **Town** (Job Board/Store) $\rightarrow$ **Travel** (Day Cost, Random Encounter Check) $\rightarrow$ **Destination/Mission Completion** $\rightarrow$ **Return to Town**.
- **Initial State:** Party starts in a **Town Node**, where they can purchase resources and accept missions.
- **Town Actions:** Town actions (e.g., resting, crafting, researching) cost **1 Day's Activity** (1 Food per character).
- **Travel:** Missions involve **Travel** to destinations on a **Procedurally Generated Map**. The estimated travel time (X Days) defines the minimum required Food resource.
- **Random Encounters:** Occur during Travel, triggering a small, single-objective Gauntlet Encounter (Obstacle, Trap, Combat, Trade, etc.).
- **Mission Reward Structure:** **AP is rewarded immediately** upon completing the destination objective. **Gold is rewarded only upon returning to the Quest Giver node.** The gold reward persists until collected.

### Encumbrance (Weight-Based Penalty)

| Encumbrance State      | Weight Threshold                | Mechanical Penalty (Gauntlet)                                                                    |
| :--------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------- |
| **Normal**             | Weight $\le$ **STR $\times 5$** | None.                                                                                            |
| **Encumbered**         | Weight $>$ **STR $\times 5$**   | **-1 penalty to all DEX Checks** and **loss of the DEX Free Step** action.                       |
| **Heavily Encumbered** | Weight $>$ **STR $\times 10$**  | **-2 penalty to all DEX/STR Checks** and **loss of DEX Free Step/STR Obstacle Forcing** actions. |

### Mini-Game Structure (The Gauntlet)

- **Structure:** **Node Exploration** on a small, rectangular tactical grid ($8 \times 8$).
- **Turn Resolution:** **Atomic.** Player pre-commits all character actions, which then execute sequentially in the chosen order. Conflicts result in a failed action but a Food cost and partial penalty (no Stamina refund).
- **Objective:** The party must move strategically to activate 3-4 specific nodes (puzzles, switches, objectives) to complete the encounter, forcing interaction with all parts of the grid.
- **Pacing Constraint:** The Gauntlet has a soft cap of **40 Total Party Actions**. After turn 20, all Stamina costs increase by +1. After turn 30, all Attribute Checks suffer a -1 penalty.

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

### 🌳 Progression System: Consumable Attribute Points (AP)

| Progression Goal             | Resource Used         | Cost Structure (AP Consumed)                                                              | Prerequisite Gate                          |
| :--------------------------- | :-------------------- | :---------------------------------------------------------------------------------------- | :----------------------------------------- |
| **Increase Attribute Score** | Specific Attribute AP | **Progressive Cost:** 5 $\rightarrow$ 10 $\rightarrow$ 15 $\rightarrow$ 20 AP to gain +1. | None (other than maxing at 5).             |
| **Unlock Tier 1 Skill**      | Specific Attribute AP | **Flat Cost:** **5 AP** of the corresponding attribute.                                   | Must have the **Attribute Score $\ge 3$**. |

### 💥 The Gauntlet: MVP Core Mechanics & Grid Elements

#### Core Grid Interactions

- **Move Object:** Handled by **STR** (Obstacle Forcing).
- **Interact/Activate:** Handled by **DEX** (Free Step/Evasion) and **INT** (Temporary Modification).
- **Tile Modification:** Handled by **WIS** (Scouting) and **CON** (Fortification).

| Attribute              | Core Mechanic (Active)     | Gauntlet Purpose                                                                                                                 |
| :--------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Strength (STR)**     | **Obstacle Forcing**       | Push, pull, or destroy heavy/damaged grid objects (Move Object interaction).                                                     |
| **Dexterity (DEX)**    | **Free Step**              | Take one extra movement square per turn as a **free action** (Movement Economy/Evasion).                                         |
| **Constitution (CON)** | **Resilience Buffer**      | **Fortify Tile** to mitigate environmental damage and penalties for allies.                                                      |
| **Intelligence (INT)** | **Temporary Modification** | **Precise Activation** of mechanism nodes, temporarily locking their state for sequence puzzles (Interact/Activate interaction). |
| **Wisdom (WIS)**       | **Situational Awareness**  | **Scout Path** to temporarily reveal hidden hazards, traps, or safe tiles on the grid (Tile Modification/Scouting).              |
| **Charisma (CHA)**     | **Positional Rally**       | **Inspire/Rally** adjacent allies, granting them a temporary bonus to their next Attribute Check.                                |

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
- **View:** Top-down grid view for The Gauntlet
- **Design Priority:** High contrast for tablet/small screen readability
- **Age Rating:** Appropriate for 10+ players

### Visual Elements

- **Characters:** Simple round shapes, minimal detail, distinct silhouettes
- **Grid Tiles:** Flat colors with icon overlays (no textures)
- **UI Panels:** Rounded rectangles, clean typography, ample spacing
- **Animations:** Simple tweens (slide/fade/scale)

### Color Palette

- **Warm Primary:** Friendly orange/yellow (adventure feel)
- **Cool Accent:** Tech-magic blue/purple for mechanisms and magic elements
- **Earth Tones:** Browns/greens for environment
- **High Contrast:** Dark backgrounds for visibility on small screens

### UI/UX Flow (The Gauntlet Turn System)

#### Action Selection Flow

1. **Character Selection:** Player clicks a character to select them
2. **Action Assignment:** Player chooses an action for that character
3. **Queue Order:** Order of assignment = execution order
4. **Reordering:** Click character in queue + use up/down buttons to reorder
5. **Default Action:** Unassigned characters automatically get "Wait" action in queue
6. **Execution:** Single "Execute Turn" button commits all actions

#### Action Queue Visualization

- Sidebar/bottom panel showing:
  - Character portrait + assigned action
  - Execution order (numbered)
  - Reorder controls (↑↓ buttons)
  - Predicted resource costs (Food, Stamina per character)

#### Turn Execution

- **Playback:** Sequential animation (1-5 seconds per action, TBD)
- **Playback Controls:** Speed toggle (1x/2x/4x), Skip to End, Pause
- **Failure Handling:** If one character fails an action, all other characters still attempt their actions
- **All-or-Nothing:** MVP does not support incremental execution (execute one action at a time)

#### Post-MVP Feature

- **Single-Step Mode:** Execute actions one at a time with player confirmation between each (see BACKLOG.md)

---

### Current Decisions Log (Complete Chronology)

... _(Log truncated for brevity, new entries below)_

### [Nov 30, 2025 - Mission Reward Structure]

- **Decision:** **AP is rewarded immediately** upon completing the destination objective. **Gold is rewarded only upon returning to the Quest Giver node.** The gold reward persists until collected.

### [Nov 30, 2025 - Core Gauntlet Mechanics (All 6 Attributes)]

- **Decision:** All six attributes are now mapped to unique, non-combat, cooperative grid interactions.

### [Nov 30, 2025 - Visibility and Fog of War]

- **Decision:** The Gauntlet uses a three-state Fog of War: **Visible (3 squares range)**, **Previously Seen (Grayed)**, and **Obscured (Dark)**.

### [Nov 30, 2025 - Atomic Turn Resolution]

- **Decision:** Gauntlet turn resolution will be **Atomic:** Player pre-commits all character actions, which then execute sequentially.

### [Nov 30, 2025 - Fatigue Recovery]

- **Decision:** Defined tiered recovery mechanics (**Simple, Intensive, Respite**) that cost **Days** and **Food** to remove Fatigue stacks.

### [Nov 30, 2025 - Hazard Definitions]

- **Decision:** Defined three core dynamic hazards: **Toxic Gas Leak (CON)**, **The Grindstone Floor (STR/INT)**, and **The State-Cycling Path (WIS/DEX/CON)**.

### [Nov 30, 2025 - Core Puzzle Elements]

- **Decision:** Refined the core grid elements into four categories: **Moveable Objects (STR)**, **Static Mechanisms (INT)**, **Dynamic Floor Tiles (WIS/CON)**, and **Trap/Hazard Tiles (DEX/WIS)**.

### [Nov 30, 2025 - Procedural Generation (PCG)]

- **Decision:** Defined two core generation mechanisms: **Start-to-Goal Reverse Scramble** (for positional puzzles) and **Guaranteed Safe Path Time Window** (for time-based puzzles), ensuring all generated Gauntlets are solvable.

### [Dec 1, 2025 - Theme and Aesthetic]

- **Decision:** Flat modern UI with simple cartoony art style (Adventure Time/Brawl Stars simplicity). Top-down view for MVP. High contrast color palette optimized for tablet readability. Age-appropriate for 10+ players.

### [Dec 1, 2025 - UI/UX Flow (The Gauntlet)]

- **Decision:** Action selection flow: Player selects character → assigns action → moves to next character. Assignment order = execution order. Reordering via up/down buttons. Unassigned characters default to "Wait" action. Single "Execute Turn" button for all-or-nothing execution with 1-5 second animations per action. Failed actions don't prevent other characters from attempting their actions.
- **Post-MVP:** Single-step execution mode (backlog item).
- **Open Questions:** What is the gold cost/AP cost of non-essential items?
