import React, { useState, useEffect } from 'react';
import { useGame, Character, Attributes } from '../../game-engine/GameState';

// Helper to generate random stats summing to 18, max 5, min 1
const generateAttributes = (): Attributes => {
  const attrs: (keyof Attributes)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const values: Record<string, number> = { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 };
  let pointsRemaining = 18 - 6; // Start with 1 in each, distribute remaining 12

  while (pointsRemaining > 0) {
    const randomAttr = attrs[Math.floor(Math.random() * attrs.length)];
    if (values[randomAttr] < 5) {
      values[randomAttr]++;
      pointsRemaining--;
    }
  }

  return values as unknown as Attributes;
};

const getArchetype = (attr: Attributes): string => {
  const maxVal = Math.max(...Object.values(attr));
  const highest = Object.entries(attr).filter(([_, v]) => v === maxVal).map(([k]) => k);
  
  if (highest.includes('str')) return 'Vanguard';
  if (highest.includes('dex')) return 'Scout';
  if (highest.includes('int')) return 'Scholar';
  if (highest.includes('wis')) return 'Survivalist';
  if (highest.includes('cha')) return 'Leader';
  if (highest.includes('con')) return 'Guardian';
  return 'Adventurer';
};

const CharacterCard: React.FC<{ 
  char: Character; 
  onUpdate: (c: Character) => void; 
  onReroll: () => void 
}> = ({ char, onUpdate, onReroll }) => {
  
  const statColor = (val: number) => {
    if (val === 5) return '#f1c40f'; // Gold for max
    if (val >= 3) return '#2ecc71'; // Green for good
    return '#95a5a6'; // Grey for average/low
  };

  return (
    <div style={{
      backgroundColor: '#2c3e50',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      width: '250px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: '#bdc3c7', marginBottom: '0.2rem' }}>Name</label>
        <input 
          type="text" 
          value={char.name}
          onChange={(e) => onUpdate({ ...char, name: e.target.value })}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1.1rem',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#34495e',
            color: 'white'
          }}
        />
      </div>

      <div style={{ 
        textAlign: 'center', 
        fontSize: '1.2rem', 
        fontWeight: 'bold', 
        color: '#3498db',
        borderBottom: '1px solid #34495e',
        paddingBottom: '0.5rem'
      }}>
        {char.archetype}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {Object.entries(char.attributes).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.9rem', color: '#95a5a6' }}>{key}</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: i <= val ? statColor(val) : '#34495e'
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={onReroll}
        style={{
          padding: '0.5rem',
          backgroundColor: '#e67e22',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '0.5rem',
          fontSize: '0.9rem'
        }}
      >
        🎲 Reroll Stats
      </button>
    </div>
  );
};

const CharacterCreation: React.FC = () => {
  const { setView, setParty } = useGame();
  const [characters, setCharacters] = useState<Character[]>([]);

  // Initialize characters on mount
  useEffect(() => {
    const initialChars: Character[] = Array.from({ length: 4 }).map((_, i) => {
      const attrs = generateAttributes();
      return {
        id: i + 1,
        name: `Hero ${i + 1}`,
        attributes: attrs,
        archetype: getArchetype(attrs)
      };
    });
    setCharacters(initialChars);
  }, []);

  const handleUpdate = (updatedChar: Character) => {
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const handleReroll = (id: number) => {
    setCharacters(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newAttrs = generateAttributes();
      return { ...c, attributes: newAttrs, archetype: getArchetype(newAttrs) };
    }));
  };

  const handleEmbark = () => {
    setParty(characters);
    setView('TOWN');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f1c40f' }}>Assemble Your Party</h2>
      <p style={{ marginBottom: '3rem', fontSize: '1.2rem', color: '#bdc3c7' }}>
        Roll for stats. Ensure your party is balanced for the dangers ahead.
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '2rem', 
        justifyContent: 'center',
        marginBottom: '3rem'
      }}>
        {characters.map(char => (
          <CharacterCard 
            key={char.id} 
            char={char} 
            onUpdate={handleUpdate} 
            onReroll={() => handleReroll(char.id)} 
          />
        ))}
      </div>

      <button 
        onClick={handleEmbark}
        style={{
          padding: '1.5rem 4rem',
          fontSize: '1.8rem',
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'transform 0.1s'
        }}
      >
        Embark to Town
      </button>
    </div>
  );
};

export default CharacterCreation;
