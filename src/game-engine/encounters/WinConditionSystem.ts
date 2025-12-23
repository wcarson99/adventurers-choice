import { World } from '../ecs/World';
import { PositionComponent } from '../ecs/Component';
import { Grid } from '../grid/Grid';

/**
 * WinConditionSystem centralizes all win condition checks
 * 
 * The win condition is met when all player characters are in the exit zone.
 * This system provides a single method to check this condition, removing
 * duplicate checks from various parts of the codebase.
 */
export class WinConditionSystem {
  /**
   * Check if the win condition is met
   * 
   * @param world - The ECS world containing all entities
   * @param grid - The grid containing exit zone information
   * @param getPlayerCharacters - Function that returns array of player character entity IDs
   * @returns true if all player characters are in the exit zone, false otherwise
   */
  checkWinCondition(
    world: World,
    grid: Grid,
    getPlayerCharacters: () => number[]
  ): boolean {
    const allCharacters = getPlayerCharacters();
    
    // Check if all characters are in the exit zone
    // Using && pattern to match original behavior exactly
    const allInExit = allCharacters.every(charId => {
      const pos = world.getComponent<PositionComponent>(charId, 'Position');
      return pos && grid.isExitZone(pos.x, pos.y);
    });
    
    return allInExit;
  }
}

