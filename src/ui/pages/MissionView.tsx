import React from 'react';
import { useGame } from '../../game-engine/GameState';
import { EncounterView } from '../components/EncounterView';
import { theme } from '../styles/theme';

export const MissionView: React.FC = () => {
  const { activeMission, completeMission, consumeFood } = useGame();

  const handleComplete = () => {
    if (activeMission) {
      consumeFood(activeMission.days * 4); // Consume food from the party
      completeMission();
    }
  };

  if (!activeMission) return <div>No active mission</div>;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <EncounterView 
        activeMission={activeMission} 
        onCompleteMission={handleComplete} 
      />
    </div>
  );
};

export default MissionView;
