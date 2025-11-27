# The Adventurer's Choice

## 🕹️ Design Pillars

* **Core Experience:** Cooperative party adventure game centered on collaborative, attribute-driven mini-games, emphasizing multiple viable paths to survival.
* **Theme:** **Pre-Industrial Fantasy** (D&D style, low-magic resource feel with Tech-Magic hybrids, focusing on scarcity and documentation).
* **Platform:** Browser/Desktop (Inspired by Puzzle Pirates).
* **Player Count:** Designed for parties of 3-6 members.
* **Attribute Integration:** All six D&D attributes (STR, DEX, CON, INT, WIS, CHA) provide distinct, non-redundant mechanical value in every major mini-game.
* **Game Modes:** Supports **Campaign Mode** and **Roguelike Mode** (featuring the **Triage Choice** recovery constraint).

---

## 🗺️ Core Mechanics

### 🧭 Core Adventure Loop (The Daily Loop)

The game progresses in cycles representing an Adventuring Day.

| Phase | Description | Primary Mini-Game Used |
| :--- | :--- | :--- |
| **1. Preparation** | Party selects and executes Downtime projects (crafting, research, training) to prepare for the day. | **The Preparation Phase** |
| **2. Adventure** | Party selects a destination and spends time/resources to travel between nodes on the World Map, managing survival meters. | **The Survival Ledger** |
| **3. Encounter** | Party resolves the challenge at the destination node (Combat, Social, or Obstacle). | **Positional Skirmish, Court of Whispers,** or **The Gauntlet** |
| **4. Recovery** | Party restores resources. This phase includes the high-stakes **Triage Choice** in Roguelike Mode. | **The Preparation Phase** (Healing Focus) |

### 🎲 Mini-Game Catalogue (Turn-Based)

#### 1. Positional Skirmish (Combat)
* **Core Challenge:** Outmaneuvering the enemy on a 3x3 grid by managing player position (front/back row) and resource tokens to execute turn-based attacks.
* **Primary Focus:** STR (Melee), DEX (Ranged/Movement).

#### 2. Court of Whispers (Social/Negotiation)
* **Core Challenge:** Convincing an NPC via debate and resource management (Favor/Trust) to achieve a desired outcome without violence. Social elements cover buying/trading (short-term) and reputation building (long-term).
* **Primary Focus:** CHA (Influence), WIS (Insight).

#### 3. The Gauntlet (Trap Dungeon/Obstacle Course)
* **Core Challenge:** Navigating a hazardous, time-pressured path by finding and disabling threats and bypassing obstacles.
* **Primary Focus:** DEX (Evasion), WIS (Detection).

#### 4. The Preparation Phase (Downtime/Resource Investment)
* **Core Challenge:** Optimally allocating limited time/action points to cooperative projects that upgrade party stats/gear.
* **Primary Focus:** INT (Research), STR (Labor), CHA (Recruitment).

#### 5. The Survival Ledger (Travel/Exploration/Gathering)
* **Core Challenge:** Balancing dynamic survival meters (Food, Water, Pace) against random environmental demands by spending inventory, gathering, or researching.
* **Primary Focus:** WIS (Gathering), CON (Endurance), INT (Research).

---

## 📈 Skill Progression and Archetypes

Skills are leveled up by successfully using their corresponding attribute in the relevant mini-game. This creates natural progression tracks leading to specialized Archetypes.

| Progression Track | Associated Mini-Game(s) | Primary Attributes | Example Skills Earned |
| :--- | :--- | :--- | :--- |
| **I. Combat & Physicality** | **Positional Skirmish** | **STR** & **DEX** | Athletics, Weapons Mastery, Acrobatics. |
| **II. Social & Trade** | **Court of Whispers** | **CHA** & **WIS** | Persuasion, Deception, Insight. |
| **III. Survival & Exploration** | **Survival Ledger** | **WIS** & **CON** | Survival, Medicine, Endurance Training. |
| **IV. Research & Crafting** | **Preparation Phase** | **INT** & **STR** | Arcana/Linguistics, Tool Proficiency, Engineering. |
| **V. Trap & Stealth** | **The Gauntlet** | **DEX** & **INT** | Sleight of Hand, Investigation, Stealth. |

---

## ⚙️ Implementation Approach: Minimal Viable Product (MVP)

The MVP goal is to prove the core fun of **collaborative, turn-based, attribute-driven puzzling**.

#### Recommended MVP: The Gauntlet (Trap Dungeon)

The Gauntlet is the ideal starting point because it forces all six attributes into an asymmetrical, time-pressured, collaborative puzzle, proving the core mechanic with minimal visual assets.

#### MVP Feature Checklist
| Component | Priority | Description |
| :--- | :--- | :--- |
| **I. Core Framework** | **Must Have** | Basic 3-6 player lobby, turn structure, and a functional player communication system (chat/voice). |
| **II. Character Definition** | **Must Have** | Simple character sheet displaying **fixed Attribute Scores** (STR, DEX, etc.). |
| **III. Core Loop (Minimum)** | **Must Have** | **Start Game $\rightarrow$ Mini-Game $\rightarrow$ Success/Fail $\rightarrow$ End Game.** (Minimal loop). |
| **IV. Mini-Game Implementation** | **Must Have** | **The Gauntlet** fully implemented with all six attribute modifiers integrated (DEX slows timer, WIS reveals traps, CON provides stamina pool). |
| **V. Basic Failure State** | *Should Have* | End screen showing "Party Wiped" message and final run time/score. |

---

### Current Decisions Log

### [Nov 27, 2025 - Game Name]
* **Decision:** The placeholder name is **The Adventurer's Choice**.
* **Rationale:** The name prioritizes clarity and emphasizes player agency and strategic decision-making within the core loop.

### [Nov 27, 2025 - Game Viability]
* **Decision:** The game is fundamentally viable and fun without traditional combat due to the strength of the collaborative puzzle structure.

### [Nov 27, 2025 - Implementation]
* **Decision:** The **MVP Focus** will be on the **The Gauntlet (Trap Dungeon)** mini-game.

### [Nov 27, 2025 - Progression]
* **Decision:** Skills are mapped to their progression track and associated mini-game, ensuring focused character growth.

---

**Now that the game's identity and structure are complete, we can focus on the progression tracks. Which Archetype progression track should we detail next, by defining three unique starting skills (or skill trees) that players can immediately identify with?**

1.  **The Combatant:** (STR/DEX focus)
2.  **The Diplomat/Trader:** (CHA/WIS focus)
3.  **The Scout/Rogue:** (DEX/INT focus)
4.  **The Crafter/Scholar:** (INT/STR focus)