import type { Action } from '@/types/Action';
import type { GameState } from '@/types/GameState';
import type { ObstacleEncounter } from '@/types/Encounter';
import { BaseMiniGame } from './BaseMiniGame';
import { World } from '../game-engine/ecs/World';
import { Grid } from '../game-engine/grid/Grid';
import { EncounterController } from '../game-engine/encounters/EncounterController';

/**
 * Obstacle mini game implementation
 * 
 * Handles puzzle-solving and obstacle encounters with:
 * - Grid-based puzzle solving
 * - Trap detection and disarming
 * - Physical obstacle manipulation (pushing, breaking, etc.)
 * - Win/loss conditions (reach exit, solve puzzle, party wipe, etc.)
 */
export class ObstacleMiniGame extends BaseMiniGame {
  private world: World;
  private grid: Grid;
  private encounterController: EncounterController;
  private turnCount: number = 0;
  private maxTurns?: number; // Optional turn limit for time pressure

  constructor(encounterType: ObstacleEncounter, world: World, grid: Grid, maxTurns?: number) {
    super(encounterType);
    this.world = world;
    this.grid = grid;
    this.encounterController = new EncounterController();
    this.maxTurns = maxTurns;
  }

  /**
   * Initialize the obstacle encounter
   * Sets up the grid, positions characters, and starts the first round
   */
  initialize(): void {
    if (this.getIsInitialized()) {
      return;
    }

    // Start the first round - EncounterController manages its own state
    // We need to provide a function to get player characters
    const getPlayerCharacters = (): number[] => {
      const entities = this.world.getAllEntities();
      return entities.filter(id => {
        // Check if entity has PlayerControlled component or Attributes component
        // For now, we'll assume all entities with Attributes are player characters
        const attrs = this.world.getComponent(id, 'Attributes');
        return attrs !== undefined;
      });
    };

    this.encounterController.startRound(getPlayerCharacters, this.world);

    this.setInitialized(true);
  }

  /**
   * Execute an action in the obstacle mini game
   * 
   * @param action - The action to execute (Move, Push, Disarm, Interact, Turn, Pass, etc.)
   * @returns Updated game state
   */
  executeAction(action: Action): GameState {
    if (!this.getIsInitialized()) {
      throw new Error('ObstacleMiniGame must be initialized before executing actions');
    }

    if (this.isGameComplete()) {
      return this.getState();
    }

    // Check turn limit before executing
    if (this.maxTurns !== undefined && this.turnCount >= this.maxTurns) {
      this.setLost(true);
      return this.getState();
    }

    // Execute the action through the encounter controller
    // Handle different target types
    let target: { x: number; y: number } | number | { dx: number; dy: number } | undefined;
    if (action.targetPos) {
      target = action.targetPos as { x: number; y: number };
    } else if (action.targetId !== undefined) {
      target = action.targetId as number;
    } else if (action.direction) {
      target = action.direction as { dx: number; dy: number };
    }

    const result = this.encounterController.executeActionImmediate(
      this.world,
      this.grid,
      action.action as 'Move' | 'Push' | 'Turn' | 'Pass',
      action.characterId as number,
      target
    );

    // Check win/loss conditions after each action
    this.updateGameStatus();

    // Increment turn count
    this.turnCount += 1;

    // Check turn limit after incrementing
    if (this.maxTurns !== undefined && this.turnCount >= this.maxTurns) {
      this.setLost(true);
    }

    return {
      turn: this.turnCount,
      maxTurns: this.maxTurns,
      encounterType: 'obstacle',
      result: result.success ? 'success' : 'failure',
      error: result.error,
      apRemaining: result.apRemaining,
      isComplete: this.isGameComplete(),
      isWon: this.hasWon(),
      isLost: this.hasLost(),
      turnsRemaining: this.maxTurns !== undefined ? this.maxTurns - this.turnCount : undefined,
    };
  }

  /**
   * Get the current state of the obstacle mini game
   * 
   * @returns Current game state snapshot
   */
  getState(): GameState {
    const currentRound = this.encounterController.getCurrentRound();
    const currentActiveCharacter = this.encounterController.getCurrentActiveCharacter();

    return {
      turn: this.turnCount,
      maxTurns: this.maxTurns,
      round: currentRound,
      encounterType: 'obstacle',
      activeCharacter: currentActiveCharacter,
      isComplete: this.isGameComplete(),
      isWon: this.hasWon(),
      isLost: this.hasLost(),
      turnsRemaining: this.maxTurns !== undefined ? this.maxTurns - this.turnCount : undefined,
      world: this.world,
      grid: this.grid,
    };
  }

  /**
   * Check if the win condition has been met
   * For obstacles, this typically means reaching the exit or solving the puzzle
   * 
   * @returns True if the obstacle encounter has been won
   */
  checkWinCondition(): boolean {
    // Get player characters function
    const getPlayerCharacters = (): number[] => {
      const entities = this.world.getAllEntities();
      return entities.filter(id => {
        const attrs = this.world.getComponent(id, 'Attributes');
        return attrs !== undefined;
      });
    };

    // Check if win condition is met (e.g., all characters at exit, puzzle solved)
    const winConditionMet = this.encounterController.checkWinCondition(
      this.world,
      this.grid,
      getPlayerCharacters
    );
    
    if (winConditionMet && !this.hasWon()) {
      this.setWon(true);
    }

    return this.hasWon();
  }

  /**
   * Check if the loss condition has been met
   * For obstacles, this typically means:
   * - All party members are defeated (0 HP)
   * - Turn limit exceeded (if applicable)
   * 
   * @returns True if the obstacle encounter has been lost
   */
  checkLossCondition(): boolean {
    // Check if all party members are defeated
    // This would need to check HP of all player-controlled characters
    // For now, we'll return false as a placeholder
    // TODO: Implement actual loss condition checking
    
    // Turn limit is checked in executeAction
    return false;
  }

  /**
   * Clean up resources when the obstacle encounter ends
   */
  cleanup(): void {
    // Clean up any resources, timers, etc.
    // The encounter controller and world/grid are managed externally
    this.setInitialized(false);
  }

  /**
   * Update game status by checking win/loss conditions
   */
  private updateGameStatus(): void {
    if (this.isGameComplete()) {
      return;
    }

    this.checkWinCondition();
    this.checkLossCondition();
  }

  /**
   * Get the encounter controller for direct access if needed
   */
  getEncounterController(): EncounterController {
    return this.encounterController;
  }

  /**
   * Get the world instance
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Get the grid instance
   */
  getGrid(): Grid {
    return this.grid;
  }

  /**
   * Get the current turn count
   */
  getTurnCount(): number {
    return this.turnCount;
  }

  /**
   * Get the maximum turn limit (if set)
   */
  getMaxTurns(): number | undefined {
    return this.maxTurns;
  }
}

