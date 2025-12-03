import React, { useState } from 'react';
import { useGame } from '../../game-engine/GameState';
import { theme } from '../styles/theme';

const GeneralStore: React.FC = () => {
  const { setView, party, updateCharacterResource } = useGame();
  const [selectedCharId, setSelectedCharId] = useState<number>(party[0]?.id || 0);

  const selectedChar = party.find(c => c.id === selectedCharId);

  const handleBuyFood = () => {
    if (selectedChar && selectedChar.gold >= 1) {
      updateCharacterResource(selectedChar.id, 'gold', -1);
      updateCharacterResource(selectedChar.id, 'food', 4);
    } else {
      alert("This character doesn't have enough gold!");
    }
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
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: theme.colors.accentLight }}>General Store</h2>
      
      {/* Character Selector */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        {party.map(char => (
          <button
            key={char.id}
            onClick={() => setSelectedCharId(char.id)}
            style={{
              padding: '1rem',
              backgroundColor: selectedCharId === char.id ? theme.colors.accent : theme.colors.cardBackground,
              color: selectedCharId === char.id ? theme.colors.background : theme.colors.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {char.name}
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>💰 {char.gold} | 🍖 {char.food}</div>
          </button>
        ))}
      </div>

      <div style={{
        backgroundColor: theme.colors.accent,
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        textAlign: 'center',
        width: '400px',
        color: theme.colors.background
      }}>
        <h3>Travel Rations</h3>
        <p>4 Units of Food for 1 Gold</p>
        
        {selectedChar && (
          <div style={{ margin: '1rem 0', fontStyle: 'italic' }}>
            Buying for: <strong>{selectedChar.name}</strong>
          </div>
        )}

        <button 
          onClick={handleBuyFood}
          disabled={!selectedChar || selectedChar.gold < 1}
          style={{
            marginTop: '1rem',
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: selectedChar && selectedChar.gold >= 1 ? theme.colors.success : theme.colors.cardBackground,
            color: theme.colors.text,
            border: 'none',
            borderRadius: '4px',
            cursor: selectedChar && selectedChar.gold >= 1 ? 'pointer' : 'not-allowed'
          }}
        >
          Buy Rations (1 Gold)
        </button>
      </div>

      <button 
        onClick={() => setView('TOWN')}
        style={{
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

export default GeneralStore;
