import React, { useState, useEffect } from 'react';
import { useGame } from '../../game-engine/GameState';
import { theme } from '../styles/theme';
import { CampaignLoader } from '../../campaigns/CampaignLoader';
import type { CampaignManifestEntry } from '../../campaigns/Campaign';

const SplashScreen: React.FC = () => {
  const { setView, prepareCampaignCharacters } = useGame();
  const [campaigns, setCampaigns] = useState<CampaignManifestEntry[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('random');
  const [loading, setLoading] = useState(false);

  // Load available campaigns on mount
  useEffect(() => {
    CampaignLoader.getAvailableCampaigns()
      .then(setCampaigns)
      .catch(error => {
        console.error('Failed to load campaigns:', error);
        setCampaigns([]);
      });
  }, []);

  const handleNewGame = async () => {
    if (selectedOption === 'random') {
      // Random mode - go to character creation with default characters
      setView('CHARACTER_CREATION');
    } else if (selectedOption && selectedOption !== 'random') {
      // Campaign selected - prepare characters and go to character creation
      setLoading(true);
      try {
        await prepareCampaignCharacters(selectedOption);
        setView('CHARACTER_CREATION');
      } catch (error) {
        console.error('Failed to prepare campaign:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundImage: 'url(/assets/splash.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: theme.colors.text,
      fontFamily: 'sans-serif',
      gap: '1.5rem',
      position: 'relative'
    }}>
      {/* Semi-transparent overlay for better text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(26, 22, 37, 0.6)',
        zIndex: 0
      }} />
      
      {/* Content container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        width: '100%',
        height: '100%'
      }}>
        {/* Game Selection - positioned above Start Adventure button */}
        <div style={{
          position: 'absolute',
          top: 'calc(18% + 150px)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
          minWidth: '240px'
        }}>
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '2rem',
              width: '264px',
              backgroundColor: theme.colors.cardBackground,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.imageBorder}`,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <option value="random">Random</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Adventure Button */}
        <button 
          onClick={handleNewGame}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '402px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.5rem',
            fontSize: '2rem',
            fontWeight: 'bold',
            backgroundColor: loading
              ? theme.colors.imageBackground
              : theme.colors.success,
            color: theme.colors.text,
            border: '1px solid #8B4513',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            opacity: loading ? 0.6 : 1,
            minWidth: '220px',
            lineHeight: '1.2'
          }}
        >
          {loading ? 'Loading...' : 'Start Adventure'}
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
