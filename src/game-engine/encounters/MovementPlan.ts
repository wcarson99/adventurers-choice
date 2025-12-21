import { PlannedPath, createPlannedPath, PathStatus } from './PlannedPath';
import { GridPosition } from '../grid/Grid';

/**
 * Manages all characters' planned movement paths
 */
export class MovementPlan {
  private paths: Map<number, PlannedPath> = new Map();

  /**
   * Add or update a path for a character
   */
  addPath(characterId: number): PlannedPath {
    if (!this.paths.has(characterId)) {
      this.paths.set(characterId, createPlannedPath(characterId));
    }
    return this.paths.get(characterId)!;
  }

  /**
   * Get a path for a character
   */
  getPath(characterId: number): PlannedPath | undefined {
    return this.paths.get(characterId);
  }

  /**
   * Remove a path for a character
   */
  removePath(characterId: number): void {
    this.paths.delete(characterId);
  }

  /**
   * Get all paths
   */
  getAllPaths(): PlannedPath[] {
    return Array.from(this.paths.values());
  }

  /**
   * Get all paths for characters that have at least one step planned
   */
  getReadyPaths(): PlannedPath[] {
    return this.getAllPaths().filter(path => path.steps.length > 0 && path.status === 'ready');
  }

  /**
   * Clear all paths
   */
  clearAll(): void {
    this.paths.clear();
  }

  /**
   * Check if any character has a planned path
   */
  hasAnyPath(): boolean {
    return this.paths.size > 0 && 
           Array.from(this.paths.values()).some(path => path.steps.length > 0);
  }

  /**
   * Add a step to a character's path
   */
  addStep(characterId: number, step: GridPosition): boolean {
    const path = this.addPath(characterId);
    path.steps.push(step);
    if (path.status === 'planning') {
      path.status = 'ready';
    }
    return true;
  }

  /**
   * Remove the last step from a character's path
   */
  removeLastStep(characterId: number): boolean {
    const path = this.getPath(characterId);
    if (!path || path.steps.length === 0) {
      return false;
    }
    path.steps.pop();
    if (path.steps.length === 0) {
      path.status = 'planning';
    }
    return true;
  }

  /**
   * Clear all steps for a character (but keep the path object)
   */
  clearPath(characterId: number): void {
    const path = this.getPath(characterId);
    if (path) {
      path.steps = [];
      path.currentStepIndex = 0;
      path.status = 'planning';
    }
  }

  /**
   * Update path status
   */
  setPathStatus(characterId: number, status: PathStatus): void {
    const path = this.getPath(characterId);
    if (path) {
      path.status = status;
    }
  }
}







