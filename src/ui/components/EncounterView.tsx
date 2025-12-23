import React, { useState, useRef } from 'react';
import { useGame } from '../../game-engine/GameState';
import { PositionComponent, RenderableComponent, AttributesComponent, PushableComponent } from '../../game-engine/ecs/Component';
import { theme } from '../styles/theme';
import { MovementPlan } from '../../game-engine/encounters/MovementPlan';
import { PlanningPhase } from '../../game-engine/encounters/EncounterPhaseManager';
import { PlannedAction, ValidMove, ValidPushDirection } from '../../game-engine/encounters/EncounterStateManager';
import { EncounterController } from '../../game-engine/encounters/EncounterController';
import { EncounterGrid } from './encounter/EncounterGrid';
import { EncounterInfoPanel } from './encounter/EncounterInfoPanel';
import { useMovementPlanning } from './encounter/useMovementPlanning';
import { useSkillPlanning } from './encounter/useSkillPlanning';

interface EncounterViewProps {
  activeMission?: { title: string; description: string; days?: number };
  onCompleteMission?: () => void;
}

// PlanningPhase type imported from EncounterPhaseManager

// PlannedAction type imported from EncounterStateManager

export const EncounterView: React.FC<EncounterViewProps> = ({ activeMission, onCompleteMission: _onCompleteMission }) => {
  const { grid, world, completeMission, consumeFood, party, showStatus, activeCampaign, currentEncounterIndex } = useGame();
  const [_tick, setTick] = useState(0); // Force render
  const [phase, setPhase] = useState<PlanningPhase>('movement');
  const [originalPositions, setOriginalPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  // Debug flag to show tile coordinates (set to true for testing)
  const [showTileCoordinates] = useState<boolean>(false);
  const [plannedActions, setPlannedActions] = useState<PlannedAction[]>([]);
  const [_actionOrder, _setActionOrder] = useState<number[]>([]); // Character IDs in execution order
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [validPushDirections, setValidPushDirections] = useState<Array<{ dx: number; dy: number; staminaCost: number }>>([]);
  const [pathUpdateTrigger, setPathUpdateTrigger] = useState(0); // Force re-render when paths change
  const encounterControllerRef = useRef<EncounterController>(new EncounterController());
  const [currentTurn, setCurrentTurn] = useState(1); // Track turn for React re-renders
  
  // Get systems from controller for convenience
  const movementPlan = encounterControllerRef.current.getMovementPlan();
  const movementSystem = encounterControllerRef.current.getMovementSystem();
  const pushSystem = encounterControllerRef.current.getPushSystem();

  // Movement planning hook - provides movement-specific handlers
  const movementPlanning = useMovementPlanning({
    world,
    grid,
    movementPlan,
    selectedCharacter,
    onCharacterSelect: (charId) => {
      if (charId === null) {
        updateSelectedCharacter(null);
        updateValidMoves([]);
        updateSelectedObject(null);
        updateValidPushDirections([]);
      } else {
        updateSelectedCharacter(charId);
      }
    },
    onValidMovesUpdate: updateValidMoves,
    onPathUpdate: () => setPathUpdateTrigger(t => t + 1),
    onTick: () => setTick(t => t + 1),
    showStatus,
  });

  // Skill planning hook - provides skill-specific handlers
  const skillPlanning = useSkillPlanning({
    world,
    grid,
    selectedCharacter,
    selectedObject,
    onCharacterSelect: (charId) => {
      updateSelectedCharacter(charId);
      if (charId === null) {
        updateSelectedObject(null);
      }
    },
    onObjectSelect: (objectId) => {
      updateSelectedObject(objectId);
    },
    onValidPushDirectionsUpdate: updateValidPushDirections,
    onTick: () => setTick(t => t + 1),
    pushSystem,
  });

  // Reset systems when encounter changes
  React.useEffect(() => {
    if (currentEncounterIndex !== undefined) {
      encounterControllerRef.current.reset();
      setCurrentTurn(1); // Reset displayed turn to 1
      setPhase('movement'); // Reset phase to movement
      // Sync React state with state manager
      setSelectedCharacter(null);
      setSelectedObject(null);
      setValidMoves([]);
      setValidPushDirections([]);
      setPlannedActions([]);
    }
  }, [currentEncounterIndex]);

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

  // Helper functions to sync React state with EncounterController
  const updateSelectedCharacter = (characterId: number | null) => {
    encounterControllerRef.current.setSelectedCharacter(characterId);
    setSelectedCharacter(characterId);
  };

  const updateSelectedObject = (objectId: number | null) => {
    encounterControllerRef.current.setSelectedObject(objectId);
    setSelectedObject(objectId);
  };

  const updateValidMoves = (moves: ValidMove[]) => {
    encounterControllerRef.current.setValidMoves(moves);
    setValidMoves(moves);
  };

  const updateValidPushDirections = (directions: ValidPushDirection[]) => {
    encounterControllerRef.current.setValidPushDirections(directions);
    setValidPushDirections(directions);
  };

  const updatePlannedActions = (actions: PlannedAction[]) => {
    encounterControllerRef.current.setPlannedActions(actions);
    setPlannedActions(actions);
  };

  const addPlannedAction = (action: PlannedAction) => {
    const currentActions = encounterControllerRef.current.getPlannedActions();
    encounterControllerRef.current.setPlannedActions([...currentActions, action]);
    setPlannedActions(encounterControllerRef.current.getPlannedActions());
  };

  const clearPlannedActions = () => {
    encounterControllerRef.current.setPlannedActions([]);
    setPlannedActions([]);
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
    console.log('Character PWR:', attrs.pwr);

    const actions: Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }> = [
      { name: 'Wait', cost: 0 }
    ];

    // Check if character can push (PWR 3+)
    if (attrs.pwr >= 3) {
      console.log('✅ Character has PWR >= 3, checking for pushable objects...');
      
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
      console.log('❌ Character PWR < 3, cannot push');
    }

    console.log('Final actions:', actions);
    console.log('=== getAvailableActions END ===');
    return actions;
  };

  const handleCharacterClick = (characterId: number) => {
    if (phase === 'movement') {
      // Use movement planning hook handler
      movementPlanning.handleCharacterClick(characterId);
      // Note: Adjacent object detection is handled in movement planning hook if needed
      // For movement phase, we primarily care about path planning, not object selection
      return;
    } else if (phase === 'skill') {
      // Use skill planning hook handler
      skillPlanning.handleCharacterClick(characterId);
    }
  };

  // Removed unused wouldOverlap function

  const handleTileClick = (x: number, y: number) => {
    // Movement phase: plan paths instead of moving immediately
    if (phase === 'movement') {
      // Use movement planning hook handler
      movementPlanning.handleTileClick(x, y);
      return;
    }

    // Skill phase - allow selecting characters and items
    if (phase === 'skill') {
      // Use skill planning hook handler
      skillPlanning.handleTileClick(x, y);
      return;
    }

    // Legacy code for executing phase (should not run in movement or skill phase)
    // This code is for backward compatibility with old execution model
    // Note: movement and skill phases have already returned above, so phase is 'executing' here
    
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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EncounterView.tsx:509',message:'Win condition check - legacy execution path',data:{phase:'legacy_execution'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const allInExit = encounterControllerRef.current.checkWinCondition(world, grid, getPlayerCharacters);
        // #region agent log
        const allCharacters = getPlayerCharacters();
        fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EncounterView.tsx:515',message:'Win condition result',data:{allInExit,characterCount:allCharacters.length,characterPositions:allCharacters.map(id=>{const p=world.getComponent<PositionComponent>(id,'Position');return p?{id,x:p.x,y:p.y,isExit:grid.isExitZone(p.x,p.y)}:null})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (allInExit) {
          setTimeout(() => {
            // Check if this is a campaign or mission
            if (activeCampaign && currentEncounterIndex !== undefined) {
              const isLastEncounter = currentEncounterIndex === activeCampaign.encounters.length - 1;
              if (isLastEncounter) {
                showStatus("Campaign Complete! All encounters finished.", 'success', 3000);
              } else {
                showStatus(`Encounter Complete! Loading next encounter...`, 'success', 2000);
              }
            } else {
              showStatus("All characters reached the exit! Mission Complete.", 'success', 3000);
              if (activeMission?.days) consumeFood(activeMission.days * 4);
            }
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EncounterView.tsx:531',message:'Calling completeMission - legacy path',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
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

  // Callback functions for EncounterInfoPanel
  const handleExecuteFreeMoves = () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EncounterView.tsx:1045',message:'Execute Free Moves button clicked',data:{executablePathsCount:movementPlan.getAllPaths().filter(p => p.steps.length > 0 && p.currentStepIndex < p.steps.length).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    const allPaths = movementPlan.getAllPaths();
    const executablePaths = allPaths.filter(path => 
      path.steps.length > 0 && 
      path.currentStepIndex < path.steps.length
    );
    
    // Execute next step for all characters with executable paths
    let allInExitDuringMovement = false;
    executablePaths.forEach(path => {
      const nextStep = path.steps[path.currentStepIndex];
      if (nextStep) {
        // Move character to next step
        movementSystem.moveCharacter(world, path.characterId, nextStep);
        path.currentStepIndex++;
        
        // Update original position to new position (executed step becomes current position)
        originalPositions.set(path.characterId, { x: nextStep.x, y: nextStep.y });
        
        // Update status
        if (path.currentStepIndex >= path.steps.length) {
          path.status = 'complete';
        } else {
          path.status = 'executing';
        }
        
        // Check win condition after each character moves
        const allInExitNow = encounterControllerRef.current.checkWinCondition(world, grid, getPlayerCharacters);
        if (allInExitNow) {
          allInExitDuringMovement = true;
        }
      }
    });
    
    // If win condition met during movement, handle it immediately
    if (allInExitDuringMovement) {
      // Show status message
      if (activeCampaign && currentEncounterIndex !== undefined) {
        const isLastEncounter = currentEncounterIndex === activeCampaign.encounters.length - 1;
        if (isLastEncounter) {
          showStatus("Campaign Complete! All encounters finished.", 'success', 3000);
        } else {
          showStatus(`Encounter Complete! Loading next encounter...`, 'success', 2000);
        }
      } else {
        showStatus("All characters reached the exit! Mission Complete.", 'success', 3000);
        if (activeMission?.days) consumeFood(activeMission.days * 4);
      }
      completeMission();
      return; // Don't continue with normal flow
    }
    
    // After execution, re-validate next steps for all characters
    const remainingPaths = movementPlan.getAllPaths().filter(p => 
      p.steps.length > 0 && p.currentStepIndex < p.steps.length
    );
    
    remainingPaths.forEach(path => {
      const nextStep = path.steps[path.currentStepIndex];
      if (!nextStep) return;
      
      const currentPos = world.getComponent<PositionComponent>(path.characterId, 'Position');
      if (!currentPos) return;
      
      const attrs = world.getComponent<AttributesComponent>(path.characterId, 'Attributes');
      if (!attrs) return;
      
      // Validate next step
      const isValidMove = movementSystem.canMoveFromTo(
        world,
        grid,
        path.characterId,
        { x: currentPos.x, y: currentPos.y },
        nextStep,
        attrs.mov
      );
      
      if (!isValidMove) {
        movementPlan.setPathStatus(path.characterId, 'blocked');
        return;
      }
      
      // Check for conflicts with other characters' next steps
      const allPathsAfterExecution = movementPlan.getAllPaths();
      const otherExecutablePaths = allPathsAfterExecution.filter(p => 
        p.characterId !== path.characterId &&
        p.steps.length > 0 && 
        p.currentStepIndex < p.steps.length
      );
      
      const conflictingPath = otherExecutablePaths.find(otherPath => {
        const otherNextStep = otherPath.steps[otherPath.currentStepIndex];
        return otherNextStep.x === nextStep.x && otherNextStep.y === nextStep.y;
      });
      
      if (conflictingPath) {
        movementPlan.setPathStatus(path.characterId, 'conflicting');
      } else {
        movementPlan.setPathStatus(path.characterId, 'ready');
      }
    });
    
    // Check for win condition after executing movement
    const allInExitAfterMovement = encounterControllerRef.current.checkWinCondition(world, grid, getPlayerCharacters);
    
    if (allInExitAfterMovement) {
      // Show status message
      if (activeCampaign && currentEncounterIndex !== undefined) {
        const isLastEncounter = currentEncounterIndex === activeCampaign.encounters.length - 1;
        if (isLastEncounter) {
          showStatus("Campaign Complete! All encounters finished.", 'success', 3000);
        } else {
          showStatus(`Encounter Complete! Loading next encounter...`, 'success', 2000);
        }
      } else {
        showStatus("All characters reached the exit! Mission Complete.", 'success', 3000);
        if (activeMission?.days) consumeFood(activeMission.days * 4);
      }
      completeMission();
      return; // Don't continue with normal flow
    }
    
    setTick(t => t + 1); // Trigger re-render
    setPathUpdateTrigger(t => t + 1); // Update button state
  };

  const validateAndGetExecuteButtonState = (): { canExecute: boolean; invalidReasons: string[] } => {
    const allPaths = movementPlan.getAllPaths();
    const executablePaths = allPaths.filter(path => 
      path.steps.length > 0 && 
      path.currentStepIndex < path.steps.length
    );
    
    if (executablePaths.length === 0) {
      return { canExecute: false, invalidReasons: ['No executable paths'] };
    }
    
    let hasInvalidNextStep = false;
    const invalidReasons: string[] = [];
    
    executablePaths.forEach(path => {
      const nextStep = path.steps[path.currentStepIndex];
      if (!nextStep) return;
      
      // Get character's current position (where they are now)
      const currentPos = world.getComponent<PositionComponent>(path.characterId, 'Position');
      if (!currentPos) return;
      
      const attrs = world.getComponent<AttributesComponent>(path.characterId, 'Attributes');
      if (!attrs) return;
      
      // Check if next step is valid (movement pattern)
      const isValidMove = movementSystem.canMoveFromTo(
        world,
        grid,
        path.characterId,
        { x: currentPos.x, y: currentPos.y },
        nextStep,
        attrs.mov
      );
      
      if (!isValidMove) {
        hasInvalidNextStep = true;
        invalidReasons.push('Invalid movement pattern');
        return;
      }
      
      // Check for conflicts with other characters' next steps
      const conflictingPath = executablePaths.find(otherPath => {
        if (otherPath.characterId === path.characterId) return false; // Skip self
        if (otherPath.currentStepIndex >= otherPath.steps.length) return false; // No next step
        const otherNextStep = otherPath.steps[otherPath.currentStepIndex];
        return otherNextStep.x === nextStep.x && otherNextStep.y === nextStep.y;
      });
      
      if (conflictingPath) {
        hasInvalidNextStep = true;
        invalidReasons.push('Square will be occupied');
        movementPlan.setPathStatus(path.characterId, 'conflicting');
      } else {
        // Clear conflicting status if step is now valid
        if (path.status === 'conflicting') {
          movementPlan.setPathStatus(path.characterId, 'ready');
        }
      }
    });
    
    return { canExecute: !hasInvalidNextStep, invalidReasons };
  };

  const handleUndoLastStep = () => {
    if (!selectedCharacter) return;
    
    // Remove last step from selected character's path (only unexecuted steps)
    if (movementPlan.removeLastStep(selectedCharacter)) {
      // Update valid moves from the new last position (or current position)
      const updatedPath = movementPlan.getPath(selectedCharacter);
      const attrs = world.getComponent<AttributesComponent>(selectedCharacter, 'Attributes');
      if (attrs) {
        let fromPos: { x: number; y: number };
        if (updatedPath && updatedPath.steps.length > 0) {
          fromPos = updatedPath.steps[updatedPath.steps.length - 1];
        } else {
          const currentPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
          if (currentPos) {
            fromPos = { x: currentPos.x, y: currentPos.y };
          } else {
            return;
          }
        }
        const moves = movementSystem.getValidMoves(world, grid, selectedCharacter, fromPos, attrs.mov);
        updateValidMoves(moves);
      }
      setPathUpdateTrigger(t => t + 1);
      setTick(t => t + 1);
    }
  };

  const handleClearAllMovements = () => {
    // Clear all paths
    movementPlan.clearAll();
    // Restore all characters to original positions
    originalPositions.forEach((originalPos, charId) => {
      movementSystem.moveCharacter(world, charId, originalPos);
    });
    updateSelectedCharacter(null);
    updateValidMoves([]);
    setTick(t => t + 1); // Trigger re-render
  };

  const handlePlanSkills = () => {
    // Check if all paths are complete or no paths planned
    const allComplete = movementPlan.getAllPaths().every(path => 
      path.status === 'complete' || path.steps.length === 0
    );
    
    if (allComplete || !movementPlan.hasAnyPath()) {
      // Transition to skill phase
      encounterControllerRef.current.transitionToSkill();
      setPhase(encounterControllerRef.current.getCurrentPhase());
      updateSelectedCharacter(null);
      updateValidMoves([]);
    } else {
      showStatus('Complete all movement paths before proceeding', 'error');
    }
  };

  const handleMoveActionUp = (index: number) => {
    if (index > 0) {
      const newActions = [...plannedActions];
      [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
      updatePlannedActions(newActions);
    }
  };

  const handleMoveActionDown = (index: number) => {
    if (index < plannedActions.length - 1) {
      const newActions = [...plannedActions];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      updatePlannedActions(newActions);
    }
  };

  const handleRemoveAction = (index: number) => {
    const newActions = plannedActions.filter((_, i) => i !== index);
    updatePlannedActions(newActions);
  };

  const handleActionSelect = (selectedActionName: string) => {
    if (!selectedCharacter) return;
    
    const existingActionIndex = plannedActions.findIndex(a => a.characterId === selectedCharacter);
    const availableActions = getAvailableActions(selectedCharacter);
    
    if (selectedActionName === 'Wait' || selectedActionName === '') {
      // Remove action (set to Wait)
      if (existingActionIndex >= 0) {
        const newActions = plannedActions.filter((_, i) => i !== existingActionIndex);
        updatePlannedActions(newActions);
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
          updatePlannedActions(newActions);
        } else {
          // Add new action
          updatePlannedActions([...plannedActions, newAction]);
        }
      }
    }
  };

  const handleBackToMovement = () => {
    // Restore original positions when going back
    originalPositions.forEach((originalPos, charId) => {
      movementSystem.moveCharacter(world, charId, originalPos);
    });
    updatePlannedActions([]);
    encounterControllerRef.current.resetToMovement();
    setPhase(encounterControllerRef.current.getCurrentPhase());
    updateSelectedCharacter(null);
    updateSelectedObject(null);
    setTick(t => t + 1); // Trigger re-render
  };

  const handleExecuteActions = () => {
    // Execute all planned actions (or everyone waits if no actions planned)
    encounterControllerRef.current.transitionToExecuting();
    setPhase(encounterControllerRef.current.getCurrentPhase());
    
    // Execute actions using EncounterController
    const executionSummary = encounterControllerRef.current.executeActions(
      world,
      grid,
      plannedActions,
      getPlayerCharacters
    );
    
    // Handle execution results
    executionSummary.results.forEach((result) => {
      if (!result.success) {
        showStatus(result.error || 'Action execution failed', 'error');
      } else if (result.action.action === 'Push') {
        showStatus('Pushed crate!', 'success');
        // Trigger re-render to show the movement
        setTick(t => t + 1);
      }
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EncounterView.tsx:1553',message:'After skill phase execution - checking win condition',data:{phase:'skill_execution'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Check win condition immediately after executing actions
    const allInExitAfterActions = executionSummary.winConditionMet;
    // #region agent log
    const allCharactersAfterActions = getPlayerCharacters();
    fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EncounterView.tsx:1560',message:'Win condition result after skill phase',data:{allInExit:allInExitAfterActions,characterCount:allCharactersAfterActions.length,characterPositions:allCharactersAfterActions.map(id=>{const p=world.getComponent<PositionComponent>(id,'Position');return p?{id,x:p.x,y:p.y,isExit:grid.isExitZone(p.x,p.y)}:null})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Check win condition immediately after executing actions
    if (allInExitAfterActions) {
      console.log('✅ Win condition met after skill execution - calling completeMission()');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EncounterView.tsx:1700',message:'Win condition met - calling completeMission from skill phase',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Show status message
      if (activeCampaign && currentEncounterIndex !== undefined) {
        const isLastEncounter = currentEncounterIndex === activeCampaign.encounters.length - 1;
        if (isLastEncounter) {
          showStatus("Campaign Complete! All encounters finished.", 'success', 3000);
        } else {
          showStatus(`Encounter Complete! Loading next encounter...`, 'success', 2000);
        }
      } else {
        showStatus("All characters reached the exit! Mission Complete.", 'success', 3000);
        if (activeMission?.days) consumeFood(activeMission.days * 4);
      }
      // Call completeMission directly - no setTimeout delay needed
      completeMission();
      return; // Don't reset to movement phase
    }
    
    // Reset after execution (only if win condition not met)
    setTimeout(() => {
      // Increment turn - a complete cycle (movement + skill + execution) has finished
      encounterControllerRef.current.incrementTurn();
      setCurrentTurn(encounterControllerRef.current.getCurrentTurn() + 1); // Update displayed turn
      updatePlannedActions([]);
      encounterControllerRef.current.resetToMovement();
      setPhase(encounterControllerRef.current.getCurrentPhase());
      updateSelectedCharacter(null);
      updateSelectedObject(null);
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
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '800px',
      width: '1280px',
      overflow: 'hidden'
    }}>
      {/* Grid Section - Left Side: 800px × 800px */}
      <EncounterGrid
        grid={grid}
        world={world}
        phase={phase}
        selectedCharacter={selectedCharacter}
        selectedObject={selectedObject}
        validMoves={validMoves}
        validPushDirections={validPushDirections}
        movementPlan={movementPlan}
        showTileCoordinates={showTileCoordinates}
        onTileClick={handleTileClick}
      />

      {/* Info Panel - Right Side: 480px × 800px */}
      <EncounterInfoPanel
        phase={phase}
        currentTurn={currentTurn}
        activeMission={activeMission}
        activeCampaign={activeCampaign}
        currentEncounterIndex={currentEncounterIndex}
        selectedCharacter={selectedCharacter}
        selectedObject={selectedObject}
        plannedActions={plannedActions}
        movementPlan={movementPlan}
        world={world}
        party={party}
        pathUpdateTrigger={pathUpdateTrigger}
        getInstructions={getInstructions}
        getPlayerCharacters={getPlayerCharacters}
        onCharacterClick={handleCharacterClick}
        onUndoLastStep={handleUndoLastStep}
        onClearAllMovements={handleClearAllMovements}
        onPlanSkills={handlePlanSkills}
        onExecuteActions={handleExecuteActions}
        onBackToMovement={handleBackToMovement}
        onActionSelect={handleActionSelect}
        getAvailableActions={getAvailableActions}
        onExecuteFreeMoves={handleExecuteFreeMoves}
        onMoveActionUp={handleMoveActionUp}
        onMoveActionDown={handleMoveActionDown}
        onRemoveAction={handleRemoveAction}
        validateAndGetExecuteButtonState={validateAndGetExecuteButtonState}
      />
    </div>
  );
};
