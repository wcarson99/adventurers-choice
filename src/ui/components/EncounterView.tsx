import React, { useState } from 'react';
import { useGame } from '../../game-engine/GameState';
import { PositionComponent, RenderableComponent } from '../../game-engine/ecs/Component';
import { theme } from '../styles/theme';

export const EncounterView: React.FC = () => {
  const { grid, world, completeMission, consumeFood, activeMission } = useGame();
  const [tick, setTick] = useState(0); // Force render

  if (!grid || !world) return <div>Loading Encounter...</div>;

  const handleTileClick = (x: number, y: number) => {
    // MVP Movement: Find the hero and move them
    // In a real system, this would be an Action sent to a System
    const entities = world.getAllEntities();
    const heroId = entities.find(id => {
      const r = world.getComponent<RenderableComponent>(id, 'Renderable');
      return r && r.color === theme.colors.accent; // Hacky way to find hero for now, keeping as is since it's logic not UI style
    });

    if (heroId) {
      const pos = world.getComponent<PositionComponent>(heroId, 'Position');
      if (pos) {
        // Simple teleport for now
        pos.x = x;
        pos.y = y;
        setTick(t => t + 1); // Trigger re-render

        // Check for win condition (Goal at 7,7)
        if (x === 7 && y === 7) {
          setTimeout(() => {
            alert("Goal Reached! Mission Complete.");
            if (activeMission) consumeFood(activeMission.days * 4);
            completeMission();
          }, 100);
        }
      }
    }
  };

  const tiles = Array.from({ length: grid.width * grid.height }, (_, i) => grid.getCoords(i));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${grid.width}, 64px)`,
      gridTemplateRows: `repeat(${grid.height}, 64px)`,
      gap: '2px',
      backgroundColor: theme.colors.cardBackground,
      padding: '8px',
      borderRadius: '8px',
      margin: '1rem auto',
      width: 'fit-content',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
      {tiles.map((pos, index) => {
        // Check for entity at this position
        // Note: This is O(N) per tile, fine for MVP (64 tiles, < 10 entities)
        const entities = world.getAllEntities();
        const entityId = entities.find(id => {
          const p = world.getComponent<PositionComponent>(id, 'Position');
          return p && p.x === pos.x && p.y === pos.y;
        });
        const renderable = entityId ? world.getComponent<RenderableComponent>(entityId, 'Renderable') : null;

        return (
          <div
            key={index}
            onClick={() => handleTileClick(pos.x, pos.y)}
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: theme.colors.imageBackground,
              border: `1px solid ${theme.colors.imageBorder}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.text,
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.imageBorder}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.imageBackground}
            title={`Tile ${pos.x},${pos.y}`}
          >
            {renderable && renderable.sprite ? (
              <img 
                src={renderable.sprite} 
                alt="entity" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            ) : renderable ? (
              <div style={{
                width: '80%',
                height: '80%',
                backgroundColor: renderable.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.cardBackground,
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}>
                {renderable.char}
              </div>
            ) : null}
            {!renderable && `${pos.x},${pos.y}`}
          </div>
        );
      })}
    </div>
  );
};
