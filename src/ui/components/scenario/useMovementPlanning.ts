import { useCallback } from 'react';
import { World } from '../../../game-engine/ecs/World';
import { Grid } from '../../../game-engine/grid/Grid';
import { PositionComponent, AttributesComponent, RenderableComponent } from '../../../game-engine/ecs/Component';
import { MovementSystem } from '../../../game-engine/encounters/MovementSystem';
import { MovementPlan } from '../../../game-engine/encounters/MovementPlan';
import { theme } from '../../styles/theme';

interface UseMovementPlanningProps {
  world: World;
  grid: Grid;
  movementPlan: MovementPlan;
  selectedCharacter: number | null;
  onCharacterSelect: (characterId: number | null) => void;
  onValidMovesUpdate: (moves: Array<{ x: number; y: number }>) => void;
  onPathUpdate: () => void;
  onTick: () => void;
  showStatus: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

export const useMovementPlanning = ({
  world,
  grid,
  movementPlan,
  selectedCharacter,
  onCharacterSelect,
  onValidMovesUpdate,
  onPathUpdate,
  onTick,
  showStatus,
}: UseMovementPlanningProps) => {
  const movementSystem = new MovementSystem();

  const handleCharacterClick = useCallback((characterId: number) => {
    const attrs = world.getComponent<AttributesComponent>(characterId, 'Attributes');
    if (!attrs) return;

    // Get current position
    const currentPos = world.getComponent<PositionComponent>(characterId, 'Position');
    if (!currentPos) return;

    // If clicking the same character, deselect
    if (selectedCharacter === characterId) {
      onCharacterSelect(null);
      onValidMovesUpdate([]);
      return;
    }

    // Select character and show valid moves
    // If character has a planned path, use the last step in the path
    // Otherwise, use current position
    onCharacterSelect(characterId);
    const path = movementPlan.getPath(characterId);
    let fromPos: { x: number; y: number };
    
    if (path && path.steps.length > 0) {
      // Use last step in planned path
      fromPos = path.steps[path.steps.length - 1];
    } else {
      // No path planned, use current position
      fromPos = { x: currentPos.x, y: currentPos.y };
    }
    
    const moves = movementSystem.getValidMoves(world, grid, characterId, fromPos, attrs.mov);
    onValidMovesUpdate(moves);
  }, [world, grid, movementPlan, selectedCharacter, onCharacterSelect, onValidMovesUpdate]);

  const handleTileClick = useCallback((x: number, y: number) => {
    // First, check if clicking on a character to select/deselect
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
    
    // If character is selected and this is a valid move, add to path (don't move yet)
    if (selectedCharacter !== null) {
      const attrs = world.getComponent<AttributesComponent>(selectedCharacter, 'Attributes');
      if (!attrs) return;
      
      // Get the position to move from
      // If character has a planned path, use the last step in the path
      // Otherwise, use current position
      const path = movementPlan.getPath(selectedCharacter);
      let fromPos: { x: number; y: number };
      
      if (path && path.steps.length > 0) {
        // Use last step in planned path
        fromPos = path.steps[path.steps.length - 1];
      } else {
        // No path planned, use current position
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
        attrs.mov
      );
      
      if (isValidStep) {
        // Add step to path
        movementPlan.addStep(selectedCharacter, { x, y });
        
        // Trigger re-render to update button state
        onPathUpdate();
        
        // Update valid moves for next step (from the newly added position)
        const moves = movementSystem.getValidMoves(world, grid, selectedCharacter, { x, y }, attrs.mov);
        onValidMovesUpdate(moves);
        
        onTick(); // Trigger re-render to show path preview
        return;
      } else {
        showStatus('Invalid move: not a valid movement pattern', 'error');
        return;
      }
    }
    
    // No character selected and not clicking on a character - do nothing
  }, [world, grid, movementPlan, selectedCharacter, handleCharacterClick, onPathUpdate, onValidMovesUpdate, onTick, showStatus]);

  return {
    handleCharacterClick,
    handleTileClick,
  };
};


