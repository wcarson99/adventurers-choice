import { PlannedPath } from './PlannedPath';
import { GridPosition } from '../grid/Grid';
import { World } from '../ecs/World';
import { PositionComponent, AttributesComponent } from '../ecs/Component';

/**
 * Tracks which squares are occupied at each step across all planned paths
 */
export class OccupancyMap {
  /**
   * Calculate which squares are occupied at a specific step
   * @param stepIndex - The step index (0 = before any movement, 1 = after first step, etc.)
   * @param allPaths - All planned paths
   * @param world - ECS world to get current positions
   * @returns Map of position to character ID that occupies it
   */
  static calculateOccupancyAtStep(
    stepIndex: number,
    allPaths: PlannedPath[],
    world: World
  ): Map<string, number> {
    const occupancy = new Map<string, number>();
    
    // Helper to create position key
    const posKey = (x: number, y: number) => `${x},${y}`;
    
    // For each character with a path
    allPaths.forEach(path => {
      if (stepIndex === 0) {
        // Step 0: Before any movement, use current position
        const pos = world.getComponent<PositionComponent>(path.characterId, 'Position');
        if (pos) {
          occupancy.set(posKey(pos.x, pos.y), path.characterId);
        }
      } else {
        // Step N: After N steps have been executed
        // Character would be at step N-1 in their path (0-indexed)
        if (path.steps.length >= stepIndex) {
          // Character has this many steps, so at step N they're at steps[stepIndex-1]
          const stepPos = path.steps[stepIndex - 1];
          occupancy.set(posKey(stepPos.x, stepPos.y), path.characterId);
        } else if (path.steps.length > 0) {
          // Character's path is shorter than stepIndex, they've completed their path
          // They stay at their final destination
          const finalPos = path.steps[path.steps.length - 1];
          occupancy.set(posKey(finalPos.x, finalPos.y), path.characterId);
        } else {
          // No path planned, use current position
          const pos = world.getComponent<PositionComponent>(path.characterId, 'Position');
          if (pos) {
            occupancy.set(posKey(pos.x, pos.y), path.characterId);
          }
        }
      }
    });
    
    // Also include characters without paths (they stay in place)
    const allEntities = world.getAllEntities();
    allEntities.forEach(entityId => {
      const attrs = world.getComponent<AttributesComponent>(entityId, 'Attributes');
      if (!attrs) return; // Only check characters
      
      // Check if this character has a path
      const hasPath = allPaths.some(p => p.characterId === entityId);
      if (!hasPath) {
        // Character has no path, they stay at current position
        const pos = world.getComponent<PositionComponent>(entityId, 'Position');
        if (pos) {
          const key = posKey(pos.x, pos.y);
          // Only add if not already occupied by a character with a path
          if (!occupancy.has(key)) {
            occupancy.set(key, entityId);
          }
        }
      }
    });
    
    return occupancy;
  }
  
  /**
   * Check if a position is occupied at a specific step
   */
  static isOccupiedAtStep(
    stepIndex: number,
    position: GridPosition,
    allPaths: PlannedPath[],
    world: World,
    excludeCharacterId?: number
  ): boolean {
    const occupancy = OccupancyMap.calculateOccupancyAtStep(stepIndex, allPaths, world);
    const posKey = `${position.x},${position.y}`;
    const occupantId = occupancy.get(posKey);
    
    if (occupantId === undefined) {
      return false;
    }
    
    // If we're excluding a character, don't count them as occupying
    if (excludeCharacterId && occupantId === excludeCharacterId) {
      return false;
    }
    
    return true;
  }
}

