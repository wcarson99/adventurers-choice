import React from 'react';
import { World } from '../../../game-engine/ecs/World';
import { AttributesComponent, PushableComponent, RenderableComponent } from '../../../game-engine/ecs/Component';
import { MovementPlan } from '../../../game-engine/encounters/MovementPlan';
import { PlanningPhase } from '../../../game-engine/encounters/EncounterPhaseManager';
import { PlannedAction } from '../../../game-engine/encounters/EncounterStateManager';
import { theme } from '../../styles/theme';

interface EncounterInfoPanelProps {
  phase: PlanningPhase; // @deprecated - kept for backward compatibility
  currentTurn: number; // Now represents round number
  activeMission?: { title: string; description: string; days?: number };
  activeCampaign?: { name: string; encounters: Array<{ name: string; description: string }> };
  currentEncounterIndex?: number;
  selectedCharacter: number | null;
  selectedObject: number | null;
  plannedActions: PlannedAction[]; // @deprecated - no longer used
  movementPlan: MovementPlan; // @deprecated - no longer used
  world: World;
  party: Array<{ name: string; archetype?: string; gold?: number; food?: number }>;
  pathUpdateTrigger: number; // @deprecated - no longer used
  getInstructions: () => string;
  getPlayerCharacters: () => number[];
  onCharacterClick: (characterId: number) => void;
  onUndoLastStep: () => void; // @deprecated - no longer used
  onClearAllMovements: () => void; // @deprecated - no longer used
  onPlanSkills: () => void; // @deprecated - no longer used
  onExecuteActions: () => void; // @deprecated - no longer used
  onBackToMovement: () => void; // @deprecated - no longer used
  onActionSelect: (actionName: string, targetId?: number) => void; // Updated to support targetId
  getAvailableActions: (characterId: number) => Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }>;
  onExecuteFreeMoves?: () => void; // @deprecated - no longer used
  onMoveActionUp?: (index: number) => void; // @deprecated - no longer used
  onMoveActionDown?: (index: number) => void; // @deprecated - no longer used
  onRemoveAction?: (index: number) => void; // @deprecated - no longer used
  validateAndGetExecuteButtonState?: () => { canExecute: boolean; invalidReasons: string[] }; // @deprecated - no longer used
  // New props for action point system
  getCurrentActiveCharacter?: () => number | null;
  getCharacterAP?: (characterId: number) => number;
  onPass?: () => void;
}

// Runtime check: This will fail if old code tries to import this module
// VERSION 2.1.0 - Force module reload
if (typeof window !== 'undefined') {
  (window as any).__ENCOUNTER_INFO_PANEL_V2__ = true;
  (window as any).__ENCOUNTER_INFO_PANEL_VERSION__ = '2.1.0';
}

export const EncounterInfoPanel: React.FC<EncounterInfoPanelProps> = ({
  phase: _phase, // @deprecated
  currentTurn,
  activeMission,
  activeCampaign,
  currentEncounterIndex,
  selectedCharacter,
  selectedObject,
  plannedActions: _plannedActions, // @deprecated
  movementPlan: _movementPlan, // @deprecated
  world,
  party,
  pathUpdateTrigger: _pathUpdateTrigger, // @deprecated
  getInstructions,
  getPlayerCharacters,
  onCharacterClick,
  onUndoLastStep: _onUndoLastStep, // @deprecated
  onClearAllMovements: _onClearAllMovements, // @deprecated
  onPlanSkills: _onPlanSkills, // @deprecated
  onExecuteActions: _onExecuteActions, // @deprecated
  onBackToMovement: _onBackToMovement, // @deprecated
  onActionSelect,
  getAvailableActions,
  onExecuteFreeMoves: _onExecuteFreeMoves, // @deprecated
  onMoveActionUp: _onMoveActionUp, // @deprecated
  onMoveActionDown: _onMoveActionDown, // @deprecated
  onRemoveAction: _onRemoveAction, // @deprecated
  validateAndGetExecuteButtonState: _validateAndGetExecuteButtonState, // @deprecated
  getCurrentActiveCharacter,
  getCharacterAP,
  onPass,
}) => {
  // CRITICAL CHECK: Verify new code is running
  if (typeof window !== 'undefined' && !(window as any).__ENCOUNTER_INFO_PANEL_V2__) {
    console.error('[EncounterInfoPanel] FATAL: Old code detected! Module not properly loaded.');
    throw new Error('Old EncounterInfoPanel code detected - browser cache issue');
  }
  
  const AP_SYSTEM_VERSION = '2.0.0';
  console.log(`[EncounterInfoPanel] ✅ AP System ${AP_SYSTEM_VERSION} LOADED - New code is running!`);
  
  const currentActiveCharacter = getCurrentActiveCharacter ? getCurrentActiveCharacter() : null;
  
  // Debug logging
  React.useEffect(() => {
    console.log('[EncounterInfoPanel] Component mounted, currentActiveCharacter:', currentActiveCharacter);
    if (currentActiveCharacter === null && getCurrentActiveCharacter) {
      console.log('[EncounterInfoPanel] WARNING: currentActiveCharacter is null - round may not be initialized');
    } else if (currentActiveCharacter !== null) {
      console.log('[EncounterInfoPanel] currentActiveCharacter:', currentActiveCharacter);
    }
  }, [currentActiveCharacter, getCurrentActiveCharacter]);
  
  return (
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

      {/* Instructions, Round, and Current Character - Compact */}
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
        <div style={{ fontSize: '0.8rem', opacity: 0.8, display: 'flex', gap: '1rem' }}>
          <span>Round: {currentTurn}</span>
          {currentActiveCharacter !== null && getCharacterAP && (
            <span style={{ color: theme.colors.accent, fontWeight: 'bold' }}>
              AP: {getCharacterAP(currentActiveCharacter)}
            </span>
          )}
        </div>
        {currentActiveCharacter !== null && (() => {
          const charIndex = Array.from(world.getAllEntities()).indexOf(currentActiveCharacter);
          const charName = party[charIndex]?.name || `Character ${charIndex + 1}`;
          return (
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.25rem', color: theme.colors.accent }}>
              Active: {charName}
            </div>
          );
        })()}
      </div>

      {/* Fallback: Show message if round not started */}
      {currentActiveCharacter === null && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.75rem',
          backgroundColor: theme.colors.background,
          borderRadius: '6px',
          border: `1px solid ${theme.colors.imageBorder}`,
          color: theme.colors.text,
          fontSize: '0.85rem',
          fontStyle: 'italic',
          opacity: 0.8,
          textAlign: 'center'
        }}>
          Waiting for round to start...
        </div>
      )}

      {/* Current Character Actions - Action Point System */}
      {currentActiveCharacter !== null && (() => {
        const availableActions = getAvailableActions(currentActiveCharacter);
        const currentAP = getCharacterAP ? getCharacterAP(currentActiveCharacter) : 50;
        const charIndex = Array.from(world.getAllEntities()).indexOf(currentActiveCharacter);
        const charName = party[charIndex]?.name || `Character ${charIndex + 1}`;
        const isSelected = selectedCharacter === currentActiveCharacter;
        
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
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{charName}</span>
              <span style={{ fontSize: '0.85rem', color: theme.colors.accentLight }}>
                {currentAP} AP
              </span>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availableActions.map((action, index) => {
                const canAfford = currentAP >= action.cost;
                const isPass = action.name === 'Pass';
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (action.name === 'Pass' && onPass) {
                        onPass();
                      } else {
                        onActionSelect(action.name, action.targetId);
                      }
                    }}
                    disabled={!canAfford && !isPass}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      backgroundColor: isPass 
                        ? theme.colors.success 
                        : canAfford 
                          ? theme.colors.accent 
                          : theme.colors.imageBackground,
                      color: theme.colors.text,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (canAfford || isPass) ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      opacity: (canAfford || isPass) ? 1 : 0.5,
                      textAlign: 'left'
                    }}
                    title={!canAfford && !isPass ? `Insufficient AP (need ${action.cost}, have ${currentAP})` : ''}
                  >
                    {action.name} ({action.cost} AP)
                    {action.requiresItem && action.targetId && ' - Target Selected'}
                  </button>
                );
              })}
            </div>
            
            {/* Select Character Button */}
            {!isSelected && (
              <button
                onClick={() => onCharacterClick(currentActiveCharacter)}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
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
                Select Character
              </button>
            )}
          </div>
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
              <div>PWR: {attrs.pwr}</div>
              <div>MOV: {attrs.mov}</div>
              <div>INF: {attrs.inf}</div>
              <div>CRE: {attrs.cre}</div>
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
  );
};

