/**
 * Job type definitions
 */

export interface Job {
  id: string;
  name: string;
  description: string;
  scenarios: ScenarioDefinition[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  testInstructions?: string; // For AI testers
  minigameType: 'combat' | 'obstacle' | 'trading';
  grid: GridConfig;
  entities: EntityPlacement[];
  winConditions: WinCondition[];
  config?: unknown; // Scenario-specific configuration (e.g., maxTurns for obstacle scenarios)
}

export interface GridConfig {
  width: number;
  height: number;
}

export interface EntityPlacement {
  type: 'character' | 'crate' | 'trap' | 'obstacle' | 'npc' | 'enemy';
  position: { x: number; y: number };
  properties: EntityProperties;
}

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

export interface WinCondition {
  type: 'allCharactersInExit' | 'allCharactersAlive' | 'custom';
  description: string;
}

/**
 * Manifest file structure for job discovery
 */
export interface JobManifest {
  jobs: JobManifestEntry[];
}

export interface JobManifestEntry {
  id: string;
  name: string;
  description: string;
  file: string; // Relative path to job JSON file
}

