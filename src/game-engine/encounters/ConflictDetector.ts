import { PlannedPath } from './PlannedPath';
import { GridPosition } from '../grid/Grid';
import { World } from '../ecs/World';
import { OccupancyMap } from './OccupancyMap';

/**
 * Detects conflicts in planned paths
 */
export class ConflictDetector {
  /**
   * Check if adding a step to a character's path would cause a conflict
   * @param characterId - Character planning the step
   * @param stepPosition - Position of the step to add
   * @param allPaths - All currently planned paths
   * @param world - ECS world
   * @returns Conflict info if conflict exists, null otherwise
   */
  static checkStepConflict(
    characterId: number,
    stepPosition: GridPosition,
    allPaths: PlannedPath[],
    world: World
  ): { type: 'occupancy' | 'swap'; conflictingCharacterId: number; stepIndex: number } | null {
    // Get the character's current path
    const characterPath = allPaths.find(p => p.characterId === characterId);
    const stepIndex = characterPath ? characterPath.steps.length + 1 : 1; // Step index if we add this step
    
    // Create a temporary path with the new step to check conflicts
    let tempPaths: PlannedPath[];
    if (characterPath) {
      // Character has an existing path, add the new step
      tempPaths = allPaths.map(p => {
        if (p.characterId === characterId) {
          return {
            ...p,
            steps: [...p.steps, stepPosition]
          };
        }
        return p;
      });
    } else {
      // Character doesn't have a path yet, create a new one with this step
      const newPath: PlannedPath = {
        characterId,
        steps: [stepPosition],
        currentStepIndex: 0,
        status: 'ready'
      };
      tempPaths = [...allPaths, newPath];
    }
    
    // Check occupancy at this step with the temporary path included
    const isOccupied = OccupancyMap.isOccupiedAtStep(
      stepIndex,
      stepPosition,
      tempPaths,
      world,
      characterId
    );
    
    if (isOccupied) {
      // Find which character occupies this position at this step
      const occupancy = OccupancyMap.calculateOccupancyAtStep(stepIndex, tempPaths, world);
      const posKey = `${stepPosition.x},${stepPosition.y}`;
      const conflictingCharacterId = occupancy.get(posKey);
      
      if (conflictingCharacterId !== undefined) {
        // Check if this is a swap (characters trying to pass through each other)
        const conflictingPath = tempPaths.find(p => p.characterId === conflictingCharacterId);
        const characterCurrentPos = world.getComponent<any>(characterId, 'Position');
        
        if (conflictingPath && characterCurrentPos) {
          // Check if conflicting character is at this character's current position at this step
          if (conflictingPath.steps.length >= stepIndex) {
            const conflictingStepPos = conflictingPath.steps[stepIndex - 1];
            if (conflictingStepPos.x === characterCurrentPos.x && 
                conflictingStepPos.y === characterCurrentPos.y) {
              return {
                type: 'swap',
                conflictingCharacterId,
                stepIndex
              };
            }
          }
        }
        
        return {
          type: 'occupancy',
          conflictingCharacterId,
          stepIndex
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check if there are any conflicts in all planned paths
   */
  static hasAnyConflict(
    allPaths: PlannedPath[],
    world: World
  ): boolean {
    // Check each path for conflicts
    for (const path of allPaths) {
      for (let i = 0; i < path.steps.length; i++) {
        const stepIndex = i + 1; // Step index (1-based)
        const stepPos = path.steps[i];
        
        const isOccupied = OccupancyMap.isOccupiedAtStep(
          stepIndex,
          stepPos,
          allPaths,
          world,
          path.characterId
        );
        
        if (isOccupied) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get all conflicts in planned paths
   */
  static getAllConflicts(
    allPaths: PlannedPath[],
    world: World
  ): Array<{ characterId: number; stepIndex: number; conflictType: 'occupancy' | 'swap'; conflictingCharacterId: number }> {
    const conflicts: Array<{ characterId: number; stepIndex: number; conflictType: 'occupancy' | 'swap'; conflictingCharacterId: number }> = [];
    
    for (const path of allPaths) {
      for (let i = 0; i < path.steps.length; i++) {
        const stepIndex = i + 1;
        const stepPos = path.steps[i];
        
        const conflict = ConflictDetector.checkStepConflict(
          path.characterId,
          stepPos,
          allPaths,
          world
        );
        
        if (conflict) {
          conflicts.push({
            characterId: path.characterId,
            stepIndex,
            conflictType: conflict.type,
            conflictingCharacterId: conflict.conflictingCharacterId
          });
        }
      }
    }
    
    return conflicts;
  }
}

