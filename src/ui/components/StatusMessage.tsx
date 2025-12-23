import React from 'react';
import { useGame } from '../../game-engine/GameState';
import { theme } from '../styles/theme';

export const StatusMessage: React.FC = () => {
  const { statusMessage, setStatusMessage, currentView } = useGame();

  if (!statusMessage) return null;

  // Don't show error, success, or info messages in MISSION view - they appear in the info panel instead
  if ((statusMessage.type === 'error' || statusMessage.type === 'success' || statusMessage.type === 'info') && currentView === 'MISSION') {
    return null;
  }

  const backgroundColor = 
    statusMessage.type === 'error' ? '#d32f2f' :
    statusMessage.type === 'success' ? theme.colors.success :
    theme.colors.accent;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10000,
      padding: '1rem 2rem',
      backgroundColor,
      color: '#fff',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      maxWidth: '90%',
      minWidth: '300px'
    }}>
      {statusMessage.text}
      <button
        onClick={() => setStatusMessage(null)}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          fontSize: '1.2rem',
          cursor: 'pointer',
          borderRadius: '4px',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: '1'
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

