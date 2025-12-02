import React from 'react';
import { useGame } from '../../game-engine/GameState';
import { EncounterView } from '../components/EncounterView';

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1c40f' }}>{activeMission.title}</h2>
      
      <p style={{ fontSize: '1.2rem', color: '#bdc3c7' }}>
        Objective: {activeMission.description}
      </p>
      
      <EncounterView />

      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={handleComplete}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Complete Mission (Debug)
        </button>
      </div>
    </div>
  );
};

export default MissionView;
