import { BaseMiniGame } from './BaseMiniGame';
import { CombatMiniGame } from './CombatMiniGame';
import { ObstacleMiniGame } from './ObstacleMiniGame';
import type { ScenarioDefinition } from '../jobs/Job';
import { ScenarioFactory } from '../scenarios/ScenarioFactory';
import type { CombatScenario } from '../types/Scenario';
import type { ObstacleScenario } from '../types/Scenario';
import type { CombatScenarioConfig } from '../types/ScenarioConfig';
import type { ObstacleScenarioConfig } from '../types/ScenarioConfig';

/**
 * Factory for creating mini game instances from scenario definitions
 */
export class MiniGameFactory {
  /**
   * Create a mini game instance from a scenario definition
   * 
   * @param scenario - The scenario definition containing minigameType and config
   * @returns A mini game instance ready to be initialized
   */
  static createFromScenario(scenario: ScenarioDefinition): BaseMiniGame {
    // Create World and Grid from scenario
    const { world, grid } = ScenarioFactory.createFromScenario(scenario);

    // Create the appropriate minigame based on minigameType
    switch (scenario.minigameType) {
      case 'combat': {
        const scenarioType: CombatScenario = {
          type: 'combat',
          requiredStats: [], // TODO: Extract from scenario definition if needed
        };
        const miniGame = new CombatMiniGame(scenarioType, world, grid);
        
        // Initialize with config if provided
        if (scenario.config) {
          miniGame.initialize(scenario.config as CombatScenarioConfig);
        } else {
          miniGame.initialize();
        }
        
        return miniGame;
      }

      case 'obstacle': {
        const scenarioType: ObstacleScenario = {
          type: 'obstacle',
          requiredStats: [], // TODO: Extract from scenario definition if needed
        };
        
        // Extract maxTurns from config if provided
        let maxTurns: number | undefined;
        if (scenario.config) {
          const config = scenario.config as ObstacleScenarioConfig;
          maxTurns = config.maxTurns;
        }
        
        const miniGame = new ObstacleMiniGame(scenarioType, world, grid, maxTurns);
        
        // Initialize with config if provided
        if (scenario.config) {
          miniGame.initialize(scenario.config);
        } else {
          miniGame.initialize();
        }
        
        return miniGame;
      }

      case 'trading': {
        // TODO: Implement TradingMiniGame when ready
        throw new Error('Trading mini games are not yet implemented');
      }

      default: {
        // Exhaustiveness check
        const _exhaustive: never = scenario.minigameType;
        throw new Error(`Unknown minigame type: ${_exhaustive}`);
      }
    }
  }
}

