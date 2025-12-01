import React, { useEffect, useState } from 'react';
import { useGame } from '../../game-engine/GameState';

const MissionView: React.FC = () => {
  const { activeMission, completeMission, updateResource } = useGame();
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!activeMission) return;

    // Simulate travel days
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500); // Fast travel for MVP

    return () => clearInterval(interval);
  }, [activeMission]);

  useEffect(() => {
    if (progress > 0 && progress % 20 === 0) {
      setLog(prev => [...prev, `Day ${progress / 20}: Traveled safely...`]);
    }
  }, [progress]);

  const handleComplete = () => {
    // Deduct food for the trip (simulated)
    if (activeMission) {
      updateResource('food', -(activeMission.days * 4));
      completeMission();
    }
  };

  if (!activeMission) return <div>No active mission</div>;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1c40f' }}>{activeMission.title}</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Traveling to destination...</p>

      <div style={{
        width: '80%',
        height: '30px',
        backgroundColor: '#7f8c8d',
        borderRadius: '15px',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#27ae60',
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>

      <div style={{
        width: '80%',
        height: '200px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem',
        overflowY: 'auto'
      }}>
        {log.map((entry, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>{entry}</div>
        ))}
        {progress === 100 && (
          <div style={{ color: '#f1c40f', fontWeight: 'bold' }}>Arrived at destination! Objective complete.</div>
        )}
      </div>

      {progress === 100 && (
        <button 
          onClick={handleComplete}
          style={{
            padding: '1.5rem 3rem',
            fontSize: '1.5rem',
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          Return to Town & Collect Reward
        </button>
      )}
    </div>
  );
};

export default MissionView;
