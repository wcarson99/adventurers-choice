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

  // Verify button positioning
  useEffect(() => {
    const button = document.querySelector('button[onclick]') as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SplashScreen.tsx:25',message:'Button position verification',data:{computedTop:rect.top,computedLeft:rect.left,styleTop:button.style.top,styleLeft:button.style.left,width:rect.width,height:rect.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'positioning'})}).catch(()=>{});
      // #endregion
      console.log('Start Adventure button position:', {
        top: rect.top,
        left: rect.left,
        styleTop: button.style.top,
        styleLeft: button.style.left
      });
    }
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
        backgroundColor: 'rgba(26, 22, 37, 0.6)', // theme.colors.background with 60% opacity
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
          top: '18%', // Positioned above the Start Adventure button
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
          minWidth: '240px' // Reduced by 20% (from 300px)
        }}>
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '2rem', // 2x taller (from 1rem)
              width: '264px', // Increased by 10% (from 240px)
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

        {/* New Game Button - positioned to fully cover brown Start Adventure circle at top */}
        <button 
          onClick={handleNewGame}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '222px', // Fixed pixel position
            left: '633px', // Fixed pixel position
            padding: '1.6rem 4rem',
            fontSize: '2.88rem', // Increased by 20% (from 2.4rem)
            fontWeight: 'bold',
            backgroundColor: loading
              ? theme.colors.imageBackground
              : theme.colors.success,
            color: theme.colors.text,
            border: 'none',
            borderRadius: '50px', // More circular to fully cover the circle
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            opacity: loading ? 0.6 : 1,
            minWidth: '280px',
            minHeight: '145px', // Increased by 15% (from 126px)
            lineHeight: '1.2',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {loading ? (
            'Loading...'
          ) : (
            <>
              <span>Start</span>
              <span>Adventure</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
