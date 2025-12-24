import { Action, ActionContext, ActionRequirements } from '../../types/Action';
import { PositionComponent, AttributesComponent, StatsComponent } from '../ecs/Component';
import { ActionExecutionSystem } from '../encounters/ActionExecutionSystem';
import { ACTION_COSTS } from '../encounters/constants';

/**
 * AttackAction represents a melee attack action against an adjacent target
 */
export class AttackAction extends Action {
  constructor(public targetId: number) {
    super();
  }

  canExecute(context: ActionContext): boolean {
    const { world, grid, characterId, apSystem } = context;

    // Check if character can afford the attack
    if (!apSystem.canAffordAction(characterId, ACTION_COSTS.ATTACK)) {
      return false;
    }

    // Check if attacker has position
    const attackerPos = world.getComponent<PositionComponent>(characterId, 'Position');
    if (!attackerPos) {
      return false;
    }

    // Check if target exists and has position
    const targetPos = world.getComponent<PositionComponent>(this.targetId, 'Position');
    if (!targetPos) {
      return false;
    }

    // Check if target has Stats component (can be damaged)
    const targetStats = world.getComponent<StatsComponent>(this.targetId, 'Stats');
    if (!targetStats) {
      return false;
    }

    // Check if target is adjacent (Manhattan distance = 1)
    const distance = grid.getDistance(attackerPos, targetPos);
    if (distance !== 1) {
      return false;
    }

    // Check if target is still alive (HP > 0)
    if (targetStats.hp <= 0) {
      return false;
    }

    return true;
  }

  execute(context: ActionContext) {
    const { world, grid, characterId, apSystem } = context;
    const actionExecutionSystem = new ActionExecutionSystem();
    
    return actionExecutionSystem.executeAttackAction(
      world,
      grid,
      characterId,
      this.targetId,
      apSystem
    );
  }

  getCost(): number {
    return ACTION_COSTS.ATTACK;
  }

  getName(): string {
    return 'Attack';
  }

  getRequirements(): ActionRequirements {
    return {
      situational: ['adjacentTarget']
    };
  }
}

