import type { Action } from '@/types/Action';
import type { GameState } from '@/types/GameState';
import type { ScenarioType } from '@/types/Scenario';
import { BaseMiniGame } from './BaseMiniGame';
import { World } from '../game-engine/ecs/World';
import { Grid } from '../game-engine/grid/Grid';
import { GridController } from '../game-engine/encounters/GridController';

/**
 * GridMiniGame is an abstract base class for grid-based mini games
 * (Combat, Obstacle, etc.) that share common grid-based logic.
 * 
 * Provides shared functionality for:
 * - World, Grid, and GridController management
 * - Turn tracking
 * - Action execution through GridController
 * - Common win condition checking
 * 
 * Subclasses should implement:
 * - checkWinConditionSpecific() - scenario-specific win condition
 * - checkLossConditionSpecific() - scenario-specific loss condition
 */
export abstract class GridMiniGame extends BaseMiniGame {
  protected world: World;
  protected grid: Grid;
  protected gridController: GridController;
  protected turnCount: number = 0;

  constructor(scenarioType: ScenarioType, world: World, grid: Grid) {
    super(scenarioType);
    this.world = world;
    this.grid = grid;
    this.gridController = new GridController();
  }

  /**
   * Initialize the grid-based mini game
   * Sets up the grid, positions characters, and starts the first round
   * 
   * @param config - Configuration data for the scenario (optional)
   */
  initialize(_config?: unknown): void {
    if (this.getIsInitialized()) {
      return;
    }

    // Start the first round - GridController manages its own state
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

    this.gridController.startRound(getPlayerCharacters, this.world);

    this.setInitialized(true);
  }

  /**
   * Execute an action in the grid-based mini game
   * 
   * @param action - The action to execute (Move, Push, Turn, Pass, etc.)
   * @returns Updated game state
   */
  executeAction(action: Action): GameState {
    if (!this.getIsInitialized()) {
      throw new Error(`${this.constructor.name} must be initialized before executing actions`);
    }

    if (this.isGameComplete()) {
      return this.getState();
    }

    // Execute the action through the grid controller
    // Handle different target types
    let target: { x: number; y: number } | number | { dx: number; dy: number } | undefined;
    if (action.targetPos) {
      target = action.targetPos as { x: number; y: number };
    } else if (action.targetId !== undefined) {
      target = action.targetId as number;
    } else if (action.direction) {
      target = action.direction as { dx: number; dy: number };
    }

    const result = this.gridController.executeActionImmediate(
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

    // Build base game state
    const baseState: GameState = {
      turn: this.turnCount,
      result: result.success ? 'success' : 'failure',
      error: result.error,
      apRemaining: result.apRemaining,
      isComplete: this.isGameComplete(),
      isWon: this.hasWon(),
      isLost: this.hasLost(),
      world: this.world,
      grid: this.grid,
    };

    // Add scenario-specific state fields
    return this.enrichGameState(baseState);
  }

  /**
   * Get the current state of the grid-based mini game
   * 
   * @returns Current game state snapshot
   */
  getState(): GameState {
    const currentRound = this.gridController.getCurrentRound();
    const currentActiveCharacter = this.gridController.getCurrentActiveCharacter();

    const baseState: GameState = {
      turn: this.turnCount,
      round: currentRound,
      activeCharacter: currentActiveCharacter,
      isComplete: this.isGameComplete(),
      isWon: this.hasWon(),
      isLost: this.hasLost(),
      world: this.world,
      grid: this.grid,
    };

    // Add scenario-specific state fields
    return this.enrichGameState(baseState);
  }

  /**
   * Check if the win condition has been met
   * Uses shared grid-based win condition checking plus scenario-specific logic
   * 
   * @returns True if the mini game has been won
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

    // Check if base win condition is met (via GridController - e.g., all characters at exit, all enemies defeated, etc.)
    const baseWinConditionMet = this.gridController.checkWinCondition(
      this.world,
      this.grid,
      getPlayerCharacters
    );

    // Check scenario-specific win condition (can override or supplement base condition)
    const specificWinConditionMet = this.checkWinConditionSpecific();

    // Win if either base OR specific condition is met
    const winConditionMet = baseWinConditionMet || specificWinConditionMet;
    
    if (winConditionMet && !this.hasWon()) {
      this.setWon(true);
    }

    return this.hasWon();
  }

  /**
   * Check if the loss condition has been met
   * Uses scenario-specific loss condition checking
   * 
   * @returns True if the mini game has been lost
   */
  checkLossCondition(): boolean {
    const lost = this.checkLossConditionSpecific();
    if (lost && !this.hasLost()) {
      this.setLost(true);
    }
    return this.hasLost();
  }

  /**
   * Clean up resources when the mini game ends
   */
  cleanup(): void {
    // Clean up any resources, timers, etc.
    // The grid controller and world/grid are managed externally
    this.setInitialized(false);
  }

  /**
   * Update game status by checking win/loss conditions
   */
  protected updateGameStatus(): void {
    if (this.isGameComplete()) {
      return;
    }

    this.checkWinCondition();
    this.checkLossCondition();
  }

  /**
   * Scenario-specific win condition checking
   * Subclasses must implement this to provide their specific win logic
   * 
   * @returns True if scenario-specific win condition is met
   */
  protected abstract checkWinConditionSpecific(): boolean;

  /**
   * Scenario-specific loss condition checking
   * Subclasses must implement this to provide their specific loss logic
   * 
   * @returns True if scenario-specific loss condition is met
   */
  protected abstract checkLossConditionSpecific(): boolean;

  /**
   * Enrich base game state with scenario-specific fields
   * Subclasses can override this to add scenario-specific state fields
   * 
   * @param baseState - Base game state
   * @returns Enriched game state
   */
  protected enrichGameState(baseState: GameState): GameState {
    return baseState;
  }

  /**
   * Get the grid controller for direct access if needed
   */
  getGridController(): GridController {
    return this.gridController;
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
}

