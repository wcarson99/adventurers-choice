/**
 * EncounterPhaseManager manages phase state and transitions
 * 
 * The encounter has three phases:
 * - 'movement': Planning character movement paths
 * - 'skill': Planning skill actions (push, wait, etc.)
 * - 'executing': Currently executing planned actions
 * 
 * This system provides validation and management of phase transitions.
 */
export type PlanningPhase = 'movement' | 'skill' | 'executing';

export class EncounterPhaseManager {
  private currentPhase: PlanningPhase = 'movement';

  /**
   * Get the current phase
   */
  getCurrentPhase(): PlanningPhase {
    return this.currentPhase;
  }

  /**
   * Transition from movement phase to skill phase
   * Validates that we're currently in movement phase
   */
  transitionToSkill(): void {
    if (this.currentPhase !== 'movement') {
      throw new Error(`Cannot transition to skill phase from ${this.currentPhase} phase`);
    }
    this.currentPhase = 'skill';
  }

  /**
   * Transition from skill phase to executing phase
   * Validates that we're currently in skill phase
   */
  transitionToExecuting(): void {
    if (this.currentPhase !== 'skill') {
      throw new Error(`Cannot transition to executing phase from ${this.currentPhase} phase`);
    }
    this.currentPhase = 'executing';
  }

  /**
   * Reset to movement phase (after execution completes)
   * Can be called from any phase
   */
  resetToMovement(): void {
    this.currentPhase = 'movement';
  }

  /**
   * Check if we're in a specific phase
   */
  isPhase(phase: PlanningPhase): boolean {
    return this.currentPhase === phase;
  }

  /**
   * Check if we're in movement phase
   */
  isMovementPhase(): boolean {
    return this.currentPhase === 'movement';
  }

  /**
   * Check if we're in skill phase
   */
  isSkillPhase(): boolean {
    return this.currentPhase === 'skill';
  }

  /**
   * Check if we're in executing phase
   */
  isExecutingPhase(): boolean {
    return this.currentPhase === 'executing';
  }

  /**
   * Reset phase manager (start of new encounter)
   */
  reset(): void {
    this.currentPhase = 'movement';
  }
}

