import React from 'react';
import { useGame, Mission } from '../../game-engine/GameState';

const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Clear the Goblin Cave',
    description: 'A local cave is infested with goblins. Clear them out.',
    days: 3,
    rewardGold: 15,
    rewardAp: 3
  },
  {
    id: 'm2',
    title: 'Rescue the Caravan',
    description: 'Merchants are stuck on the road. Help them.',
    days: 4,
    rewardGold: 20,
    rewardAp: 4
  },
  {
    id: 'm3',
    title: 'Explore Ancient Ruins',
    description: 'Rumors of treasure in the old ruins.',
    days: 5,
    rewardGold: 25,
    rewardAp: 5
  }
];

const JobBoard: React.FC = () => {
  const { setView, startMission, food } = useGame();

  const handleAccept = (mission: Mission) => {
    const foodCost = mission.days * 4; // 4 characters
    if (food >= foodCost) {
      startMission(mission);
    } else {
      alert(`Not enough food! You need ${foodCost} food for this ${mission.days}-day mission.`);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#8e44ad', // Job board color
      color: '#ecf0f1',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Job Board</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '2rem',
        width: '100%',
        maxWidth: '1200px'
      }}>
        {MOCK_MISSIONS.map(mission => (
          <div key={mission.id} style={{
            backgroundColor: '#2c3e50',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ color: '#f1c40f', marginBottom: '0.5rem' }}>{mission.title}</h3>
              <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>{mission.description}</p>
              <div style={{ marginBottom: '0.5rem' }}>⏳ Duration: {mission.days} Days</div>
              <div style={{ marginBottom: '0.5rem' }}>🍖 Food Cost: {mission.days * 4}</div>
              <div style={{ marginBottom: '1rem' }}>💰 Reward: {mission.rewardGold} Gold</div>
            </div>
            
            <button 
              onClick={() => handleAccept(mission)}
              style={{
                padding: '1rem',
                fontSize: '1.1rem',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Accept Mission
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setView('TOWN')}
        style={{
          marginTop: '3rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          backgroundColor: '#95a5a6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Back to Town
      </button>
    </div>
  );
};

export default JobBoard;
