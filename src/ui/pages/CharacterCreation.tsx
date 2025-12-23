import React, { useState, useEffect } from 'react';
import { useGame, Character, Attributes } from '../../game-engine/GameState';
import { theme } from '../styles/theme';

// Deterministic stats for each archetype: Primary 5, Secondary 5, Others 2
const getDeterministicAttributes = (archetype: string): Attributes => {
  const base: Attributes = { pwr: 2, mov: 2, inf: 2, cre: 2 };
  
  switch (archetype) {
    case 'Warrior':
      return { ...base, pwr: 5, mov: 5 };
    case 'Thief':
      return { ...base, mov: 5, pwr: 5 };
    case 'Wizard':
      return { ...base, cre: 5, inf: 5 };
    case 'Cleric':
      return { ...base, inf: 5, cre: 5 };
    case 'Bard':
      return { ...base, inf: 5, mov: 5 };
    case 'Paladin':
      return { ...base, pwr: 5, inf: 5 };
    default:
      return base;
  }
};

// Helper to generate random stats summing to 12, max 5, min 1 (for reroll)
const generateRandomAttributes = (): Attributes => {
  const attrs: (keyof Attributes)[] = ['pwr', 'mov', 'inf', 'cre'];
  const values: Record<string, number> = { pwr: 1, mov: 1, inf: 1, cre: 1 };
  let pointsRemaining = 12 - 4; // Start with 1 in each, distribute remaining 8

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
  
  if (highest.includes('pwr')) return 'Warrior';
  if (highest.includes('mov')) return 'Thief';
  if (highest.includes('cre')) return 'Wizard';
  if (highest.includes('inf')) {
    // If INF is highest, check second highest to differentiate Cleric vs Bard
    const sorted = Object.entries(attr).sort(([,a], [,b]) => b - a);
    if (sorted[1][0] === 'cre') return 'Cleric';
    if (sorted[1][0] === 'mov') return 'Bard';
    return 'Bard'; // Default to Bard if INF is highest
  }
  return 'Adventurer';
};

const getSprite = (archetype: string): string => {
  switch (archetype) {
    case 'Warrior': return '/assets/characters/warrior.png';
    case 'Thief': return '/assets/characters/thief.png';
    case 'Wizard': return '/assets/characters/wizard.png';
    case 'Cleric': return '/assets/characters/cleric.png';
    case 'Bard': return '/assets/characters/bard.png';
    case 'Paladin': return '/assets/characters/paladin.png';
    default: return '/assets/characters/warrior.png';
  }
};

const CharacterCard: React.FC<{ 
  char: Character; 
  onUpdate: (c: Character) => void; 
  onReroll: () => void 
}> = ({ char, onUpdate, onReroll }) => {
  return (
    <div style={{
      backgroundColor: theme.colors.cardBackground,
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
      width: '250px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      alignItems: 'center'
    }}>
      <img 
        src={char.sprite} 
        alt={char.archetype} 
        style={{ 
          width: '100px', 
          height: '100px', 
          objectFit: 'contain',
          borderRadius: '50%',
          backgroundColor: theme.colors.imageBackground,
          border: `2px solid ${theme.colors.imageBorder}`
        }} 
      />

      <div style={{ width: '100%' }}>
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
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            textAlign: 'center'
          }}
        />
      </div>

      <div style={{ 
        textAlign: 'center', 
        fontSize: '1.2rem', 
        fontWeight: 'bold', 
        color: theme.colors.accentLight
      }}>
        {char.archetype}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', columnGap: '2rem' }}>
        {Object.entries(char.attributes).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              textTransform: 'uppercase', 
              fontWeight: 'bold', 
              fontSize: '1.5rem', 
              color: theme.colors.text
            }}>{key}</span>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: theme.colors.text,
              fontFamily: 'monospace'
            }}>
              {val.toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={onReroll}
        style={{
          padding: '0.5rem',
          backgroundColor: theme.colors.accent,
          color: theme.colors.background,
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
  const { setView, setParty, party, gameMode, activeJob, startJob } = useGame();
  const [characters, setCharacters] = useState<Character[]>([]);

  // Initialize characters on mount
  useEffect(() => {
    // If we have a campaign with pre-filled party, use those characters
    if (gameMode === 'campaign' && party.length > 0) {
      setCharacters(party);
    } else {
      // Otherwise use default deterministic party
      const defaultArchetypes = ['Warrior', 'Thief', 'Paladin', 'Cleric'];
      const initialChars: Character[] = defaultArchetypes.map((archetype, i) => {
        const attrs = getDeterministicAttributes(archetype);
        return {
          id: i + 1,
          name: `Hero ${i + 1}`,
          attributes: attrs,
          archetype: archetype,
          gold: 20,
          food: 4, // Start with 4 food per character
          sprite: getSprite(archetype)
        };
      });
      setCharacters(initialChars);
    }
  }, [gameMode, party]);

  const handleUpdate = (updatedChar: Character) => {
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const handleReroll = (id: number) => {
    setCharacters(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newAttrs = generateRandomAttributes();
      const newArchetype = getArchetype(newAttrs);
      return { 
        ...c, 
        attributes: newAttrs, 
        archetype: newArchetype,
        sprite: getSprite(newArchetype)
      };
    }));
  };

  const handleEmbark = async () => {
    setParty(characters);
    
    // If this is a campaign, start the first encounter
    if (gameMode === 'campaign' && activeJob) {
      await startJob(activeJob.id, 0);
    } else {
      // Otherwise go to town (roguelike mode)
      setView('TOWN');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: theme.colors.accentLight }}>Assemble Your Party</h2>
      <p style={{ marginBottom: '3rem', fontSize: '1.2rem', color: theme.colors.accent }}>
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
          backgroundColor: theme.colors.success,
          color: theme.colors.text,
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
