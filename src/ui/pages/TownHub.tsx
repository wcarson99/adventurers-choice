import React from 'react';
import { useGame } from '../../game-engine/GameState';
import { theme } from '../styles/theme';

const TownHub: React.FC = () => {
  const { setView, getTotalGold, getTotalFood } = useGame();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '2rem',
        fontSize: '1.2rem',
        backgroundColor: theme.colors.cardBackground,
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <span>💰 Gold: {getTotalGold()}</span>
        <span>🍖 Food: {getTotalFood()}</span>
      </div>

      <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', color: theme.colors.accentLight }}>Riverside Village</h2>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <button 
          onClick={() => setView('STORE')}
          style={{
            padding: '2rem',
            fontSize: '1.5rem',
            backgroundColor: theme.colors.accent,
            color: theme.colors.background,
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
            backgroundColor: theme.colors.success,
            color: theme.colors.text,
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
            backgroundColor: theme.colors.cardBackground,
            color: theme.colors.text,
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
