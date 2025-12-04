import { World } from '../ecs/World';
import { Grid, GridPosition } from '../grid/Grid';
import { PositionComponent, AttributesComponent, PushableComponent } from '../ecs/Component';

/**
 * PushSystem handles STR-based pushing mechanics
 * Requirements:
 * - Character must have STR ≥ 3
 * - Character must be adjacent to object (on side opposite push direction)
 * - Object weight ≤ STR × 20
 * - Target square must be empty
 * - Character must have enough stamina
 */
export class PushSystem {
  /**
   * Check if a character can push an object
   */
  canPush(
    world: World,
    grid: Grid,
    characterId: number,
    objectId: number,
    direction: { dx: number; dy: number }
  ): { canPush: boolean; reason?: string; staminaCost?: number } {
    const charAttrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    const charPos = world.getComponent<PositionComponent>(characterId, 'Position');
    const objPos = world.getComponent<PositionComponent>(objectId, 'Position');
    const pushable = world.getComponent<PushableComponent>(objectId, 'Pushable');

    if (!charAttrs || !charPos || !objPos || !pushable) {
      return { canPush: false, reason: 'Missing components' };
    }

    // Check STR requirement
    if (charAttrs.str < 3) {
      return { canPush: false, reason: 'STR 3+ required to push' };
    }

    // Check weight limit
    const maxWeight = charAttrs.str * 20;
    if (pushable.weight > maxWeight) {
      return { canPush: false, reason: `Object too heavy (${pushable.weight} lb > ${maxWeight} lb max)` };
    }

    // Check if character is adjacent to object
    const distance = grid.getDistance(charPos, objPos);
    if (distance !== 1) {
      return { canPush: false, reason: 'Character must be adjacent to object' };
    }

    // Check if character is on the correct side (opposite of push direction)
    const charToObj = {
      dx: objPos.x - charPos.x,
      dy: objPos.y - charPos.y
    };
    
    // Character should be behind the object (opposite of push direction)
    if (charToObj.dx !== -direction.dx || charToObj.dy !== -direction.dy) {
      return { canPush: false, reason: 'Character must be behind object (opposite push direction)' };
    }

    // Calculate target position
    const targetPos: GridPosition = {
      x: objPos.x + direction.dx,
      y: objPos.y + direction.dy
    };

    // Check if target is valid
    if (!grid.isValid(targetPos.x, targetPos.y)) {
      return { canPush: false, reason: 'Target position is out of bounds' };
    }

    // Check if target is a wall
    if (grid.isWall(targetPos.x, targetPos.y)) {
      return { canPush: false, reason: 'Cannot push into wall' };
    }

    // Check if target is occupied
    if (this.isOccupied(world, targetPos.x, targetPos.y, objectId)) {
      return { canPush: false, reason: 'Target position is occupied' };
    }

    // Calculate stamina cost
    const staminaCost = Math.max(1, Math.ceil(pushable.weight / charAttrs.str));

    // TODO: Check if character has enough stamina (need StaminaComponent)
    // For now, we'll skip this check

    return { canPush: true, staminaCost };
  }

  /**
   * Push an object in a direction
   */
  pushObject(
    world: World,
    objectId: number,
    direction: { dx: number; dy: number }
  ): boolean {
    const objPos = world.getComponent<PositionComponent>(objectId, 'Position');
    if (!objPos) return false;

    // Move object 1 square in the push direction
    objPos.x += direction.dx;
    objPos.y += direction.dy;
    return true;
  }

  /**
   * Get valid push directions for an object (all 4 directions)
   */
  getPushDirections(): Array<{ dx: number; dy: number; name: string }> {
    return [
      { dx: 0, dy: -1, name: 'Up' },
      { dx: 0, dy: 1, name: 'Down' },
      { dx: -1, dy: 0, name: 'Left' },
      { dx: 1, dy: 0, name: 'Right' }
    ];
  }

  /**
   * Get valid push actions for a character adjacent to an object
   */
  getValidPushActions(
    world: World,
    grid: Grid,
    characterId: number,
    objectId: number
  ): Array<{ direction: { dx: number; dy: number }; staminaCost: number }> {
    const validPushes: Array<{ direction: { dx: number; dy: number }; staminaCost: number }> = [];
    const directions = this.getPushDirections();

    for (const dir of directions) {
      const result = this.canPush(world, grid, characterId, objectId, dir);
      if (result.canPush && result.staminaCost) {
        validPushes.push({ direction: dir, staminaCost: result.staminaCost });
      }
    }

    return validPushes;
  }

  /**
   * Check if a position is occupied by another entity
   */
  private isOccupied(world: World, x: number, y: number, excludeId: number): boolean {
    const entities = world.getAllEntities();
    
    for (const entityId of entities) {
      if (entityId === excludeId) continue;
      
      const pos = world.getComponent<PositionComponent>(entityId, 'Position');
      if (pos && pos.x === x && pos.y === y) {
        return true;
      }
    }
    
    return false;
  }
}

