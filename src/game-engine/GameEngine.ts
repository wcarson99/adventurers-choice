import { Action } from '@/types/Action';
import type { GameState } from '@/types/GameState';

/**
 * Core game engine for turn-based game execution
 * 
 * The game is non-realtime and event-driven. All game logic flows through
 * the executeTurn method, which processes a single player action synchronously.
 * 
 * Note: In the current architecture, most game logic is handled by GridController
 * and mini games. This GameEngine provides a high-level interface for turn execution.
 */
export class GameEngine {
  private turn: number = 0;

  /**
   * Execute a single turn by processing a player action
   * 
   * @param action - The action class instance to execute
   * @returns Updated game state after processing the action
   */
  executeTurn(_action: Action): GameState {
    // Increment turn counter
    // Note: The action's execute() method should be called by the caller
    // with the appropriate ActionContext. This method provides a high-level
    // interface for turn tracking.
    this.turn += 1;
    
    // Return current game state
    return {
      turn: this.turn,
    };
  }

  /**
   * Get current game state without executing a turn
   */
  getState(): GameState {
    return {
      turn: this.turn,
    };
  }
}

