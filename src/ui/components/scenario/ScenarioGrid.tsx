import React from 'react';
import { Grid } from '../../../game-engine/grid/Grid';
import { World } from '../../../game-engine/ecs/World';
import { PositionComponent, RenderableComponent, DirectionComponent } from '../../../game-engine/ecs/Component';
import { MovementPlan } from '../../../game-engine/encounters/MovementPlan';
import { PlanningPhase } from '../../../game-engine/encounters/EncounterPhaseManager';
import { ValidMove, ValidPushDirection } from '../../../game-engine/encounters/EncounterStateManager';
import { theme } from '../../styles/theme';

interface ScenarioGridProps {
  grid: Grid;
  world: World;
  phase: PlanningPhase;
  selectedCharacter: number | null;
  selectedObject: number | null;
  validMoves: ValidMove[];
  validPushDirections: ValidPushDirection[];
  movementPlan: MovementPlan;
  showTileCoordinates: boolean;
  onTileClick: (x: number, y: number) => void;
  selectingDirection?: boolean;
}

export const ScenarioGrid: React.FC<ScenarioGridProps> = ({
  grid,
  world,
  phase,
  selectedCharacter,
  selectedObject,
  validMoves,
  validPushDirections,
  movementPlan,
  showTileCoordinates,
  onTileClick,
  selectingDirection: _selectingDirection = false,
}) => {
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
          
          // Check if this is the current position (where character is now, after any executed steps)
          const isCurrentPosition = phase === 'movement' && selectedCharacter && (() => {
            const currentPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
            return currentPos && currentPos.x === pos.x && currentPos.y === pos.y;
          })();
          
          // Check if this is a selected object (crate)
          const isSelectedObjectTile = selectedObject && (() => {
            const p = world.getComponent<PositionComponent>(selectedObject, 'Position');
            return p && p.x === pos.x && p.y === pos.y;
          })();
          
          // Check if this is a valid push destination
          const isValidPushDest = selectedObject && validPushDirections.some(push => {
            const objPos = world.getComponent<PositionComponent>(selectedObject, 'Position');
            if (!objPos) return false;
            return pos.x === objPos.x + push.dx && pos.y === objPos.y + push.dy;
          });
          
          // Check if this tile is part of a planned path (only unexecuted steps)
          const isPathStep = phase === 'movement' && (() => {
            // Check all characters' paths
            const allPaths = movementPlan.getAllPaths();
            for (const path of allPaths) {
              const stepIndex = path.steps.findIndex(step => step.x === pos.x && step.y === pos.y);
              // Only highlight steps that haven't been executed yet
              if (stepIndex >= 0 && stepIndex >= path.currentStepIndex) {
                return { path, stepIndex: stepIndex + 1 }; // Step numbers start at 1
              }
            }
            return null;
          })();
          
          // Check if this is the start position of a planned path
          const isPathStart = phase === 'movement' && selectedCharacter && (() => {
            const currentPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
            const path = movementPlan.getPath(selectedCharacter);
            return currentPos && 
                   path && 
                   path.steps.length > 0 &&
                   currentPos.x === pos.x && 
                   currentPos.y === pos.y;
          })();

          return (
            <div
              key={index}
              data-tile-x={pos.x}
              data-tile-y={pos.y}
              data-testid={`tile-${pos.x}-${pos.y}`}
              onClick={() => onTileClick(pos.x, pos.y)}
              style={{
                width: `${tileSize}px`,
                height: `${tileSize}px`,
                backgroundImage: grid.isWall(pos.x, pos.y)
                  ? 'url(/assets/items/wall.png)'
                  : 'url(/assets/items/stone-floor.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: isSelectedCharacter
                  ? 'rgba(255, 215, 0, 0.3)' // Gold overlay for selected character
                  : isPathStep
                  ? 'rgba(100, 149, 237, 0.4)' // Cornflower blue overlay for path steps
                  : isPathStart
                  ? 'rgba(255, 215, 0, 0.2)' // Light gold overlay for path start
                  : isSelectedObjectTile
                  ? 'rgba(255, 165, 0, 0.3)' // Orange overlay for selected crate
                  : isValidPushDest
                  ? 'rgba(152, 251, 152, 0.3)' // Pale green overlay for valid push destinations
                  : isValidMove
                  ? 'rgba(144, 238, 144, 0.3)' // Light green overlay for valid moves
                  : grid.isEntranceZone(pos.x, pos.y)
                  ? 'rgba(74, 144, 226, 0.3)' // Blue overlay for entrance
                  : grid.isExitZone(pos.x, pos.y)
                  ? 'rgba(144, 238, 144, 0.3)' // Light green overlay for exit
                  : 'transparent',
                opacity: isCurrentPosition ? 0.5 : 1,
                border: isSelectedCharacter 
                  ? '3px solid #ff8c00'
                  : isPathStep
                  ? '2px solid #6495ed' // Cornflower blue border for path steps
                  : isSelectedObjectTile
                  ? '3px solid #ff6347'
                  : isValidPushDest
                  ? '2px solid #00ff00'
                  : isValidMove
                  ? '2px solid #32cd32'
                  : 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.text,
                fontSize: '0.7rem',
                cursor: isValidMove || entityId ? 'pointer' : 'default',
                position: 'relative'
              }}
              title={`Tile ${pos.x},${pos.y}${isValidMove ? ' (Valid Move)' : ''}`}
            >
              {renderable && renderable.sprite ? (
                <img 
                  src={renderable.sprite} 
                  alt="entity" 
                  data-entity-id={entityId}
                  data-testid={`entity-${entityId}`}
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
              {/* Show direction indicator (green for players, red for NPCs) */}
              {entityId && (() => {
                const direction = world.getComponent<DirectionComponent>(entityId, 'Direction');
                if (!direction) return null;
                
                // Check if this is an NPC
                const NPCComponent = world.getComponent(entityId, 'NPC');
                const isNPC = NPCComponent !== undefined;
                
                // Green for players, red for NPCs
                const dotColor = isNPC ? '#ff0000' : '#00ff00';
                
                // Calculate position for the circle based on direction
                // Place it on the edge of the tile in the facing direction
                const offsetX = direction.dx * 0.35; // 35% from center toward edge
                const offsetY = direction.dy * 0.35;
                
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${offsetX * tileSize}px)`,
                      top: `calc(50% + ${offsetY * tileSize}px)`,
                      transform: 'translate(-50%, -50%)',
                      width: '12px',
                      height: '12px',
                      backgroundColor: dotColor,
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                    title={`Facing: (${direction.dx}, ${direction.dy})`}
                  />
                );
              })()}
              {/* Show current position hint */}
              {isCurrentPosition && phase === 'movement' && selectedCharacter && (
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
                  Start
                </div>
              )}
              {/* Show step number for path steps */}
              {isPathStep && !renderable && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: 'rgba(100, 149, 237, 0.8)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fff'
                }}>
                  {isPathStep.stepIndex}
                </div>
              )}
              {/* Show tile coordinates (debug) */}
              {showTileCoordinates && !renderable && (
                <div style={{
                  fontSize: '0.6rem',
                  color: theme.colors.text,
                  opacity: 0.5
                }}>
                  {pos.x},{pos.y}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

