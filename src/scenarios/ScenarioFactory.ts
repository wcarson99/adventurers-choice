import { World } from '../game-engine/ecs/World';
import { Grid } from '../game-engine/grid/Grid';
import {
  PositionComponent,
  RenderableComponent,
  AttributesComponent,
  PushableComponent,
  DirectionComponent,
  NPCComponent,
  StatsComponent,
} from '../game-engine/ecs/Component';
import type { ScenarioDefinition, EntityPlacement } from '../jobs/Job';
import type { Character } from '../game-engine/GameState';
import { theme } from '../ui/styles/theme';

/**
 * Factory for creating ECS World and Grid from job scenario definitions
 */
export class ScenarioFactory {
  /**
   * Create World and Grid from a scenario definition
   * Returns the world, grid, and party (characters from the scenario)
   */
  static createFromScenario(
    scenario: ScenarioDefinition
  ): { world: World; grid: Grid; party: Character[] } {
    const world = new World();
    const grid = new Grid(scenario.grid.width, scenario.grid.height);
    const party: Character[] = [];

    // Process entities in order
    scenario.entities.forEach((entity, index) => {
      const entityId = world.createEntity();

      // Add position component
      world.addComponent(entityId, {
        type: 'Position',
        x: entity.position.x,
        y: entity.position.y,
      } as PositionComponent);

      // Handle different entity types
      switch (entity.type) {
        case 'character':
          this.createCharacter(world, entityId, entity, index, party);
          break;
        case 'npc':
        case 'enemy':
          this.createNPC(world, entityId, entity);
          break;
        case 'crate':
          this.createCrate(world, entityId, entity);
          break;
        case 'trap':
        case 'obstacle':
          // TODO: Implement trap/obstacle creation
          console.warn(`Entity type ${entity.type} not yet implemented`);
          break;
        default:
          console.warn(`Unknown entity type: ${entity.type}`);
      }
    });

    return { world, grid, party };
  }

  /**
   * Create a character entity from job definition
   */
  private static createCharacter(
    world: World,
    entityId: number,
    entity: EntityPlacement,
    index: number,
    party: Character[]
  ): void {
    const props = entity.properties;

    // Validate required character properties
    if (!props.name || !props.archetype || !props.attributes) {
      throw new Error(
        `Character entity missing required properties: name, archetype, or attributes`
      );
    }

    // Create Character object for party
    const character: Character = {
      id: index + 1,
      name: props.name,
      archetype: props.archetype,
      attributes: props.attributes,
      gold: props.gold ?? 20,
      food: props.food ?? 4,
      sprite: props.sprite || '/assets/characters/warrior.png',
    };
    party.push(character);

    // Add renderable component
    world.addComponent(entityId, {
      type: 'Renderable',
      char: character.name[0].toUpperCase(),
      color: theme.colors.accent,
      sprite: character.sprite,
    } as RenderableComponent);

    // Add attributes component
    world.addComponent(entityId, {
      type: 'Attributes',
      pwr: props.attributes.pwr,
      mov: props.attributes.mov,
      inf: props.attributes.inf,
      cre: props.attributes.cre,
    } as AttributesComponent);

    // Add direction component (default facing right)
    world.addComponent(entityId, {
      type: 'Direction',
      dx: 1,
      dy: 0,
    } as DirectionComponent);
  }

  /**
   * Create an NPC/enemy entity from job definition
   */
  private static createNPC(
    world: World,
    entityId: number,
    entity: EntityPlacement
  ): void {
    const props = entity.properties;

    // Validate required NPC properties
    if (!props.name || !props.attributes) {
      throw new Error(
        `NPC entity missing required properties: name or attributes`
      );
    }

    // Add renderable component with distinct color (red for enemies)
    world.addComponent(entityId, {
      type: 'Renderable',
      char: props.name[0].toUpperCase(),
      color: '#d32f2f', // Red for enemies/NPCs (distinct from player accent color)
      sprite: props.sprite || '/assets/characters/warrior.png', // Default sprite, can be overridden
    } as RenderableComponent);

    // Add attributes component
    world.addComponent(entityId, {
      type: 'Attributes',
      pwr: props.attributes.pwr,
      mov: props.attributes.mov,
      inf: props.attributes.inf,
      cre: props.attributes.cre,
    } as AttributesComponent);

    // Add stats component with HP (default to 10 if not specified)
    const maxHp = props.maxHp ?? 10;
    world.addComponent(entityId, {
      type: 'Stats',
      hp: maxHp,
      maxHp: maxHp,
      stamina: props.stamina ?? 50,
      maxStamina: props.maxStamina ?? 50,
    } as StatsComponent);

    // Add direction component (default facing right)
    world.addComponent(entityId, {
      type: 'Direction',
      dx: 1,
      dy: 0,
    } as DirectionComponent);

    // Add NPC component to mark this entity as an NPC
    world.addComponent(entityId, {
      type: 'NPC',
    } as NPCComponent);
  }

  /**
   * Create a crate entity from job definition
   */
  private static createCrate(
    world: World,
    entityId: number,
    entity: EntityPlacement
  ): void {
    const props = entity.properties;

    // Validate required crate properties
    if (props.weight === undefined) {
      throw new Error(`Crate entity missing required property: weight`);
    }

    // Add renderable component
    world.addComponent(entityId, {
      type: 'Renderable',
      char: 'C',
      color: '#8B4513', // Brown for crate
      sprite: props.sprite || '/assets/items/crate.png',
    } as RenderableComponent);

    // Add pushable component
    world.addComponent(entityId, {
      type: 'Pushable',
      weight: props.weight,
      sprite: props.sprite || '/assets/items/crate.png',
    } as PushableComponent);
  }
}

