# The Adventurer's Choice

## 🕹️ Design Pillars

* **Core Experience:** Cooperative party adventure game centered on collaborative, attribute-driven mini-games, emphasizing multiple viable paths to survival.
* **Theme:** **Pre-Industrial Fantasy** (D&D style, low-magic resource feel with Tech-Magic hybrids, focusing on scarcity and documentation).
* **Player Count:** Designed for parties of 3-6 members.
* **Attribute Integration:** All six D&D attributes (STR, DEX, CON, INT, WIS, CHA) provide distinct, non-redundant mechanical value in every major mini-game.
* **Game Mode (MVP Focus):** **Roguelike Mode** (procedurally generated maps, high-stakes failure).
* **Core Tension:** Managing **Food Consumption** (the clock) against **Fatigue** (the penalty for pushing too far) to gain **Attribute Points (AP)**.

---

## 🗺️ Core Mechanics

### ⏳ Player-Controlled Turn Structure (The Survival Clock)

The game uses two resource-linked time scales: **Days** (narrative progress/major cost) and **Turns** (action economy/micro-cost).

| Activity Type | Time Unit | Food Cost (Per Character) | Food Cost (Party of 4) | Equivalence |
| :--- | :--- | :--- | :--- | :--- |
| **Travel (Node Move)** | 1 Day | **1 Unit of Food** | **4 Units of Food** | Baseline daily cost. |
| **Preparation / Downtime** | 1 Day | **1 Unit of Food** | **4 Units of Food** | Baseline daily cost. |
| **Recovery / Rest** | 1 Day per Recovery Turn | **1 Unit of Food** | **4 Units of Food** per Day of Recovery | Full rest consumes a full day's resources. |
| **Encounter Action** | 1 Turn | **0.1 Units of Food** | **0.4 Units of Food** | Micro-costing. 10 actions = 1 Day of Food. |

#### Survival Constraints

* **Food Consumption (Baseline):** **1 Unit of Food** supports **1 Character for 1 Day**. All macro-activities consume 1 Food per character.
* **Fatigue Mechanic (Final):** **1 stack of Fatigue** is gained for every **4 Units of Food** consumed by a single character. This aligns the penalty directly with resource expenditure (e.g., 4 days of travel or 40 encounter turns).
    * **Penalty:** Each stack of Fatigue imposes a flat **-1 penalty to *all* Attribute Checks** (STR, DEX, CON, INT, WIS, CHA).

#### Failure Condition: The Starvation Clock

* **Starvation State:** Triggered when the party attempts a Day-based activity (Travel/Town Action) without enough Food for all characters.
* **Starvation Penalty (During Gauntlet):** If a character in the Starvation State ends a turn with **0 Stamina**, they gain **1 stack of Fatigue**.
* **Irreducible HP Loss:** If a character gains a stack of Fatigue while already at **5 or more stacks**, they suffer **-1 Irreducible HP** loss.
* **Tactical Defeat:** Party Wipe (all HP $\le 0$) results in immediate Game Over.

### 💰 Economy and Resources

| Resource | Scope | Calculation/Constraint | Purpose |
| :--- | :--- | :--- | :--- |
| **Attribute Scores** | Individual | Randomly generated: sum of 18, max of 5. | Prerequisite for skills and basis for checks. |
| **HP (Hit Points)** | Individual | Base 5 HP + **CON Score**. | Damage resilience resource. |
| **Stamina (Action Resource)**| Individual | Base 5 Stamina + **CON Score**. Cost 2-4 for core actions. | Action pool, depleted during Encounters. |
| **Food Resource** | Party Pool | **1 Unit of Food = 2 lbs.**. | Primary survival resource. Consumed daily and tactically. |
| **Gold** | Individual Pool (Carried) | **1 Unit of Gold = 0.5 lbs.**. | Used strictly for **Trade and Supplies** (no revival cost). |
| **Food Cost (Trade)** | **1 Gold = 4 Units of Food.** | Sets the high-scarcity baseline economy. (1 Gold buys 4 Days of survival for a single character). |

#### Tactical Food Use

* **Stamina Restoration:** Consuming **1 Unit of Food** counts as an action during an Encounter and restores **+5 Stamina**.

### 🗺️ Town and Overland Flow

* **Initial State:** Party starts in a **Town Node**, where they can purchase resources and accept missions.
* **Town Actions:** Town actions (e.g., resting, crafting, researching) cost **1 Day's Activity** (1 Food per character).
* **Travel:** Missions involve **Travel** to destinations on a **Procedurally Generated Map**. The estimated travel time (X Days) defines the minimum required Food resource.

### Encumbrance (Weight-Based Penalty)

| Encumbrance State | Weight Threshold | Mechanical Penalty (Gauntlet) |
| :--- | :--- | :--- |
| **Normal** | Weight $\le$ **STR $\times 5$** | None. |
| **Encumbered** | Weight $>$ **STR $\times 5$** | **-1 penalty to all DEX Checks** and **loss of the DEX Free Step** action. |
| **Heavily Encumbered** | Weight $>$ **STR $\times 10$** | **-2 penalty to all DEX/STR Checks** and **loss of DEX Free Step/STR Obstacle Forcing** actions. |

### Mini-Game Structure (The Gauntlet)

* **Structure:** **Node Exploration** on a small, tactical grid (e.g., $8 \times 8$).
* **Objective:** The party must move strategically to activate 3-4 specific nodes (puzzles, switches, objectives) to complete the encounter, forcing interaction with all parts of the grid.

### 🌳 Progression System: Consumable Attribute Points (AP)

| Progression Goal | Resource Used | Cost Structure (AP Consumed) | Prerequisite Gate |
| :--- | :--- | :--- | :--- |
| **Increase Attribute Score** | Specific Attribute AP | **Progressive Cost:** 5 $\rightarrow$ 10 $\rightarrow$ 15 $\rightarrow$ 20 AP to gain +1. | None (other than maxing at 5). |
| **Unlock Tier 1 Skill** | Specific Attribute AP | **Flat Cost:** **5 AP** of the corresponding attribute. | Must have the **Attribute Score $\ge 3$**. |

### 💥 The Gauntlet: MVP Core Mechanics & Tier 1 Skills

| Attribute | Core Mechanic (Active) | Tier 1 Skill (Passive/Reactionary) | Primary Role & Cost to Unlock |
| :--- | :--- | :--- | :--- |
| **Strength (STR)** | **Obstacle Forcing (Move/Destroy)** | **Controlled Descent:** Cost for **Obstacle Forcing** is reduced by **-1**. | **5 STR AP**. |
| **Dexterity (DEX)** | **Free Step (Movement Economy)** | **Acrobatics Training:** Move **diagonally** on the grid for the cost of a single square. | **5 DEX AP**. |
| **Constitution (CON)** | **Resilience Buffer (Heal/Prevent)** | **Quick Recovery:** Amount restored by **Resilience Buffer** is increased by **+1**. | **5 CON AP**. |
| **Intelligence (INT)** | **Temporary Modification (Saboteur)** | **Efficient Tool Use:** Stamina cost for **Temporary Modification** is reduced by **-1**. | **5 INT AP**. |
| **Wisdom (WIS)** | **Situational Awareness (Environmental)** | **Critical Spotting:** Area of effect for "Near" information from **Situational Awareness** is increased by **+1 square**. | **5 WIS AP**. |
| **Charisma (CHA)** | **Positional Rally (Temporary Buff)** | **Inspiring Presence:** Duration of **Positional Rally** boost is increased by **+1 turn**. | **5 CHA AP**. |

#### Encounter Template Examples

| Type | Name | Attribute Check | Fail State | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Obstacle (STR)** | Collapsing Archway | **STR Check** (Obstacle Forcing) | Minor damage and 1 stack of Fatigue to the acting character. | Tests team-based clearing/stabilization. |
| **Trap (DEX)** | Hidden Pressure Plate | **DEX Check** (Free Step) | Inflicts moderate damage and Encumbers the character for 2 turns. | Tests scouting and careful movement. |

---

### Current Decisions Log (Complete Chronology)

### [Nov 29, 2025 - MVP Scope & Progression]
* **Decision:** Core mechanics defined: **Attribute Skill Tree**, **Consumable AP**, and **Tier 1 Skills** for all six attributes. **Archetypes are removed**.

### [Nov 29, 2025 - Resource Ownership & Revival]
* **Decision:** **Gold** is an **Individual Pool** contributing to personal **Encumbrance**. Revival is backlogged to the **Tier 3 CON skill**.

### [Nov 30, 2025 - Finalized Economy and Tactical Use]
* **Decision:** **1 Gold = 4 Units of Food.** (High Scarcity baseline confirmed).
* **Decision:** **1 Unit of Food restores +5 Stamina** when consumed as an action during an Encounter.

### [Nov 30, 2025 - Finalized Pacing and Fatigue]
* **Decision:** **Travel (Node Move)** and **Downtime** cost **1 Day** (1 Food per character).
* **Decision:** **Encounter Actions** cost **0.1 Food per character** (micro-costing).
* **Decision:** **Fatigue** is gained for every **4 Units of Food** consumed by a single character.

### [Nov 30, 2025 - Encounter Structure]
* **Decision:** **Mini-Game Structure** is **Node Exploration** on a small tactical grid ($8 \times 8$).
* **Decision:** MVP includes a **STR Obstacle (Collapsing Archway)** and a **DEX Trap (Hidden Pressure Plate)** as initial template examples.

### [Nov 30, 2025 - Failure Condition (Unifying States)]
* **Decision:** The separate **Exhaustion Damage** track is **removed** to simplify state complexity.
* **Decision:** **Fatigue** is redefined as the general mechanical penalty: **Each stack of Fatigue imposes a flat -1 penalty to *all* Attribute Checks**.
* **Decision:** The **Starvation Clock** penalty is tied to Fatigue: In the Starvation State, ending a turn with **0 Stamina** grants **1 stack of Fatigue**. If a character gains a Fatigue stack while already at **5 or more stacks**, they suffer **-1 Irreducible HP** loss.