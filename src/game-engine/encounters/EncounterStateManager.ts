/**
 * EncounterStateManager manages encounter-specific state
 * 
 * This manager tracks UI state that's specific to the encounter view:
 * - Selected character/object
 * - Valid moves and push directions
 * - Planned actions
 * 
 * Note: This manages the state, but React state is still needed for re-renders.
 * The manager provides a clean API and validation for state updates.
 */
export interface ValidMove {
  x: number;
  y: number;
}

export interface ValidPushDirection {
  dx: number;
  dy: number;
  staminaCost: number;
}

export interface PlannedAction {
  characterId: number;
  action: string;
  targetId?: number;
  cost: number;
}

export class EncounterStateManager {
  private selectedCharacter: number | null = null;
  private selectedObject: number | null = null;
  private validMoves: ValidMove[] = [];
  private validPushDirections: ValidPushDirection[] = [];
  private plannedActions: PlannedAction[] = [];

  /**
   * Get the currently selected character ID
   */
  getSelectedCharacter(): number | null {
    return this.selectedCharacter;
  }

  /**
   * Set the selected character
   */
  setSelectedCharacter(characterId: number | null): void {
    this.selectedCharacter = characterId;
    // Clear valid moves when character changes
    if (characterId === null) {
      this.validMoves = [];
    }
  }

  /**
   * Get the currently selected object ID
   */
  getSelectedObject(): number | null {
    return this.selectedObject;
  }

  /**
   * Set the selected object
   */
  setSelectedObject(objectId: number | null): void {
    this.selectedObject = objectId;
    // Clear valid push directions when object changes
    if (objectId === null) {
      this.validPushDirections = [];
    }
  }

  /**
   * Get valid moves for the selected character
   */
  getValidMoves(): ValidMove[] {
    return [...this.validMoves]; // Return copy to prevent mutation
  }

  /**
   * Set valid moves for the selected character
   */
  setValidMoves(moves: ValidMove[]): void {
    this.validMoves = [...moves]; // Store copy
  }

  /**
   * Get valid push directions for the selected object
   */
  getValidPushDirections(): ValidPushDirection[] {
    return [...this.validPushDirections]; // Return copy to prevent mutation
  }

  /**
   * Set valid push directions for the selected object
   */
  setValidPushDirections(directions: ValidPushDirection[]): void {
    this.validPushDirections = [...directions]; // Store copy
  }

  /**
   * Get all planned actions
   */
  getPlannedActions(): PlannedAction[] {
    return [...this.plannedActions]; // Return copy to prevent mutation
  }

  /**
   * Add a planned action
   */
  addPlannedAction(action: PlannedAction): void {
    this.plannedActions = [...this.plannedActions, action];
  }

  /**
   * Remove a planned action by index
   */
  removePlannedAction(index: number): void {
    if (index >= 0 && index < this.plannedActions.length) {
      this.plannedActions = this.plannedActions.filter((_, i) => i !== index);
    }
  }

  /**
   * Update a planned action at a specific index
   */
  updatePlannedAction(index: number, action: PlannedAction): void {
    if (index >= 0 && index < this.plannedActions.length) {
      this.plannedActions = this.plannedActions.map((a, i) => i === index ? action : a);
    }
  }

  /**
   * Clear all planned actions
   */
  clearPlannedActions(): void {
    this.plannedActions = [];
  }

  /**
   * Clear all selection state
   */
  clearSelection(): void {
    this.selectedCharacter = null;
    this.selectedObject = null;
    this.validMoves = [];
    this.validPushDirections = [];
  }

  /**
   * Reset all state (start of new encounter)
   */
  reset(): void {
    this.clearSelection();
    this.clearPlannedActions();
  }

  /**
   * Get a snapshot of current state
   */
  getState(): {
    selectedCharacter: number | null;
    selectedObject: number | null;
    validMoves: ValidMove[];
    validPushDirections: ValidPushDirection[];
    plannedActions: PlannedAction[];
  } {
    return {
      selectedCharacter: this.selectedCharacter,
      selectedObject: this.selectedObject,
      validMoves: this.getValidMoves(),
      validPushDirections: this.getValidPushDirections(),
      plannedActions: this.getPlannedActions(),
    };
  }
}

