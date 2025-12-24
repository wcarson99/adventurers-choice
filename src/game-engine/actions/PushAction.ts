import { Action, ActionContext, ActionRequirements } from '../../types/Action';
import { AttributesComponent, PositionComponent, DirectionComponent } from '../ecs/Component';
import { ActionExecutionSystem } from '../encounters/ActionExecutionSystem';
import { PushSystem } from '../encounters/PushSystem';
import { ACTION_COSTS } from '../encounters/constants';

/**
 * PushAction represents a push action to push an object
 */
export class PushAction extends Action {
  constructor(public targetId: number) {
    super();
  }

  canExecute(context: ActionContext): boolean {
    const { world, grid, characterId, apSystem } = context;

    // Check attribute requirement: PWR >= 3
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    if (!attrs || attrs.pwr < 3) {
      return false;
    }

    // Check if character can afford the push
    if (!apSystem.canAffordPush(characterId)) {
      return false;
    }

    // Get character's facing direction
    const directionComp = world.getComponent<DirectionComponent>(characterId, 'Direction');
    if (!directionComp) {
      return false;
    }

    const charPos = world.getComponent<PositionComponent>(characterId, 'Position');
    const objPos = world.getComponent<PositionComponent>(this.targetId, 'Position');

    if (!charPos || !objPos) {
      return false;
    }

    // Calculate direction from character to object
    const charToObj = {
      dx: objPos.x - charPos.x,
      dy: objPos.y - charPos.y,
    };

    // Normalize to -1, 0, or 1
    const normalizedCharToObj = {
      dx: charToObj.dx === 0 ? 0 : (charToObj.dx > 0 ? 1 : -1),
      dy: charToObj.dy === 0 ? 0 : (charToObj.dy > 0 ? 1 : -1),
    };

    // Check if character is facing the object
    if (directionComp.dx !== normalizedCharToObj.dx || directionComp.dy !== normalizedCharToObj.dy) {
      return false;
    }

    // Use the character's facing direction as the push direction
    const pushDirection = {
      dx: directionComp.dx,
      dy: directionComp.dy,
    };

    // Validate that this push is actually possible
    const pushSystem = new PushSystem();
    const canPushResult = pushSystem.canPush(
      world,
      grid,
      characterId,
      this.targetId,
      pushDirection
    );

    return canPushResult.canPush;
  }

  execute(context: ActionContext) {
    const { world, grid, characterId, apSystem } = context;
    const actionExecutionSystem = new ActionExecutionSystem();
    
    return actionExecutionSystem.executePushAction(
      world,
      grid,
      characterId,
      this.targetId,
      apSystem
    );
  }

  getCost(): number {
    return ACTION_COSTS.PUSH;
  }

  getName(): string {
    return 'Push';
  }

  getRequirements(): ActionRequirements {
    return { attributes: { pwr: 3 } };
  }
}

