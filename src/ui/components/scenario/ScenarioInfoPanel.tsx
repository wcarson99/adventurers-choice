import React from 'react';
import { World } from '../../../game-engine/ecs/World';
import { AttributesComponent, PushableComponent, RenderableComponent, NPCComponent } from '../../../game-engine/ecs/Component';
import { MovementPlan } from '../../../game-engine/encounters/MovementPlan';
import { PlanningPhase } from '../../../game-engine/encounters/EncounterPhaseManager';
import { PlannedAction } from '../../../game-engine/encounters/EncounterStateManager';
import { theme } from '../../styles/theme';
import { useGame } from '../../../game-engine/GameState';

interface ScenarioInfoPanelProps {
  phase: PlanningPhase; // @deprecated - kept for backward compatibility
  currentTurn: number; // Now represents round number
  activeMission?: { title: string; description: string; days?: number };
  activeJob?: { name: string; scenarios: Array<{ name: string; description: string }> };
  currentScenarioIndex?: number;
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
  // Turn action props
  selectingDirection?: boolean;
  onDirectionSelect?: (dx: number, dy: number) => void;
  // Abandon button props
  scenarioType?: 'combat' | 'obstacle' | 'trading';
  onAbandon?: () => void;
  // Flee button props
  allowFleeing?: boolean;
  onFlee?: () => void;
  // Turn order props
  getTurnOrder?: () => number[];
}

// Runtime check: This will fail if old code tries to import this module
// VERSION 2.1.0 - Force module reload
if (typeof window !== 'undefined') {
  (window as any).__SCENARIO_INFO_PANEL_V2__ = true;
  (window as any).__SCENARIO_INFO_PANEL_VERSION__ = '2.1.0';
}

export const ScenarioInfoPanel: React.FC<ScenarioInfoPanelProps> = ({
  phase: _phase, // @deprecated
  currentTurn: _currentTurn, // @deprecated - kept for backward compatibility
  activeMission,
  activeJob,
  currentScenarioIndex,
  selectedCharacter,
  selectedObject,
  plannedActions: _plannedActions, // @deprecated
  movementPlan: _movementPlan, // @deprecated
  world,
  party,
  pathUpdateTrigger: _pathUpdateTrigger, // @deprecated
  getInstructions: _getInstructions, // @deprecated - kept for backward compatibility
  getPlayerCharacters: _getPlayerCharacters,
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
  selectingDirection = false,
  onDirectionSelect: _onDirectionSelect,
  scenarioType,
  onAbandon,
  allowFleeing,
  onFlee,
  getTurnOrder,
}) => {
  // CRITICAL CHECK: Verify new code is running
  if (typeof window !== 'undefined' && !(window as any).__SCENARIO_INFO_PANEL_V2__) {
    console.error('[ScenarioInfoPanel] FATAL: Old code detected! Module not properly loaded.');
    throw new Error('Old ScenarioInfoPanel code detected - browser cache issue');
  }
  
  const AP_SYSTEM_VERSION = '2.0.0';
  console.log(`[ScenarioInfoPanel] ✅ AP System ${AP_SYSTEM_VERSION} LOADED - New code is running!`);
  
  const currentActiveCharacter = getCurrentActiveCharacter ? getCurrentActiveCharacter() : null;
  const { statusMessage, setStatusMessage } = useGame();
  
  // Debug logging
  React.useEffect(() => {
      console.log('[ScenarioInfoPanel] Component mounted, currentActiveCharacter:', currentActiveCharacter);
    if (currentActiveCharacter === null && getCurrentActiveCharacter) {
      console.log('[ScenarioInfoPanel] WARNING: currentActiveCharacter is null - round may not be initialized');
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
      {/* Mission/Campaign Title - Centered */}
      {(activeMission || (activeJob && currentScenarioIndex !== undefined)) && (
        <div style={{
          marginBottom: '0.75rem',
          paddingBottom: '0.75rem',
          borderBottom: `1px solid ${theme.colors.imageBorder}`
        }}>
          <h2 style={{ 
            fontSize: '1.2rem', 
            margin: '0 0 0.25rem 0', 
            color: theme.colors.accent,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {activeMission 
              ? activeMission.title 
              : activeJob && currentScenarioIndex !== undefined
                ? `${activeJob.name} - ${activeJob.scenarios[currentScenarioIndex].name}`
                : ''}
          </h2>
          <p style={{ 
            fontSize: '0.75rem', 
            margin: 0, 
            color: theme.colors.text,
            opacity: 0.8,
            lineHeight: '1.2',
            textAlign: 'center'
          }}>
            {activeMission 
              ? activeMission.description 
              : activeJob && currentScenarioIndex !== undefined
                ? activeJob.scenarios[currentScenarioIndex].description
                : ''}
          </p>
          {activeJob && currentScenarioIndex !== undefined && (
            <p style={{ 
              fontSize: '0.7rem', 
              margin: '0.25rem 0 0 0', 
              color: theme.colors.accentLight,
              opacity: 0.7,
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              Scenario {currentScenarioIndex + 1} of {activeJob.scenarios.length}
            </p>
          )}
        </div>
      )}

      {/* Turn Order Display */}
      {getTurnOrder && (() => {
        const turnOrder = getTurnOrder();
        if (turnOrder.length === 0) return null;
        
        const currentActive = getCurrentActiveCharacter ? getCurrentActiveCharacter() : null;
        
        return (
          <div style={{
            marginBottom: '0.75rem',
            padding: '0.75rem',
            backgroundColor: theme.colors.background,
            borderRadius: '6px',
            border: `1px solid ${theme.colors.imageBorder}`
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: theme.colors.accent,
              marginBottom: '0.5rem'
            }}>
              Turn Order
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              {turnOrder.map((charId, index) => {
                const isActive = charId === currentActive;
                const isNPC = world.getComponent<NPCComponent>(charId, 'NPC') !== undefined;
                const attrs = world.getComponent<AttributesComponent>(charId, 'Attributes');
                const renderable = world.getComponent<RenderableComponent>(charId, 'Renderable');
                
                // Get character name
                let charName: string;
                if (isNPC) {
                  // For NPCs, use stored name if available, otherwise infer from first letter
                  if (renderable?.name) {
                    charName = renderable.name;
                  } else {
                    const firstLetter = renderable?.char || 'E';
                    // Try to infer name from first letter (E=Enemy, W=Warrior, T=Thief, etc.)
                    const nameMap: { [key: string]: string } = {
                      'E': 'Enemy',
                      'W': 'Enemy Warrior',
                      'T': 'Enemy Thief',
                      'B': 'Enemy Bard',
                      'C': 'Enemy Cleric',
                      'P': 'Enemy Paladin',
                      'Z': 'Enemy Wizard',
                      'G': 'Goblin' // G for Goblin
                    };
                    charName = nameMap[firstLetter] || `Enemy ${firstLetter}`;
                  }
                } else {
                  // For players, get from party array
                  const charIndex = Array.from(world.getAllEntities()).indexOf(charId);
                  charName = party[charIndex]?.name || `Character ${charIndex + 1}`;
                }
                
                return (
                  <div
                    key={charId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: isActive ? theme.colors.accent : 'transparent',
                      color: isActive ? '#fff' : (isNPC ? '#ff6b6b' : theme.colors.text),
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 'bold' : 'normal'
                    }}
                  >
                    <span style={{ width: '20px', textAlign: 'center' }}>
                      {index + 1}.
                    </span>
                    {/* Character image at 25% size (assuming original is ~64px, so 25% = 16px) */}
                    {renderable?.sprite ? (
                      <img
                        src={renderable.sprite}
                        alt={charName}
                        style={{
                          width: '16px',
                          height: '16px',
                          objectFit: 'contain',
                          flexShrink: 0,
                          imageRendering: 'pixelated' // Keep pixel art crisp
                        }}
                      />
                    ) : (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isNPC ? '#ff0000' : '#00ff00',
                        flexShrink: 0
                      }} />
                    )}
                    <span style={{ flex: 1 }}>{charName}</span>
                    {attrs && (
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        MOV {attrs.mov}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Selected Character Info */}
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

      {/* Action Selection */}
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
            
            {/* Direction Selection Message (when Turn action is selected) */}
            {selectingDirection && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem',
                backgroundColor: theme.colors.accent,
                color: theme.colors.text,
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                👆 Click on the grid to select direction
                <button
                  onClick={() => {
                    // Cancel direction selection
                    if (onActionSelect) {
                      onActionSelect('Cancel', undefined);
                    }
                  }}
                  style={{
                    display: 'block',
                    marginTop: '0.5rem',
                    margin: '0.5rem auto 0',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    backgroundColor: theme.colors.imageBackground,
                    color: theme.colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {!selectingDirection && (
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
            )}
            
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

      {/* Status Message - At bottom of info panel (errors, success, and info) */}
      {statusMessage && (statusMessage.type === 'error' || statusMessage.type === 'success' || statusMessage.type === 'info') && (
        <div style={{
          marginTop: 'auto',
          padding: '0.75rem',
          backgroundColor: statusMessage.type === 'error' 
            ? '#d32f2f' 
            : statusMessage.type === 'success' 
            ? theme.colors.success 
            : theme.colors.accent,
          color: '#fff',
          borderRadius: '6px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          textAlign: 'center',
          border: `1px solid ${theme.colors.imageBorder}`,
          position: 'relative'
        }}>
          {statusMessage.text}
          <button
            onClick={() => setStatusMessage(null)}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              borderRadius: '4px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1'
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Abandon Button - Only visible for obstacle scenarios */}
      {scenarioType === 'obstacle' && onAbandon && (
        <button
          onClick={onAbandon}
          style={{
            marginTop: 'auto',
            padding: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            backgroundColor: '#d32f2f',
            color: '#fff',
            border: `2px solid ${theme.colors.imageBorder}`,
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'center',
            width: '100%'
          }}
        >
          Abandon Scenario
        </button>
      )}

      {/* Flee Button - Only visible for combat scenarios with allowFleeing=true */}
      {scenarioType === 'combat' && allowFleeing && onFlee && (
        <button
          onClick={onFlee}
          style={{
            marginTop: 'auto',
            padding: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            backgroundColor: '#ff9800',
            color: '#fff',
            border: `2px solid ${theme.colors.imageBorder}`,
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'center',
            width: '100%'
          }}
        >
          Flee
        </button>
      )}
    </div>
  );
};

