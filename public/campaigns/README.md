# Campaign Files

Campaign files define test encounters that can be loaded directly for testing, bypassing the normal game flow.

## Location

Campaign files are stored in `public/campaigns/` for easy HTTP access during development and testing.

## File Structure

Each campaign file is a JSON object with the following structure:

```json
{
  "id": "unique-campaign-id",
  "name": "Display Name",
  "description": "What this campaign tests",
  "encounters": [
    {
      "id": "encounter-id",
      "name": "Encounter Name",
      "description": "What this encounter tests",
      "grid": {
        "width": 10,
        "height": 10
      },
      "entities": [
        {
          "type": "character" | "crate" | "trap" | "obstacle",
          "position": { "x": 0, "y": 1 },
          "properties": {
            // Entity-specific properties
          }
        }
      ],
      "winConditions": [
        {
          "type": "allCharactersInExit",
          "description": "Win condition description"
        }
      ]
    }
  ]
}
```

## Entity Types

### Character

```json
{
  "type": "character",
  "position": { "x": 0, "y": 1 },
  "properties": {
    "name": "Hero 1",
    "archetype": "Warrior",
    "attributes": {
      "str": 5,
      "dex": 2,
      "con": 5,
      "int": 2,
      "wis": 2,
      "cha": 2
    },
    "sprite": "/assets/characters/warrior.png"
  }
}
```

**Archetypes:**
- `Warrior`: STR 5, CON 5, others 2
- `Thief`: DEX 5, STR 5, others 2
- `Wizard`: INT 5, WIS 5, others 2
- `Cleric`: WIS 5, CON 5, others 2
- `Bard`: CHA 5, DEX 5, others 2
- `Paladin`: STR 5, CHA 5, others 2

**Entrance Zone:** Characters should be placed at `(0, 1)`, `(0, 2)`, `(0, 3)`, or `(0, 4)` (left side, rows 1-4).

### Crate

```json
{
  "type": "crate",
  "position": { "x": 1, "y": 1 },
  "properties": {
    "weight": 30,
    "sprite": "/assets/items/crate.png"
  }
}
```

**Weight:** Determines push difficulty. Characters with STR 3+ can push crates. Stamina cost = `Math.ceil(weight / 3)`.

**Playable Area:** Crates should be placed in the playable area (x: 1-8, y: 1-8), not in entrance/exit zones.

## Grid Zones

- **Entrance Zone:** Left side (x=0), rows 1-4 (y: 1, 2, 3, 4)
- **Exit Zone:** Right side (x=9), rows 5-8 (y: 5, 6, 7, 8)
- **Playable Area:** Interior 8×8 (x: 1-8, y: 1-8)
- **Walls:** Border squares excluding entrance/exit zones

## Example Campaigns

- `push-test-campaign.json` - Tests push mechanics with 3 crates
- `movement-test-campaign.json` - Simple movement test with minimal obstacles

## Usage

Campaign files can be loaded via HTTP:

```typescript
const response = await fetch('/campaigns/push-test-campaign.json');
const campaign = await response.json();
```

## Future Enhancements

- Support for traps, obstacles, and other entity types
- Multiple encounters per campaign (sequence testing)
- Encounter templates for reusable patterns
- Campaign validation and error checking

