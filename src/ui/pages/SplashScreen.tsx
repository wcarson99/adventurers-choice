import React from 'react';
import { useGame } from '../../game-engine/GameState';
import { theme } from '../styles/theme';

const SplashScreen: React.FC = () => {
  const { setView } = useGame();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '2rem', color: theme.colors.accentLight }}>Adventurer's Choice</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '3rem', fontStyle: 'italic' }}>
        Survive the Gauntlet. Manage your resources.
      </p>
      <button 
        onClick={() => setView('CHARACTER_CREATION')}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.5rem',
          backgroundColor: theme.colors.success,
          color: theme.colors.text,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.4)'
        }}
      >
        New Game
      </button>
    </div>
  );
};

export default SplashScreen;
