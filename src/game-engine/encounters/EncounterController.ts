import { World } from '../ecs/World';
import { Grid } from '../grid/Grid';
import { TurnSystem } from './TurnSystem';
import { EncounterPhaseManager, PlanningPhase } from './EncounterPhaseManager';
import { EncounterStateManager, PlannedAction } from './EncounterStateManager';
import { ActionExecutionSystem } from './ActionExecutionSystem';
import { WinConditionSystem } from './WinConditionSystem';
import { MovementSystem } from './MovementSystem';
import { PushSystem } from './PushSystem';
import { MovementPlan } from './MovementPlan';

/**
 * EncounterController orchestrates all encounter systems and provides a unified interface
 * for managing encounter state, phase transitions, and game logic.
 */
export class EncounterController {
  private turnSystem: TurnSystem;
  private phaseManager: EncounterPhaseManager;
  private stateManager: EncounterStateManager;
  private actionExecutionSystem: ActionExecutionSystem;
  private winConditionSystem: WinConditionSystem;
  private movementSystem: MovementSystem;
  private pushSystem: PushSystem;
  private movementPlan: MovementPlan;

  constructor() {
    this.turnSystem = new TurnSystem();
    this.phaseManager = new EncounterPhaseManager();
    this.stateManager = new EncounterStateManager();
    this.actionExecutionSystem = new ActionExecutionSystem();
    this.winConditionSystem = new WinConditionSystem();
    this.movementSystem = new MovementSystem();
    this.pushSystem = new PushSystem();
    this.movementPlan = new MovementPlan();
  }

  // Turn System Access
  getCurrentTurn(): number {
    return this.turnSystem.getCurrentTurn();
  }

  incrementTurn(): void {
    this.turnSystem.incrementTurn();
  }

  resetTurn(): void {
    this.turnSystem.reset();
  }

  // Phase Manager Access
  getCurrentPhase(): PlanningPhase {
    return this.phaseManager.getCurrentPhase();
  }

  transitionToPhase(newPhase: PlanningPhase): boolean {
    return this.phaseManager.transitionToPhase(newPhase, () => {
      // No-op callback - phase updates are handled by React state in EncounterView
    });
  }

  transitionToSkill(): void {
    this.phaseManager.transitionToSkill();
  }

  transitionToExecuting(): void {
    this.phaseManager.transitionToExecuting();
  }

  resetToMovement(): void {
    this.phaseManager.resetToMovement();
  }

  // State Manager Access
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

  setPlannedActions(actions: PlannedAction[]): void {
    this.stateManager.setPlannedActions(actions);
  }

  getMovementPlan(): MovementPlan {
    return this.movementPlan;
  }

  // Win Condition System Access
  checkWinCondition(world: World, grid: Grid, getPlayerCharacters: () => number[]): boolean {
    return this.winConditionSystem.checkWinCondition(world, grid, getPlayerCharacters);
  }

  // Action Execution System Access
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
    this.phaseManager.reset();
    this.stateManager.reset();
    this.movementPlan.clearAll();
  }

  // Reset for a new turn (after execution phase completes)
  resetForNewTurn(): void {
    this.phaseManager.resetToMovement();
    this.stateManager.setPlannedActions([]);
    this.stateManager.setSelectedCharacter(null);
    this.stateManager.setSelectedObject(null);
    this.stateManager.setValidMoves([]);
    this.stateManager.setValidPushDirections([]);
  }
}

