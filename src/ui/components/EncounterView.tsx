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

interface PlannedMovement {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export const EncounterView: React.FC<EncounterViewProps> = ({ activeMission, onCompleteMission }) => {
  const { grid, world, completeMission, consumeFood, party, showStatus } = useGame();
  const [tick, setTick] = useState(0); // Force render
  const [phase, setPhase] = useState<PlanningPhase>('movement');
  const [plannedMovements, setPlannedMovements] = useState<Map<number, PlannedMovement>>(new Map());
  const [originalPositions, setOriginalPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [validPushDirections, setValidPushDirections] = useState<Array<{ dx: number; dy: number; staminaCost: number }>>([]);
  const movementSystem = new MovementSystem();
  const pushSystem = new PushSystem();

  // Initialize original positions on mount
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
      setPlannedMovements(new Map());
    }
  }, [world, phase === 'movement']);

  if (!grid || !world) return <div>Loading Encounter...</div>;

  // Helper to get instructions text
  const getInstructions = (): string => {
    if (phase === 'movement') {
      if (selectedCharacter) {
        return '👆 Click a green tile to plan movement. Click grayed original position to undo.';
      }
      if (plannedMovements.size > 0) {
        return `📋 ${plannedMovements.size} movement(s) planned. Select characters to plan more, or click "Plan Skill Actions".`;
      }
      return '👆 Click a character to select, then click a green tile to plan their movement.';
    }
    if (phase === 'skill') {
      return '🎯 Skill Action Planning: Select characters and choose actions (coming soon)';
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

  const handleCharacterClick = (characterId: number) => {
    if (phase !== 'movement') return;
    
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    if (!attrs) return;

    // Use original position for movement planning
    const originalPos = originalPositions.get(characterId);
    if (!originalPos) return;

    // If clicking the same character, deselect
    if (selectedCharacter === characterId) {
      setSelectedCharacter(null);
      setValidMoves([]);
      setSelectedObject(null);
      setValidPushDirections([]);
      return;
    }

    // Select character and show valid moves from original position
    setSelectedCharacter(characterId);
    const moves = movementSystem.getValidMoves(world, grid, characterId, originalPos, attrs.dex);
    setValidMoves(moves);
    
    // Check if character is adjacent to any pushable objects
    const entities = world.getAllEntities();
    const adjacentObjects: Array<{ id: number; pushActions: Array<{ direction: { dx: number; dy: number }; staminaCost: number }> }> = [];
    
    for (const entityId of entities) {
      const pushable = world.getComponent<PushableComponent>(entityId, 'Pushable');
      if (!pushable) continue;
      
      const objPos = world.getComponent<PositionComponent>(entityId, 'Position');
      if (!objPos) continue;
      
      const distance = grid.getDistance(pos, objPos);
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

  // Check if planned movements result in overlapping characters
  const hasOverlappingCharacters = (): boolean => {
    const destinationMap = new Map<string, number>();
    for (const [charId, movement] of plannedMovements.entries()) {
      const key = `${movement.to.x},${movement.to.y}`;
      if (destinationMap.has(key)) {
        return true; // Overlap found
      }
      destinationMap.set(key, charId);
    }
    return false;
  };

  const handleTileClick = (x: number, y: number) => {
    // Movement planning phase
    if (phase === 'movement') {
      // Check if clicking on original position to undo
      if (selectedCharacter !== null) {
        const originalPos = originalPositions.get(selectedCharacter);
        if (originalPos && originalPos.x === x && originalPos.y === y) {
          // Undo movement for this character
          const newPlanned = new Map(plannedMovements);
          newPlanned.delete(selectedCharacter);
          setPlannedMovements(newPlanned);
          setSelectedCharacter(null);
          setValidMoves([]);
          return;
        }
      }

      // If character is selected and this is a valid move, plan the movement
      if (selectedCharacter !== null) {
        const isValidMove = validMoves.some(move => move.x === x && move.y === y);
        
        if (isValidMove) {
          const originalPos = originalPositions.get(selectedCharacter);
          if (originalPos) {
            // Plan the movement
            const newPlanned = new Map(plannedMovements);
            newPlanned.set(selectedCharacter, {
              from: originalPos,
              to: { x, y }
            });
            setPlannedMovements(newPlanned);
            setSelectedCharacter(null);
            setValidMoves([]);
          }
          return;
        }
      }

      // Check if clicking on a character to select
      const entities = world.getAllEntities();
      const clickedEntity = entities.find(id => {
        const r = world.getComponent<RenderableComponent>(id, 'Renderable');
        const attrs = world.getComponent<AttributesComponent>(id, 'Attributes');
        if (!r || !attrs) return false;
        // Use original position if character has planned movement
        const originalPos = originalPositions.get(id);
        const currentPos = world.getComponent<PositionComponent>(id, 'Position');
        const pos = originalPos || (currentPos ? { x: currentPos.x, y: currentPos.y } : null);
        return pos && pos.x === x && pos.y === y && r.color === theme.colors.accent;
      });

      if (clickedEntity) {
        handleCharacterClick(clickedEntity);
        return;
      }
      return;
    }

    // Legacy code for skill/executing phases (will be updated later)
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
        // Check for entity at this position (using original position in movement phase)
        const entities = world.getAllEntities();
        let entityId: number | undefined;
        let renderable: RenderableComponent | null = null;
        
        if (phase === 'movement') {
          // In movement phase, check original positions
          for (const id of entities) {
            const originalPos = originalPositions.get(id);
            if (originalPos && originalPos.x === pos.x && originalPos.y === pos.y) {
              entityId = id;
              renderable = world.getComponent<RenderableComponent>(id, 'Renderable');
              break;
            }
          }
        } else {
          // In other phases, use current positions
          entityId = entities.find(id => {
            const p = world.getComponent<PositionComponent>(id, 'Position');
            return p && p.x === pos.x && p.y === pos.y;
          });
          renderable = entityId ? world.getComponent<RenderableComponent>(entityId, 'Renderable') : null;
        }

        // Check for ghost position (planned movement destination)
        let ghostCharacterId: number | undefined;
        let ghostRenderable: RenderableComponent | null = null;
        if (phase === 'movement') {
          plannedMovements.forEach((movement, charId) => {
            if (movement.to.x === pos.x && movement.to.y === pos.y) {
              ghostCharacterId = charId;
              ghostRenderable = world.getComponent<RenderableComponent>(charId, 'Renderable');
            }
          });
        }

        // Check if this is an original position that should be grayed out
        const isOriginalPosition = phase === 'movement' && (() => {
          for (const [charId, originalPos] of originalPositions.entries()) {
            if (originalPos.x === pos.x && originalPos.y === pos.y) {
              // Gray out if character has a planned movement
              return plannedMovements.has(charId);
            }
          }
          return false;
        })();

        // Check if this tile is a valid move
        const isValidMove = validMoves.some(move => move.x === pos.x && move.y === pos.y);
        const isSelectedCharacter = selectedCharacter && (() => {
          const originalPos = originalPositions.get(selectedCharacter);
          if (originalPos) {
            return originalPos.x === pos.x && originalPos.y === pos.y;
          }
          const p = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
          return p && p.x === pos.x && p.y === pos.y;
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
              backgroundColor: isOriginalPosition
                ? '#555' // Gray out original positions with planned moves
                : isSelectedCharacter
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
            {/* Ghost position for planned movement */}
            {ghostRenderable && ghostCharacterId && (
              <div style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                opacity: 0.6,
                pointerEvents: 'none'
              }}>
                {ghostRenderable.sprite ? (
                  <img 
                    src={ghostRenderable.sprite} 
                    alt="ghost" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.6 }} 
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: ghostRenderable.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.cardBackground,
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    opacity: 0.6
                  }}>
                    {ghostRenderable.char}
                  </div>
                )}
              </div>
            )}
            {!renderable && !ghostRenderable && `${pos.x},${pos.y}`}
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
                  const plannedMove = plannedMovements.get(charId);
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
                      title={plannedMove ? `Move: (${plannedMove.from.x},${plannedMove.from.y}) → (${plannedMove.to.x},${plannedMove.to.y})` : 'Wait'}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                        {charName}
                      </div>
                      {plannedMove ? (
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
                setPlannedMovements(new Map());
                setSelectedCharacter(null);
                setValidMoves([]);
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
              Clear
            </button>
            <button
              onClick={() => {
                if (!hasOverlappingCharacters()) {
                  setPhase('skill');
                }
              }}
              disabled={hasOverlappingCharacters()}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.85rem',
                backgroundColor: hasOverlappingCharacters() 
                  ? theme.colors.imageBackground 
                  : theme.colors.success,
                color: theme.colors.text,
                border: 'none',
                borderRadius: '4px',
                cursor: hasOverlappingCharacters() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: hasOverlappingCharacters() ? 0.5 : 1
              }}
            >
              Plan Skills
            </button>
          </div>
        )}
        {phase === 'movement' && hasOverlappingCharacters() && (
          <div style={{
            marginBottom: '0.75rem',
            fontSize: '0.75rem',
            color: '#d32f2f',
            fontStyle: 'italic',
            padding: '0.25rem 0.5rem'
          }}>
            ⚠️ Characters cannot overlap
          </div>
        )}

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
