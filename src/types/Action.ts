import { World } from '../game-engine/ecs/World';
import { Grid } from '../game-engine/grid/Grid';
import { ActionPointSystem } from '../game-engine/encounters/ActionPointSystem';
import { TurnSystem } from '../game-engine/encounters/TurnSystem';
import { ActionExecutionResult } from '../game-engine/encounters/ActionExecutionSystem';

/**
 * Context required for action execution and validation
 */
export interface ActionContext {
  world: World;
  grid: Grid;
  characterId: number;
  apSystem: ActionPointSystem;
  turnSystem: TurnSystem;
}

/**
 * Requirements for an action (attribute and situational requirements)
 */
export interface ActionRequirements {
  attributes?: { [key: string]: number }; // e.g., { pwr: 3 }
  situational?: string[]; // e.g., ['facingTarget', 'pushableObject']
}

/**
 * Abstract base class for all game actions
 * 
 * Each action type encapsulates:
 * - Availability restrictions (AP costs, attribute requirements, situational checks)
 * - Cost calculation
 * - Validation logic
 * - Action-specific data
 */
export abstract class Action {
  /**
   * Check if this action can be executed given the current context
   * 
   * @param context - The action context
   * @returns True if the action can be executed, false otherwise
   */
  abstract canExecute(context: ActionContext): boolean;

  /**
   * Execute this action
   * 
   * @param context - The action context
   * @returns Execution result with success status and remaining AP
   */
  abstract execute(context: ActionContext): ActionExecutionResult;

  /**
   * Get the AP cost of this action
   * 
   * @returns The AP cost
   */
  abstract getCost(): number;

  /**
   * Get the display name of this action
   * 
   * @returns The action name
   */
  abstract getName(): string;

  /**
   * Get the requirements for this action
   * 
   * @returns Action requirements (attributes, situational)
   */
  abstract getRequirements(): ActionRequirements;
}

/**
 * Legacy Action type (deprecated)
 * @deprecated Use Action class hierarchy instead
 */
export type ActionType = {
  type: string;
  [key: string]: unknown;
};

