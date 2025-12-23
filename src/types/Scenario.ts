/**
 * Scenario type definitions using discriminated unions
 * This provides type-safe polymorphism for different minigame/scenario types
 */

/**
 * Stat requirement for scenarios
 */
export interface StatRequirement {
  attribute: 'pwr' | 'mov' | 'inf' | 'cre';
  minimum: number;
}

/**
 * Combat scenario - requires combat-focused attributes
 */
export interface CombatScenario {
  type: 'combat';
  requiredStats: StatRequirement[];
  requiredSkills?: string[];
}

/**
 * Obstacle scenario - requires puzzle-solving and physical attributes
 */
export interface ObstacleScenario {
  type: 'obstacle';
  requiredStats: StatRequirement[];
  requiredSkills?: string[];
}

/**
 * Trading scenario - requires social and mental attributes
 */
export interface TradingScenario {
  type: 'trading';
  requiredStats: StatRequirement[];
  requiredSkills?: string[];
}

/**
 * Discriminated union of all scenario types
 * To add a new scenario type, add a new interface and union member here
 */
export type ScenarioType =
  | CombatScenario
  | ObstacleScenario
  | TradingScenario;

/**
 * Type guard for combat scenarios
 */
export function isCombatScenario(scenario: ScenarioType): scenario is CombatScenario {
  return scenario.type === 'combat';
}

/**
 * Type guard for obstacle scenarios
 */
export function isObstacleScenario(scenario: ScenarioType): scenario is ObstacleScenario {
  return scenario.type === 'obstacle';
}

/**
 * Type guard for trading scenarios
 */
export function isTradingScenario(scenario: ScenarioType): scenario is TradingScenario {
  return scenario.type === 'trading';
}

/**
 * Get display name for scenario type
 */
export function getScenarioTypeDisplayName(scenario: ScenarioType): string {
  switch (scenario.type) {
    case 'combat':
      return 'Combat';
    case 'obstacle':
      return 'Obstacle';
    case 'trading':
      return 'Trading';
    default:
      // Exhaustiveness check - TypeScript will error if we miss a case
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = scenario;
      void _exhaustive; // Suppress unused variable warning
      return 'Unknown';
  }
}

/**
 * Get short abbreviation for stat attribute
 */
export function getStatAbbreviation(attribute: StatRequirement['attribute']): string {
  const abbreviations: Record<StatRequirement['attribute'], string> = {
    pwr: 'PWR',
    mov: 'MOV',
    inf: 'INF',
    cre: 'CRE',
  };
  return abbreviations[attribute];
}

