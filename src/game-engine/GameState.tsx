import React, { createContext, useContext, useState, ReactNode } from "react";
import { theme } from '../ui/styles/theme';
import type { ScenarioType } from '../types/Scenario';

// Define the possible views in the game loop
export type GameView =
  | "SPLASH"
  | "CHARACTER_CREATION"
  | "TOWN"
  | "STORE"
  | "JOB_BOARD"
  | "MISSION";

// Define Mission interface
export interface Mission {
  id: string;
  title: string;
  description: string;
  days: number;
  rewardGold: number;
  rewardAp: number;
  encounterType: ScenarioType;
}

export interface Attributes {
  pwr: number;
  mov: number;
  inf: number;
  cre: number;
}

export interface Character {
  id: number;
  name: string;
  attributes: Attributes;
  archetype: string;
  gold: number;
  food: number;
  sprite: string;
}

import { World } from './ecs/World';
import { Grid } from './grid/Grid';
import { PositionComponent, RenderableComponent, AttributesComponent, PushableComponent } from './ecs/Component';
import type { Job } from '../jobs/Job';
import { JobLoader } from '../jobs/JobLoader';
import { ScenarioFactory } from '../scenarios/ScenarioFactory';

// Define the Game State interface
interface GameState {
  currentView: GameView;
  activeMission?: Mission;
  completedMissions: Mission[];
  party: Character[];
  world?: World;
  grid?: Grid;
  // Job support
  gameMode?: 'roguelike' | 'campaign';
  activeJob?: Job;
  currentScenarioIndex?: number;
}

export type StatusMessageType = 'error' | 'success' | 'info';

export interface StatusMessage {
  text: string;
  type: StatusMessageType;
}

// Define the Context interface
interface GameContextType extends GameState {
  setView: (view: GameView) => void;
  // Updated to target specific character
  updateCharacterResource: (charId: number, resource: 'gold' | 'food', amount: number) => void;
  startMission: (mission: Mission) => void;
  completeMission: () => void;
  turnInMission: (missionId: string) => void;
  setParty: (party: Character[]) => void;
  // Helpers to get totals
  getTotalGold: () => number;
  getTotalFood: () => number;
  consumeFood: (amount: number) => void;
  // Job support
  prepareJobCharacters: (jobId: string) => Promise<void>;
  startJob: (jobId: string, scenarioIndex?: number) => Promise<void>;
  nextScenario: () => void;
  // Status message
  statusMessage: StatusMessage | null;
  setStatusMessage: (message: StatusMessage | null) => void;
  showStatus: (text: string, type: StatusMessageType, duration?: number) => void;
}

// Default state
const initialState: GameState = {
  currentView: 'SPLASH',
  activeMission: undefined,
  completedMissions: [],
  party: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(initialState);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const setView = (view: GameView) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const updateCharacterResource = (charId: number, resource: 'gold' | 'food', amount: number) => {
    setState(prev => ({
      ...prev,
      party: prev.party.map(c => 
        c.id === charId ? { ...c, [resource]: c[resource] + amount } : c
      )
    }));
  };

  const startMission = (mission: Mission) => {
    const world = new World();
    const grid = new Grid(10, 10);

    // Spawn all party members in entrance zone (left side, rows 1-4)
    const entrancePositions = grid.getEntranceZonePositions();
    state.party.forEach((hero, index) => {
      if (index < entrancePositions.length) {
        const pos = entrancePositions[index];
        const entityId = world.createEntity();
        world.addComponent(entityId, { type: 'Position', x: pos.x, y: pos.y } as PositionComponent);
        world.addComponent(entityId, { 
          type: 'Renderable', 
          char: hero.name[0], 
          color: theme.colors.accent,
          sprite: hero.sprite 
        } as RenderableComponent);
        world.addComponent(entityId, {
          type: 'Attributes',
          pwr: hero.attributes.pwr,
          mov: hero.attributes.mov,
          inf: hero.attributes.inf,
          cre: hero.attributes.cre
        } as AttributesComponent);
      }
    });

    // Spawn pushable crates (30 lb each - pushable by PWR 3)
    // Simplified for testing: Place first crate directly in front of first character (warrior at 0,1)
    // Warrior at (0,1), crate at (1,1) - warrior can push it right to (2,1)
    const cratePositions = [
      { x: 1, y: 1 }, // Directly in front of warrior (0,1) - easy push test
      { x: 5, y: 4 }, // Center, can push in all directions
      { x: 7, y: 5 }  // Center-right, can push in all directions
    ];

    cratePositions.forEach(pos => {
      // Only place if it's in playable area and not occupied
      if (grid.isPlayableArea(pos.x, pos.y)) {
        const crateId = world.createEntity();
        world.addComponent(crateId, { type: 'Position', x: pos.x, y: pos.y } as PositionComponent);
        world.addComponent(crateId, { 
          type: 'Renderable', 
          char: 'C', 
          color: '#8B4513', // Brown for crate
          sprite: '/assets/items/crate.png'
        } as RenderableComponent);
        world.addComponent(crateId, {
          type: 'Pushable',
          weight: 30, // 30 lb - pushable by PWR 3 (cost: Math.ceil(30/3) = 10 stamina)
          sprite: '/assets/items/crate.png'
        } as PushableComponent);
      }
    });

    setState(prev => ({ 
      ...prev, 
      activeMission: mission,
      currentView: 'MISSION',
      world,
      grid
    }));
  };

  const completeMission = () => {
    setState(prev => {
      // Handle job scenario completion
      // Check for campaign mode OR if we have an activeJob (fallback for state issues)
      if ((prev.gameMode === 'campaign' || prev.activeJob) && prev.activeJob && prev.currentScenarioIndex !== undefined) {
        console.log('🟡 Handling job completion', {
          scenarioIndex: prev.currentScenarioIndex,
          totalScenarios: prev.activeJob.scenarios.length
        });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameState.tsx:192',message:'Handling job completion',data:{scenarioIndex:prev.currentScenarioIndex,totalScenarios:prev.activeJob.scenarios.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        const scenarioIndex = prev.currentScenarioIndex;
        const totalScenarios = prev.activeJob.scenarios.length;
        
        // Check if there are more scenarios
        if (scenarioIndex < totalScenarios - 1) {
          // Load next scenario immediately
          const nextIndex = scenarioIndex + 1;
          const scenario = prev.activeJob.scenarios[nextIndex];
          const { world, grid, party } = ScenarioFactory.createFromScenario(scenario);
          
          return {
            ...prev,
            currentScenarioIndex: nextIndex,
            party: party, // Update party (in case characters changed)
            world,
            grid,
            // Stay in MISSION view
          };
        } else {
          // Job complete
          showStatus('Job Complete!', 'success', 3000);
          return {
            ...prev,
            activeJob: undefined,
            currentScenarioIndex: undefined,
            gameMode: undefined,
            currentView: 'SPLASH',
            world: undefined,
            grid: undefined
          };
        }
      }
      
      // Handle roguelike mission completion
      if (!prev.activeMission) {
        return prev;
      }
      
      // Add mission to completed list (but don't give reward yet)
      return {
        ...prev,
        completedMissions: [...prev.completedMissions, prev.activeMission],
        activeMission: undefined,
        currentView: 'TOWN',
        world: undefined,
        grid: undefined
      };
    });
  };

  const prepareJobCharacters = async (jobId: string) => {
    try {
      // Load job
      const job = await JobLoader.loadJob(jobId);
      
      // Get first scenario to extract characters
      const scenario = job.scenarios[0];
      
      // Create party from scenario (but don't create world/grid yet)
      const { party } = ScenarioFactory.createFromScenario(scenario);

      setState(prev => ({
        ...prev,
        gameMode: 'campaign',
        activeJob: job,
        currentScenarioIndex: 0,
        party: party, // Set party from job for character creation screen
        // Don't set world/grid yet - wait until they click "Embark"
        activeMission: undefined, // Clear any active mission
      }));
    } catch (error) {
      console.error('Failed to prepare job:', error);
      showStatus(`Failed to load job: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  };

  const startJob = async (jobId: string, scenarioIndex: number = 0) => {
    try {
      // Load job
      const job = await JobLoader.loadJob(jobId);
      
      // Validate scenario index
      if (scenarioIndex < 0 || scenarioIndex >= job.scenarios.length) {
        throw new Error(`Invalid scenario index: ${scenarioIndex}`);
      }

      // Get scenario definition
      const scenario = job.scenarios[scenarioIndex];
      
      // Create world, grid, and party from scenario
      const { world, grid, party } = ScenarioFactory.createFromScenario(scenario);

      setState(prev => ({
        ...prev,
        gameMode: 'campaign',
        activeJob: job,
        currentScenarioIndex: scenarioIndex,
        party: party, // Set party from job
        world,
        grid,
        currentView: 'MISSION',
        activeMission: undefined, // Clear any active mission
      }));
    } catch (error) {
      console.error('Failed to start job:', error);
      showStatus(`Failed to load job: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const nextScenario = () => {
    setState(prev => {
      if (prev.gameMode !== 'campaign' || !prev.activeJob || prev.currentScenarioIndex === undefined) {
        return prev;
      }

      const nextIndex = prev.currentScenarioIndex + 1;
      if (nextIndex >= prev.activeJob.scenarios.length) {
        // Job complete
        return {
          ...prev,
          activeJob: undefined,
          currentScenarioIndex: undefined,
          gameMode: undefined,
          currentView: 'SPLASH',
          world: undefined,
          grid: undefined
        };
      }

      // Load next scenario
      const scenario = prev.activeJob.scenarios[nextIndex];
      const { world, grid, party } = ScenarioFactory.createFromScenario(scenario);

      return {
        ...prev,
        currentScenarioIndex: nextIndex,
        party: party, // Update party (in case characters changed)
        world,
        grid,
      };
    });
  };

  const turnInMission = (missionId: string) => {
    setState(prev => {
      const mission = prev.completedMissions.find(m => m.id === missionId);
      if (!mission) return prev;
      
      // Give reward when turning in
      const reward = mission.rewardGold;
      
      return {
        ...prev,
        party: prev.party.map((c, i) => i === 0 ? { ...c, gold: c.gold + reward } : c),
        completedMissions: prev.completedMissions.filter(m => m.id !== missionId)
      };
    });
  };

  const setParty = (party: Character[]) => {
    setState(prev => ({ ...prev, party }));
  };

  const getTotalGold = () => state.party.reduce((sum, c) => sum + c.gold, 0);
  const getTotalFood = () => state.party.reduce((sum, c) => sum + c.food, 0);

  const consumeFood = (amount: number) => {
    let remaining = amount;
    const newParty = state.party.map(char => {
      if (remaining <= 0) return char;
      const consume = Math.min(char.food, remaining);
      remaining -= consume;
      return { ...char, food: char.food - consume };
    });
    setState(prev => ({ ...prev, party: newParty }));
  };

  const showStatus = (text: string, type: StatusMessageType, duration: number = 3000) => {
    setStatusMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => setStatusMessage(null), duration);
    }
  };

  return (
    <GameContext.Provider value={{ 
      ...state, 
      setView, 
      updateCharacterResource, 
      startMission, 
      completeMission,
      turnInMission, 
      setParty,
      getTotalGold,
      getTotalFood,
      consumeFood,
      prepareJobCharacters,
      startJob,
      nextScenario,
      statusMessage,
      setStatusMessage,
      showStatus
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
