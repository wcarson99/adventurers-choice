import React, { createContext, useContext, useState, ReactNode } from "react";

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
}

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  id: number;
  name: string;
  attributes: Attributes;
  archetype: string;
  gold: number;
  food: number;
}

import { World } from './ecs/World';
import { Grid } from './grid/Grid';
import { PositionComponent, RenderableComponent } from './ecs/Component';

// Define the Game State interface
interface GameState {
  currentView: GameView;
  activeMission?: Mission;
  party: Character[];
  world?: World;
  grid?: Grid;
}

// Define the Context interface
interface GameContextType extends GameState {
  setView: (view: GameView) => void;
  // Updated to target specific character
  updateCharacterResource: (charId: number, resource: 'gold' | 'food', amount: number) => void;
  startMission: (mission: Mission) => void;
  completeMission: () => void;
  setParty: (party: Character[]) => void;
  // Helpers to get totals
  getTotalGold: () => number;
  getTotalFood: () => number;
  consumeFood: (amount: number) => void;
}

// Default state
const initialState: GameState = {
  currentView: 'SPLASH',
  activeMission: undefined,
  party: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(initialState);

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
    const grid = new Grid(8, 8);

    // Spawn first character at 0,0
    if (state.party.length > 0) {
      const hero = state.party[0];
      const entityId = world.createEntity();
      world.addComponent(entityId, { type: 'Position', x: 0, y: 0 } as PositionComponent);
      world.addComponent(entityId, { type: 'Renderable', char: hero.name[0], color: '#f1c40f' } as RenderableComponent);
    }

    // Spawn Goal at 7,7
    const goalId = world.createEntity();
    world.addComponent(goalId, { type: 'Position', x: 7, y: 7 } as PositionComponent);
    world.addComponent(goalId, { type: 'Renderable', char: 'G', color: '#2ecc71' } as RenderableComponent);

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
      if (!prev.activeMission) return prev;
      
      // Distribute gold reward evenly (or to first char for MVP)
      // For MVP, let's give it to the first character
      const reward = prev.activeMission.rewardGold;
      
      return {
        ...prev,
        party: prev.party.map((c, i) => i === 0 ? { ...c, gold: c.gold + reward } : c),
        activeMission: undefined,
        currentView: 'TOWN',
        world: undefined,
        grid: undefined
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

  return (
    <GameContext.Provider value={{ 
      ...state, 
      setView, 
      updateCharacterResource, 
      startMission, 
      completeMission, 
      setParty,
      getTotalGold,
      getTotalFood,
      consumeFood
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
