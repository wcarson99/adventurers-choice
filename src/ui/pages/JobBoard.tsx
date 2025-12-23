import React from 'react';
import { useGame, Mission } from '../../game-engine/GameState';
import { theme } from '../styles/theme';
import { getEncounterTypeDisplayName } from '../../types/Encounter';
import { StatRequirements } from '../components/StatRequirements';

const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Clear the Goblin Cave',
    description: 'A local cave is infested with goblins. Clear them out.',
    days: 3,
    rewardGold: 15,
    rewardAp: 3,
    encounterType: {
      type: 'combat',
      requiredStats: [
        { attribute: 'pwr', minimum: 3 },
        { attribute: 'mov', minimum: 2 }
      ]
    }
  },
  {
    id: 'm2',
    title: 'Rescue the Caravan',
    description: 'Merchants are stuck on the road. Help them.',
    days: 4,
    rewardGold: 20,
    rewardAp: 4,
    encounterType: {
      type: 'trading',
      requiredStats: [
        { attribute: 'inf', minimum: 3 },
        { attribute: 'cre', minimum: 2 }
      ]
    }
  },
  {
    id: 'm3',
    title: 'Explore Ancient Ruins',
    description: 'Rumors of treasure in the old ruins.',
    days: 5,
    rewardGold: 25,
    rewardAp: 5,
    encounterType: {
      type: 'obstacle',
      requiredStats: [
        { attribute: 'cre', minimum: 3 },
        { attribute: 'mov', minimum: 2 }
      ]
    }
  }
];

const JobBoard: React.FC = () => {
  const { setView, startMission, getTotalFood, completedMissions, turnInMission, showStatus } = useGame();
  const missionsListRef = React.useRef<HTMLDivElement>(null);
  
  // Verify scrollbar visibility
  React.useEffect(() => {
    if (missionsListRef.current) {
      const el = missionsListRef.current;
      const styles = window.getComputedStyle(el);
      // Removed unused hasScrollbar variable
      
      console.log('=== Scrollbar Verification ===');
      console.log('overflowY:', styles.overflowY);
      console.log('maxHeight:', styles.maxHeight);
      console.log('scrollHeight:', el.scrollHeight);
      console.log('clientHeight:', el.clientHeight);
      console.log('offsetWidth:', el.offsetWidth);
      console.log('clientWidth:', el.clientWidth);
      const scrollbarWidth = el.offsetWidth - el.clientWidth;
      console.log('Scrollbar visible (width diff):', scrollbarWidth);
      console.log('Has overflow:', el.scrollHeight > el.clientHeight);
      
      // Check if scrollbar is actually rendered (webkit)
      const scrollbar = window.getComputedStyle(el, '::-webkit-scrollbar');
      console.log('Webkit scrollbar width:', scrollbar.width);
      
      // Try to detect scrollbar visibility
      const testScroll = el.scrollTop;
      el.scrollTop = 1;
      const canScroll = el.scrollTop > 0;
      el.scrollTop = testScroll;
      console.log('Can scroll:', canScroll);
      console.log('============================');
      
      if (scrollbarWidth === 0 && styles.overflowY === 'scroll' && el.scrollHeight > el.clientHeight) {
        console.warn('⚠️ Scrollbar exists but is overlaying (not reserving space). This is normal for overlay scrollbars.');
        console.warn('⚠️ The scrollbar should still be visible on the right edge when hovering or scrolling.');
      }
    }
  }, []);

  const handleAccept = (mission: Mission) => {
    const foodCost = mission.days * 4; // 4 characters
    const totalFood = getTotalFood();
    
    if (totalFood >= foodCost) {
      startMission(mission);
    } else {
      showStatus(
        `Not enough food! You need ${foodCost} food for this ${mission.days}-day mission. You have ${totalFood}.`,
        'error',
        5000
      );
    }
  };

  const handleTurnIn = (missionId: string) => {
    turnInMission(missionId);
    showStatus('Mission complete! Gold reward received.', 'success', 3000);
  };

  return (
    <>
      <style>{`
        .missions-scroll-container {
          overflow-y: scroll !important;
          overflow-x: hidden !important;
          /* Reserve space for scrollbar (works with classic scrollbars) */
          scrollbar-gutter: stable;
        }
        /* Webkit browsers (Chrome, Safari, Edge) - Custom scrollbar styling */
        .missions-scroll-container::-webkit-scrollbar {
          width: 14px !important;
          -webkit-appearance: none !important;
        }
        .missions-scroll-container::-webkit-scrollbar-track {
          background: ${theme.colors.background} !important;
          border-left: 2px solid ${theme.colors.accent} !important;
        }
        .missions-scroll-container::-webkit-scrollbar-thumb {
          background: ${theme.colors.accent} !important;
          border-radius: 7px !important;
          border: 2px solid ${theme.colors.background} !important;
          min-height: 30px !important;
        }
        .missions-scroll-container::-webkit-scrollbar-thumb:hover {
          background: ${theme.colors.accentLight} !important;
        }
        .missions-scroll-container::-webkit-scrollbar-thumb:active {
          background: ${theme.colors.accentLight} !important;
        }
        /* Note: On macOS, overlay scrollbars may only appear on hover/scrolling */
        /* To always see scrollbars, user can change System Preferences > General > Show scroll bars: Always */
        /* Firefox */
        .missions-scroll-container {
          scrollbar-width: thin !important;
          scrollbar-color: ${theme.colors.accent} ${theme.colors.background} !important;
        }
      `}</style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: 'sans-serif',
        padding: '2rem',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: theme.colors.accentLight, flexShrink: 0, height: 'auto' }}>Job Board</h2>
      
      {/* Completed Missions Section */}
      {completedMissions.length > 0 && (
        <div style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          marginBottom: '2rem',
          maxHeight: '40vh',
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: theme.colors.accent }}>✅ Completed Missions - Turn In For Reward!</h3>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {completedMissions.map(mission => (
              <div key={mission.id} style={{
                backgroundColor: theme.colors.success,
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `2px solid ${theme.colors.accent}`
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>{mission.title}</h3>
                  <div style={{ color: '#fff' }}>💰 Reward: {mission.rewardGold} Gold</div>
                </div>
                
                <button 
                  onClick={() => handleTurnIn(mission.id)}
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    backgroundColor: theme.colors.accent,
                    color: theme.colors.background,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Turn In Mission
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available Missions Section - Scrollable List */}
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '1200px',
          flex: '1 1 0',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div 
          ref={missionsListRef}
          data-testid="missions-list"
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflowY: 'scroll',
            overflowX: 'hidden',
            flex: '1 1 0',
            minHeight: 0,
            width: '100%',
            maxHeight: 'calc(100vh - 350px)', // Constrain height more to ensure scrollbar appears with more overflow
            scrollbarGutter: 'stable',
            // Force scrollbar to always be visible
            scrollbarWidth: 'thin', // Firefox
            scrollbarColor: `${theme.colors.accent} ${theme.colors.background}`, // Firefox
          }}
          className="missions-scroll-container"
        >
          {MOCK_MISSIONS.map(mission => (
            <div 
              key={mission.id} 
              data-testid={`mission-${mission.id}`}
              style={{
              backgroundColor: theme.colors.cardBackground,
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* First line: name, type, time, cost with accept button on right */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  flex: 1,
                  flexWrap: 'wrap'
                }}>
                  <h3 
                    data-testid={`mission-title-${mission.id}`}
                    style={{ 
                      color: theme.colors.accentLight, 
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      margin: 0
                    }}
                  >
                    {mission.title}
                  </h3>
                  <span 
                    data-testid={`mission-type-${mission.id}`}
                    style={{ 
                      fontSize: '0.9rem', 
                      color: theme.colors.accent,
                      fontWeight: 'bold',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: theme.colors.background,
                      borderRadius: '4px'
                    }}
                  >
                    {getEncounterTypeDisplayName(mission.encounterType)}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                    ⏳ {mission.days} Days
                  </span>
                  <span style={{ fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                    🍖 {mission.days * 4} Food
                  </span>
                  <span style={{ fontSize: '0.9rem', color: theme.colors.accent, fontWeight: 'bold' }}>
                    💰 {mission.rewardGold} Gold
                  </span>
                </div>
                <button 
                  onClick={() => handleAccept(mission)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.9rem',
                    backgroundColor: theme.colors.success,
                    color: theme.colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Accept Mission
                </button>
              </div>
              
              {/* Second line: required stats */}
              <div data-testid={`mission-stats-${mission.id}`}>
                <StatRequirements requiredStats={mission.encounterType.requiredStats} />
              </div>
              
              {/* Third line: description */}
              <p style={{ 
                margin: 0, 
                fontStyle: 'italic', 
                color: theme.colors.textSecondary,
                fontSize: '0.9rem'
              }}>
                {mission.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setView('TOWN')}
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          backgroundColor: theme.colors.cardBackground,
          color: theme.colors.text,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        Back to Town
      </button>
    </div>
    </>
  );
};

export default JobBoard;
