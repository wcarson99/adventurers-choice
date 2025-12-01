import React from 'react';
import { useGame } from '../../game-engine/GameState';

const GeneralStore: React.FC = () => {
  const { setView, gold, food, updateResource } = useGame();

  const handleBuyFood = () => {
    if (gold >= 1) {
      updateResource('gold', -1);
      updateResource('food', 4);
    } else {
      alert("Not enough gold!");
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#d35400', // Store color
      color: '#ecf0f1',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>General Store</h2>
      
      <div style={{ 
        fontSize: '1.5rem', 
        marginBottom: '2rem',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <div>Your Gold: {gold}</div>
        <div>Your Food: {food}</div>
      </div>

      <div style={{
        backgroundColor: '#e67e22',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h3>Travel Rations</h3>
        <p>4 Units of Food for 1 Gold</p>
        <button 
          onClick={handleBuyFood}
          style={{
            marginTop: '1rem',
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
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

export default GeneralStore;
