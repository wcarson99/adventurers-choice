import React, { useState } from 'react';
import { useGame } from '../../game-engine/GameState';
import { PositionComponent, RenderableComponent, AttributesComponent, PushableComponent } from '../../game-engine/ecs/Component';
import { theme } from '../styles/theme';
import { Grid } from '../../game-engine/grid/Grid';
import { MovementSystem } from '../../game-engine/encounters/MovementSystem';
import { PushSystem } from '../../game-engine/encounters/PushSystem';

interface EncounterViewProps {
  activeMission?: { title: string; description: string };
  onCompleteMission?: () => void;
}

type PlanningPhase = 'movement' | 'skill' | 'executing';

interface PlannedAction {
  characterId: number;
  action: string;
  targetId?: number;
  cost: number;
}

export const EncounterView: React.FC<EncounterViewProps> = ({ activeMission, onCompleteMission }) => {
  const { grid, world, completeMission, consumeFood, party, showStatus } = useGame();
  const [tick, setTick] = useState(0); // Force render
  const [phase, setPhase] = useState<PlanningPhase>('movement');
  const [originalPositions, setOriginalPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [plannedActions, setPlannedActions] = useState<PlannedAction[]>([]);
  const [actionOrder, setActionOrder] = useState<number[]>([]); // Character IDs in execution order
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [validPushDirections, setValidPushDirections] = useState<Array<{ dx: number; dy: number; staminaCost: number }>>([]);
  const movementSystem = new MovementSystem();
  const pushSystem = new PushSystem();

  // Initialize original positions at start of turn (when entering movement phase)
  React.useEffect(() => {
    if (world && phase === 'movement') {
      const positions = new Map<number, { x: number; y: number }>();
      const entities = world.getAllEntities();
      entities.forEach(id => {
        const pos = world.getComponent<PositionComponent>(id, 'Position');
        const attrs = world.getComponent<AttributesComponent>(id, 'Attributes');
        if (pos && attrs) {
          positions.set(id, { x: pos.x, y: pos.y });
        }
      });
      setOriginalPositions(positions);
    }
  }, [world, phase === 'movement']);

  if (!grid || !world) return <div>Loading Encounter...</div>;

  // Helper to get instructions text
  const getInstructions = (): string => {
    if (phase === 'movement') {
      if (selectedCharacter) {
        return '👆 Click a green tile to move. Click original position to undo.';
      }
      return '👆 Click a character to select, then click a green tile to move them.';
    }
    if (phase === 'skill') {
      if (selectedCharacter) {
        return '🎯 Select an action from the dropdown. Use ↑↓ to reorder actions in the queue.';
      }
      if (plannedActions.length > 0) {
        return `📋 ${plannedActions.length} action(s) planned. Select characters to add more, or click "Execute".`;
      }
      return '🎯 Click a character to select, then choose an action from the dropdown.';
    }
    return '👆 Click a character to select, then move or push crates';
  };

  // Get all player characters
  const getPlayerCharacters = () => {
    const entities = world.getAllEntities();
    return entities.filter(id => {
      const r = world.getComponent<RenderableComponent>(id, 'Renderable');
      return r && r.color === theme.colors.accent;
    });
  };

  // Get available actions for a character
  const getAvailableActions = (characterId: number): Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }> => {
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    if (!attrs) return [];

    const actions: Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }> = [
      { name: 'Wait', cost: 0 }
    ];

    // Check if character can push (STR 3+)
    if (attrs.str >= 3) {
      // Use current position (after movements in skill phase, or original in movement phase)
      const currentPos = world.getComponent<PositionComponent>(characterId, 'Position');
      const charPos = currentPos ? { x: currentPos.x, y: currentPos.y } : null;
      
      if (charPos) {
        const entities = world.getAllEntities();
        const adjacentPushable = entities.find(id => {
          const pushable = world.getComponent<PushableComponent>(id, 'Pushable');
          if (!pushable) return false;
          const objPos = world.getComponent<PositionComponent>(id, 'Position');
          if (!objPos) return false;
          return grid.getDistance(charPos, objPos) === 1;
        });

        if (adjacentPushable) {
          const pushActions = pushSystem.getValidPushActions(world, grid, characterId, adjacentPushable);
          if (pushActions.length > 0) {
            actions.push({
              name: 'Push',
              cost: pushActions[0].staminaCost,
              requiresItem: true,
              targetId: adjacentPushable
            });
          }
        }
      }
    }

    return actions;
  };

  const handleCharacterClick = (characterId: number) => {
    if (phase === 'movement') {
      const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
      if (!attrs) return;

      // Get current position and original position
      const currentPos = world.getComponent<PositionComponent>(characterId, 'Position');
      if (!currentPos) return;
      const originalPos = originalPositions.get(characterId);
      if (!originalPos) return;

      // Check if character has already moved
      const hasMoved = currentPos.x !== originalPos.x || currentPos.y !== originalPos.y;
      
      // If character has moved, only allow selection for undo (show original position as only valid move)
      if (hasMoved) {
        // If clicking the same character, deselect
        if (selectedCharacter === characterId) {
          setSelectedCharacter(null);
          setValidMoves([]);
          setSelectedObject(null);
          setValidPushDirections([]);
          return;
        }
        // Select character but only show original position as valid move (for undo)
        setSelectedCharacter(characterId);
        setValidMoves([originalPos]); // Only original position is valid (for undo)
        return;
      }

      // Character hasn't moved yet - normal selection
      // If clicking the same character, deselect
      if (selectedCharacter === characterId) {
        setSelectedCharacter(null);
        setValidMoves([]);
        setSelectedObject(null);
        setValidPushDirections([]);
        return;
      }

      // Select character and show valid moves from current position
      setSelectedCharacter(characterId);
      const moves = movementSystem.getValidMoves(world, grid, characterId, { x: currentPos.x, y: currentPos.y }, attrs.dex);
      setValidMoves(moves);
    } else if (phase === 'skill') {
      // In skill phase, select character for action planning
      if (selectedCharacter === characterId) {
        setSelectedCharacter(null);
        setSelectedObject(null);
        return;
      }
      setSelectedCharacter(characterId);
      setSelectedObject(null);
    }
    
    // Check if character is adjacent to any pushable objects
    const currentPos = world.getComponent<PositionComponent>(characterId, 'Position');
    if (!currentPos) return;
    
    const entities = world.getAllEntities();
    const adjacentObjects: Array<{ id: number; pushActions: Array<{ direction: { dx: number; dy: number }; staminaCost: number }> }> = [];
    
    for (const entityId of entities) {
      const pushable = world.getComponent<PushableComponent>(entityId, 'Pushable');
      if (!pushable) continue;
      
      const objPos = world.getComponent<PositionComponent>(entityId, 'Position');
      if (!objPos) continue;
      
      const distance = grid.getDistance({ x: currentPos.x, y: currentPos.y }, objPos);
      if (distance === 1) {
        // Character is adjacent to this object
        const pushActions = pushSystem.getValidPushActions(world, grid, characterId, entityId);
        if (pushActions.length > 0) {
          adjacentObjects.push({ id: entityId, pushActions });
        }
      }
    }
    
    // If adjacent to exactly one object, auto-select it and show push directions
    if (adjacentObjects.length === 1) {
      setSelectedObject(adjacentObjects[0].id);
      setValidPushDirections(adjacentObjects[0].pushActions.map(a => ({ ...a.direction, staminaCost: a.staminaCost })));
    } else {
      setSelectedObject(null);
      setValidPushDirections([]);
    }
  };

  // Check if a move would result in overlapping characters
  const wouldOverlap = (targetX: number, targetY: number, excludeCharacterId?: number): boolean => {
    const entities = world.getAllEntities();
    for (const id of entities) {
      if (excludeCharacterId && id === excludeCharacterId) continue;
      const attrs = world.getComponent<AttributesComponent>(id, 'Attributes');
      if (!attrs) continue; // Only check characters
      const pos = world.getComponent<PositionComponent>(id, 'Position');
      if (pos && pos.x === targetX && pos.y === targetY) {
        return true; // Overlap found
      }
    }
    return false;
  };

  const handleTileClick = (x: number, y: number) => {
    // Movement phase: move characters immediately
    if (phase === 'movement') {
      // Check if clicking on original position to undo (restore to original)
      if (selectedCharacter !== null) {
        const originalPos = originalPositions.get(selectedCharacter);
        if (originalPos && originalPos.x === x && originalPos.y === y) {
          // Restore character to original position
          movementSystem.moveCharacter(world, selectedCharacter, originalPos);
          setSelectedCharacter(null);
          setValidMoves([]);
          setTick(t => t + 1); // Trigger re-render
          return;
        }
      }

      // If character is selected and this is a valid move, move immediately
      if (selectedCharacter !== null) {
        const isValidMove = validMoves.some(move => move.x === x && move.y === y);
        
        if (isValidMove) {
          // Check for overlap before moving
          if (wouldOverlap(x, y, selectedCharacter)) {
            showStatus('Cannot move: another character is already there', 'error');
            return;
          }
          
          // Move the character immediately
          movementSystem.moveCharacter(world, selectedCharacter, { x, y });
          setSelectedCharacter(null);
          setValidMoves([]);
          setTick(t => t + 1); // Trigger re-render
          return;
        }
      }

      // Check if clicking on a character to select (always use current position)
      const entities = world.getAllEntities();
      const clickedEntity = entities.find(id => {
        const r = world.getComponent<RenderableComponent>(id, 'Renderable');
        const attrs = world.getComponent<AttributesComponent>(id, 'Attributes');
        if (!r || !attrs) return false;
        
        const currentPos = world.getComponent<PositionComponent>(id, 'Position');
        return currentPos && currentPos.x === x && currentPos.y === y && r.color === theme.colors.accent;
      });

      if (clickedEntity) {
        handleCharacterClick(clickedEntity);
        return;
      }
      return;
    }

    // Skill phase - allow selecting characters and items
    if (phase === 'skill') {
      const entities = world.getAllEntities();
      const clickedEntity = entities.find(id => {
        const p = world.getComponent<PositionComponent>(id, 'Position');
        return p && p.x === x && p.y === y;
      });
      
      if (clickedEntity) {
        const r = world.getComponent<RenderableComponent>(clickedEntity, 'Renderable');
        const attrs = world.getComponent<AttributesComponent>(clickedEntity, 'Attributes');
        const pushable = world.getComponent<PushableComponent>(clickedEntity, 'Pushable');
        
        if (r && attrs && r.color === theme.colors.accent) {
          // Clicked on a character
          handleCharacterClick(clickedEntity);
        } else if (pushable) {
          // Clicked on an item (crate)
          setSelectedObject(clickedEntity);
        }
      }
      return;
    }

    // Legacy code for executing phase
    const entities = world.getAllEntities();
    const clickedEntity = entities.find(id => {
      const p = world.getComponent<PositionComponent>(id, 'Position');
      return p && p.x === x && p.y === y;
    });
    
    const clickedPushable = clickedEntity ? world.getComponent<PushableComponent>(clickedEntity, 'Pushable') : null;
    
    // If character is selected and we clicked on a pushable object they can push
    if (selectedCharacter !== null && clickedPushable && clickedEntity) {
      const charPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
      if (charPos) {
        const distance = grid.getDistance(charPos, { x, y });
        if (distance === 1) {
          // Character is adjacent, check if we can push
          const pushActions = pushSystem.getValidPushActions(world, grid, selectedCharacter, clickedEntity);
          
          if (pushActions.length > 0) {
            // Show push directions or push in the direction clicked
            // For now, if there's only one valid direction, push in that direction
            // Otherwise, select the object to show push options
            if (pushActions.length === 1) {
              // Auto-push in the only valid direction
              pushSystem.pushObject(world, clickedEntity, pushActions[0].direction);
              setSelectedCharacter(null);
              setValidMoves([]);
              setSelectedObject(null);
              setValidPushDirections([]);
              setTick(t => t + 1);
            } else {
              // Multiple directions, select object to show options
              setSelectedObject(clickedEntity);
              setValidPushDirections(pushActions.map(a => ({ ...a.direction, staminaCost: a.staminaCost })));
            }
            return;
          }
        }
      }
    }
    
    // If object is selected and we clicked a valid push destination
    if (selectedObject !== null && selectedCharacter !== null) {
      const objPos = world.getComponent<PositionComponent>(selectedObject, 'Position');
      if (objPos) {
        // Check if clicked position is a valid push destination
        const direction = {
          dx: x - objPos.x,
          dy: y - objPos.y
        };
        
        const validPush = validPushDirections.find(p => p.dx === direction.dx && p.dy === direction.dy);
        if (validPush) {
          pushSystem.pushObject(world, selectedObject, direction);
          setSelectedCharacter(null);
          setValidMoves([]);
          setSelectedObject(null);
          setValidPushDirections([]);
          setTick(t => t + 1);
          return;
        }
      }
    }
    
    // If a character is selected and this is a valid move, move them
    if (selectedCharacter !== null) {
      const isValidMove = validMoves.some(move => move.x === x && move.y === y);
      
      if (isValidMove) {
        movementSystem.moveCharacter(world, selectedCharacter, { x, y });
        setSelectedCharacter(null);
        setValidMoves([]);
        setSelectedObject(null);
        setValidPushDirections([]);
        setTick(t => t + 1); // Trigger re-render

        // Check for win condition (all characters in exit zone)
        const allCharacters = getPlayerCharacters();
        const allInExit = allCharacters.every(charId => {
          const pos = world.getComponent<PositionComponent>(charId, 'Position');
          return pos && grid.isExitZone(pos.x, pos.y);
        });

        if (allInExit) {
          setTimeout(() => {
            showStatus("All characters reached the exit! Mission Complete.", 'success', 3000);
            if (activeMission) consumeFood(activeMission.days * 4);
            completeMission();
          }, 100);
        }
      } else {
        // Clicked on invalid tile, check if it's a character to select
        if (clickedEntity) {
          const r = world.getComponent<RenderableComponent>(clickedEntity, 'Renderable');
          if (r && r.color === theme.colors.accent) {
            handleCharacterClick(clickedEntity);
          } else if (clickedPushable) {
            // Clicked on a crate - select it
            setSelectedObject(clickedEntity);
            setSelectedCharacter(null);
            setValidMoves([]);
            setValidPushDirections([]);
            
            // If a character is selected and adjacent, show push options
            if (selectedCharacter !== null) {
              const charPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
              if (charPos) {
                const distance = grid.getDistance(charPos, { x, y });
                if (distance === 1) {
                  const pushActions = pushSystem.getValidPushActions(world, grid, selectedCharacter, clickedEntity);
                  if (pushActions.length > 0) {
                    setValidPushDirections(pushActions.map(a => ({ ...a.direction, staminaCost: a.staminaCost })));
                  }
                }
              }
            }
          }
        } else {
          // Clicked empty space, deselect
          setSelectedCharacter(null);
          setValidMoves([]);
          setSelectedObject(null);
          setValidPushDirections([]);
        }
      }
    } else {
      // No character selected, check if clicking on a character or crate
      if (clickedEntity) {
        const r = world.getComponent<RenderableComponent>(clickedEntity, 'Renderable');
        if (r && r.color === theme.colors.accent) {
          handleCharacterClick(clickedEntity);
        } else if (clickedPushable && phase === 'skill') {
          // In skill phase, selecting an item for push action
          setSelectedObject(clickedEntity);
        } else if (clickedPushable) {
          // Clicked on a crate - select it
          setSelectedObject(clickedEntity);
          setSelectedCharacter(null);
          setValidMoves([]);
          setValidPushDirections([]);
        }
      }
    }
  };

  const tiles = Array.from({ length: grid.width * grid.height }, (_, i) => grid.getCoords(i));

  // Fixed layout: 800px grid, 480px info panel
  // Grid: 800px × 800px
  // Padding: 8px each side = 16px total
  // Gaps: 9 gaps × 2px = 18px total
  // Available for tiles: 800 - 16 - 18 = 766px
  // Tile size: 766 / 10 = 76.6px, use 76px
  // Total: 76×10 + 18 + 16 = 794px (fits in 800px)
  const tileSize = 76;

  return (
    <div style={{ 
      display: 'flex', 
      height: '800px',
      width: '1280px',
      overflow: 'hidden'
    }}>
      {/* Grid Section - Left Side: 800px × 800px */}
      <div style={{
        width: '800px',
        height: '800px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid.width}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${grid.height}, ${tileSize}px)`,
          gap: '2px',
          backgroundColor: theme.colors.cardBackground,
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
      {tiles.map((pos, index) => {
        // Check for entity at this position (always use current positions)
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
        
        // Check if this is the original position (for undo hint in movement phase)
        const isOriginalPosition = phase === 'movement' && selectedCharacter && (() => {
          const originalPos = originalPositions.get(selectedCharacter);
          return originalPos && originalPos.x === pos.x && originalPos.y === pos.y;
        })();
        
        // Check if this is a selected object (crate)
        const isSelectedObject = selectedObject && (() => {
          const p = world.getComponent<PositionComponent>(selectedObject, 'Position');
          return p && p.x === pos.x && p.y === pos.y;
        })();
        
        // Check if this is a valid push destination
        const isValidPushDest = selectedObject && validPushDirections.some(push => {
          const objPos = world.getComponent<PositionComponent>(selectedObject, 'Position');
          if (!objPos) return false;
          return pos.x === objPos.x + push.dx && pos.y === objPos.y + push.dy;
        });

        return (
          <div
            key={index}
            onClick={() => handleTileClick(pos.x, pos.y)}
            style={{
              width: `${tileSize}px`,
              height: `${tileSize}px`,
              backgroundColor: isSelectedCharacter
                ? '#ffd700' // Gold for selected character
                : isSelectedObject
                ? '#ffa500' // Orange for selected crate
                : isValidPushDest
                ? '#98fb98' // Pale green for valid push destinations
                : isValidMove
                ? '#90ee90' // Light green for valid moves
                : grid.isWall(pos.x, pos.y) 
                ? '#666' 
                : grid.isEntranceZone(pos.x, pos.y)
                ? '#4a90e2'
                : grid.isExitZone(pos.x, pos.y)
                ? '#90ee90' // Light green for all exit zone tiles (consistent)
                : theme.colors.imageBackground,
              opacity: isOriginalPosition ? 0.5 : 1,
              border: isSelectedCharacter 
                ? '3px solid #ff8c00'
                : isSelectedObject
                ? '3px solid #ff6347'
                : isValidPushDest
                ? '2px solid #00ff00'
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
            {/* Show original position hint if selected character has moved */}
            {isOriginalPosition && phase === 'movement' && selectedCharacter && (
              <div style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                fontSize: '0.6rem',
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '2px 4px',
                borderRadius: '2px'
              }}>
                Original
              </div>
            )}
            {!renderable && `${pos.x},${pos.y}`}
          </div>
        );
      })}
        </div>
      </div>

      {/* Info Panel - Right Side: 480px × 800px */}
      <div style={{
        width: '480px',
        height: '800px',
        backgroundColor: theme.colors.cardBackground,
        borderLeft: `2px solid ${theme.colors.imageBorder}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        overflowY: 'auto',
        boxShadow: '-4px 0 6px rgba(0,0,0,0.3)'
      }}>
        {/* Mission Title - Compact */}
        {activeMission && (
          <div style={{
            marginBottom: '0.75rem',
            paddingBottom: '0.75rem',
            borderBottom: `1px solid ${theme.colors.imageBorder}`
          }}>
            <h2 style={{ 
              fontSize: '1.2rem', 
              margin: '0 0 0.25rem 0', 
              color: theme.colors.accent,
              fontWeight: 'bold'
            }}>
              {activeMission.title}
            </h2>
            <p style={{ 
              fontSize: '0.75rem', 
              margin: 0, 
              color: theme.colors.text,
              opacity: 0.8,
              lineHeight: '1.2'
            }}>
              {activeMission.description}
            </p>
          </div>
        )}

        {/* Instructions and Turn Counter - Compact */}
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.5rem',
          backgroundColor: theme.colors.background,
          borderRadius: '6px',
          color: theme.colors.text,
          fontSize: '0.85rem',
          lineHeight: '1.3'
        }}>
          <div style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>
            {getInstructions()}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            Turn: 1
          </div>
        </div>

        {/* Free Actions - Movement Planning Phase - Compact */}
        {phase === 'movement' && (() => {
          const playerCharacters = getPlayerCharacters();
          
          return (
            <div style={{
              marginBottom: '0.75rem',
              padding: '0.75rem',
              backgroundColor: theme.colors.background,
              borderRadius: '6px',
              border: `1px solid ${theme.colors.imageBorder}`
            }}>
              <div style={{ 
                marginBottom: '0.5rem', 
                color: theme.colors.accent,
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                Free Actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {playerCharacters.map(charId => {
                  const charIndex = Array.from(world.getAllEntities()).indexOf(charId);
                  const charName = party[charIndex]?.name || `C${charIndex + 1}`;
                  const currentPos = world.getComponent<PositionComponent>(charId, 'Position');
                  const originalPos = originalPositions.get(charId);
                  const hasMoved = originalPos && currentPos && 
                    (originalPos.x !== currentPos.x || originalPos.y !== currentPos.y);
                  const isSelected = selectedCharacter === charId;
                  
                  return (
                    <div
                      key={charId}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: isSelected 
                          ? theme.colors.accent 
                          : theme.colors.cardBackground,
                        borderRadius: '4px',
                        border: isSelected 
                          ? `2px solid ${theme.colors.accentLight}` 
                          : `1px solid ${theme.colors.imageBorder}`,
                        fontSize: '0.75rem',
                        color: isSelected ? theme.colors.background : theme.colors.text,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCharacterClick(charId)}
                      title={hasMoved && currentPos ? `Move: (${originalPos.x},${originalPos.y}) → (${currentPos.x},${currentPos.y})` : 'Wait'}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                        {charName}
                      </div>
                      {hasMoved ? (
                        <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                          ✓ Move
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                          Wait
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Movement Planning Controls - Compact */}
        {phase === 'movement' && (
          <div style={{
            marginBottom: '0.75rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => {
                // Restore all characters to original positions
                originalPositions.forEach((originalPos, charId) => {
                  movementSystem.moveCharacter(world, charId, originalPos);
                });
                setSelectedCharacter(null);
                setValidMoves([]);
                setTick(t => t + 1); // Trigger re-render
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.85rem',
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.imageBorder}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Clear All Movements
            </button>
            <button
              onClick={() => {
                // Characters are already in their new positions, just transition to skill phase
                setPhase('skill');
                setSelectedCharacter(null);
                setValidMoves([]);
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.85rem',
                backgroundColor: theme.colors.success,
                color: theme.colors.text,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Plan Skills
            </button>
          </div>
        )}

        {/* Skill Action Planning Phase */}
        {phase === 'skill' && (() => {
          const playerCharacters = getPlayerCharacters();
          
          return (
            <>
              {/* Action Queue - Compact */}
              <div style={{
                marginBottom: '0.75rem',
                padding: '0.75rem',
                backgroundColor: theme.colors.background,
                borderRadius: '6px',
                border: `1px solid ${theme.colors.imageBorder}`
              }}>
                <div style={{ 
                  marginBottom: '0.5rem', 
                  color: theme.colors.accent,
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Action Queue
                </div>
                {plannedActions.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, fontStyle: 'italic' }}>
                    No actions planned. Select characters to add actions.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {plannedActions.map((action, index) => {
                      const charIndex = Array.from(world.getAllEntities()).indexOf(action.characterId);
                      const charName = party[charIndex]?.name || `C${charIndex + 1}`;
                      return (
                        <div
                          key={`${action.characterId}-${index}`}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: theme.colors.cardBackground,
                            borderRadius: '4px',
                            border: `1px solid ${theme.colors.imageBorder}`,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', minWidth: '1.5rem' }}>
                            {index + 1}.
                          </div>
                          <div style={{ flex: 1 }}>
                            {charName}: {action.action} ({action.cost} stamina)
                          </div>
                          <button
                            onClick={() => {
                              if (index > 0) {
                                const newActions = [...plannedActions];
                                [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
                                setPlannedActions(newActions);
                              }
                            }}
                            disabled={index === 0}
                            style={{
                              padding: '0.25rem 0.4rem',
                              fontSize: '0.7rem',
                              backgroundColor: index === 0 ? theme.colors.imageBackground : theme.colors.cardBackground,
                              color: theme.colors.text,
                              border: `1px solid ${theme.colors.imageBorder}`,
                              borderRadius: '3px',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              opacity: index === 0 ? 0.5 : 1
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => {
                              if (index < plannedActions.length - 1) {
                                const newActions = [...plannedActions];
                                [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
                                setPlannedActions(newActions);
                              }
                            }}
                            disabled={index === plannedActions.length - 1}
                            style={{
                              padding: '0.25rem 0.4rem',
                              fontSize: '0.7rem',
                              backgroundColor: index === plannedActions.length - 1 ? theme.colors.imageBackground : theme.colors.cardBackground,
                              color: theme.colors.text,
                              border: `1px solid ${theme.colors.imageBorder}`,
                              borderRadius: '3px',
                              cursor: index === plannedActions.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: index === plannedActions.length - 1 ? 0.5 : 1
                            }}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => {
                              const newActions = plannedActions.filter((_, i) => i !== index);
                              setPlannedActions(newActions);
                            }}
                            style={{
                              padding: '0.25rem 0.4rem',
                              fontSize: '0.7rem',
                              backgroundColor: '#d32f2f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Available Actions - When character selected */}
              {selectedCharacter && (() => {
                const availableActions = getAvailableActions(selectedCharacter);
                const charIndex = Array.from(world.getAllEntities()).indexOf(selectedCharacter);
                const charName = party[charIndex]?.name || `Character ${charIndex + 1}`;
                const existingActionIndex = plannedActions.findIndex(a => a.characterId === selectedCharacter);
                
                return (
                  <div style={{
                    marginBottom: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: theme.colors.background,
                    borderRadius: '6px',
                    border: `1px solid ${theme.colors.imageBorder}`
                  }}>
                    <div style={{ 
                      marginBottom: '0.5rem', 
                      color: theme.colors.accent,
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      {charName} - Select Action
                    </div>
                    <select
                      value={existingActionIndex >= 0 ? plannedActions[existingActionIndex].action : 'Wait'}
                      onChange={(e) => {
                        const selectedActionName = e.target.value;
                        if (selectedActionName === 'Wait' || selectedActionName === '') {
                          // Remove action (set to Wait)
                          if (existingActionIndex >= 0) {
                            const newActions = plannedActions.filter((_, i) => i !== existingActionIndex);
                            setPlannedActions(newActions);
                          }
                        } else {
                          // Find the action by name
                          const action = availableActions.find(a => a.name === selectedActionName);
                          if (action) {
                            const newAction: PlannedAction = {
                              characterId: selectedCharacter,
                              action: action.name,
                              cost: action.cost,
                              targetId: action.targetId || (action.requiresItem ? selectedObject || undefined : undefined)
                            };
                            
                            if (existingActionIndex >= 0) {
                              // Update existing action
                              const newActions = [...plannedActions];
                              newActions[existingActionIndex] = newAction;
                              setPlannedActions(newActions);
                            } else {
                              // Add new action
                              setPlannedActions([...plannedActions, newAction]);
                            }
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                        backgroundColor: theme.colors.cardBackground,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.imageBorder}`,
                        borderRadius: '4px'
                      }}
                    >
                      <option value="Wait">Wait (0 stamina)</option>
                      {availableActions.filter(a => a.name !== 'Wait').map((action, index) => (
                        <option key={index} value={action.name}>
                          {action.name} ({action.cost} stamina{action.requiresItem ? ', requires item' : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* Skill Action Controls - Compact */}
              <div style={{
                marginBottom: '0.75rem',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => {
                    // Restore original positions when going back
                    originalPositions.forEach((originalPos, charId) => {
                      movementSystem.moveCharacter(world, charId, originalPos);
                    });
                    setPlannedActions([]);
                    setPhase('movement');
                    setSelectedCharacter(null);
                    setSelectedObject(null);
                    setTick(t => t + 1); // Trigger re-render
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.imageBorder}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // Execute all planned actions
                    setPhase('executing');
                    // TODO: Execute movements first, then skill actions
                    // For now, just reset
                    setTimeout(() => {
                      setPlannedActions([]);
                      setPhase('movement');
                      setSelectedCharacter(null);
                      setSelectedObject(null);
                      setTick(t => t + 1);
                    }, 100);
                  }}
                  disabled={plannedActions.length === 0}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    backgroundColor: plannedActions.length === 0 
                      ? theme.colors.imageBackground 
                      : theme.colors.success,
                    color: theme.colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: plannedActions.length === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: plannedActions.length === 0 ? 0.5 : 1
                  }}
                >
                  Execute
                </button>
              </div>
            </>
          );
        })()}

        {/* Selected Entity Stats - Only show one at a time */}
        {selectedCharacter && !selectedObject && (() => {
          const attrs = world.getComponent<AttributesComponent>(selectedCharacter, 'Attributes');
          
          if (!attrs) return null;
          
          // Get character name from party
          const charIndex = Array.from(world.getAllEntities()).indexOf(selectedCharacter);
          const charName = party[charIndex]?.name || `Character ${charIndex + 1}`;
          const archetype = party[charIndex]?.archetype || 'Adventurer';
          
          return (
            <div style={{
              padding: '0.75rem',
              backgroundColor: theme.colors.background,
              borderRadius: '6px',
              color: theme.colors.text,
              marginBottom: '0.75rem',
              border: `1px solid ${theme.colors.imageBorder}`
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.25rem', color: theme.colors.accent, fontSize: '1rem' }}>
                {charName}
              </h3>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: theme.colors.accentLight }}>
                {archetype}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <div>STR: {attrs.str}</div>
                <div>DEX: {attrs.dex}</div>
                <div>CON: {attrs.con}</div>
                <div>INT: {attrs.int}</div>
                <div>WIS: {attrs.wis}</div>
                <div>CHA: {attrs.cha}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div>HP: 10/10</div>
                <div>Stamina: 10/10</div>
                <div>Gold: {party[charIndex]?.gold || 0}</div>
                <div>Food: {party[charIndex]?.food || 0}</div>
              </div>
            </div>
          );
        })()}

        {/* Item Stats - When item selected (only if no character selected) */}
        {selectedObject && !selectedCharacter && (() => {
          const pushable = world.getComponent<PushableComponent>(selectedObject, 'Pushable');
          const renderable = world.getComponent<RenderableComponent>(selectedObject, 'Renderable');
          
          if (!pushable) return null;
          
          return (
            <div style={{
              padding: '0.75rem',
              backgroundColor: theme.colors.background,
              borderRadius: '6px',
              color: theme.colors.text,
              marginBottom: '0.75rem',
              border: `1px solid ${theme.colors.imageBorder}`
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: theme.colors.accent, fontSize: '1rem' }}>
                {renderable?.char === 'C' ? 'Crate' : 'Item'}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div>Type: Crate</div>
                <div>Weight: {pushable.weight} lb</div>
                <div>Pushable: Yes</div>
              </div>
            </div>
          );
        })()}

        {/* Complete Mission Button - At bottom */}
        {onCompleteMission && (
          <div style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: `1px solid ${theme.colors.imageBorder}`
          }}>
            <button 
              onClick={onCompleteMission}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.9rem',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Complete Mission (Debug)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
