import React from 'react';
import { useGame, Mission } from '../../game-engine/GameState';
import { theme } from '../styles/theme';

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
  const { setView, startMission, getTotalFood, completedMissions, turnInMission } = useGame();

  const handleAccept = (mission: Mission) => {
    const foodCost = mission.days * 4; // 4 characters
    const totalFood = getTotalFood();
    
    if (totalFood >= foodCost) {
      startMission(mission);
    } else {
      alert(`Not enough food! You need ${foodCost} food for this ${mission.days}-day mission. You have ${totalFood}.`);
    }
  };

  const handleTurnIn = (missionId: string) => {
    turnInMission(missionId);
    alert('Mission complete! Gold reward received.');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: 'sans-serif',
      padding: '2rem',
      overflowY: 'auto'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: theme.colors.accentLight }}>Job Board</h2>
      
      {/* Completed Missions Section */}
      {completedMissions.length > 0 && (
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: theme.colors.accent }}>✅ Completed Missions - Turn In For Reward!</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '2rem'
          }}>
            {completedMissions.map(mission => (
              <div key={mission.id} style={{
                backgroundColor: theme.colors.success,
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: `2px solid ${theme.colors.accent}`
              }}>
                <div>
                  <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>{mission.title}</h3>
                  <div style={{ marginBottom: '1rem' }}>💰 Reward: {mission.rewardGold} Gold</div>
                </div>
                
                <button 
                  onClick={() => handleTurnIn(mission.id)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.1rem',
                    backgroundColor: theme.colors.accent,
                    color: theme.colors.background,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginTop: '1rem'
                  }}
                >
                  Turn In Mission
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available Missions Section */}
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Available Missions</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '2rem'
        }}>
          {MOCK_MISSIONS.map(mission => (
            <div key={mission.id} style={{
              backgroundColor: theme.colors.cardBackground,
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ color: theme.colors.accentLight, marginBottom: '0.5rem' }}>{mission.title}</h3>
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
                  backgroundColor: theme.colors.success,
                  color: theme.colors.text,
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
      </div>

      <button 
        onClick={() => setView('TOWN')}
        style={{
          marginTop: '3rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          backgroundColor: theme.colors.cardBackground,
          color: theme.colors.text,
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
