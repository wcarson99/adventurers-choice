import { useCallback } from 'react';
import { World } from '../../../game-engine/ecs/World';
import { Grid } from '../../../game-engine/grid/Grid';
import { PositionComponent, RenderableComponent, AttributesComponent, PushableComponent } from '../../../game-engine/ecs/Component';
import { PushSystem } from '../../../game-engine/encounters/PushSystem';
import { PlannedAction } from '../../../game-engine/encounters/EncounterStateManager';
import { theme } from '../../styles/theme';

interface UseSkillPlanningProps {
  world: World;
  grid: Grid;
  selectedCharacter: number | null;
  selectedObject: number | null;
  onCharacterSelect: (characterId: number | null) => void;
  onObjectSelect: (objectId: number | null) => void;
  onValidPushDirectionsUpdate: (directions: Array<{ dx: number; dy: number; staminaCost: number }>) => void;
  onTick: () => void;
  pushSystem: PushSystem;
}

export const useSkillPlanning = ({
  world,
  grid,
  selectedCharacter,
  selectedObject,
  onCharacterSelect,
  onObjectSelect,
  onValidPushDirectionsUpdate,
  onTick,
  pushSystem,
}: UseSkillPlanningProps) => {
  const handleCharacterClick = useCallback((characterId: number) => {
    // In skill phase, select character for action planning
    if (selectedCharacter === characterId) {
      onCharacterSelect(null);
      onObjectSelect(null);
      return;
    }
    onCharacterSelect(characterId);
    onObjectSelect(null);
    
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
      onObjectSelect(adjacentObjects[0].id);
      onValidPushDirectionsUpdate(adjacentObjects[0].pushActions.map(a => ({ ...a.direction, staminaCost: a.staminaCost })));
    } else {
      onObjectSelect(null);
      onValidPushDirectionsUpdate([]);
    }
  }, [world, grid, selectedCharacter, pushSystem, onCharacterSelect, onObjectSelect, onValidPushDirectionsUpdate]);

  const handleTileClick = useCallback((x: number, y: number) => {
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
        onObjectSelect(clickedEntity);
        onTick(); // Force re-render to update available actions
      }
    }
  }, [world, handleCharacterClick, onObjectSelect, onTick]);

  return {
    handleCharacterClick,
    handleTileClick,
  };
};

