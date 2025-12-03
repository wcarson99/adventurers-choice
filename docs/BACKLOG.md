---
title: Product Backlog
type: backlog
status: living-document
last_updated: 2025-12-01
tags: [backlog, roadmap, tasks]
---

# Product Backlog & RoadmapVertical Slices

This document contains the prioritized list of Vertical Slices for incremental development. Each slice represents a small, end-to-end user-facing feature that can be built using TDD (RED → GREEN → REFACTOR).

## MVP: The Gauntlet (Core Game Loop)

### Phase 1: Foundation

- [x] **Slice 1.1**: Project setup (Vite, React, TypeScript, Playwright)
- [x] **Slice 1.2**: Basic game engine structure (`GameEngine.executeTurn` skeleton)
- [ ] **Slice 1.3**: ECS foundation (Entity, Component, System base classes)
- [ ] **Slice 1.4**: Character creation UI (create party of 3-6 characters with fixed attributes)

### Phase 2: Character System

- [ ] **Slice 2.1**: Character entities with AttributeComponent
- [ ] **Slice 2.2**: Display character sheet UI (show attributes)
- [ ] **Slice 2.3**: Character selection/management in party

### Phase 3: The Gauntlet - Basic Structure

- [ ] **Slice 3.1**: Gauntlet game state initialization
- [ ] **Slice 3.2**: Grid-based game board rendering (Canvas)
- [ ] **Slice 3.3**: Character positioning on grid (PositionComponent)
- [ ] **Slice 3.4**: Basic movement action (MoveAction)

### Phase 4: The Gauntlet - Traps

- [ ] **Slice 4.1**: Trap entities with TrapComponent
- [ ] **Slice 4.2**: Trap rendering on grid
- [ ] **Slice 4.3**: WIS-based trap detection (reveal hidden traps)
- [ ] **Slice 4.4**: DEX/INT-based trap disarming (DisarmTrapAction)

### Phase 5: The Gauntlet - Attributes Integration

- [ ] **Slice 5.1**: STR-based obstacle breaking
- [ ] **Slice 5.2**: CON-based stamina system (StaminaComponent)
- [ ] **Slice 5.3**: Attribute-based action success/failure calculations
- [ ] **Slice 5.4**: All six attributes provide mechanical value in Gauntlet

### Phase 6: The Gauntlet - Turn System

- [ ] **Slice 6.1**: Turn tracking (TurnComponent, TurnSystem)
- [ ] **Slice 6.2**: Turn limit enforcement (puzzles with time pressure)
- [ ] **Slice 6.3**: Turn-based action selection UI
- [ ] **Slice 6.4**: End turn / Next turn flow

### Phase 7: The Gauntlet - Win/Loss

- [ ] **Slice 7.1**: Win condition (reach end of Gauntlet)
- [ ] **Slice 7.2**: Loss condition (party wipe or turn limit exceeded)
- [ ] **Slice 7.3**: End game screen (success/failure message)
- [ ] **Slice 7.4**: Score/final stats display

### Phase 8: Core Loop Completion

- [ ] **Slice 8.1**: Start Game → Encounter → Success/Fail → End Game loop
- [ ] **Slice 8.2**: Basic failure state UI
- [ ] **Slice 8.3**: Game restart/new game flow
- [ ] **Slice 8.4**: Opportunity encounters (optional "Explore?" choice)
- [ ] **Slice 8.5**: Simple treasure encounter (reward Gold/Food)

## Post-MVP Features

### World Map & Progression

- [ ] **Slice 9.1**: World map structure (linear node sequence)
- [ ] **Slice 9.2**: Node state tracking (Unvisited, In-Progress, Completed, Failed)
- [ ] **Slice 9.3**: Travel between nodes (forward-only)
- [ ] **Slice 9.4**: Encounter selection UI
- [ ] **Slice 9.5**: Backtracking to previous encounters (revisit failed/partial puzzles)
- [ ] **Slice 9.6**: Partial puzzle state persistence (save progress in encounters)

### Additional Mini-Games

- [ ] **Slice 10.1**: Positional Skirmish (Combat) - 3x3 grid, STR/DEX focus
- [ ] **Slice 10.2**: Court of Whispers (Social) - CHA/WIS focus
- [ ] **Slice 10.3**: The Preparation Phase (Downtime) - INT/STR/CHA focus
- [ ] **Slice 10.4**: The Survival Ledger (Travel) - WIS/CON/INT focus

### NPC Encounters (Post-MVP)

- [ ] **Slice 10.5**: NPC encounter framework (combat, trading, dialogue)
- [ ] **Slice 10.6**: Combat encounters (enemy entities, turn-based combat)
- [ ] **Slice 10.7**: Trading encounters (merchant NPCs, item exchange)
- [ ] **Slice 10.8**: Information gathering (dialogue trees, quest hints)

### Character Progression

- [ ] **Slice 11.1**: Skill system foundation
- [ ] **Slice 11.2**: Skill progression by attribute usage
- [ ] **Slice 11.3**: Archetype progression tracks
- [ ] **Slice 11.4**: Skill trees/starting skills

### Game Modes

- [ ] **Slice 12.1**: Campaign Mode structure
- [ ] **Slice 12.2**: Roguelike Mode structure
- [ ] **Slice 12.3**: Triage Choice recovery constraint (Roguelike)

### Advanced Features

- [ ] **Slice 13.1**: Deployable devices during encounters
- [ ] **Slice 13.2**: Summonable monsters
- [ ] **Slice 13.3**: Equipment system (attribute modifiers)
- [ ] **Slice 13.4**: Save/Load system
- [ ] **Slice 13.5**: Inventory management
- [ ] **Slice 13.6**: Consumable/utility items (Torch - extended visibility, Rope - bypass climbing checks, Pick - bypass obstacle breaking checks)
- [ ] **Slice 13.7**: Resurrection system (town-based, Gold + Time cost)
- [ ] **Slice 13.8**: "Carry the Fallen" mechanic (remains have weight, must be brought to town)
- [ ] **Slice 13.9**: Improvised solutions (use Food/consumables to bypass attribute requirements)
- [ ] **Slice 13.10**: Multiple solution paths per encounter (Primary vs. Alternate approaches)
- [ ] **Slice 13.11**: Focus free action mechanic
  - **Core Concept:** Focus is a free action (like Move and Wait) that grants a bonus to the next skill-based action
  - **Scaling:** Bonus = `max(INT, WIS)` (mental focus/awareness)
  - **Thematic:** "Focusing your chi" for accuracy, meditating for spell casting, focusing on person for CHA persuasion
  - **Design Questions:**
    - How does bonus apply? (+X to check, -X stamina cost, allows attempting harder actions, or skill-specific?)
    - When does focus expire? (Lost on movement? After using bonus? After X turns?)
    - Can you stack focus? (One at a time? Multiple focuses? Focus intensity?)
    - How does focus work with deterministic checks? (Allow attempting actions above attribute? Just reduce costs?)
  - **Implementation Note:** Impact must be designed on a skill-by-skill basis (STR push, DEX disarm, CHA persuade, etc. may have different focus effects)

### UI/UX Enhancements

- [ ] **Slice 14.1**: Single-step execution mode (execute one action at a time with confirmation)
- [ ] **Slice 14.2**: Action replay/rewind system
- [ ] **Slice 14.3**: Advanced action queue editing (insert, swap, conditional actions)
- [ ] **Slice 14.4**: Probabilistic attribute checks (threshold with falloff system)

## Notes

- **Priority**: Slices are listed in approximate development order
- **Dependencies**: Later slices may depend on earlier ones
- **Flexibility**: Order can be adjusted based on testing feedback
- **MVP Goal**: Complete Phases 1-8 to prove core fun of collaborative, turn-based, attribute-driven puzzling
