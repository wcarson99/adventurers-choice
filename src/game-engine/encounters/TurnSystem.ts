/**
 * TurnSystem manages turn and round tracking for encounters
 * 
 * Provides centralized turn/round management with a clean API.
 * A "turn" represents a complete cycle: movement phase + skill phase + execution.
 * A "round" represents multiple turns (future use for multi-round encounters).
 */
export class TurnSystem {
  private turn: number = 0;
  private round: number = 1;

  /**
   * Get the current turn number (1-indexed)
   */
  getCurrentTurn(): number {
    return this.turn;
  }

  /**
   * Get the current round number (1-indexed)
   */
  getCurrentRound(): number {
    return this.round;
  }

  /**
   * Increment the turn counter
   * Called when a complete turn cycle (movement + skill + execution) finishes
   */
  incrementTurn(): void {
    this.turn += 1;
  }

  /**
   * Increment the round counter
   * Called when a complete round finishes (future use)
   */
  incrementRound(): void {
    this.round += 1;
    this.turn = 0; // Reset turn counter for new round
  }

  /**
   * Reset turn counter to 0 (start of encounter)
   */
  resetTurn(): void {
    this.turn = 0;
  }

  /**
   * Reset round counter to 1 and turn to 0 (start of new encounter)
   */
  reset(): void {
    this.turn = 0;
    this.round = 1;
  }

  /**
   * Get a snapshot of current turn/round state
   */
  getState(): { turn: number; round: number } {
    return {
      turn: this.turn,
      round: this.round,
    };
  }
}

