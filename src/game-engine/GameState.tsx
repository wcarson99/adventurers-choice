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
}

// Define the Game State interface
interface GameState {
  currentView: GameView;
  gold: number;
  food: number;
  activeMission?: Mission;
  party: Character[];
}

// Define the Context interface
interface GameContextType extends GameState {
  setView: (view: GameView) => void;
  updateResource: (resource: 'gold' | 'food', amount: number) => void;
  startMission: (mission: Mission) => void;
  completeMission: () => void;
  setParty: (party: Character[]) => void;
}

// Default state
const initialState: GameState = {
  currentView: 'SPLASH',
  gold: 80,
  food: 0,
  activeMission: undefined,
  party: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(initialState);

  const setView = (view: GameView) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const updateResource = (resource: 'gold' | 'food', amount: number) => {
    setState(prev => ({ ...prev, [resource]: prev[resource] + amount }));
  };

  const startMission = (mission: Mission) => {
    setState(prev => ({ 
      ...prev, 
      activeMission: mission,
      currentView: 'MISSION'
    }));
  };

  const completeMission = () => {
    setState(prev => {
      if (!prev.activeMission) return prev;
      return {
        ...prev,
        gold: prev.gold + prev.activeMission.rewardGold,
        // AP would be added here too
        activeMission: undefined,
        currentView: 'TOWN'
      };
    });
  };

  const setParty = (party: Character[]) => {
    setState(prev => ({ ...prev, party }));
  };

  return (
    <GameContext.Provider value={{ ...state, setView, updateResource, startMission, completeMission, setParty }}>
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
