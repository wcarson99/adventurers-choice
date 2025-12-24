import { World } from '../ecs/World';
import { Grid } from '../grid/Grid';
import { PositionComponent, AttributesComponent, NPCComponent, StatsComponent } from '../ecs/Component';
import { MovementSystem } from './MovementSystem';
import { ActionFactory } from '../actions';
import { ActionContext } from '../../types/Action';
import { ActionPointSystem } from './ActionPointSystem';
import { ACTION_COSTS } from './constants';

/**
 * AISystem provides simple AI logic for NPCs
 * 
 * Current behavior:
 * - Finds nearest player character
 * - Moves toward nearest player (if AP allows)
 * - Attacks if adjacent to player
 * - Passes if no valid actions
 */
export class AISystem {
  private movementSystem: MovementSystem;

  constructor() {
    this.movementSystem = new MovementSystem();
  }

  /**
   * Execute AI turn for an NPC
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param npcId - The NPC entity ID
   * @param getPlayerCharacters - Function that returns array of player character IDs
   * @param apSystem - ActionPointSystem to check AP
   * @param buildActionContext - Function to build ActionContext for the NPC
   * @returns The action that was executed (or null if passed)
   */
  executeAITurn(
    world: World,
    grid: Grid,
    npcId: number,
    getPlayerCharacters: () => number[],
    apSystem: ActionPointSystem,
    buildActionContext: (characterId: number) => ActionContext
  ): { action: 'Attack' | 'Move' | 'Pass'; targetId?: number; targetPos?: { x: number; y: number } } | null {
    // Verify this is an NPC
    const npcComponent = world.getComponent<NPCComponent>(npcId, 'NPC');
    if (!npcComponent) {
      return null; // Not an NPC
    }

    // Get NPC position and attributes
    const npcPos = world.getComponent<PositionComponent>(npcId, 'Position');
    const npcAttrs = world.getComponent<AttributesComponent>(npcId, 'Attributes');
    if (!npcPos || !npcAttrs) {
      return null; // NPC missing required components
    }

    // Get all player characters
    const players = getPlayerCharacters();
    if (players.length === 0) {
      // No players to target, pass
      return { action: 'Pass' };
    }

    // Find nearest player
    const nearestPlayer = this.findNearestPlayer(world, grid, npcPos, players);
    if (!nearestPlayer) {
      return { action: 'Pass' };
    }

    const nearestPlayerPos = world.getComponent<PositionComponent>(nearestPlayer.id, 'Position');
    if (!nearestPlayerPos) {
      return { action: 'Pass' };
    }

    // Check if adjacent to nearest player
    const distance = grid.getDistance(npcPos, nearestPlayerPos);
    if (distance === 1) {
      // Adjacent - try to attack
      if (apSystem.canAffordAction(npcId, ACTION_COSTS.ATTACK)) {
        const attackAction = ActionFactory.createAttackAction(nearestPlayer.id);
        const context = buildActionContext(npcId);
        if (attackAction.canExecute(context)) {
          attackAction.execute(context);
          return { action: 'Attack', targetId: nearestPlayer.id };
        }
      }
    }

    // Not adjacent or can't attack - try to move toward nearest player
    if (apSystem.canAffordAction(npcId, ACTION_COSTS.MOVE)) {
      const moveTarget = this.findMoveTowardTarget(world, grid, npcId, npcPos, npcAttrs.mov, nearestPlayerPos);
      if (moveTarget) {
        const moveAction = ActionFactory.createMoveAction(moveTarget);
        const context = buildActionContext(npcId);
        if (moveAction.canExecute(context)) {
          moveAction.execute(context);
          return { action: 'Move', targetPos: moveTarget };
        }
      }
    }

    // Can't attack or move - pass
    return { action: 'Pass' };
  }

  /**
   * Find the nearest player character to the NPC
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param npcPos - NPC position
   * @param players - Array of player character IDs
   * @returns Nearest player info or null
   */
  private findNearestPlayer(
    world: World,
    grid: Grid,
    npcPos: PositionComponent,
    players: number[]
  ): { id: number; distance: number } | null {
    let nearest: { id: number; distance: number } | null = null;

    for (const playerId of players) {
      const playerPos = world.getComponent<PositionComponent>(playerId, 'Position');
      if (!playerPos) continue;

      // Check if player is alive (has Stats with HP > 0)
      const playerStats = world.getComponent<StatsComponent>(playerId, 'Stats');
      if (playerStats && playerStats.hp <= 0) continue;

      const distance = grid.getDistance(npcPos, playerPos);
      if (nearest === null || distance < nearest.distance) {
        nearest = { id: playerId, distance };
      }
    }

    return nearest;
  }

  /**
   * Find a move position that moves toward the target
   * Returns the move that gets closest to the target
   * 
   * @param world - The ECS world
   * @param grid - The grid
   * @param npcId - The NPC entity ID
   * @param npcPos - Current NPC position
   * @param mov - NPC's MOV attribute
   * @param targetPos - Target position to move toward
   * @returns Best move position or null if no valid moves
   */
  private findMoveTowardTarget(
    world: World,
    grid: Grid,
    npcId: number,
    npcPos: PositionComponent,
    mov: number,
    targetPos: PositionComponent
  ): { x: number; y: number } | null {
    // Get all valid moves
    const validMoves = this.movementSystem.getValidMoves(world, grid, npcId, npcPos, mov);
    if (validMoves.length === 0) {
      return null;
    }

    // Find the move that gets closest to target
    let bestMove: { x: number; y: number } | null = null;
    let bestDistance = Infinity;

    for (const move of validMoves) {
      const distance = grid.getDistance(move, targetPos);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMove = move;
      }
    }

    return bestMove;
  }
}

