import { Action, ActionContext, ActionRequirements } from '../../types/Action';
import { ActionExecutionSystem } from '../encounters/ActionExecutionSystem';
import { ACTION_COSTS } from '../encounters/constants';

/**
 * PassAction represents a pass action to end the character's turn
 */
export class PassAction extends Action {
  canExecute(context: ActionContext): boolean {
    const { characterId, turnSystem } = context;

    // Check if it's this character's turn
    const currentActive = turnSystem.getCurrentActiveCharacter();
    return currentActive === characterId;
  }

  execute(context: ActionContext) {
    const { characterId, turnSystem, apSystem } = context;
    const actionExecutionSystem = new ActionExecutionSystem();
    
    return actionExecutionSystem.executePassAction(
      characterId,
      turnSystem,
      apSystem
    );
  }

  getCost(): number {
    return ACTION_COSTS.PASS;
  }

  getName(): string {
    return 'Pass';
  }

  getRequirements(): ActionRequirements {
    return {}; // No attribute requirements
  }
}

