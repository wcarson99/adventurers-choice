import React, { useState } from 'react';
import { useGame } from '../../game-engine/GameState';
import { PositionComponent, RenderableComponent, AttributesComponent } from '../../game-engine/ecs/Component';
import { theme } from '../styles/theme';
import { Grid } from '../../game-engine/grid/Grid';
import { MovementSystem } from '../../game-engine/encounters/MovementSystem';

export const EncounterView: React.FC = () => {
  const { grid, world, completeMission, consumeFood, activeMission } = useGame();
  const [tick, setTick] = useState(0); // Force render
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>([]);
  const movementSystem = new MovementSystem();

  if (!grid || !world) return <div>Loading Encounter...</div>;

  // Get all player characters
  const getPlayerCharacters = () => {
    const entities = world.getAllEntities();
    return entities.filter(id => {
      const r = world.getComponent<RenderableComponent>(id, 'Renderable');
      return r && r.color === theme.colors.accent;
    });
  };

  const handleCharacterClick = (characterId: number) => {
    const pos = world.getComponent<PositionComponent>(characterId, 'Position');
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    
    if (!pos || !attrs) return;

    // If clicking the same character, deselect
    if (selectedCharacter === characterId) {
      setSelectedCharacter(null);
      setValidMoves([]);
      return;
    }

    // Select character and show valid moves
    setSelectedCharacter(characterId);
    const moves = movementSystem.getValidMoves(world, grid, characterId, pos, attrs.dex);
    setValidMoves(moves);
  };

  const handleTileClick = (x: number, y: number) => {
    // If a character is selected and this is a valid move, move them
    if (selectedCharacter !== null) {
      const isValidMove = validMoves.some(move => move.x === x && move.y === y);
      
      if (isValidMove) {
        movementSystem.moveCharacter(world, selectedCharacter, { x, y });
        setSelectedCharacter(null);
        setValidMoves([]);
        setTick(t => t + 1); // Trigger re-render

        // Check for win condition (all characters in exit zone)
        const allCharacters = getPlayerCharacters();
        const allInExit = allCharacters.every(charId => {
          const pos = world.getComponent<PositionComponent>(charId, 'Position');
          return pos && grid.isExitZone(pos.x, pos.y);
        });

        if (allInExit) {
          setTimeout(() => {
            alert("All characters reached the exit! Mission Complete.");
            if (activeMission) consumeFood(activeMission.days * 4);
            completeMission();
          }, 100);
        }
      } else {
        // Clicked on invalid tile, check if it's a character to select
        const entities = world.getAllEntities();
        const clickedEntity = entities.find(id => {
          const p = world.getComponent<PositionComponent>(id, 'Position');
          return p && p.x === x && p.y === y;
        });
        
        if (clickedEntity) {
          const r = world.getComponent<RenderableComponent>(clickedEntity, 'Renderable');
          if (r && r.color === theme.colors.accent) {
            handleCharacterClick(clickedEntity);
          }
        } else {
          // Clicked empty space, deselect
          setSelectedCharacter(null);
          setValidMoves([]);
        }
      }
    } else {
      // No character selected, check if clicking on a character
      const entities = world.getAllEntities();
      const clickedEntity = entities.find(id => {
        const p = world.getComponent<PositionComponent>(id, 'Position');
        return p && p.x === x && p.y === y;
      });
      
      if (clickedEntity) {
        const r = world.getComponent<RenderableComponent>(clickedEntity, 'Renderable');
        if (r && r.color === theme.colors.accent) {
          handleCharacterClick(clickedEntity);
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

        // Check if this tile is a valid move
        const isValidMove = validMoves.some(move => move.x === pos.x && move.y === pos.y);
        const isSelectedCharacter = selectedCharacter && (() => {
          const p = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
          return p && p.x === pos.x && p.y === pos.y;
        })();

        return (
          <div
            key={index}
            onClick={() => handleTileClick(pos.x, pos.y)}
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: isSelectedCharacter
                ? '#ffd700' // Gold for selected character
                : isValidMove
                ? '#90ee90' // Light green for valid moves
                : grid.isWall(pos.x, pos.y) 
                ? '#666' 
                : grid.isEntranceZone(pos.x, pos.y)
                ? '#4a90e2'
                : grid.isExitZone(pos.x, pos.y)
                ? '#2ecc71'
                : theme.colors.imageBackground,
              border: isSelectedCharacter 
                ? '3px solid #ff8c00'
                : isValidMove
                ? '2px solid #32cd32'
                : `1px solid ${theme.colors.imageBorder}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.text,
              fontSize: '0.7rem',
              cursor: isValidMove || entityId ? 'pointer' : 'default',
              transition: 'background-color 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!isValidMove && !isSelectedCharacter && !entityId) {
                e.currentTarget.style.backgroundColor = theme.colors.imageBorder;
              }
            }}
            onMouseLeave={(e) => {
              if (!isValidMove && !isSelectedCharacter && !entityId) {
                e.currentTarget.style.backgroundColor = theme.colors.imageBackground;
              }
            }}
            title={`Tile ${pos.x},${pos.y}${isValidMove ? ' (Valid Move)' : ''}`}
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
