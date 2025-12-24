import { Action, ActionContext, ActionRequirements } from '../../types/Action';
import { ActionExecutionSystem } from '../encounters/ActionExecutionSystem';
import { ACTION_COSTS } from '../encounters/constants';

/**
 * TurnAction represents a turn action to change facing direction
 */
export class TurnAction extends Action {
  constructor(public direction: { dx: number; dy: number }) {
    super();
  }

  canExecute(context: ActionContext): boolean {
    const { characterId, apSystem } = context;

    // Check if character can afford the turn
    if (!apSystem.canAffordTurn(characterId)) {
      return false;
    }

    // Validate direction (must be -1, 0, or 1 for each component, at least one non-zero)
    if ((this.direction.dx !== -1 && this.direction.dx !== 0 && this.direction.dx !== 1) ||
        (this.direction.dy !== -1 && this.direction.dy !== 0 && this.direction.dy !== 1) ||
        (this.direction.dx === 0 && this.direction.dy === 0)) {
      return false;
    }

    return true;
  }

  execute(context: ActionContext) {
    const { world, characterId, apSystem } = context;
    const actionExecutionSystem = new ActionExecutionSystem();
    
    return actionExecutionSystem.executeTurnAction(
      world,
      characterId,
      this.direction,
      apSystem
    );
  }

  getCost(): number {
    return ACTION_COSTS.TURN;
  }

  getName(): string {
    return 'Turn';
  }

  getRequirements(): ActionRequirements {
    return {}; // No attribute requirements
  }
}

