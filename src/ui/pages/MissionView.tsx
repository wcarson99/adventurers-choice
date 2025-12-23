import React from 'react';
import { useGame } from '../../game-engine/GameState';
import { EncounterView } from '../components/EncounterView';

export const MissionView: React.FC = () => {
  const { activeMission, completeMission, consumeFood, activeCampaign, currentEncounterIndex: _currentEncounterIndex } = useGame();

  const handleComplete = () => {
    if (activeMission) {
      consumeFood(activeMission.days * 4); // Consume food from the party
      completeMission();
    } else {
      // Campaign mode - just complete the encounter
      completeMission();
    }
  };

  // Show encounter view if we have either an active mission OR an active campaign
  if (!activeMission && !activeCampaign) {
    return <div>No active mission or campaign</div>;
  }

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
