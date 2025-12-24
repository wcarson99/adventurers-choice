import { Action, ActionContext, ActionRequirements } from '../../types/Action';
import { PositionComponent } from '../ecs/Component';
import { ActionExecutionSystem } from '../encounters/ActionExecutionSystem';
import { ACTION_COSTS } from '../encounters/constants';

/**
 * MoveAction represents a movement action to a target position
 */
export class MoveAction extends Action {
  constructor(public targetPos: { x: number; y: number }) {
    super();
  }

  canExecute(context: ActionContext): boolean {
    const { world, grid, characterId, apSystem } = context;

    // Check if character can afford the move
    if (!apSystem.canAffordMove(characterId)) {
      return false;
    }

    // Validate move (check if position is valid and reachable)
    const charPos = world.getComponent<PositionComponent>(characterId, 'Position');
    if (!charPos) {
      return false;
    }

    // Check if target position is valid
    if (!grid.isValid(this.targetPos.x, this.targetPos.y)) {
      return false;
    }

    // Check if target is a wall
    if (grid.isWall(this.targetPos.x, this.targetPos.y)) {
      return false;
    }

    // Check if target is occupied
    const entities = world.getAllEntities();
    for (const entityId of entities) {
      if (entityId === characterId) continue;
      const pos = world.getComponent<PositionComponent>(entityId, 'Position');
      if (pos && pos.x === this.targetPos.x && pos.y === this.targetPos.y) {
        return false;
      }
    }

    return true;
  }

  execute(context: ActionContext) {
    const { world, grid, characterId, apSystem } = context;
    const actionExecutionSystem = new ActionExecutionSystem();
    
    return actionExecutionSystem.executeMoveAction(
      world,
      grid,
      characterId,
      this.targetPos,
      apSystem
    );
  }

  getCost(): number {
    return ACTION_COSTS.MOVE;
  }

  getName(): string {
    return 'Move';
  }

  getRequirements(): ActionRequirements {
    return {}; // No attribute requirements
  }
}

