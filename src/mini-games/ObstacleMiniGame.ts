import type { ActionType } from '@/types/Action';
import type { GameState } from '@/types/GameState';
import type { ObstacleScenario } from '@/types/Scenario';
import { GridMiniGame } from './GridMiniGame';
import { World } from '../game-engine/ecs/World';
import { Grid } from '../game-engine/grid/Grid';
import type { ObstacleScenarioConfig } from '../types/ScenarioConfig';

/**
 * Obstacle mini game implementation
 * 
 * Handles puzzle-solving and obstacle scenarios with:
 * - Grid-based puzzle solving
 * - Trap detection and disarming
 * - Physical obstacle manipulation (pushing, breaking, etc.)
 * - Win/loss conditions (reach exit, solve puzzle, party wipe, turn limit, etc.)
 */
export class ObstacleMiniGame extends GridMiniGame {
  private maxTurns?: number; // Optional turn limit for time pressure

  constructor(scenarioType: ObstacleScenario, world: World, grid: Grid, maxTurns?: number) {
    super(scenarioType, world, grid);
    this.maxTurns = maxTurns;
  }

  /**
   * Initialize the obstacle scenario
   * Sets up the grid, positions characters, and starts the first round
   * 
   * @param config - Obstacle scenario configuration (optional)
   */
  initialize(config?: unknown): void {
    // Extract maxTurns from config if provided
    if (config !== undefined) {
      const obstacleConfig = config as ObstacleScenarioConfig;
      if (obstacleConfig.maxTurns !== undefined) {
        this.maxTurns = obstacleConfig.maxTurns;
      }
    }

    // Call parent initialization
    super.initialize(config);
  }

  /**
   * Execute an action in the obstacle mini game
   * Overrides parent to check turn limit before executing
   * 
   * @param action - The action to execute (Move, Push, Disarm, Interact, Turn, Pass, etc.)
   * @returns Updated game state
   */
  executeAction(action: ActionType): GameState {
    // Check turn limit before executing
    if (this.maxTurns !== undefined && this.turnCount >= this.maxTurns) {
      this.setLost(true);
      return this.getState();
    }

    // Call parent executeAction
    const state = super.executeAction(action);

    // Check turn limit after incrementing
    if (this.maxTurns !== undefined && this.turnCount >= this.maxTurns) {
      this.setLost(true);
      return this.getState();
    }

    return state;
  }

  /**
   * Enrich game state with obstacle-specific fields
   */
  protected enrichGameState(baseState: GameState): GameState {
    return {
      ...baseState,
      encounterType: 'obstacle',
      maxTurns: this.maxTurns,
      turnsRemaining: this.maxTurns !== undefined ? this.maxTurns - this.turnCount : undefined,
    };
  }

  /**
   * Check if the obstacle-specific win condition has been met
   * For obstacles, this typically means reaching the exit or solving the puzzle
   * (Base win condition from GridMiniGame already checks for exit, so this can be a supplement)
   * 
   * @returns True if obstacle-specific win condition is met
   */
  protected checkWinConditionSpecific(): boolean {
    // For obstacle scenarios, the base grid win condition (all characters at exit)
    // should already handle the main win condition.
    // This method can be used to add additional win conditions if needed.
    
    // TODO: Implement obstacle-specific win conditions if needed (e.g., puzzle solved)
    return false;
  }

  /**
   * Check if the obstacle-specific loss condition has been met
   * For obstacles, this typically means:
   * - All party members are defeated (0 HP)
   * - Turn limit exceeded (checked in executeAction)
   * 
   * @returns True if the obstacle scenario has been lost
   */
  protected checkLossConditionSpecific(): boolean {
    // Turn limit is checked in executeAction before calling parent
    // So we just need to check for party wipe here
    
    // Check if all party members are defeated
    // This would need to check HP of all player-controlled characters
    // For now, we'll return false as a placeholder
    // TODO: Implement actual loss condition checking (check HP of all party members)
    
    return false;
  }

  /**
   * Get the maximum turn limit (if set)
   */
  getMaxTurns(): number | undefined {
    return this.maxTurns;
  }
}
