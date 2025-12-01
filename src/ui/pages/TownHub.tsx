import React from 'react';
import { useGame } from '../../game-engine/GameState';

const TownHub: React.FC = () => {
  const { setView, gold, food } = useGame();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#7f8c8d', // Greyish town color
      color: '#ecf0f1',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '2rem',
        fontSize: '1.2rem',
        backgroundColor: '#2c3e50',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <span>💰 Gold: {gold}</span>
        <span>🍖 Food: {food}</span>
      </div>

      <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', color: '#f1c40f' }}>Riverside Village</h2>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <button 
          onClick={() => setView('STORE')}
          style={{
            padding: '2rem',
            fontSize: '1.5rem',
            backgroundColor: '#e67e22',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '200px'
          }}
        >
          General Store
        </button>

        <button 
          onClick={() => setView('JOB_BOARD')}
          style={{
            padding: '2rem',
            fontSize: '1.5rem',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '200px'
          }}
        >
          Job Board
        </button>

        <button 
          onClick={() => alert('Resting... (Coming Soon)')}
          style={{
            padding: '2rem',
            fontSize: '1.5rem',
            backgroundColor: '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '200px'
          }}
        >
          Rest at Inn
        </button>
      </div>
    </div>
  );
};

export default TownHub;
