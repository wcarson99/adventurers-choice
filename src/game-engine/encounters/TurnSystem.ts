import { World } from '../ecs/World';
import { AttributesComponent } from '../ecs/Component';

/**
 * TurnSystem manages turn and round tracking for encounters
 * 
 * In the new action point system:
 * - A "round" represents all characters taking one turn each, ordered by MOV
 * - A "turn" represents a single character's action phase (they can take multiple actions until they pass)
 * - Characters are ordered by MOV (highest first) at the start of each round
 */
export class TurnSystem {
  private round: number = 1;
  private characterTurnOrder: number[] = [];
  private currentActiveCharacterIndex: number = 0;
  private passedCharacters: Set<number> = new Set();

  /**
   * Get the current round number (1-indexed)
   */
  getCurrentRound(): number {
    return this.round;
  }

  /**
   * Get the current active character ID (whose turn it is)
   * Returns null if no character is active (e.g., round not started)
   */
  getCurrentActiveCharacter(): number | null {
    if (this.characterTurnOrder.length === 0) {
      return null;
    }
    if (this.currentActiveCharacterIndex >= this.characterTurnOrder.length) {
      return null;
    }
    return this.characterTurnOrder[this.currentActiveCharacterIndex];
  }

  /**
   * Get the character turn order for the current round
   * Returns array of character IDs ordered by MOV (highest first)
   */
  getCharacterTurnOrder(): number[] {
    return [...this.characterTurnOrder];
  }

  /**
   * Start a new round by ordering characters by MOV (highest first)
   * Sets the first character as active
   * 
   * @param getAllCharacters - Function that returns array of all character IDs (players + NPCs)
   * @param world - The ECS world to access character attributes
   */
  startRound(getAllCharacters: () => number[], world: World): void {
    const characters = getAllCharacters();
    
    // Order characters by MOV (highest first)
    // If MOV is equal, maintain original order (stable sort)
    const charactersWithMOV = characters.map(charId => {
      const attrs = world.getComponent<AttributesComponent>(charId, 'Attributes');
      const mov = attrs?.mov ?? 0;
      return { charId, mov };
    });

    this.characterTurnOrder = charactersWithMOV
      .sort((a, b) => {
        // Sort by MOV descending, then by character ID for stability
        if (b.mov !== a.mov) {
          return b.mov - a.mov;
        }
        return a.charId - b.charId;
      })
      .map(item => item.charId);

    // Reset turn state
    this.currentActiveCharacterIndex = 0;
    this.passedCharacters.clear();
  }

  /**
   * Move to the next character in the turn order
   * If all characters have passed, this will be handled by passTurn()
   */
  nextCharacter(): void {
    if (this.characterTurnOrder.length === 0) {
      return;
    }

    // Find next character that hasn't passed
    let nextIndex = this.currentActiveCharacterIndex + 1;
    while (nextIndex < this.characterTurnOrder.length) {
      const nextCharId = this.characterTurnOrder[nextIndex];
      if (!this.passedCharacters.has(nextCharId)) {
        this.currentActiveCharacterIndex = nextIndex;
        return;
      }
      nextIndex++;
    }

    // All remaining characters have passed, round is complete
    // This will be handled by passTurn() calling isRoundComplete()
  }

  /**
   * Mark the current character as having passed and advance to next character
   * If all characters have passed, increments the round and resets state
   * 
   * @returns True if round was completed (all characters passed), false otherwise
   */
  passTurn(): boolean {
    const currentChar = this.getCurrentActiveCharacter();
    if (currentChar === null) {
      return false;
    }

    // Mark current character as passed
    this.passedCharacters.add(currentChar);

    // Check if round is complete
    if (this.isRoundComplete()) {
      // Round complete - increment round and reset state
      // Note: startRound() must be called separately to re-order characters for next round
      // This allows the caller to control when the next round starts
      this.round += 1;
      this.currentActiveCharacterIndex = 0;
      this.passedCharacters.clear();
      return true;
    }

    // Move to next character
    this.nextCharacter();
    return false;
  }

  /**
   * Check if the current round is complete (all characters have passed)
   */
  isRoundComplete(): boolean {
    if (this.characterTurnOrder.length === 0) {
      return true; // No characters means round is "complete"
    }
    return this.passedCharacters.size >= this.characterTurnOrder.length;
  }

  /**
   * Check if a specific character has passed their turn
   */
  hasPassed(characterId: number): boolean {
    return this.passedCharacters.has(characterId);
  }

  /**
   * Reset turn counter to 0 (start of encounter)
   * @deprecated Use reset() instead. This method is kept for backward compatibility.
   */
  resetTurn(): void {
    this.reset();
  }

  /**
   * Reset round counter to 1 and turn to 0 (start of new encounter)
   */
  reset(): void {
    this.round = 1;
    this.characterTurnOrder = [];
    this.currentActiveCharacterIndex = 0;
    this.passedCharacters.clear();
  }

  /**
   * Get a snapshot of current turn/round state
   */
  getState(): { 
    round: number; 
    currentActiveCharacter: number | null;
    characterTurnOrder: number[];
    passedCharacters: number[];
  } {
    return {
      round: this.round,
      currentActiveCharacter: this.getCurrentActiveCharacter(),
      characterTurnOrder: this.getCharacterTurnOrder(),
      passedCharacters: Array.from(this.passedCharacters),
    };
  }

  /**
   * Get the current turn number (1-indexed)
   * @deprecated In the new system, "turn" refers to individual character actions.
   * Use getCurrentRound() and getCurrentActiveCharacter() instead.
   */
  getCurrentTurn(): number {
    // For backward compatibility, return round number
    // This maintains the old API but the semantics have changed
    return this.round;
  }

  /**
   * Increment the turn counter
   * @deprecated Use passTurn() instead. This method is kept for backward compatibility.
   */
  incrementTurn(): void {
    // For backward compatibility, just increment round
    // This is not the correct behavior for the new system
    this.round += 1;
  }

  /**
   * Increment the round counter
   * Called when a complete round finishes
   * @deprecated Use passTurn() which handles round advancement automatically.
   */
  incrementRound(): void {
    this.round += 1;
    this.passedCharacters.clear();
  }
}
