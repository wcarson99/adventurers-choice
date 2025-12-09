import React, { useState } from 'react';
import { useGame } from '../../game-engine/GameState';
import { PositionComponent, RenderableComponent, AttributesComponent, PushableComponent } from '../../game-engine/ecs/Component';
import { theme } from '../styles/theme';
import { Grid } from '../../game-engine/grid/Grid';
import { MovementSystem } from '../../game-engine/encounters/MovementSystem';
import { PushSystem } from '../../game-engine/encounters/PushSystem';
import { MovementPlan } from '../../game-engine/encounters/MovementPlan';

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
  const { grid, world, completeMission, consumeFood, party, showStatus, activeCampaign, currentEncounterIndex } = useGame();
  const [tick, setTick] = useState(0); // Force render
  const [phase, setPhase] = useState<PlanningPhase>('movement');
  const [originalPositions, setOriginalPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  // Debug flag to show tile coordinates (set to true for testing)
  const [showTileCoordinates] = useState<boolean>(false);
  const [plannedActions, setPlannedActions] = useState<PlannedAction[]>([]);
  const [actionOrder, setActionOrder] = useState<number[]>([]); // Character IDs in execution order
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [validPushDirections, setValidPushDirections] = useState<Array<{ dx: number; dy: number; staminaCost: number }>>([]);
  const [movementPlan] = useState<MovementPlan>(() => new MovementPlan());
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
        const path = movementPlan.getPath(selectedCharacter);
        const pathSteps = path ? path.steps.length : 0;
        if (pathSteps > 0) {
          return `👆 Click green tiles to add steps (${pathSteps} planned). Click "Undo" to remove last step.`;
        }
        return '👆 Click a green tile to plan movement path.';
      }
      return '👆 Click a character to select, then click green tiles to plan their path.';
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
    console.log('=== getAvailableActions START ===');
    console.log('Character ID:', characterId);
    console.log('Phase:', phase);
    console.log('Selected Object:', selectedObject);
    
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    if (!attrs) {
      console.log('❌ No AttributesComponent found for character', characterId);
      return [];
    }
    
    console.log('Character Attributes:', attrs);
    console.log('Character STR:', attrs.str);

    const actions: Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }> = [
      { name: 'Wait', cost: 0 }
    ];

    // Check if character can push (STR 3+)
    if (attrs.str >= 3) {
      console.log('✅ Character has STR >= 3, checking for pushable objects...');
      
      // Use current position (after movements in skill phase, or original in movement phase)
      const currentPos = world.getComponent<PositionComponent>(characterId, 'Position');
      const charPos = currentPos ? { x: currentPos.x, y: currentPos.y } : null;
      
      console.log('Character Position:', charPos);
      
      if (charPos) {
        // First check if there's a selected object (crate) that's adjacent
        let targetPushable: number | undefined;
        
        if (selectedObject) {
          console.log('Selected Object ID:', selectedObject);
          const pushable = world.getComponent<PushableComponent>(selectedObject, 'Pushable');
          console.log('Selected Object PushableComponent:', pushable);
          
          if (pushable) {
            const objPos = world.getComponent<PositionComponent>(selectedObject, 'Position');
            console.log('Selected Object Position:', objPos);
            
            if (objPos) {
              const distance = grid.getDistance(charPos, objPos);
              console.log('Distance to selected object:', distance);
              
              if (distance === 1) {
                targetPushable = selectedObject;
                console.log('✅ Selected object is adjacent, using it as target');
              } else {
                console.log('❌ Selected object is NOT adjacent (distance:', distance, ')');
              }
            } else {
              console.log('❌ Selected object has no PositionComponent');
            }
          } else {
            console.log('❌ Selected object has no PushableComponent');
          }
        } else {
          console.log('No object selected');
        }
        
        // If no selected object is adjacent, look for any adjacent pushable
        if (!targetPushable) {
          console.log('Searching for any adjacent pushable objects...');
          const entities = world.getAllEntities();
          console.log('All entities:', entities);
          
          targetPushable = entities.find(id => {
            const pushable = world.getComponent<PushableComponent>(id, 'Pushable');
            if (!pushable) return false;
            const objPos = world.getComponent<PositionComponent>(id, 'Position');
            if (!objPos) return false;
            const distance = grid.getDistance(charPos, objPos);
            console.log(`  Entity ${id}: pushable=${!!pushable}, pos=(${objPos.x},${objPos.y}), distance=${distance}`);
            return distance === 1;
          });
          
          if (targetPushable) {
            console.log('✅ Found adjacent pushable object:', targetPushable);
          } else {
            console.log('❌ No adjacent pushable objects found');
          }
        }

        if (targetPushable) {
          console.log('Checking valid push actions for object:', targetPushable);
          const pushActions = pushSystem.getValidPushActions(world, grid, characterId, targetPushable);
          console.log('PushSystem.getValidPushActions result:', pushActions);
          
          if (pushActions.length > 0) {
            console.log('✅ Adding Push action with', pushActions.length, 'valid directions');
            actions.push({
              name: 'Push',
              cost: pushActions[0].staminaCost,
              requiresItem: true,
              targetId: targetPushable
            });
          } else {
            console.log('❌ No valid push actions returned by PushSystem');
          }
        } else {
          console.log('❌ No target pushable object found');
        }
      } else {
        console.log('❌ Character has no position');
      }
    } else {
      console.log('❌ Character STR < 3, cannot push');
    }

    console.log('Final actions:', actions);
    console.log('=== getAvailableActions END ===');
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
    // Movement phase: plan paths instead of moving immediately
    if (phase === 'movement') {
      // If character is selected and this is a valid move, add to path (don't move yet)
      if (selectedCharacter !== null) {
        const attrs = world.getComponent<AttributesComponent>(selectedCharacter, 'Attributes');
        if (!attrs) return;
        
        // Get the position to move from (last step in path, or current position)
        const path = movementPlan.getPath(selectedCharacter);
        let fromPos: { x: number; y: number };
        
        if (path && path.steps.length > 0) {
          // Moving from the last step in the path
          fromPos = path.steps[path.steps.length - 1];
        } else {
          // Moving from current position
          const currentPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
          if (!currentPos) return;
          fromPos = { x: currentPos.x, y: currentPos.y };
        }
        
        // Validate the step using MovementSystem
        const isValidStep = movementSystem.canMoveFromTo(
          world,
          grid,
          selectedCharacter,
          fromPos,
          { x, y },
          attrs.dex
        );
        
        if (isValidStep) {
          // Add step to path
          movementPlan.addStep(selectedCharacter, { x, y });
          
          // Update valid moves for next step (from the newly added position)
          const moves = movementSystem.getValidMoves(world, grid, selectedCharacter, { x, y }, attrs.dex);
          setValidMoves(moves);
          
          setTick(t => t + 1); // Trigger re-render to show path preview
          return;
        } else {
          showStatus('Invalid move: not a valid movement pattern', 'error');
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
      console.log('=== Skill Phase Tile Click ===');
      console.log('Clicked tile:', x, y);
      
      const entities = world.getAllEntities();
      const clickedEntity = entities.find(id => {
        const p = world.getComponent<PositionComponent>(id, 'Position');
        return p && p.x === x && p.y === y;
      });
      
      console.log('Clicked entity ID:', clickedEntity);
      
      if (clickedEntity) {
        const r = world.getComponent<RenderableComponent>(clickedEntity, 'Renderable');
        const attrs = world.getComponent<AttributesComponent>(clickedEntity, 'Attributes');
        const pushable = world.getComponent<PushableComponent>(clickedEntity, 'Pushable');
        
        console.log('Entity components:', { 
          hasRenderable: !!r, 
          hasAttributes: !!attrs, 
          hasPushable: !!pushable,
          renderableColor: r?.color 
        });
        
        if (r && attrs && r.color === theme.colors.accent) {
          // Clicked on a character
          console.log('✅ Clicked on character:', clickedEntity);
          handleCharacterClick(clickedEntity);
        } else if (pushable) {
          // Clicked on an item (crate)
          console.log('✅ Clicked on crate:', clickedEntity);
          console.log('Setting selectedObject to:', clickedEntity);
          setSelectedObject(clickedEntity);
          setTick(t => t + 1); // Force re-render to update available actions
          // Re-check available actions for selected character if one is selected
          if (selectedCharacter) {
            console.log('Character already selected, actions should update');
          }
        } else {
          console.log('❌ Clicked entity is neither character nor crate');
        }
      } else {
        console.log('❌ No entity found at clicked position');
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
            // Check if this is a campaign or mission
            if (activeCampaign && currentEncounterIndex !== undefined) {
              const encounter = activeCampaign.encounters[currentEncounterIndex];
              const isLastEncounter = currentEncounterIndex === activeCampaign.encounters.length - 1;
              if (isLastEncounter) {
                showStatus("Campaign Complete! All encounters finished.", 'success', 3000);
              } else {
                showStatus(`Encounter Complete! Loading next encounter...`, 'success', 2000);
              }
            } else {
              showStatus("All characters reached the exit! Mission Complete.", 'success', 3000);
              if (activeMission) consumeFood(activeMission.days * 4);
            }
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
        
        // Check if this tile is part of a planned path
        const isPathStep = phase === 'movement' && (() => {
          // Check all characters' paths
          const allPaths = movementPlan.getAllPaths();
          for (const path of allPaths) {
            const stepIndex = path.steps.findIndex(step => step.x === pos.x && step.y === pos.y);
            if (stepIndex >= 0) {
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
            onClick={() => handleTileClick(pos.x, pos.y)}
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
                : isSelectedObject
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
              opacity: isOriginalPosition ? 0.5 : 1,
              border: isSelectedCharacter 
                ? '3px solid #ff8c00'
                : isPathStep
                ? '2px solid #6495ed' // Cornflower blue border for path steps
                : isSelectedObject
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
        {/* Mission/Campaign Title - Compact */}
        {(activeMission || (activeCampaign && currentEncounterIndex !== undefined)) && (
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
              {activeMission 
                ? activeMission.title 
                : activeCampaign && currentEncounterIndex !== undefined
                  ? `${activeCampaign.name} - ${activeCampaign.encounters[currentEncounterIndex].name}`
                  : ''}
            </h2>
            <p style={{ 
              fontSize: '0.75rem', 
              margin: 0, 
              color: theme.colors.text,
              opacity: 0.8,
              lineHeight: '1.2'
            }}>
              {activeMission 
                ? activeMission.description 
                : activeCampaign && currentEncounterIndex !== undefined
                  ? activeCampaign.encounters[currentEncounterIndex].description
                  : ''}
            </p>
            {activeCampaign && currentEncounterIndex !== undefined && (
              <p style={{ 
                fontSize: '0.7rem', 
                margin: '0.25rem 0 0 0', 
                color: theme.colors.accentLight,
                opacity: 0.7,
                fontStyle: 'italic'
              }}>
                Encounter {currentEncounterIndex + 1} of {activeCampaign.encounters.length}
              </p>
            )}
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
                  const path = movementPlan.getPath(charId);
                  const pathSteps = path ? path.steps.length : 0;
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
                      title={pathSteps > 0 ? `${pathSteps} step${pathSteps !== 1 ? 's' : ''} planned` : 'No path planned'}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                        {charName}
                      </div>
                      {pathSteps > 0 ? (
                        <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                          {pathSteps} step{pathSteps !== 1 ? 's' : ''}
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
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {movementPlan.hasAnyPath() && (() => {
              // Check if there are any paths that can be executed (ready or executing)
              const executablePaths = movementPlan.getAllPaths().filter(path => 
                path.steps.length > 0 && 
                (path.status === 'ready' || path.status === 'executing') &&
                path.currentStepIndex < path.steps.length
              );
              
              if (executablePaths.length === 0) return null;
              
              return (
                <button
                  onClick={() => {
                    // Execute next step for all characters with executable paths
                    executablePaths.forEach(path => {
                      const nextStep = path.steps[path.currentStepIndex];
                      if (nextStep) {
                        // Move character to next step
                        movementSystem.moveCharacter(world, path.characterId, nextStep);
                        path.currentStepIndex++;
                        
                        // Update status
                        if (path.currentStepIndex >= path.steps.length) {
                          path.status = 'complete';
                        } else {
                          path.status = 'executing';
                        }
                      }
                    });
                    
                    setTick(t => t + 1); // Trigger re-render
                  }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  backgroundColor: theme.colors.accent,
                  color: theme.colors.text,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                  Execute Free Moves
                </button>
              );
            })()}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedCharacter && movementPlan.getPath(selectedCharacter)?.steps.length > 0 && (
                <button
                  onClick={() => {
                    // Remove last step from selected character's path
                    if (movementPlan.removeLastStep(selectedCharacter)) {
                      // Update valid moves from the new last position (or current position)
                      const path = movementPlan.getPath(selectedCharacter);
                      const attrs = world.getComponent<AttributesComponent>(selectedCharacter, 'Attributes');
                      if (attrs) {
                        let fromPos: { x: number; y: number };
                        if (path && path.steps.length > 0) {
                          fromPos = path.steps[path.steps.length - 1];
                        } else {
                          const currentPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
                          if (currentPos) {
                            fromPos = { x: currentPos.x, y: currentPos.y };
                          } else {
                            return;
                          }
                        }
                        const moves = movementSystem.getValidMoves(world, grid, selectedCharacter, fromPos, attrs.dex);
                        setValidMoves(moves);
                      }
                      setTick(t => t + 1);
                    }
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
                    fontWeight: 'bold',
                    minWidth: '120px'
                  }}
                >
                  Undo Last Step
                </button>
              )}
              <button
                onClick={() => {
                  // Clear all paths
                  movementPlan.clearAll();
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
                  fontWeight: 'bold',
                  minWidth: '120px'
                }}
              >
                Clear All Movements
              </button>
              <button
                onClick={() => {
                  // Check if all paths are complete or no paths planned
                  const allComplete = movementPlan.getAllPaths().every(path => 
                    path.status === 'complete' || path.steps.length === 0
                  );
                  
                  if (allComplete || !movementPlan.hasAnyPath()) {
                    // Transition to skill phase
                    setPhase('skill');
                    setSelectedCharacter(null);
                    setValidMoves([]);
                  } else {
                    showStatus('Complete all movement paths before proceeding', 'error');
                  }
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
                console.log('=== Rendering Available Actions ===');
                console.log('Selected Character:', selectedCharacter);
                console.log('Selected Object:', selectedObject);
                const availableActions = getAvailableActions(selectedCharacter);
                console.log('Available Actions returned:', availableActions);
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
                    // Execute all planned actions (or everyone waits if no actions planned)
                    setPhase('executing');
                    
                    // Execute each planned action
                    plannedActions.forEach((plannedAction) => {
                      if (plannedAction.action === 'Push' && plannedAction.targetId) {
                        console.log(`🔄 Executing Push: character ${plannedAction.characterId}, object ${plannedAction.targetId}`);
                        
                        // Get valid push directions for this character and object
                        const pushActions = pushSystem.getValidPushActions(
                          world,
                          grid,
                          plannedAction.characterId,
                          plannedAction.targetId
                        );
                        
                        console.log(`  Found ${pushActions.length} valid push directions:`, pushActions);
                        
                        if (pushActions.length > 0) {
                          // Find the direction that makes sense based on character position
                          // Character should be behind the object in the push direction
                          const charPos = world.getComponent<PositionComponent>(plannedAction.characterId, 'Position');
                          const objPos = world.getComponent<PositionComponent>(plannedAction.targetId, 'Position');
                          
                          let pushDirection = pushActions[0].direction; // Default to first
                          
                          if (charPos && objPos) {
                            // Calculate direction from character to object
                            const charToObj = {
                              dx: objPos.x - charPos.x,
                              dy: objPos.y - charPos.y
                            };
                            
                            // Find push direction that matches (character behind object)
                            const matchingDirection = pushActions.find(pa => 
                              pa.direction.dx === charToObj.dx && pa.direction.dy === charToObj.dy
                            );
                            
                            if (matchingDirection) {
                              pushDirection = matchingDirection.direction;
                              console.log(`  ✅ Using matching direction: (${pushDirection.dx}, ${pushDirection.dy})`);
                            } else {
                              console.log(`  ⚠️ No matching direction found, using first: (${pushDirection.dx}, ${pushDirection.dy})`);
                            }
                          }
                          
                          // Get object's current position BEFORE pushing (copy the values, not the reference)
                          const objPosComponent = world.getComponent<PositionComponent>(plannedAction.targetId, 'Position');
                          if (!objPosComponent) {
                            console.log(`❌ Object ${plannedAction.targetId} has no position`);
                            showStatus('Cannot push: object has no position', 'error');
                            return;
                          }
                          
                          // Copy the position values (before they get modified by pushObject)
                          const objOldPosition = { x: objPosComponent.x, y: objPosComponent.y };
                          console.log(`  Object old position: (${objOldPosition.x}, ${objOldPosition.y})`);
                          
                          // Push the object (this modifies objPosComponent)
                          pushSystem.pushObject(world, plannedAction.targetId, pushDirection);
                          
                          // Move character to object's old position (using the copied values)
                          movementSystem.moveCharacter(world, plannedAction.characterId, objOldPosition);
                          
                          console.log(`✅ Pushed object ${plannedAction.targetId} in direction (${pushDirection.dx}, ${pushDirection.dy})`);
                          console.log(`✅ Moved character ${plannedAction.characterId} to object's old position (${objOldPosition.x}, ${objOldPosition.y})`);
                          showStatus(`Pushed crate!`, 'success');
                          
                          // Trigger re-render to show the movement
                          setTick(t => t + 1);
                        } else {
                          console.log(`❌ No valid push directions for character ${plannedAction.characterId} and object ${plannedAction.targetId}`);
                          showStatus('Cannot push: no valid direction', 'error');
                        }
                      } else if (plannedAction.action === 'Wait') {
                        // Wait action - do nothing
                        console.log(`Character ${plannedAction.characterId} waits`);
                      }
                    });
                    
                    // Reset after execution
                    setTimeout(() => {
                      setPlannedActions([]);
                      setPhase('movement');
                      setSelectedCharacter(null);
                      setSelectedObject(null);
                      // Update original positions for next turn
                      const newOriginalPositions = new Map<number, { x: number; y: number }>();
                      const playerCharacters = getPlayerCharacters();
                      playerCharacters.forEach(charId => {
                        const pos = world.getComponent<PositionComponent>(charId, 'Position');
                        if (pos) {
                          newOriginalPositions.set(charId, { x: pos.x, y: pos.y });
                        }
                      });
                      setOriginalPositions(newOriginalPositions);
                      setTick(t => t + 1);
                    }, 500); // Give time for animations/visual feedback
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

      </div>
    </div>
  );
};
