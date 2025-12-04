
import React from 'react';
import { GameProvider, useGame } from '../game-engine/GameState';
import SplashScreen from './pages/SplashScreen';
import CharacterCreation from './pages/CharacterCreation';
import TownHub from './pages/TownHub';
import GeneralStore from './pages/GeneralStore';
import JobBoard from './pages/JobBoard';
import MissionView from './pages/MissionView';
import { StatusMessage } from './components/StatusMessage';

const GameViewSwitcher: React.FC = () => {
  const { currentView } = useGame();

  switch (currentView) {
    case 'SPLASH':
      return <SplashScreen />;
    case 'CHARACTER_CREATION':
      return <CharacterCreation />;
    case 'TOWN':
      return <TownHub />;
    case 'STORE':
      return <GeneralStore />;
    case 'JOB_BOARD':
      return <JobBoard />;
    case 'MISSION':
      return <MissionView />;
    default:
      return <div>Unknown View</div>;
  }
};

function App() {
  return (
    <GameProvider>
      <StatusMessage />
      <GameViewSwitcher />
    </GameProvider>
  );
}

export default App;

