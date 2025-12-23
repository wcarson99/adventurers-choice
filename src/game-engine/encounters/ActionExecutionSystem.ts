import { World } from '../ecs/World';
import { Grid } from '../grid/Grid';
import { PositionComponent } from '../ecs/Component';
import { MovementSystem } from './MovementSystem';
import { PushSystem } from './PushSystem';
import { PlannedAction } from './EncounterStateManager';
import { WinConditionSystem } from './WinConditionSystem';

export interface ActionExecutionResult {
  success: boolean;
  action: PlannedAction;
  error?: string;
}

export interface ExecutionSummary {
  results: ActionExecutionResult[];
  winConditionMet: boolean;
}

/**
 * ActionExecutionSystem executes planned actions (movement, push, wait)
 * 
 * This system extracts action execution logic from the UI layer,
 * providing a clean API for executing planned actions and handling
 * validation and errors.
 */
export class ActionExecutionSystem {
  private movementSystem: MovementSystem;
  private pushSystem: PushSystem;
  private winConditionSystem: WinConditionSystem;

  constructor() {
    this.movementSystem = new MovementSystem();
    this.pushSystem = new PushSystem();
    this.winConditionSystem = new WinConditionSystem();
  }

  /**
   * Execute all planned actions
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param plannedActions - Array of planned actions to execute
   * @param getPlayerCharacters - Function to get player character IDs for win condition check
   * @returns Execution summary with results and win condition status
   */
  executeActions(
    world: World,
    grid: Grid,
    plannedActions: PlannedAction[],
    getPlayerCharacters: () => number[]
  ): ExecutionSummary {
    const results: ActionExecutionResult[] = [];

    // Execute each planned action
    for (const plannedAction of plannedActions) {
      const result = this.executeAction(world, grid, plannedAction);
      results.push(result);
    }

    // Check win condition after all actions are executed
    const winConditionMet = this.winConditionSystem.checkWinCondition(
      world,
      grid,
      getPlayerCharacters
    );

    return {
      results,
      winConditionMet,
    };
  }

  /**
   * Execute a single planned action
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param plannedAction - The action to execute
   * @returns Execution result
   */
  executeAction(
    world: World,
    grid: Grid,
    plannedAction: PlannedAction
  ): ActionExecutionResult {
    if (plannedAction.action === 'Push' && plannedAction.targetId) {
      return this.executePushAction(world, grid, plannedAction);
    } else if (plannedAction.action === 'Wait') {
      return this.executeWaitAction(plannedAction);
    } else {
      return {
        success: false,
        action: plannedAction,
        error: `Unknown action: ${plannedAction.action}`,
      };
    }
  }

  /**
   * Execute a Push action
   */
  private executePushAction(
    world: World,
    grid: Grid,
    plannedAction: PlannedAction
  ): ActionExecutionResult {
    if (!plannedAction.targetId) {
      return {
        success: false,
        action: plannedAction,
        error: 'Push action requires targetId',
      };
    }

    // Get valid push directions for this character and object
    const pushActions = this.pushSystem.getValidPushActions(
      world,
      grid,
      plannedAction.characterId,
      plannedAction.targetId
    );

    if (pushActions.length === 0) {
      return {
        success: false,
        action: plannedAction,
        error: 'No valid push directions',
      };
    }

    // Find the direction that makes sense based on character position
    // Character should be behind the object in the push direction
    const charPos = world.getComponent<PositionComponent>(plannedAction.characterId, 'Position');
    const objPos = world.getComponent<PositionComponent>(plannedAction.targetId, 'Position');

    let pushDirection = pushActions[0].direction; // Default to first

    if (charPos && objPos) {
      // Calculate direction from character to object
      const charToObj = {
        dx: objPos.x - charPos.x,
        dy: objPos.y - charPos.y,
      };

      // Find push direction that matches (character behind object)
      const matchingDirection = pushActions.find(pa =>
        pa.direction.dx === charToObj.dx && pa.direction.dy === charToObj.dy
      );

      if (matchingDirection) {
        pushDirection = matchingDirection.direction;
      }
    }

    // Get object's current position BEFORE pushing (copy the values, not the reference)
    const objPosComponent = world.getComponent<PositionComponent>(plannedAction.targetId, 'Position');
    if (!objPosComponent) {
      return {
        success: false,
        action: plannedAction,
        error: 'Object has no position',
      };
    }

    // Copy the position values (before they get modified by pushObject)
    const objOldPosition = { x: objPosComponent.x, y: objPosComponent.y };

    // Push the object (this modifies objPosComponent)
    this.pushSystem.pushObject(world, plannedAction.targetId, pushDirection);

    // Move character to object's old position (using the copied values)
    this.movementSystem.moveCharacter(world, plannedAction.characterId, objOldPosition);

    return {
      success: true,
      action: plannedAction,
    };
  }

  /**
   * Execute a Wait action (does nothing)
   */
  private executeWaitAction(plannedAction: PlannedAction): ActionExecutionResult {
    return {
      success: true,
      action: plannedAction,
    };
  }
}

