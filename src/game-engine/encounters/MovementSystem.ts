import { World } from '../ecs/World';
import { Grid, GridPosition } from '../grid/Grid';
import { PositionComponent } from '../ecs/Component';

export interface MovementPattern {
  dx: number;
  dy: number;
  name: string;
}

/**
 * MovementSystem handles character movement based on MOV scores
 * Movement is FREE (no stamina cost)
 */
export class MovementSystem {
  /**
   * Get valid movement patterns for a character based on their MOV score
   */
  getMovementPatterns(mov: number): MovementPattern[] {
    const patterns: MovementPattern[] = [];

    // MOV 1-3: Horizontal/Vertical only (orthogonal)
    if (mov >= 1) {
      patterns.push(
        { dx: 0, dy: -1, name: 'Up' },
        { dx: 0, dy: 1, name: 'Down' },
        { dx: -1, dy: 0, name: 'Left' },
        { dx: 1, dy: 0, name: 'Right' }
      );
    }

    // MOV 4-6: Add diagonal
    if (mov >= 4) {
      patterns.push(
        { dx: -1, dy: -1, name: 'Up-Left' },
        { dx: 1, dy: -1, name: 'Up-Right' },
        { dx: -1, dy: 1, name: 'Down-Left' },
        { dx: 1, dy: 1, name: 'Down-Right' }
      );
    }

    // MOV 7-9: Add 2-square orthogonal
    if (mov >= 7) {
      patterns.push(
        { dx: 0, dy: -2, name: 'Up-2' },
        { dx: 0, dy: 2, name: 'Down-2' },
        { dx: -2, dy: 0, name: 'Left-2' },
        { dx: 2, dy: 0, name: 'Right-2' }
      );
    }

    // MOV 10+: Extended patterns (future)
    // TODO: Add knight moves, 2-square diagonal, etc.

    return patterns;
  }

  /**
   * Get all valid move destinations for a character
   */
  getValidMoves(
    world: World,
    grid: Grid,
    characterId: number,
    currentPos: GridPosition,
    mov: number
  ): GridPosition[] {
    const patterns = this.getMovementPatterns(mov);
    const validMoves: GridPosition[] = [];

    for (const pattern of patterns) {
      const newX = currentPos.x + pattern.dx;
      const newY = currentPos.y + pattern.dy;

      // Check if destination is valid
      if (!grid.isValid(newX, newY)) continue;

      // Check if destination is a wall
      if (grid.isWall(newX, newY)) continue;

      // Check if destination is occupied by another character
      if (this.isOccupied(world, grid, newX, newY, characterId)) continue;

      // For 2-square moves, check that the path is clear
      if (Math.abs(pattern.dx) === 2 || Math.abs(pattern.dy) === 2) {
        const midX = currentPos.x + Math.sign(pattern.dx);
        const midY = currentPos.y + Math.sign(pattern.dy);
        
        // Check if middle square is blocked
        if (grid.isWall(midX, midY) || this.isOccupied(world, grid, midX, midY, characterId)) {
          continue;
        }
      }

      validMoves.push({ x: newX, y: newY });
    }

    return validMoves;
  }

  /**
   * Check if a position is occupied by another character
   */
  private isOccupied(world: World, grid: Grid, x: number, y: number, excludeId: number): boolean {
    const entities = world.getAllEntities();
    
    for (const entityId of entities) {
      if (entityId === excludeId) continue;
      
      const pos = world.getComponent<PositionComponent>(entityId, 'Position');
      if (pos && pos.x === x && pos.y === y) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate if a path step is valid for a character's MOV
   * Checks if the step follows a valid movement pattern from the current position
   */
  validatePathStep(
    world: World,
    grid: Grid,
    characterId: number,
    fromPos: GridPosition,
    toPos: GridPosition,
    mov: number
  ): boolean {
    // Calculate the delta
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;

    // Check if destination is valid
    if (!grid.isValid(toPos.x, toPos.y)) return false;

    // Check if destination is a wall
    if (grid.isWall(toPos.x, toPos.y)) return false;

    // Check if destination is occupied by another character
    if (this.isOccupied(world, grid, toPos.x, toPos.y, characterId)) return false;

    // Get valid movement patterns
    const patterns = this.getMovementPatterns(mov);

    // Check if the delta matches any valid pattern
    const matchesPattern = patterns.some(pattern => pattern.dx === dx && pattern.dy === dy);

    if (!matchesPattern) return false;

    // For 2-square moves, check that the path is clear
    if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
      const midX = fromPos.x + Math.sign(dx);
      const midY = fromPos.y + Math.sign(dy);
      
      // Check if middle square is blocked
      if (grid.isWall(midX, midY) || this.isOccupied(world, grid, midX, midY, characterId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if character can move from position A to B (respects MOV patterns)
   */
  canMoveFromTo(
    world: World,
    grid: Grid,
    characterId: number,
    fromPos: GridPosition,
    toPos: GridPosition,
    mov: number
  ): boolean {
    return this.validatePathStep(world, grid, characterId, fromPos, toPos, mov);
  }

  /**
   * Move a character to a new position (free action, no stamina cost)
   */
  moveCharacter(
    world: World,
    characterId: number,
    targetPos: GridPosition
  ): boolean {
    const pos = world.getComponent<PositionComponent>(characterId, 'Position');
    if (!pos) return false;

    pos.x = targetPos.x;
    pos.y = targetPos.y;
    return true;
  }
}

