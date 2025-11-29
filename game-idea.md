# The Adventurer's Choice

## 🕹️ Design Pillars

* **Core Experience:** Cooperative party adventure game centered on collaborative, attribute-driven mini-games, emphasizing multiple viable paths to survival.
* **Theme:** **Pre-Industrial Fantasy** (D&D style, low-magic resource feel with Tech-Magic hybrids, focusing on scarcity and documentation).
* **Player Count:** Designed for parties of 3-6 members.
* **Attribute Integration:** All six D&D attributes (STR, DEX, CON, INT, WIS, CHA) provide distinct, non-redundant mechanical value in every major mini-game.
* **Game Mode (MVP Focus):** Supports **Roguelike Mode** only.

---

## 🗺️ Core Mechanics

### 🧭 Core Adventure Loop (The Daily Loop)

| Phase | Description | Primary Mini-Game Used |
| :--- | :--- | :--- |
| **1. Preparation** | Party selects and executes Downtime projects (crafting, training, **spending AP**). | **The Preparation Phase** |
| **2. Adventure** | Party selects a destination and spends time/resources to travel. | **The Survival Ledger** |
| **3. Encounter** | Party resolves the challenge at the destination node, **earning AP**. | **Positional Skirmish, Court of Whispers,** or **The Gauntlet** |
| **4. Recovery** | Party restores resources (includes mode-specific rules). | **The Preparation Phase** (Healing Focus) |

### 🏆 Progression and Economy (MVP)

| Component | Rule/Constraint | Rationale |
| :--- | :--- | :--- |
| **Attribute Scores (STR-CHA)**| Randomly generated with a **sum of 18** and a **maximum of 5**. | Ensures randomized character builds and specialization. |
| **Gold** | **Individual Pool** (Tracked on character). **1 Unit of Gold = 0.5 lbs.** | Used exclusively for **Trade, Supplies, and Reviving** fallen allies. Contributes to individual Encumbrance. |
| **Resource Economy Focus** | **Gold (Wealth/Trade)** is separate from **AP (Power/Progression)**. | Creates two clear, distinct economic loops for player decision-making. |

### 🌳 Progression System: Consumable Attribute Points (AP)

* **Acquisition:** APs are earned individually, based on the *successful use* of the corresponding core attribute mechanic during an Encounter. (e.g., Using **Obstacle Forcing** earns STR AP).
* **Spending:** AP is consumed during the **Preparation Phase** to permanently improve the character.

| Progression Goal | Resource Used | Cost Structure | Prerequisite Gate |
| :--- | :--- | :--- | :--- |
| **Increase Attribute Score** | Specific Attribute AP (e.g., STR AP) | **Progressive Cost:** The number of AP consumed to gain +1 to the attribute (5 $\rightarrow$ 10 $\rightarrow$ 15 $\rightarrow$ 20). | None (other than maxing at 5). |
| **Unlock Tier 1 Skill** | Specific Attribute AP (e.g., STR AP) | **Flat Cost:** **5 AP** of the corresponding attribute. | Must have the **Attribute Score $\ge 3$**. |

### 🧍 Character Foundation & Encumbrance

| Component | Rule/Starting Value | Rationale |
| :--- | :--- | :--- |
| **Tier 1 Skill Prereq** | Must have a score of **3** in the corresponding attribute to unlock and learn Tier 1 Skills. | Creates a meaningful specialization threshold. |
| **HP / Stamina** | Base 5 + **CON Score**. | CON is the central survival/action resource. |
| **Encumbrance (Gold/Items)** | Weight $>$ **STR $\times 5$** (Encumbered), Weight $>$ **STR $\times 10$** (Heavily Encumbered). | Forces STR characters to be the primary carriers of wealth (Gold) and supplies. |

---

## 💥 The Gauntlet: MVP Core Mechanics & Tier 1 Skills

The MVP skill progression is limited to the Core Mechanic (active) and a single Tier 1 Skill (passive/utility), both costing **5 AP** to unlock if the attribute score is $\ge 3$.

| Attribute | Core Mechanic (Active) | Tier 1 Skill (Passive/Reactionary) | Primary Role & Cost to Unlock |
| :--- | :--- | :--- | :--- |
| **Strength (STR)** | **Obstacle Forcing (Move/Destroy)** | **Controlled Descent:** Cost for **Obstacle Forcing** is reduced by **-1**. | **5 STR AP** |
| **Dexterity (DEX)** | **Free Step (Movement Economy)** | **Acrobatics Training:** Move **diagonally** on the grid for the cost of a single square. | **5 DEX AP** |
| **Constitution (CON)** | **Resilience Buffer (Heal/Prevent)** | **Quick Recovery:** Amount restored by **Resilience Buffer** is increased by **+1**. | **5 CON AP** |
| **Intelligence (INT)** | **Temporary Modification (Saboteur)** | **Efficient Tool Use:** Stamina cost for **Temporary Modification** is reduced by **-1**. | **5 INT AP** |
| **Wisdom (WIS)** | **Situational Awareness (Environmental)** | **Critical Spotting:** Area of effect for "Near" information from **Situational Awareness** is increased by **+1 square**. | **5 WIS AP** |
| **Charisma (CHA)** | **Positional Rally (Temporary Buff)** | **Inspiring Presence:** Duration of **Positional Rally** boost is increased by **+1 turn**. | **5 CHA AP** |

---

### Current Decisions Log

### [Nov 29, 2025 - Final Progression Model]
* **Decision:** Progression is driven entirely by **Consumable Attribute Points (AP)**. The AXP and Lore Fragments pools are removed.
* **Decision:** APs are earned individually based on the actions successfully taken during an encounter (e.g., using STR abilities earns STR AP).
* **Decision:** APs are spent during the **Preparation Phase** to either **increase a base attribute score** (progressive cost: 5, 10, 15, 20 AP) or **unlock a Tier 1 skill** (flat cost of 5 AP).
* **Rationale:** Creates the simplest, most transparent progression model that directly ties action to permanent reward, providing maximum player agency over their character's specialization.

**Next Step:** Let's define the AP gain rate for the MVP. **How many AP tokens should a player gain from successfully using a Core Attribute Mechanic (e.g., using 'Obstacle Forcing' once in The Gauntlet)?** (We must be careful to keep this low, as the cost for a Tier 1 skill is only 5 AP.)