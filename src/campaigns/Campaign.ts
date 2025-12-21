/**
 * Campaign type definitions
 */

export interface Campaign {
  id: string;
  name: string;
  description: string;
  encounters: EncounterDefinition[];
}

export interface EncounterDefinition {
  id: string;
  name: string;
  description: string;
  testInstructions?: string; // For AI testers
  grid: GridConfig;
  entities: EntityPlacement[];
  winConditions: WinCondition[];
}

export interface GridConfig {
  width: number;
  height: number;
}

export interface EntityPlacement {
  type: 'character' | 'crate' | 'trap' | 'obstacle';
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
 * Manifest file structure for campaign discovery
 */
export interface CampaignManifest {
  campaigns: CampaignManifestEntry[];
}

export interface CampaignManifestEntry {
  id: string;
  name: string;
  description: string;
  file: string; // Relative path to campaign JSON file
}

