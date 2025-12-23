import { World } from '../ecs/World';
import { Grid } from '../grid/Grid';
import { TurnSystem } from './TurnSystem';
import { EncounterPhaseManager, PlanningPhase } from './EncounterPhaseManager';
import { EncounterStateManager, PlannedAction } from './EncounterStateManager';
import { ActionExecutionSystem, ActionExecutionResult } from './ActionExecutionSystem';
import { WinConditionSystem } from './WinConditionSystem';
import { MovementSystem } from './MovementSystem';
import { PushSystem } from './PushSystem';
import { MovementPlan } from './MovementPlan';
import { ActionPointSystem } from './ActionPointSystem';

/**
 * EncounterController orchestrates all encounter systems and provides a unified interface
 * for managing encounter state, turn order, action execution, and game logic.
 * 
 * In the new action point system:
 * - Characters take turns ordered by MOV
 * - Each character has 50 AP per turn
 * - Actions execute immediately when selected
 * - Phase-based planning is removed
 */
export class EncounterController {
  private turnSystem: TurnSystem;
  private apSystem: ActionPointSystem;
  private phaseManager: EncounterPhaseManager; // @deprecated - kept for backward compatibility
  private stateManager: EncounterStateManager;
  private actionExecutionSystem: ActionExecutionSystem;
  private winConditionSystem: WinConditionSystem;
  private movementSystem: MovementSystem;
  private pushSystem: PushSystem;
  private movementPlan: MovementPlan; // @deprecated - kept for backward compatibility

  constructor() {
    this.turnSystem = new TurnSystem();
    this.apSystem = new ActionPointSystem();
    this.phaseManager = new EncounterPhaseManager();
    this.stateManager = new EncounterStateManager();
    this.actionExecutionSystem = new ActionExecutionSystem();
    this.winConditionSystem = new WinConditionSystem();
    this.movementSystem = new MovementSystem();
    this.pushSystem = new PushSystem();
    this.movementPlan = new MovementPlan();
  }

  // ============================================================================
  // NEW ACTION POINT SYSTEM METHODS
  // ============================================================================

  /**
   * Get the current active character (whose turn it is)
   */
  getCurrentActiveCharacter(): number | null {
    return this.turnSystem.getCurrentActiveCharacter();
  }

  /**
   * Get the current round number
   */
  getCurrentRound(): number {
    return this.turnSystem.getCurrentRound();
  }

  /**
   * Get the character turn order for the current round
   */
  getCharacterTurnOrder(): number[] {
    return this.turnSystem.getCharacterTurnOrder();
  }

  /**
   * Get the current AP for a character
   */
  getCharacterAP(characterId: number): number {
    return this.apSystem.getAP(characterId);
  }

  /**
   * Check if a character can afford an action
   * 
   * @param characterId - The character ID
   * @param actionType - Action type: 'Move', 'Push', or 'Pass'
   * @returns True if character can afford the action
   */
  canAffordAction(characterId: number, actionType: 'Move' | 'Push' | 'Turn' | 'Pass'): boolean {
    switch (actionType) {
      case 'Move':
        return this.apSystem.canAffordMove(characterId);
      case 'Push':
        return this.apSystem.canAffordPush(characterId);
      case 'Turn':
        return this.apSystem.canAffordTurn(characterId);
      case 'Pass':
        return true; // Pass always costs 0 AP
      default:
        return false;
    }
  }

  /**
   * Start a new round by ordering characters by MOV and setting first as active
   * Resets AP for the first character to 50
   * 
   * @param getPlayerCharacters - Function that returns array of player character IDs
   * @param world - The ECS world to access character attributes
   */
  startRound(getPlayerCharacters: () => number[], world: World): void {
    // Order characters by MOV and set turn order
    this.turnSystem.startRound(getPlayerCharacters, world);
    
    // Reset AP for the first active character
    const firstCharacter = this.turnSystem.getCurrentActiveCharacter();
    if (firstCharacter !== null) {
      this.apSystem.resetAP(firstCharacter);
    }
  }

  /**
   * Execute an action immediately
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param actionType - Action type: 'Move', 'Push', or 'Pass'
   * @param characterId - The character ID
   * @param target - Optional target (position for Move, entity ID for Push)
   * @returns Execution result with success status and remaining AP
   */
  executeActionImmediate(
    world: World,
    grid: Grid,
    actionType: 'Move' | 'Push' | 'Turn' | 'Pass',
    characterId: number,
    target?: { x: number; y: number } | number | { dx: number; dy: number }
  ): ActionExecutionResult {
    // Verify this is the current active character's turn
    const currentActive = this.turnSystem.getCurrentActiveCharacter();
    if (currentActive !== characterId) {
      return {
        success: false,
        action: { characterId, action: actionType },
        error: 'Not this character\'s turn',
        apRemaining: this.apSystem.getAP(characterId),
      };
    }

    // Check if character can afford the action
    if (!this.canAffordAction(characterId, actionType)) {
      return {
        success: false,
        action: { characterId, action: actionType },
        error: `Insufficient AP for ${actionType} action`,
        apRemaining: this.apSystem.getAP(characterId),
      };
    }

    // Execute the action
    switch (actionType) {
      case 'Move':
        if (!target || typeof target === 'number' || ('dx' in target && 'dy' in target)) {
          return {
            success: false,
            action: { characterId, action: actionType },
            error: 'Move action requires target position {x, y}',
            apRemaining: this.apSystem.getAP(characterId),
          };
        }
        return this.actionExecutionSystem.executeMoveAction(
          world,
          grid,
          characterId,
          target,
          this.apSystem
        );

      case 'Push':
        if (!target || typeof target !== 'number') {
          return {
            success: false,
            action: { characterId, action: actionType },
            error: 'Push action requires target entity ID',
            apRemaining: this.apSystem.getAP(characterId),
          };
        }
        return this.actionExecutionSystem.executePushAction(
          world,
          grid,
          characterId,
          target,
          this.apSystem
        );

      case 'Turn':
        if (!target || typeof target === 'number' || ('x' in target && 'y' in target)) {
          return {
            success: false,
            action: { characterId, action: actionType },
            error: 'Turn action requires direction {dx, dy}',
            apRemaining: this.apSystem.getAP(characterId),
          };
        }
        return this.actionExecutionSystem.executeTurnAction(
          world,
          characterId,
          target,
          this.apSystem
        );

      case 'Pass':
        // Execute pass action directly
        const passResult = this.actionExecutionSystem.executePassAction(
          characterId,
          this.turnSystem,
          this.apSystem
        );
        
        // If pass succeeded and round not complete, reset AP for next character
        if (passResult.success && !this.turnSystem.isRoundComplete()) {
          const nextCharacter = this.turnSystem.getCurrentActiveCharacter();
          if (nextCharacter !== null) {
            this.apSystem.resetAP(nextCharacter);
          }
        }
        
        return passResult;

      default:
        return {
          success: false,
          action: { characterId, action: actionType },
          error: `Unknown action type: ${actionType}`,
          apRemaining: this.apSystem.getAP(characterId),
        };
    }
  }

  /**
   * Pass the current character's turn
   * Ends their turn and advances to next character or completes the round
   * 
   * @returns True if round was completed, false otherwise
   */
  passTurn(): boolean {
    const currentCharacter = this.turnSystem.getCurrentActiveCharacter();
    if (currentCharacter === null) {
      return false;
    }

    // Execute pass action directly (doesn't need world/grid)
    const result = this.actionExecutionSystem.executePassAction(
      currentCharacter,
      this.turnSystem,
      this.apSystem
    );

    if (!result.success) {
      return false;
    }

    // Check if round completed
    const roundComplete = this.turnSystem.isRoundComplete();
    
    if (roundComplete) {
      // Round completed - caller should call startRound() to begin next round
      return true;
    } else {
      // Advance to next character and reset their AP
      const nextCharacter = this.turnSystem.getCurrentActiveCharacter();
      if (nextCharacter !== null) {
        this.apSystem.resetAP(nextCharacter);
      }
      return false;
    }
  }

  /**
   * Check if the current round is complete
   */
  isRoundComplete(): boolean {
    return this.turnSystem.isRoundComplete();
  }

  // ============================================================================
  // BACKWARD COMPATIBILITY - DEPRECATED METHODS
  // ============================================================================

  /**
   * @deprecated Use getCurrentRound() instead. This method is kept for backward compatibility.
   */
  getCurrentTurn(): number {
    return this.turnSystem.getCurrentTurn();
  }

  /**
   * @deprecated Use startRound() and passTurn() instead. This method is kept for backward compatibility.
   */
  incrementTurn(): void {
    this.turnSystem.incrementTurn();
  }

  /**
   * @deprecated Use reset() instead. This method is kept for backward compatibility.
   */
  resetTurn(): void {
    this.turnSystem.reset();
  }

  // Phase Manager Access (deprecated - phase-based system removed)
  /**
   * @deprecated Phase-based system removed. Use action point system instead.
   */
  getCurrentPhase(): PlanningPhase {
    return this.phaseManager.getCurrentPhase();
  }

  /**
   * @deprecated Phase-based system removed. Use action point system instead.
   */
  transitionToPhase(_newPhase: PlanningPhase): boolean {
    // Deprecated method - phase system removed
    // This method is kept for backward compatibility but does nothing
    return false;
  }

  /**
   * @deprecated Phase-based system removed. Use action point system instead.
   */
  transitionToSkill(): void {
    this.phaseManager.transitionToSkill();
  }

  /**
   * @deprecated Phase-based system removed. Use action point system instead.
   */
  transitionToExecuting(): void {
    this.phaseManager.transitionToExecuting();
  }

  /**
   * @deprecated Phase-based system removed. Use action point system instead.
   */
  resetToMovement(): void {
    this.phaseManager.resetToMovement();
  }

  // State Manager Access (still used for UI state)
  getSelectedCharacter(): number | null {
    return this.stateManager.getSelectedCharacter();
  }

  setSelectedCharacter(characterId: number | null): void {
    this.stateManager.setSelectedCharacter(characterId);
  }

  getSelectedObject(): number | null {
    return this.stateManager.getSelectedObject();
  }

  setSelectedObject(objectId: number | null): void {
    this.stateManager.setSelectedObject(objectId);
  }

  getValidMoves(): Array<{ x: number; y: number }> {
    return this.stateManager.getValidMoves();
  }

  setValidMoves(moves: Array<{ x: number; y: number }>): void {
    this.stateManager.setValidMoves(moves);
  }

  getValidPushDirections(): Array<{ dx: number; dy: number; staminaCost: number }> {
    return this.stateManager.getValidPushDirections();
  }

  setValidPushDirections(directions: Array<{ dx: number; dy: number; staminaCost: number }>): void {
    this.stateManager.setValidPushDirections(directions);
  }

  getPlannedActions(): PlannedAction[] {
    return this.stateManager.getPlannedActions();
  }

  /**
   * @deprecated Planned actions are no longer used. Actions execute immediately.
   */
  setPlannedActions(_actions: PlannedAction[]): void {
    // Deprecated method - planned actions removed
    // This method is kept for backward compatibility but does nothing
  }

  /**
   * @deprecated MovementPlan is no longer used. Actions execute immediately.
   */
  getMovementPlan(): MovementPlan {
    return this.movementPlan;
  }

  // Win Condition System Access
  checkWinCondition(world: World, grid: Grid, getPlayerCharacters: () => number[]): boolean {
    return this.winConditionSystem.checkWinCondition(world, grid, getPlayerCharacters);
  }

  // Action Execution System Access (deprecated - use executeActionImmediate instead)
  /**
   * @deprecated Use executeActionImmediate() instead. This method is kept for backward compatibility.
   */
  executeActions(
    world: World,
    grid: Grid,
    plannedActions: PlannedAction[],
    getPlayerCharacters: () => number[]
  ) {
    return this.actionExecutionSystem.executeActions(world, grid, plannedActions, getPlayerCharacters);
  }

  // Movement System Access
  getMovementSystem(): MovementSystem {
    return this.movementSystem;
  }

  // Push System Access
  getPushSystem(): PushSystem {
    return this.pushSystem;
  }

  // Reset all systems for a new encounter
  reset(): void {
    this.turnSystem.reset();
    this.apSystem.reset();
    this.phaseManager.reset();
    this.stateManager.reset();
    this.movementPlan.clearAll();
  }

  /**
   * @deprecated Phase-based system removed. Use action point system instead.
   */
  resetForNewTurn(): void {
    this.phaseManager.resetToMovement();
    // setPlannedActions removed - planned actions no longer used
    this.stateManager.setSelectedCharacter(null);
    this.stateManager.setSelectedObject(null);
    this.stateManager.setValidMoves([]);
    this.stateManager.setValidPushDirections([]);
  }
}
