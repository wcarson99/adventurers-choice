import React, { useState, useRef } from 'react';
import { useGame } from '../../game-engine/GameState';
import { PositionComponent, RenderableComponent, AttributesComponent, PushableComponent, DirectionComponent } from '../../game-engine/ecs/Component';
import { theme } from '../styles/theme';
import { ValidMove } from '../../game-engine/encounters/EncounterStateManager';
import { GridController } from '../../game-engine/encounters/GridController';
import { ScenarioGrid } from './scenario/ScenarioGrid';
import { ScenarioInfoPanel } from './scenario/ScenarioInfoPanel';
import { SUCCESS_MESSAGE_DURATION_MS } from '../constants';

interface ScenarioViewProps {
  activeMission?: { title: string; description: string; days?: number };
  onCompleteMission?: () => void;
}

// PlanningPhase type imported from EncounterPhaseManager

// PlannedAction type imported from EncounterStateManager

export const ScenarioView: React.FC<ScenarioViewProps> = ({ activeMission, onCompleteMission: _onCompleteMission }) => {
  const { grid, world, completeMission, consumeFood, party, showStatus, activeJob, currentScenarioIndex } = useGame();
  const [_tick, setTick] = useState(0); // Force render
  // Debug flag to show tile coordinates (set to true for testing)
  const [showTileCoordinates] = useState<boolean>(false);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [validPushDirections, setValidPushDirections] = useState<Array<{ dx: number; dy: number; staminaCost: number }>>([]);
  const [selectingDirection, setSelectingDirection] = useState<boolean>(false);
  const gridControllerRef = useRef<GridController>(new GridController());
  const [currentRound, setCurrentRound] = useState(1); // Track round for React re-renders
  
  // Get systems from controller for convenience
  const movementSystem = gridControllerRef.current.getMovementSystem();
  const pushSystem = gridControllerRef.current.getPushSystem();

  // Get all player characters (used in multiple places)
  const getPlayerCharacters = () => {
    if (!world) return [];
    const entities = world.getAllEntities();
    return entities.filter(id => {
      const r = world.getComponent<RenderableComponent>(id, 'Renderable');
      return r && r.color === theme.colors.accent;
    });
  };

  // Reset systems and start round when scenario/mission changes
  React.useEffect(() => {
    // Initialize for both job mode (currentScenarioIndex) and random/mission mode (activeMission)
    if (world && grid) {
      gridControllerRef.current.reset();
      // Start first round
      gridControllerRef.current.startRound(getPlayerCharacters, world);
      const round = gridControllerRef.current.getCurrentRound();
      const activeChar = gridControllerRef.current.getCurrentActiveCharacter();
      console.log('[ScenarioView] Round started:', round, 'Active character:', activeChar);
      setCurrentRound(round);
      // Sync React state with state manager
      setSelectedObject(null);
      setValidPushDirections([]);
      
      // Auto-select first character and default to Move or Pass
      if (activeChar !== null && grid) {
        updateSelectedCharacter(activeChar);
        const attrs = world.getComponent<AttributesComponent>(activeChar, 'Attributes');
        const pos = world.getComponent<PositionComponent>(activeChar, 'Position');
        
        // Check if character can afford Move (15 AP)
        const canAffordMove = gridControllerRef.current.canAffordAction(activeChar, 'Move');
        
        if (canAffordMove && attrs && pos) {
          // Default to Move: calculate and show valid moves
          const moves = movementSystem.getValidMoves(world, grid, activeChar, { x: pos.x, y: pos.y }, attrs.mov);
          updateValidMoves(moves);
          console.log('[ScenarioView] Auto-selected character, defaulting to Move action');
        } else {
          // Default to Pass: clear moves (Pass will be the only available action)
          setValidMoves([]);
          console.log('[ScenarioView] Auto-selected character, defaulting to Pass action (insufficient AP for Move)');
        }
      } else {
        setSelectedCharacter(null);
        setValidMoves([]);
      }
      
      // @deprecated - planned actions no longer used
      setTick(t => t + 1); // Force re-render
    }
  }, [currentScenarioIndex, activeMission, world, grid]);


  if (!grid || !world) return <div>Loading Scenario...</div>;

  // Helper to get instructions text
  const getInstructions = (): string => {
    const currentActiveCharacter = gridControllerRef.current.getCurrentActiveCharacter();
    if (currentActiveCharacter === null) {
      return 'Round not started. Waiting for scenario initialization...';
    }
    
    if (selectedCharacter) {
      const currentAP = gridControllerRef.current.getCharacterAP(selectedCharacter);
      const availableActions = getAvailableActions(selectedCharacter);
      if (availableActions.length > 1) { // More than just Pass
        return `👆 Click a green tile to move, or select an action. ${currentAP} AP remaining.`;
      }
      return `👆 Click a green tile to move. ${currentAP} AP remaining.`;
    }
    
    const currentAP = gridControllerRef.current.getCharacterAP(currentActiveCharacter);
    return `👆 Click the active character (${currentAP} AP) to select, then choose an action.`;
  };

  // Helper functions to sync React state with GridController
  const updateSelectedCharacter = (characterId: number | null) => {
    gridControllerRef.current.setSelectedCharacter(characterId);
    setSelectedCharacter(characterId);
  };

  const updateValidMoves = (moves: ValidMove[]) => {
    gridControllerRef.current.setValidMoves(moves);
    setValidMoves(moves);
  };

  // Helper to keep character selected and default to Move or Pass after action execution
  const keepCharacterSelectedWithDefaultAction = (characterId: number) => {
    if (!grid) return;
    
    // Keep character selected
    updateSelectedCharacter(characterId);
    
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    const pos = world.getComponent<PositionComponent>(characterId, 'Position');
    
    // Check if character can afford Move (15 AP)
    const canAffordMove = gridControllerRef.current.canAffordAction(characterId, 'Move');
    
    if (canAffordMove && attrs && pos) {
      // Default to Move: calculate and show valid moves
      const moves = movementSystem.getValidMoves(world, grid, characterId, { x: pos.x, y: pos.y }, attrs.mov);
      updateValidMoves(moves);
    } else {
      // Default to Pass: clear moves
      setValidMoves([]);
    }
  };

  // @deprecated - planned actions no longer used, actions execute immediately

  // Get available actions for a character (filtered by AP affordability)
  const getAvailableActions = (characterId: number): Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }> => {
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    if (!attrs) {
      return [];
    }

    const actions: Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }> = [];
    
    // Always include Pass action (costs 0 AP)
    actions.push({ name: 'Pass', cost: 0 });
    
    // Add Turn action if character can afford it (5 AP)
    if (gridControllerRef.current.canAffordAction(characterId, 'Turn')) {
      actions.push({ name: 'Turn', cost: 5 });
    }
    
    // Add Move action if character can afford it (15 AP)
    if (gridControllerRef.current.canAffordAction(characterId, 'Move')) {
      actions.push({ name: 'Move', cost: 15 });
    }
    
    // Check if character can push (PWR 3+) and can afford it (25 AP)
    // Only enable if character is facing a pushable item
    if (attrs.pwr >= 3 && gridControllerRef.current.canAffordAction(characterId, 'Push')) {
      const currentPos = world.getComponent<PositionComponent>(characterId, 'Position');
      const directionComp = world.getComponent<DirectionComponent>(characterId, 'Direction');
      const charPos = currentPos ? { x: currentPos.x, y: currentPos.y } : null;
      
      if (charPos && directionComp) {
        // Check for pushable object in the direction the character is facing
        const targetPos = {
          x: charPos.x + directionComp.dx,
          y: charPos.y + directionComp.dy,
        };

        // Look for a pushable object at the target position
        const entities = world.getAllEntities();
        const targetPushable = entities.find(id => {
          const pushable = world.getComponent<PushableComponent>(id, 'Pushable');
          if (!pushable) return false;
          const objPos = world.getComponent<PositionComponent>(id, 'Position');
          if (!objPos) return false;
          return objPos.x === targetPos.x && objPos.y === targetPos.y;
        });

        // If found pushable object in facing direction, check if push is valid
        if (targetPushable) {
          const pushActions = pushSystem.getValidPushActions(world, grid, characterId, targetPushable);
          if (pushActions.length > 0) {
            actions.push({
              name: 'Push',
              cost: 25,
              requiresItem: true,
              targetId: targetPushable
            });
          }
        }
      }
    }

    return actions;
  };

  const handleCharacterClick = (characterId: number) => {
    // Only allow selecting the current active character
    const currentActiveCharacter = gridControllerRef.current.getCurrentActiveCharacter();
    if (currentActiveCharacter !== characterId) {
      showStatus('Not this character\'s turn', 'error');
      return;
    }
    
    // Select character and calculate valid moves
    updateSelectedCharacter(characterId);
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    const pos = world.getComponent<PositionComponent>(characterId, 'Position');
    if (attrs && pos) {
      const moves = movementSystem.getValidMoves(world, grid, characterId, { x: pos.x, y: pos.y }, attrs.mov);
      updateValidMoves(moves);
    }
  };

  // Removed unused wouldOverlap function

  const handleTileClick = (x: number, y: number) => {
    const currentActiveCharacter = gridControllerRef.current.getCurrentActiveCharacter();
    if (currentActiveCharacter === null) {
      return; // No active character
    }

    // If selecting direction for Turn action, handle direction selection
    if (selectingDirection && selectedCharacter === currentActiveCharacter) {
      const charPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
      if (!charPos) {
        showStatus('Character has no position', 'error');
        return;
      }

      // Calculate direction from character to clicked tile
      const dx = x - charPos.x;
      const dy = y - charPos.y;

      // Normalize direction to -1, 0, or 1
      const normalizedDx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
      const normalizedDy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

      // Don't allow turning to (0, 0) - must face a direction
      if (normalizedDx === 0 && normalizedDy === 0) {
        showStatus('Cannot face the same position', 'error');
        return;
      }

      // Execute turn action
      handleDirectionSelect(normalizedDx, normalizedDy);
      return;
    }

    // If character is selected, try to execute move action immediately
    if (selectedCharacter === currentActiveCharacter) {
      const isValidMove = validMoves.some(move => move.x === x && move.y === y);
      
      if (isValidMove) {
        // Execute move action immediately
        const result = gridControllerRef.current.executeActionImmediate(
          world,
          grid,
          'Move',
          selectedCharacter,
          { x, y }
        );

        if (result.success) {
          showStatus(`Moved! ${result.apRemaining} AP remaining`, 'success', SUCCESS_MESSAGE_DURATION_MS);
          setTick(t => t + 1);

          // Check win condition
          const allInExit = gridControllerRef.current.checkWinCondition(world, grid, getPlayerCharacters);
          if (allInExit) {
            handleWinCondition();
            return;
          }

          // Keep character selected and default to Move or Pass
          keepCharacterSelectedWithDefaultAction(selectedCharacter);
        } else {
          showStatus(result.error || 'Move failed', 'error');
        }
        return;
      }
    }

    // Check if clicking on a pushable object
    const entities = world.getAllEntities();
    const clickedEntity = entities.find(id => {
      const p = world.getComponent<PositionComponent>(id, 'Position');
      return p && p.x === x && p.y === y;
    });
    
    const clickedPushable = clickedEntity ? world.getComponent<PushableComponent>(clickedEntity, 'Pushable') : null;
    
    // If character is selected and clicked on adjacent pushable, execute push
    if (selectedCharacter === currentActiveCharacter && clickedPushable && clickedEntity) {
      const charPos = world.getComponent<PositionComponent>(selectedCharacter, 'Position');
      if (charPos && grid.getDistance(charPos, { x, y }) === 1) {
        const result = gridControllerRef.current.executeActionImmediate(
          world,
          grid,
          'Push',
          selectedCharacter,
          clickedEntity
        );

        if (result.success) {
          showStatus(`Pushed! ${result.apRemaining} AP remaining`, 'success', SUCCESS_MESSAGE_DURATION_MS);
          setSelectedObject(null);
          setTick(t => t + 1);

          // Check win condition
          const allInExit = gridControllerRef.current.checkWinCondition(world, grid, getPlayerCharacters);
          if (allInExit) {
            handleWinCondition();
            return;
          }

          // Keep character selected and default to Move or Pass
          keepCharacterSelectedWithDefaultAction(selectedCharacter);
        } else {
          showStatus(result.error || 'Push failed', 'error');
        }
        return;
      }
    }

    // If clicking on a character, select it
    if (clickedEntity) {
      const r = world.getComponent<RenderableComponent>(clickedEntity, 'Renderable');
      if (r && r.color === theme.colors.accent) {
        handleCharacterClick(clickedEntity);
      } else if (clickedPushable) {
        // Clicked on a crate - select it for potential push
        setSelectedObject(clickedEntity);
      }
    } else {
      // Clicked empty space, deselect
      updateSelectedCharacter(null);
      updateValidMoves([]);
      setSelectedObject(null);
    }
  };

  // Helper to handle win condition
  const handleWinCondition = () => {
    setTimeout(() => {
      if (activeJob && currentScenarioIndex !== undefined) {
        const isLastScenario = currentScenarioIndex === activeJob.scenarios.length - 1;
        if (isLastScenario) {
          showStatus("Job Complete! All scenarios finished.", 'success', 3000);
        } else {
          showStatus(`Scenario Complete! Loading next scenario...`, 'success', 2000);
        }
      } else {
        showStatus("All characters reached the exit! Mission Complete.", 'success', 3000);
        if (activeMission?.days) consumeFood(activeMission.days * 4);
      }
      completeMission();
    }, 100);
  };

  // Handle Pass button click
  const handlePass = () => {
    const currentActiveCharacter = gridControllerRef.current.getCurrentActiveCharacter();
    if (currentActiveCharacter === null) {
      showStatus('No active character', 'error');
      return;
    }

    const roundComplete = gridControllerRef.current.passTurn();
    
    if (roundComplete) {
      // Round completed - start next round
      gridControllerRef.current.startRound(getPlayerCharacters, world);
      setCurrentRound(gridControllerRef.current.getCurrentRound());
      showStatus('Round complete! Starting next round...', 'success', SUCCESS_MESSAGE_DURATION_MS);
      
      // Auto-select first character of new round
      const nextActiveChar = gridControllerRef.current.getCurrentActiveCharacter();
      if (nextActiveChar !== null && grid) {
        updateSelectedCharacter(nextActiveChar);
        const attrs = world.getComponent<AttributesComponent>(nextActiveChar, 'Attributes');
        const pos = world.getComponent<PositionComponent>(nextActiveChar, 'Position');
        
        // Check if character can afford Move (15 AP)
        const canAffordMove = gridControllerRef.current.canAffordAction(nextActiveChar, 'Move');
        
        if (canAffordMove && attrs && pos) {
          // Default to Move: calculate and show valid moves
          const moves = movementSystem.getValidMoves(world, grid, nextActiveChar, { x: pos.x, y: pos.y }, attrs.mov);
          updateValidMoves(moves);
        } else {
          // Default to Pass: clear moves
          setValidMoves([]);
        }
      } else {
        updateSelectedCharacter(null);
        setValidMoves([]);
      }
    } else {
      // Next character's turn - auto-select and default to Move or Pass
      const nextCharacter = gridControllerRef.current.getCurrentActiveCharacter();
      if (nextCharacter !== null && grid) {
        updateSelectedCharacter(nextCharacter);
        const attrs = world.getComponent<AttributesComponent>(nextCharacter, 'Attributes');
        const pos = world.getComponent<PositionComponent>(nextCharacter, 'Position');
        
        // Check if character can afford Move (15 AP)
        const canAffordMove = gridControllerRef.current.canAffordAction(nextCharacter, 'Move');
        
        if (canAffordMove && attrs && pos) {
          // Default to Move: calculate and show valid moves
          const moves = movementSystem.getValidMoves(world, grid, nextCharacter, { x: pos.x, y: pos.y }, attrs.mov);
          updateValidMoves(moves);
        } else {
          // Default to Pass: clear moves
          setValidMoves([]);
        }
        showStatus('Turn passed', 'info');
      } else {
        updateSelectedCharacter(null);
        setValidMoves([]);
      }
    }
    
    setSelectedObject(null);
    setTick(t => t + 1);
  };

  // Handle action button click (from action dropdown/buttons)
  const handleActionClick = (actionName: string, targetId?: number) => {
    const currentActiveCharacter = gridControllerRef.current.getCurrentActiveCharacter();
    if (currentActiveCharacter === null) {
      showStatus('No active character', 'error');
      return;
    }

    if (actionName === 'Pass') {
      handlePass();
      return;
    }

    if (actionName === 'Turn') {
      // Show direction selection UI
      setSelectingDirection(true);
      return;
    }

    if (actionName === 'Cancel') {
      // Cancel direction selection
      setSelectingDirection(false);
      return;
    }

    if (actionName === 'Push' && targetId) {
      const result = gridControllerRef.current.executeActionImmediate(
        world,
        grid,
        'Push',
        currentActiveCharacter,
        targetId
      );

      if (result.success) {
        showStatus(`Pushed! ${result.apRemaining} AP remaining`, 'success', SUCCESS_MESSAGE_DURATION_MS);
        setSelectedObject(null);
        setTick(t => t + 1);

        // Check win condition
        const allInExit = gridControllerRef.current.checkWinCondition(world, grid, getPlayerCharacters);
        if (allInExit) {
          handleWinCondition();
          return;
        }

        // Keep character selected and default to Move or Pass
        keepCharacterSelectedWithDefaultAction(currentActiveCharacter);
      } else {
        showStatus(result.error || 'Push failed', 'error');
      }
    }
    // Move actions are handled via tile clicks
  };

  // Handle direction selection for Turn action
  const handleDirectionSelect = (dx: number, dy: number) => {
    const currentActiveCharacter = gridControllerRef.current.getCurrentActiveCharacter();
    if (currentActiveCharacter === null) {
      showStatus('No active character', 'error');
      return;
    }

    const result = gridControllerRef.current.executeActionImmediate(
      world,
      grid,
      'Turn',
      currentActiveCharacter,
      { dx, dy }
    );

    if (result.success) {
      showStatus(`Turned! ${result.apRemaining} AP remaining`, 'success', SUCCESS_MESSAGE_DURATION_MS);
      setSelectingDirection(false);
      setTick(t => t + 1);

      // Keep character selected and default to Move or Pass
      keepCharacterSelectedWithDefaultAction(currentActiveCharacter);
    } else {
      showStatus(result.error || 'Turn failed', 'error');
    }
  };

  // @deprecated - Old phase-based handlers removed (no longer used with AP system)

  return (
    <div style={{ 
      display: 'flex', 
      height: '800px',
      width: '1280px',
      overflow: 'hidden'
    }}>
      {/* Grid Section - Left Side: 800px × 800px */}
      <ScenarioGrid
        grid={grid}
        world={world}
        phase={'executing' as any} // @deprecated - kept for backward compatibility
        selectedCharacter={selectedCharacter}
        selectedObject={selectedObject}
        validMoves={validMoves}
        validPushDirections={validPushDirections}
        movementPlan={null as any} // @deprecated - no longer used
        showTileCoordinates={showTileCoordinates}
        onTileClick={handleTileClick}
      />

      {/* Info Panel - Right Side: 480px × 800px */}
      <ScenarioInfoPanel
        phase={'executing' as any} // @deprecated - kept for backward compatibility
        currentTurn={currentRound}
        activeMission={activeMission}
        activeJob={activeJob}
        currentScenarioIndex={currentScenarioIndex}
        selectedCharacter={selectedCharacter}
        selectedObject={selectedObject}
        plannedActions={[]} // @deprecated - no longer used
        movementPlan={null as any} // @deprecated - no longer used
        world={world}
        party={party}
        pathUpdateTrigger={0} // @deprecated - no longer used
        getInstructions={getInstructions}
        getPlayerCharacters={getPlayerCharacters}
        onCharacterClick={handleCharacterClick}
        onUndoLastStep={() => {}} // @deprecated - no longer used
        onClearAllMovements={() => {}} // @deprecated - no longer used
        onPlanSkills={() => {}} // @deprecated - no longer used
        onExecuteActions={() => {}} // @deprecated - no longer used
        onBackToMovement={() => {}} // @deprecated - no longer used
        onActionSelect={handleActionClick} // Updated to use new handler
        selectingDirection={selectingDirection}
        onDirectionSelect={handleDirectionSelect}
        getAvailableActions={getAvailableActions}
        onExecuteFreeMoves={undefined} // @deprecated - no longer used
        onMoveActionUp={undefined} // @deprecated - no longer used
        onMoveActionDown={undefined} // @deprecated - no longer used
        onRemoveAction={undefined} // @deprecated - no longer used
        validateAndGetExecuteButtonState={undefined} // @deprecated - no longer used
        getCurrentActiveCharacter={() => gridControllerRef.current.getCurrentActiveCharacter()}
        getCharacterAP={(characterId) => gridControllerRef.current.getCharacterAP(characterId)}
        onPass={handlePass}
      />
    </div>
  );
};
