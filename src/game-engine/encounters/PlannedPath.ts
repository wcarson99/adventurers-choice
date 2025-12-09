import { GridPosition } from '../grid/Grid';

/**
 * Status of a planned path
 */
export type PathStatus = 'planning' | 'ready' | 'executing' | 'complete' | 'blocked' | 'conflicting';

/**
 * Represents a planned movement path for a character
 */
export interface PlannedPath {
  characterId: number;
  steps: GridPosition[];
  currentStepIndex: number;
  status: PathStatus;
}

/**
 * Create a new planned path for a character
 */
export function createPlannedPath(characterId: number): PlannedPath {
  return {
    characterId,
    steps: [],
    currentStepIndex: 0,
    status: 'planning',
  };
}

/**
 * Check if a path has any steps
 */
export function hasSteps(path: PlannedPath): boolean {
  return path.steps.length > 0;
}

/**
 * Check if a path is complete (all steps executed)
 */
export function isComplete(path: PlannedPath): boolean {
  return path.currentStepIndex >= path.steps.length;
}

/**
 * Get the next step position for a path
 */
export function getNextStep(path: PlannedPath): GridPosition | null {
  if (path.currentStepIndex < path.steps.length) {
    return path.steps[path.currentStepIndex];
  }
  return null;
}

/**
 * Get the current position in the path (where character should be after executing up to currentStepIndex)
 */
export function getCurrentPosition(path: PlannedPath, startPosition: GridPosition): GridPosition {
  if (path.currentStepIndex === 0) {
    return startPosition;
  }
  if (path.currentStepIndex <= path.steps.length) {
    return path.steps[path.currentStepIndex - 1];
  }
  return path.steps[path.steps.length - 1];
}

