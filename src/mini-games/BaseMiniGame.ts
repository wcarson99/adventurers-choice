import type { ActionType } from '@/types/Action';
import type { GameState } from '@/types/GameState';
import type { ScenarioType } from '@/types/Scenario';

/**
 * Base class for all mini games (Combat, Obstacles, Trading, Statecraft, etc.)
 * 
 * Provides a common interface for:
 * - Initialization and cleanup
 * - Action processing
 * - State management
 * - Win/loss condition checking
 * 
 * All mini games are turn-based and event-driven, following the architecture
 * where GameEngine.executeTurn(action) is the single entry point.
 */
export abstract class BaseMiniGame {
  protected scenarioType: ScenarioType;
  protected isInitialized: boolean = false;
  protected isComplete: boolean = false;
  protected isWon: boolean = false;
  protected isLost: boolean = false;

  constructor(scenarioType: ScenarioType) {
    this.scenarioType = scenarioType;
  }

  /**
   * Initialize the mini game
   * Called when the mini game starts
   * 
   * @param config - Configuration data for the scenario (optional)
   */
  abstract initialize(config?: unknown): void;

  /**
   * Execute an action in the mini game
   * This is the main entry point for game logic
   * 
   * @param action - The action to execute (legacy ActionType format)
   * @returns Updated game state after processing the action
   */
  abstract executeAction(action: ActionType): GameState;

  /**
   * Get the current state of the mini game
   * 
   * @returns Current game state snapshot
   */
  abstract getState(): GameState;

  /**
   * Check if the win condition has been met
   * 
   * @returns True if the mini game has been won
   */
  abstract checkWinCondition(): boolean;

  /**
   * Check if the loss condition has been met
   * 
   * @returns True if the mini game has been lost
   */
  abstract checkLossCondition(): boolean;

  /**
   * Clean up resources when the mini game ends
   */
  abstract cleanup(): void;

  /**
   * Get the scenario type for this mini game
   */
  getScenarioType(): ScenarioType {
    return this.scenarioType;
  }

  /**
   * Check if the mini game is complete (won or lost)
   */
  isGameComplete(): boolean {
    return this.isComplete || this.isWon || this.isLost;
  }

  /**
   * Check if the mini game has been won
   */
  hasWon(): boolean {
    return this.isWon;
  }

  /**
   * Check if the mini game has been lost
   */
  hasLost(): boolean {
    return this.isLost;
  }

  /**
   * Check if the mini game has been initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Mark the mini game as initialized
   */
  protected setInitialized(value: boolean): void {
    this.isInitialized = value;
  }

  /**
   * Mark the mini game as complete
   */
  protected setComplete(value: boolean): void {
    this.isComplete = value;
  }

  /**
   * Mark the mini game as won
   */
  protected setWon(value: boolean): void {
    this.isWon = value;
    if (value) {
      this.setComplete(true);
    }
  }

  /**
   * Mark the mini game as lost
   */
  protected setLost(value: boolean): void {
    this.isLost = value;
    if (value) {
      this.setComplete(true);
    }
  }
}

