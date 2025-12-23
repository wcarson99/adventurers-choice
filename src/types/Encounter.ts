/**
 * Encounter type definitions using discriminated unions
 * This provides type-safe polymorphism for different minigame/encounter types
 */

/**
 * Stat requirement for encounters
 */
export interface StatRequirement {
  attribute: 'pwr' | 'mov' | 'inf' | 'cre';
  minimum: number;
}

/**
 * Combat encounter - requires combat-focused attributes
 */
export interface CombatEncounter {
  type: 'combat';
  requiredStats: StatRequirement[];
  requiredSkills?: string[];
}

/**
 * Obstacle encounter - requires puzzle-solving and physical attributes
 */
export interface ObstacleEncounter {
  type: 'obstacle';
  requiredStats: StatRequirement[];
  requiredSkills?: string[];
}

/**
 * Trading encounter - requires social and mental attributes
 */
export interface TradingEncounter {
  type: 'trading';
  requiredStats: StatRequirement[];
  requiredSkills?: string[];
}

/**
 * Discriminated union of all encounter types
 * To add a new encounter type, add a new interface and union member here
 */
export type EncounterType =
  | CombatEncounter
  | ObstacleEncounter
  | TradingEncounter;

/**
 * Type guard for combat encounters
 */
export function isCombatEncounter(encounter: EncounterType): encounter is CombatEncounter {
  return encounter.type === 'combat';
}

/**
 * Type guard for obstacle encounters
 */
export function isObstacleEncounter(encounter: EncounterType): encounter is ObstacleEncounter {
  return encounter.type === 'obstacle';
}

/**
 * Type guard for trading encounters
 */
export function isTradingEncounter(encounter: EncounterType): encounter is TradingEncounter {
  return encounter.type === 'trading';
}

/**
 * Get display name for encounter type
 */
export function getEncounterTypeDisplayName(encounter: EncounterType): string {
  switch (encounter.type) {
    case 'combat':
      return 'Combat';
    case 'obstacle':
      return 'Obstacle';
    case 'trading':
      return 'Trading';
    default:
      // Exhaustiveness check - TypeScript will error if we miss a case
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = encounter;
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





