
# Project: D&D Browser Game - Core System Design

## 1. The 5-Stat, 15-Branch Core System

The game utilizes five specialized stats for character investment, which are the foundation for the 15 distinct specialization paths.

| Stat | Core Concept | Role in System |
| :--- | :--- | :--- |
| **1. Physique (PHY)** | Physical Action & Efficiency | Raw physical ability, speed, and endurance of movement. |
| **2. Insight (INS)** | Logic, Deduction, & World Knowledge | Mental acuity, analysis, and mechanical skill. |
| **3. Command (COM)** | Social Influence & Leadership | Persuasion, motivation, delegation, and tactical oversight. |
| **4. Willpower (WIL)** | Inner Power & Sustained Effort | Mental fortitude, focus, magical resource pool, and resilience. |
| **5. Fortune (FTE)** | Luck, Opportunity, & Chaos | The influence of fate, external randomness, and serendipitous discovery. |

## 2. The 15 Specialization Branches (5x3 Grid)

Each of the five stats has three specialized branches. These branches define a character's role and dictate the focus of their gear and skill access across all minigames.

| Stat | Branch 1 (Focus) | Branch 2 (Control) | Branch 3 (Defense) | High-Impact Combat Role |
| :--- | :--- | :--- | :--- | :--- |
| **PHY** | **Might (STR):** Raw force, Melee Damage. | **Finesse (DEX):** Evasion, Speed, Ranged Damage. | **Endurance:** Stamina regeneration, resistance to movement impairment. | *All Three* (Core damage and movement) |
| **INS** | **Analysis:** Weakness and trend identification. | **Engineering:** Devices, Traps, Technology. | **Lore:** Decryption, language, creature knowledge. | **Engineering** (Battlefield control via traps/explosives) |
| **COM** | **Intimidation:** Coercion, threat, single-target debuffs. | **Charm:** Negotiation, group/social persuasion. | **Tactics:** Group buffs, morale, battlefield support. | **Tactics** (Force multiplier via group buffs) |
| **WIL** | **Focus:** Mana/resource efficiency, cost reduction. | **Channeling:** Sustained spells/wards, resistance to distraction. | **Resilience:** HP, Status Effect Resistance (Mental & Physical). | **Channeling** (Sustained magical pressure/protection) |
| **FTE** | **Discovery:** Loot rarity, resource finding. | **Heresy:** Chaos magic, unpredictable critical strikes. | **Survival:** Divine saves, escaping fatal events. | **Heresy** (High-reward, swingy chaotic damage) |

## 3. Derived Health (HP) System

Health (HP) is **derived** from a character's level plus a bonus from specific branches across three different stats. This ensures survivability is not tied to a single specialization.

| Survival Path | Stat and Branch | Contribution to Survival |
| :--- | :--- | :--- |
| **Physical Shield** | **PHY (Endurance)** | High multiplier to the character's **Maximum HP Pool** and Stamina. |
| **Mental Fortitude** | **WIL (Resilience)** | Boosts **HP/Stamina Regeneration** and provides resistance to all status effects (poison, fear, stun). |
| **Unseen Favor** | **FTE (Survival)** | Increases the chance of a "Divine Save" (ignoring a fatal blow) and grants resource recovery on rare events. |

## 4. Combat Minigame Integration

The combat system is designed to allow every specialization to have a powerful, high-impact role:

| Stat | Combat Role Summary | Gear Aesthetic & Function |
| :--- | :--- | :--- |
| **PHY** | **Striker/Tank** (High damage, direct defense, HP pool via **Endurance**). | Heavy Plate, Two-Handed Weapons (Might) or Light Leather, Bows (Finesse). Gear focuses on raw damage and damage reduction. |
| **INS** | **Utility Controller** (Manipulates the environment via traps, bombs, and analyzing enemy weaknesses). | Utility Vests, Goggles, Wrenches, Technical Weapons. Gear provides slots for deployables and grants target analysis data. |
| **COM** | **Commander/Buffer** (Empowers allies, calls for support, and utilizes morale boosts to increase group performance). | Ornate Armor, Capes, Banners/Scepters. Gear enhances buff range and duration. |
| **WIL** | **Sustained Caster** (Reliable magic, strong wards, and high resistance to status effects via **Resilience**). | Robes, Staves, Focused Amulets. Gear increases Mana/Focus pool and spell effectiveness. |
| **FTE** | **Chaos Swinger** (Unpredictable, high-variance damage through critical hits and random beneficial events). | Patchwork Armor, Lucky Charms, Exotic Weapons. Gear increases critical hit chance and loot rarity. |

### Combat Summoning Mechanics

Summoning is split across three distinct stat paths, reinforcing the unique identity of each stat:

1.  **Arcane Summons (WIL):** Used for tactical elementals or short-lived bindings. Reliable, but consumes the caster's **Mana/Focus** pool.
2.  **Social Summons (COM):** Used for recruiting longer-term mercenaries, militia, or champions. Their quality and duration are based on the character's **Charm/Tactics** and pre-mission negotiation.
3.  **Divine/Chaos Summons (FTE):** Used for high-impact, rare aid (e.g., massive celestial beings, random localized destruction). Unreliable, high-risk, high-reward, triggered by **Heresy**.

***

## Next Steps for Resumption

The next logical step is to detail how this **5-Stat, 15-Branch** system applies to the other planned minigames.

**Proposed Next Focus:**

* **The Statecraft Minigame:** How do the 15 branches translate into kingdom management, policy decisions, diplomacy, and resource collection? (e.g., How does **PHY-Might** help run a kingdom?)