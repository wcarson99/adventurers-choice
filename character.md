### 🧍 Roguelike Character Foundation

#### I. Core Attributes & Initial Stats

| Component | Rule/Starting Value | Rationale |
| :--- | :--- | :--- |
| **Attribute Scores (STR-CHA)**| Randomly generated with a **sum of 18** and a **maximum of 5** for any single attribute. | Ensures randomized character builds without being immediately overpowered. |
| **Tier 1 Skill Prereq** | Must have a score of **3** in the corresponding attribute to unlock and learn Tier 1 Skills. | Creates a meaningful specialization threshold. |

#### II. Core Resource Pools (Individual & Party)

| Resource | Scope | Calculation/Consumption Rule |
| :--- | :--- | :--- |
| **HP (Hit Points)** | **Individual** | Base 5 HP + **CON Score**. |
| **Stamina (Action Resource)** | **Individual** | Base 5 Stamina + **CON Score**. Cost 2-4 for core attribute actions. |
| **Food Resource** | **Party Pool (Carried)** | Measured in **Weight (lbs)**. **1 Unit of Food = 2 lbs.** |
| **Food Consumption** | **Party Cost** | **1 Unit of Food** is consumed from the total party pool per turn/action. |

#### III. Encumbrance (Weight-Based Penalty)

| Encumbrance State | Weight Threshold | Mechanical Penalty (Gauntlet) |
| :--- | :--- | :--- |
| **Normal** | Weight $\le$ **STR $\times 5$** | None. |
| **Encumbered** | Weight $>$ **STR $\times 5$** | **-1 penalty to all DEX Checks** and **loss of the DEX Free Step** action. |
| **Heavily Encumbered** | Weight $>$ **STR $\times 10$** | **-2 penalty to all DEX/STR Checks** and **loss of DEX Free Step/STR Obstacle Forcing** actions. |

### 🏃 Tier 1 Skill Candidate Backlog (Attribute 3+ Required)

| Attribute | Candidate 1 (Name & Effect) | Candidate 2 (Name & Effect) | Candidate 3 (Name & Effect) |
| :--- | :--- | :--- | :--- |
| **STR** | **Controlled Descent:** Cost for **Obstacle Forcing** is reduced by **-1**. | **Resilient Load:** Increases **Encumbrance Threshold** by **10 lbs.** | **Bracing Stance:** Ally ignores **Heavily Encumbered** penalty for next STR check. |
| **DEX** | **Acrobatics Training:** Move **diagonally** on the grid for the cost of a single square. | **Swift Disarmament:** Recover **1 Stamina** on successful disarm. | **Feather Step:** Gains **+1 bonus** to Evasion Checks. |
| **CON** | **Quick Recovery:** Amount restored by **Resilience Buffer** is increased by **+1**. | **Iron Stomach:** Takes **half HP damage** from starvation drain. | **Endurance Training:** Increases **Max Stamina** pool by **+2**. |
| **INT** | **Efficient Tool Use:** Stamina cost for **Temporary Modification** is reduced by **-1**. | **Systemic Memory:** Gains **+1 bonus** to logic/sequence checks (e.g., Rune Lock). | **Resourceful Crafting:** Yields **+1 extra Tool Kit** during Preparation Phase. |
| **WIS** | **Critical Spotting:** Area of effect for "Near" information from **Situational Awareness** is increased by **+1 square**. | **Focused Gatherer:** Yield of **Food/Water** from Gathering Spots is increased by **+1 Unit**. | **Sure Footing:** Gains **+1 bonus** to checks required to navigate difficult terrain. |
| **CHA** | **Inspiring Presence:** Duration of **Positional Rally** boost is increased by **+1 turn**. | **Quick Huddle:** Reduces the **Stamina cost** of **Positional Rally** action by **-1**. | **Natural Encouragement:** Free **1 Stamina** revive to adjacent ally (once/encounter). |