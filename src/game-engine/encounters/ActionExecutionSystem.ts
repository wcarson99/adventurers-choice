import { World } from '../ecs/World';
import { Grid } from '../grid/Grid';
import { PositionComponent, DirectionComponent, AttributesComponent, StatsComponent } from '../ecs/Component';
import { MovementSystem } from './MovementSystem';
import { PushSystem } from './PushSystem';
import { PlannedAction } from './EncounterStateManager';
import { WinConditionSystem } from './WinConditionSystem';
import { ActionPointSystem } from './ActionPointSystem';
import { TurnSystem } from './TurnSystem';
import { ACTION_COSTS } from './constants';
import { Action, ActionContext } from '../../types/Action';

export interface ActionExecutionResult {
  success: boolean;
  action: PlannedAction | { characterId: number; action: string; targetId?: number; targetPos?: { x: number; y: number } };
  error?: string;
  apRemaining?: number;
}

export interface ExecutionSummary {
  results: ActionExecutionResult[];
  winConditionMet: boolean;
}

/**
 * ActionExecutionSystem executes actions immediately with AP deduction
 * 
 * This system provides immediate action execution (not batched) and handles
 * AP deduction for each action. Actions execute immediately when called.
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
   * Execute an action using the Action class instance
   * 
   * @param action - The action instance to execute
   * @param context - The action context
   * @returns Execution result with success status and remaining AP
   */
  executeActionInstance(action: Action, context: ActionContext): ActionExecutionResult {
    return action.execute(context);
  }

  /**
   * Execute a move action immediately
   * Deducts 15 AP from the character
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param characterId - The character ID
   * @param targetPos - Target position {x, y}
   * @param apSystem - ActionPointSystem to deduct AP
   * @returns Execution result with success status and remaining AP
   */
  executeMoveAction(
    world: World,
    grid: Grid,
    characterId: number,
    targetPos: { x: number; y: number },
    apSystem: ActionPointSystem
  ): ActionExecutionResult {
    // Check if character can afford the move
    if (!apSystem.canAffordMove(characterId)) {
      return {
        success: false,
        action: { characterId, action: 'Move', targetPos },
        error: 'Insufficient AP to move',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Validate move (check if position is valid and reachable)
    const charPos = world.getComponent<PositionComponent>(characterId, 'Position');
    if (!charPos) {
      return {
        success: false,
        action: { characterId, action: 'Move', targetPos },
        error: 'Character has no position',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if target position is valid
    if (!grid.isValid(targetPos.x, targetPos.y)) {
      return {
        success: false,
        action: { characterId, action: 'Move', targetPos },
        error: 'Invalid target position',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if target is a wall
    if (grid.isWall(targetPos.x, targetPos.y)) {
      return {
        success: false,
        action: { characterId, action: 'Move', targetPos },
        error: 'Cannot move into wall',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if target is occupied
    const entities = world.getAllEntities();
    for (const entityId of entities) {
      if (entityId === characterId) continue;
      const pos = world.getComponent<PositionComponent>(entityId, 'Position');
      if (pos && pos.x === targetPos.x && pos.y === targetPos.y) {
        return {
          success: false,
          action: { characterId, action: 'Move', targetPos },
          error: 'Target position is occupied',
          apRemaining: apSystem.getAP(characterId),
        };
      }
    }

    // Calculate direction of movement
    const dx = targetPos.x - charPos.x;
    const dy = targetPos.y - charPos.y;
    
    // Normalize direction to -1, 0, or 1
    const normalizedDx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
    const normalizedDy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

    // Execute move
    const moveSuccess = this.movementSystem.moveCharacter(world, characterId, targetPos);
    if (!moveSuccess) {
      return {
        success: false,
        action: { characterId, action: 'Move', targetPos },
        error: 'Failed to move character',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Update character's facing direction to match movement direction
    let directionComp = world.getComponent<DirectionComponent>(characterId, 'Direction');
    if (!directionComp) {
      // Create new direction component if it doesn't exist
      directionComp = {
        type: 'Direction',
        dx: normalizedDx,
        dy: normalizedDy,
      };
      world.addComponent(characterId, directionComp);
    } else {
      // Update existing direction component
      directionComp.dx = normalizedDx;
      directionComp.dy = normalizedDy;
    }

    // Deduct AP
    const remainingAP = apSystem.deductAP(characterId, ACTION_COSTS.MOVE);

    return {
      success: true,
      action: { characterId, action: 'Move', targetPos },
      apRemaining: remainingAP,
    };
  }

  /**
   * Execute a push action immediately
   * Deducts 25 AP from the character
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param characterId - The character ID
   * @param targetId - The object/entity to push
   * @param apSystem - ActionPointSystem to deduct AP
   * @returns Execution result with success status and remaining AP
   */
  executePushAction(
    world: World,
    grid: Grid,
    characterId: number,
    targetId: number,
    apSystem: ActionPointSystem
  ): ActionExecutionResult {
    // Check if character can afford the push
    if (!apSystem.canAffordPush(characterId)) {
      return {
        success: false,
        action: { characterId, action: 'Push', targetId },
        error: 'Insufficient AP to push',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Get character's facing direction
    const directionComp = world.getComponent<DirectionComponent>(characterId, 'Direction');
    if (!directionComp) {
      return {
        success: false,
        action: { characterId, action: 'Push', targetId },
        error: 'Character has no facing direction',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    const charPos = world.getComponent<PositionComponent>(characterId, 'Position');
    const objPos = world.getComponent<PositionComponent>(targetId, 'Position');

    if (!charPos || !objPos) {
      return {
        success: false,
        action: { characterId, action: 'Push', targetId },
        error: 'Character or object has no position',
        apRemaining: apSystem.getAP(characterId),
      };
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
      return {
        success: false,
        action: { characterId, action: 'Push', targetId },
        error: 'Character must be facing the object to push',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Use the character's facing direction as the push direction
    const pushDirection = {
      dx: directionComp.dx,
      dy: directionComp.dy,
    };

    // Validate that this push is actually possible
    const canPushResult = this.pushSystem.canPush(
      world,
      grid,
      characterId,
      targetId,
      pushDirection
    );

    if (!canPushResult.canPush) {
      return {
        success: false,
        action: { characterId, action: 'Push', targetId },
        error: canPushResult.reason || 'Cannot push in this direction',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Get object's current position BEFORE pushing (copy the values, not the reference)
    const objPosComponent = world.getComponent<PositionComponent>(targetId, 'Position');
    if (!objPosComponent) {
      return {
        success: false,
        action: { characterId, action: 'Push', targetId },
        error: 'Object has no position',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Copy the position values (before they get modified by pushObject)
    const objOldPosition = { x: objPosComponent.x, y: objPosComponent.y };

    // Push the object (this modifies objPosComponent)
    this.pushSystem.pushObject(world, targetId, pushDirection);

    // Move character to object's old position (using the copied values)
    this.movementSystem.moveCharacter(world, characterId, objOldPosition);

    // Deduct AP
    const remainingAP = apSystem.deductAP(characterId, ACTION_COSTS.PUSH);

    return {
      success: true,
      action: { characterId, action: 'Push', targetId },
      apRemaining: remainingAP,
    };
  }

  /**
   * Execute an attack action immediately
   * Deducts 20 AP from the attacker and deals PWR-based damage to the target
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param characterId - The attacker character ID
   * @param targetId - The target entity ID to attack
   * @param apSystem - ActionPointSystem to deduct AP
   * @returns Execution result with success status and remaining AP
   */
  executeAttackAction(
    world: World,
    grid: Grid,
    characterId: number,
    targetId: number,
    apSystem: ActionPointSystem
  ): ActionExecutionResult {
    // Check if character can afford the attack
    if (!apSystem.canAffordAction(characterId, ACTION_COSTS.ATTACK)) {
      return {
        success: false,
        action: { characterId, action: 'Attack', targetId },
        error: 'Insufficient AP to attack',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if attacker has position and attributes
    const attackerPos = world.getComponent<PositionComponent>(characterId, 'Position');
    const attackerAttrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    if (!attackerPos || !attackerAttrs) {
      return {
        success: false,
        action: { characterId, action: 'Attack', targetId },
        error: 'Attacker missing position or attributes',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if target exists and has position and stats
    const targetPos = world.getComponent<PositionComponent>(targetId, 'Position');
    const targetStats = world.getComponent<StatsComponent>(targetId, 'Stats');
    if (!targetPos || !targetStats) {
      return {
        success: false,
        action: { characterId, action: 'Attack', targetId },
        error: 'Target missing position or stats',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if target is adjacent (Manhattan distance = 1)
    const distance = grid.getDistance(attackerPos, targetPos);
    if (distance !== 1) {
      return {
        success: false,
        action: { characterId, action: 'Attack', targetId },
        error: 'Target is not adjacent',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if target is still alive
    if (targetStats.hp <= 0) {
      return {
        success: false,
        action: { characterId, action: 'Attack', targetId },
        error: 'Target is already defeated',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Calculate damage based on attacker's PWR
    const damage = attackerAttrs.pwr;

    // Apply damage to target (reduce HP, but don't go below 0)
    targetStats.hp = Math.max(0, targetStats.hp - damage);

    // Deduct AP from attacker
    const remainingAP = apSystem.deductAP(characterId, ACTION_COSTS.ATTACK);

    return {
      success: true,
      action: { characterId, action: 'Attack', targetId },
      apRemaining: remainingAP,
    };
  }

  /**
   * Execute a turn action immediately
   * Changes the character's facing direction
   * Deducts 5 AP from the character
   * 
   * @param world - The ECS world
   * @param characterId - The character ID
   * @param direction - Direction {dx, dy} to face (-1, 0, or 1 for each component)
   * @param apSystem - ActionPointSystem to deduct AP
   * @returns Execution result with success status and remaining AP
   */
  executeTurnAction(
    world: World,
    characterId: number,
    direction: { dx: number; dy: number },
    apSystem: ActionPointSystem
  ): ActionExecutionResult {
    // Validate direction (must be -1, 0, or 1 for each component, and at least one must be non-zero)
    if ((direction.dx !== -1 && direction.dx !== 0 && direction.dx !== 1) ||
        (direction.dy !== -1 && direction.dy !== 0 && direction.dy !== 1) ||
        (direction.dx === 0 && direction.dy === 0)) {
      return {
        success: false,
        action: { characterId, action: 'Turn' },
        error: 'Invalid direction (must be -1, 0, or 1 for dx/dy, at least one non-zero)',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Check if character can afford the turn
    if (!apSystem.canAffordTurn(characterId)) {
      return {
        success: false,
        action: { characterId, action: 'Turn' },
        error: 'Insufficient AP to turn',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Get or create direction component
    let directionComp = world.getComponent<DirectionComponent>(characterId, 'Direction');
    if (!directionComp) {
      // Create new direction component (default to facing right)
      directionComp = {
        type: 'Direction',
        dx: 1,
        dy: 0,
      };
      world.addComponent(characterId, directionComp);
    }

    // Update direction
    directionComp.dx = direction.dx;
    directionComp.dy = direction.dy;

    // Deduct AP
    const remainingAP = apSystem.deductAP(characterId, ACTION_COSTS.TURN);

    return {
      success: true,
      action: { characterId, action: 'Turn' },
      apRemaining: remainingAP,
    };
  }

  /**
   * Execute a pass action
   * Ends the character's turn and resets their AP to 50
   * 
   * @param characterId - The character ID
   * @param turnSystem - TurnSystem to advance turn
   * @param apSystem - ActionPointSystem to reset AP
   * @returns Execution result with success status
   */
  executePassAction(
    characterId: number,
    turnSystem: TurnSystem,
    apSystem: ActionPointSystem
  ): ActionExecutionResult {
    // Verify this is the current active character
    const currentActive = turnSystem.getCurrentActiveCharacter();
    if (currentActive !== characterId) {
      return {
        success: false,
        action: { characterId, action: 'Pass' },
        error: 'Not this character\'s turn',
        apRemaining: apSystem.getAP(characterId),
      };
    }

    // Reset AP for this character (they'll get 50 AP at start of next turn)
    apSystem.resetAP(characterId);

    // Pass the turn (this will advance to next character or complete round)
    turnSystem.passTurn();

    return {
      success: true,
      action: { characterId, action: 'Pass' },
      apRemaining: 0, // AP is reset, but they'll have 50 at start of next turn
    };
  }

  /**
   * Execute all planned actions (batched execution)
   * 
   * @deprecated Use immediate execution methods (executeMoveAction, executePushAction) instead.
   * This method is kept for backward compatibility during the transition.
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
   * @deprecated Use immediate execution methods instead.
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
      // For backward compatibility, execute push without AP system
      // This will be removed once all code uses immediate execution
      return this.executePushActionLegacy(world, grid, plannedAction);
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
   * Execute a Push action (legacy method without AP)
   * @deprecated Use executePushAction with AP system instead
   */
  private executePushActionLegacy(
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

  /**
   * Check win condition
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param getPlayerCharacters - Function to get player character IDs
   * @returns True if win condition is met
   */
  checkWinCondition(
    world: World,
    grid: Grid,
    getPlayerCharacters: () => number[]
  ): boolean {
    return this.winConditionSystem.checkWinCondition(world, grid, getPlayerCharacters);
  }
}
