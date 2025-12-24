/**
 * Scenario configuration types
 * These types represent the configuration data that is fed into minigame instances
 */

/**
 * Base configuration for grid-based scenarios
 */
export interface GridScenarioConfig {
  grid: {
    width: number;
    height: number;
  };
  entities: EntityPlacement[];
  winConditions: WinCondition[];
}

/**
 * Entity placement in a scenario
 */
export interface EntityPlacement {
  type: 'character' | 'crate' | 'trap' | 'obstacle';
  position: { x: number; y: number };
  properties: EntityProperties;
}

/**
 * Entity properties
 */
export interface EntityProperties {
  // Character properties
  name?: string;
  archetype?: string;
  attributes?: {
    pwr: number;
    mov: number;
    inf: number;
    cre: number;
  };
  sprite?: string;
  gold?: number;
  food?: number;
  
  // Crate/Item properties
  weight?: number;
  
  // Generic properties
  [key: string]: any;
}

/**
 * Win condition
 */
export interface WinCondition {
  type: 'allCharactersInExit' | 'allCharactersAlive' | 'custom';
  description: string;
}

/**
 * Configuration for combat scenarios
 * Extends GridScenarioConfig with combat-specific settings
 */
export interface CombatScenarioConfig extends GridScenarioConfig {
  allowFleeing?: boolean; // Whether players can flee from combat
}

/**
 * Configuration for obstacle scenarios
 * Extends GridScenarioConfig with obstacle-specific settings (e.g., turn limits)
 */
export interface ObstacleScenarioConfig extends GridScenarioConfig {
  maxTurns?: number; // Optional turn limit for time pressure
}

/**
 * Configuration for trading scenarios
 * Trading scenarios may not use a grid, so this is a separate interface
 */
export interface TradingScenarioConfig {
  // Trading-specific configuration
  // This can be extended as trading scenarios are implemented
}

