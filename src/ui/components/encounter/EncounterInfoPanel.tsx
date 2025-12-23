import React from 'react';
import { World } from '../../../game-engine/ecs/World';
import { AttributesComponent, PushableComponent, RenderableComponent } from '../../../game-engine/ecs/Component';
import { MovementPlan } from '../../../game-engine/encounters/MovementPlan';
import { PlanningPhase } from '../../../game-engine/encounters/EncounterPhaseManager';
import { PlannedAction } from '../../../game-engine/encounters/EncounterStateManager';
import { theme } from '../../styles/theme';

interface EncounterInfoPanelProps {
  phase: PlanningPhase;
  currentTurn: number;
  activeMission?: { title: string; description: string; days?: number };
  activeCampaign?: { name: string; encounters: Array<{ name: string; description: string }> };
  currentEncounterIndex?: number;
  selectedCharacter: number | null;
  selectedObject: number | null;
  plannedActions: PlannedAction[];
  movementPlan: MovementPlan;
  world: World;
  party: Array<{ name: string; archetype?: string; gold?: number; food?: number }>;
  pathUpdateTrigger: number;
  getInstructions: () => string;
  getPlayerCharacters: () => number[];
  onCharacterClick: (characterId: number) => void;
  onUndoLastStep: () => void;
  onClearAllMovements: () => void;
  onPlanSkills: () => void;
  onExecuteActions: () => void;
  onBackToMovement: () => void;
  onActionSelect: (actionName: string) => void;
  getAvailableActions: (characterId: number) => Array<{ name: string; cost: number; requiresItem?: boolean; targetId?: number }>;
  onExecuteFreeMoves?: () => void;
  onMoveActionUp?: (index: number) => void;
  onMoveActionDown?: (index: number) => void;
  onRemoveAction?: (index: number) => void;
  validateAndGetExecuteButtonState?: () => { canExecute: boolean; invalidReasons: string[] };
}

export const EncounterInfoPanel: React.FC<EncounterInfoPanelProps> = ({
  phase,
  currentTurn,
  activeMission,
  activeCampaign,
  currentEncounterIndex,
  selectedCharacter,
  selectedObject,
  plannedActions,
  movementPlan,
  world,
  party,
  pathUpdateTrigger,
  getInstructions,
  getPlayerCharacters,
  onCharacterClick,
  onUndoLastStep,
  onClearAllMovements,
  onPlanSkills,
  onExecuteActions,
  onBackToMovement,
  onActionSelect,
  getAvailableActions,
  onExecuteFreeMoves,
  onMoveActionUp,
  onMoveActionDown,
  onRemoveAction,
  validateAndGetExecuteButtonState,
}) => {
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
          Turn: {currentTurn}
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
                    onClick={() => onCharacterClick(charId)}
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
            // Force recalculation when paths change (use pathUpdateTrigger)
            void pathUpdateTrigger;
            
            // Check if there are any paths that can be executed (ready, executing, or conflicting)
            const allPaths = movementPlan.getAllPaths();
            const executablePaths = allPaths.filter(path => 
              path.steps.length > 0 && 
              path.currentStepIndex < path.steps.length
            );
            
            if (executablePaths.length === 0) return null;
            
            // Get validation state from parent if provided
            const buttonState = validateAndGetExecuteButtonState ? validateAndGetExecuteButtonState() : { canExecute: true, invalidReasons: [] };
            const hasInvalidNextStep = !buttonState.canExecute;
            
            return (
              <button
                onClick={onExecuteFreeMoves || (() => {})}
                disabled={hasInvalidNextStep}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  backgroundColor: hasInvalidNextStep ? theme.colors.imageBackground : theme.colors.accent,
                  color: theme.colors.text,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: hasInvalidNextStep ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: hasInvalidNextStep ? 0.6 : 1
                }}
                title={hasInvalidNextStep ? `Cannot execute: ${buttonState.invalidReasons.join(', ')}` : 'Execute next step for all characters'}
              >
                Execute Free Moves{hasInvalidNextStep ? ' (Invalid)' : ''}
              </button>
            );
          })()}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selectedCharacter && (() => {
              const path = movementPlan.getPath(selectedCharacter);
              // Only show undo if there are planned steps that haven't been executed yet
              const unexecutedSteps = path && path.steps.length > path.currentStepIndex;
              if (!unexecutedSteps) return null;
              
              return (
                <button
                  onClick={onUndoLastStep}
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
              );
            })()}
            <button
              onClick={onClearAllMovements}
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
              onClick={onPlanSkills}
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
      {phase === 'skill' && (
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
                      {onMoveActionUp && (
                        <button
                          onClick={() => {
                            if (index > 0) {
                              onMoveActionUp(index);
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
                      )}
                      {onMoveActionDown && (
                        <button
                          onClick={() => {
                            if (index < plannedActions.length - 1) {
                              onMoveActionDown(index);
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
                      )}
                      {onRemoveAction && (
                        <button
                          onClick={() => {
                            onRemoveAction(index);
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
                      )}
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
                  onChange={(e) => onActionSelect(e.target.value)}
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
              onClick={onBackToMovement}
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
              onClick={onExecuteActions}
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

