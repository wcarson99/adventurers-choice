import React from 'react';
import { useGame } from '../../game-engine/GameState';

const SplashScreen: React.FC = () => {
  const { setView } = useGame();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#2c3e50', // Dark background
      color: '#ecf0f1', // Light text
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '2rem', color: '#f1c40f' }}>Adventurer's Choice</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '3rem', fontStyle: 'italic' }}>
        Survive the Gauntlet. Manage your resources.
      </p>
      <button 
        onClick={() => setView('CHARACTER_CREATION')}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.5rem',
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        New Game
      </button>
    </div>
  );
};

export default SplashScreen;
