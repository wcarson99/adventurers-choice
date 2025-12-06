---
title: Architecture Decision Records
type: decisions
status: living-document
last_updated: 2025-12-01
tags: [adr, decisions, architecture]
---

# Architecture Decision Records (ADR)

This document captures key design and architecture decisions made during development, including context, rationale, and considered alternatives.

---

## ADR-001: Atomic Turn Resolution

**Date:** 2025-11-30  
**Status:** Accepted  
**Context:** Deciding how turn actions should be executed in tactical encounters.  
**Decision:** Player pre-commits all character actions, which then execute sequentially in the chosen order.  
**Rationale:**

- Enables strategic planning with full information
- Allows for action sequencing puzzles
- Maintains turn-based purity without real-time pressure
  **Consequences:**
- Conflicts (e.g., two characters targeting same tile) result in failed action but still cost resources
- Requires clear UI feedback for action order

**Alternatives Considered:**

- Real-time action execution: Rejected (not turn-based)
- Per-character turn resolution: Less strategic, slower pacing

---

## ADR-002: Deterministic Attribute Checks (MVP)

**Date:** 2025-12-01  
**Status:** Accepted for MVP  
**Context:** Deciding between deterministic vs. probabilistic attribute checks.  
**Decision:** Use deterministic checks for MVP (100% success if character meets/exceeds requirement).  
**Rationale:**

- Puzzle-focused gameplay benefits from predictability
- Matches cooperative party structure (find right character for right task)
- Respects player's pre-committed action planning
- Simpler to implement and balance

**Consequences:**

- Player always knows if an action will succeed before committing
- Encourages party composition strategy (need diverse attributes)
- Less RNG frustration

**Alternatives Considered:**

- Probabilistic with threshold falloff (STR 2 vs STR 3 = 80% success): Moved to backlog
- Pure dice-rolling (D&D style): Rejected (too much RNG variance for atomic turns)

---

## ADR-003: Simple Permadeath (MVP)

**Date:** 2025-12-01  
**Status:** Accepted for MVP  
**Context:** Determining death and resurrection mechanics.  
**Decision:** Party wipe (all characters 0 HP) = permanent Game Over, no resurrection system in MVP.  
**Rationale:**

- True roguelike stakes
- Simplest to implement
- Encourages careful resource management
- HP fully restores between encounters (clean slate for each puzzle)

**Consequences:**

- High tension gameplay
- Players must be cautious with HP management
- No soft-lock recovery if party wipes

**Alternatives Considered:**

- Town-based resurrection with "Carry the Fallen" mechanic: Moved to backlog
- Knocked-out revival after encounters: Rejected (too forgiving for roguelike)

---

## ADR-004: Flat Modern Cartoony Art Style

**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Choosing visual aesthetic for the game.  
**Decision:** Flat modern UI with simple cartoony art (Adventure Time/Brawl Stars style), top-down view.  
**Rationale:**

- Optimized for tablet/small screen readability (high contrast)
- Age-appropriate for 10+ players
- Faster to produce art assets (simpler shapes)
- Clean, accessible visual language

**Consequences:**

- UI must use high contrast colors
- Character designs use simple round shapes with distinct silhouettes
- Grid tiles use flat colors with icon overlays (no detailed textures)

**Alternatives Considered:**

- Isometric view with pixel art: Rejected (harder to read on small screens, more complex art pipeline)
- Realistic/detailed art: Rejected (too slow to produce, not age-appropriate tone)

---

## ADR-005: Mission Rotation (7 Days)

**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Deciding how missions appear/disappear from job boards.  
**Decision:** Unclaimed missions rotate out after 7 game days, replaced with new missions.  
**Rationale:**

- Provides time pressure without being oppressive
- Allows grinding repeatable missions while waiting for suitable main missions
- Thematic justification: "Quest was claimed by another party"
- Encourages replayability (different missions each run)

**Consequences:**

- Players have 1 week to prepare for/accept a mission
- Creates strategic decision: "Take suboptimal mission now, or wait for better fit?"

**Alternatives Considered:**

- No rotation: Rejected (too static, no time pressure)
- Immediate rotation (new missions each town visit): Rejected (too fast, overwhelming)

---

## ADR-006: Map Reveal on Mission Acceptance

**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Deciding map visibility and fog of war at world map level.  
**Decision:** Only starting town is visible initially. Accepting a mission reveals its destination node and connecting paths.  
**Rationale:**

- Creates sense of exploration and discovery
- Prevents choice paralysis (limited visible missions)
- Map grows organically as player progresses

**Consequences:**

- Procedural map generation needed
- UI must elegantly handle dynamic map reveal

**Alternatives Considered:**

- Full map visible from start: Rejected (no exploration feel)
- Gradual reveal by travel distance: Too complex for MVP

---

## ADR-007: ECS Architecture for Game Logic

**Date:** Early Development  
**Status:** Accepted  
**Context:** Choosing game architecture pattern.  
**Decision:** Use Entity-Component-System (ECS) architecture for all game logic.  
**Rationale:**

- Clean separation of data (components) and logic (systems)
- Highly testable
- Framework-agnostic (can swap React for another UI layer)
- Scales well with complex interactions

**Consequences:**

- Game state is serializable by default
- Systems operate on component combinations
- React is presentation layer only

**Alternatives Considered:**

- Object-oriented class hierarchy: Rejected (tight coupling, harder to test)
- Purely functional approach: Considered but ECS provides better organization

---

## ADR-008: Bidirectional Edges Only (MVP)

**Date:** 2025-12-01  
**Status:** Accepted for MVP  
**Context:** Deciding map traversal rules.  
**Decision:** All travel edges are bidirectional in MVP. One-way edges deferred to post-MVP.  
**Rationale:**

- Simpler pathfinding and map generation
- Allows backtracking for resupply
- Fewer edge cases to handle

**Consequences:**

- Players can always return to previous towns
- Reduces risk of soft-locks

**Alternatives Considered:**

- Include one-way edges (e.g., "Descend cliff"): Moved to backlog for thematic flavor

---

## ADR-009: HP/Stamina Full Restore Between Encounters

**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Deciding resource recovery between tactical encounters.  
**Decision:** HP and Stamina fully restore between encounters (automatic rest/camping).  
**Rationale:**

- Each encounter is self-contained puzzle
- Prevents cascading failure (one bad encounter doesn't doom entire mission)
- Simpler resource management tracking

**Consequences:**

- Food is consumed for travel days, not for healing
- Encounters don't "remember" damage from previous encounters on same mission

**Alternatives Considered:**

- Partial HP restore: Too punishing, creates death spirals
- Carry-over HP/Stamina: Too complex to balance

---

## ADR-010: Simplified Fatigue System (MVP)

**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Deciding Fatigue accumulation mechanics.  
**Decision:** Remove automatic "food consumption → fatigue" link. Fatigue only from Starvation penalty or specific encounter hazards.  
**Rationale:**

- Thematically clearer ("eating food makes you tired" is backwards)
- Fatigue becomes emergency/penalty resource, not inevitable accumulation
- Simpler to track

**Consequences:**

- Players won't constantly accumulate Fatigue during normal play
- Rest mechanics still available at towns to remove Fatigue from hazards

**Alternatives Considered:**

- "4 Food consumed = 1 Fatigue" (original design): Rejected (thematically confusing)
- Time-based Fatigue ("X days without rest"): Deferred to post-MVP

---

## ADR-011: Square Occupancy Rules

**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Deciding occupancy rules for grid squares to support encounter persistence and test campaigns.  
**Decision:** 
- One item per square maximum
- Character and item cannot share the same square
- Characters cannot share spaces (already established)

**Rationale:**

- **Visual clarity:** Prevents sprite overlap and interaction ambiguity
- **Consistent rules:** All entity types follow same "one per square" rule
- **Simpler implementation:** No need for stacking logic, multi-entity selection, or overlap rendering
- **Clear interactions:** Clicking a square always targets exactly one entity
- **Test campaign support:** Deterministic placement rules make encounter design and testing straightforward

**Consequences:**

- Items must be placed on empty squares (cannot be in character spawn/exit zones or on occupied squares)
- Encounter generation must check for available squares when placing items
- Movement validation must check for both characters and items when determining if a square is occupied
- Clear visual representation (one entity per square)

**Alternatives Considered:**

- **Multiple items per square:** Rejected (visual complexity, interaction ambiguity, not needed for MVP)
- **Character + item on same square (auto-collect):** Rejected (visual overlap, less player control)
- **Character + item on same square (manual collect):** Rejected (extra complexity, inconsistent with character-character rule)

---

## Post-MVP Decisions (Backlog)

The following decisions are deferred until post-MVP development:

- **Probabilistic Attribute Checks:** Threshold-with-falloff system for risk/reward
- **Resurrection System:** Town-based with "Carry the Fallen" mechanic
- **One-Way Travel Edges:** Geography-based restrictions (cliffs, rivers)
- **Improvised Solutions:** Use Food/consumables to bypass attribute requirements
- **Single-Step Execution Mode:** Execute one action at a time with confirmation

---

## Decision Process

All major decisions should be documented here using this format:

```markdown
## ADR-XXX: Decision Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Rejected | Superseded
**Context:** Why this decision is needed
**Decision:** What was decided
**Rationale:** Why this decision was made
**Consequences:** What this decision enables/prevents
**Alternatives Considered:** What else was considered and why rejected
```
