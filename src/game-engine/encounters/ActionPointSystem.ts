import { ACTION_COSTS, DEFAULT_AP } from './constants';

/**
 * ActionPointSystem tracks action points (AP) for each character
 * 
 * Characters have a default of 50 AP per turn. AP is deducted when actions
 * are executed and reset to 50 at the start of each character's turn.
 */
export class ActionPointSystem {
  private apMap: Map<number, number> = new Map();

  /**
   * Get the current AP for a character
   * 
   * @param characterId - The character ID
   * @returns Current AP (defaults to DEFAULT_AP if character not tracked)
   */
  getAP(characterId: number): number {
    return this.apMap.get(characterId) ?? DEFAULT_AP;
  }

  /**
   * Deduct AP from a character
   * 
   * @param characterId - The character ID
   * @param amount - Amount of AP to deduct
   * @returns The new AP value after deduction
   */
  deductAP(characterId: number, amount: number): number {
    const currentAP = this.getAP(characterId);
    const newAP = Math.max(0, currentAP - amount);
    this.apMap.set(characterId, newAP);
    return newAP;
  }

  /**
   * Reset AP for a character to the default value (50)
   * 
   * @param characterId - The character ID
   */
  resetAP(characterId: number): void {
    this.apMap.set(characterId, DEFAULT_AP);
  }

  /**
   * Check if a character can afford an action
   * 
   * @param characterId - The character ID
   * @param cost - The AP cost of the action (can use ACTION_COSTS constants)
   * @returns True if character has enough AP, false otherwise
   */
  canAfford(characterId: number, cost: number): boolean {
    return this.getAP(characterId) >= cost;
  }

  /**
   * Check if a character can afford a move action
   * 
   * @param characterId - The character ID
   * @returns True if character can afford MOVE action
   */
  canAffordMove(characterId: number): boolean {
    return this.canAfford(characterId, ACTION_COSTS.MOVE);
  }

  /**
   * Check if a character can afford a push action
   * 
   * @param characterId - The character ID
   * @returns True if character can afford PUSH action
   */
  canAffordPush(characterId: number): boolean {
    return this.canAfford(characterId, ACTION_COSTS.PUSH);
  }

  /**
   * Check if a character can afford a turn action
   * 
   * @param characterId - The character ID
   * @returns True if character can afford TURN action
   */
  canAffordTurn(characterId: number): boolean {
    return this.canAfford(characterId, ACTION_COSTS.TURN);
  }

  /**
   * Check if a character can afford an action by cost
   * Generic method that accepts any action cost
   * 
   * @param characterId - The character ID
   * @param cost - The AP cost of the action
   * @returns True if character can afford the action
   */
  canAffordAction(characterId: number, cost: number): boolean {
    return this.canAfford(characterId, cost);
  }

  /**
   * Reset all AP tracking (for new encounter)
   */
  reset(): void {
    this.apMap.clear();
  }

  /**
   * Get a snapshot of all character AP values
   * 
   * @returns Map of characterId to AP
   */
  getAllAP(): Map<number, number> {
    return new Map(this.apMap);
  }
}

