import React, { useState, useEffect } from 'react';
import { useGame } from '../../game-engine/GameState';
import { theme } from '../styles/theme';
import { CampaignLoader } from '../../campaigns/CampaignLoader';
import type { CampaignManifestEntry } from '../../campaigns/Campaign';

const SplashScreen: React.FC = () => {
  const { setView, startCampaign } = useGame();
  const [gameMode, setGameMode] = useState<'roguelike' | 'campaign'>('roguelike');
  const [campaigns, setCampaigns] = useState<CampaignManifestEntry[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
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
    if (gameMode === 'roguelike') {
      setView('CHARACTER_CREATION');
    } else if (gameMode === 'campaign' && selectedCampaignId) {
      setLoading(true);
      try {
        await startCampaign(selectedCampaignId, 0);
      } catch (error) {
        console.error('Failed to start campaign:', error);
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
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: 'sans-serif',
      gap: '1.5rem'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: theme.colors.accentLight }}>Adventurer's Choice</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '1rem', fontStyle: 'italic' }}>
        Survive the Gauntlet. Manage your resources.
      </p>

      {/* Game Mode Selection */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center',
        minWidth: '300px'
      }}>
        <label style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          Game Mode:
          <select
            value={gameMode}
            onChange={(e) => {
              setGameMode(e.target.value as 'roguelike' | 'campaign');
              setSelectedCampaignId('');
            }}
            style={{
              marginLeft: '0.5rem',
              padding: '0.5rem',
              fontSize: '1rem',
              backgroundColor: theme.colors.cardBackground,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.imageBorder}`,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <option value="roguelike">Rogue-Like</option>
            <option value="campaign">Campaign</option>
          </select>
        </label>

        {/* Campaign Selection (only shown when campaign mode is selected) */}
        {gameMode === 'campaign' && (
          <label style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '100%' }}>
            Campaign:
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              style={{
                marginLeft: '0.5rem',
                padding: '0.5rem',
                fontSize: '1rem',
                width: 'calc(100% - 0.5rem)',
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.imageBorder}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select Campaign --</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Campaign Description */}
        {gameMode === 'campaign' && selectedCampaignId && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: theme.colors.cardBackground,
            borderRadius: '6px',
            fontSize: '0.9rem',
            width: '100%',
            textAlign: 'center',
            border: `1px solid ${theme.colors.imageBorder}`
          }}>
            {campaigns.find(c => c.id === selectedCampaignId)?.description || ''}
          </div>
        )}
      </div>

      {/* New Game Button */}
      <button 
        onClick={handleNewGame}
        disabled={loading || (gameMode === 'campaign' && !selectedCampaignId)}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.5rem',
          backgroundColor: (loading || (gameMode === 'campaign' && !selectedCampaignId))
            ? theme.colors.imageBackground
            : theme.colors.success,
          color: theme.colors.text,
          border: 'none',
          borderRadius: '8px',
          cursor: (loading || (gameMode === 'campaign' && !selectedCampaignId)) ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
          opacity: (loading || (gameMode === 'campaign' && !selectedCampaignId)) ? 0.6 : 1
        }}
      >
        {loading ? 'Loading...' : 'New Game'}
      </button>
    </div>
  );
};

export default SplashScreen;
