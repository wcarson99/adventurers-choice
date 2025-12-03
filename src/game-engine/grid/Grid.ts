export interface GridPosition {
  x: number;
  y: number;
}

export class Grid {
  width: number;
  height: number;

  constructor(width: number = 10, height: number = 10) {
    this.width = width;
    this.height = height;
  }

  isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getDistance(a: GridPosition, b: GridPosition): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
  }
  
  // Helper to get index from coordinates
  getIndex(x: number, y: number): number {
    return y * this.width + x;
  }
  
  // Helper to get coordinates from index
  getCoords(index: number): GridPosition {
    return {
      x: index % this.width,
      y: Math.floor(index / this.width)
    };
  }

  /**
   * Check if position is in the entrance zone
   * Entrance zone: left side (x=0), rows 1-4 (0-indexed: y: 1, 2, 3, 4)
   * Excludes corner (0,0) so characters can move freely
   */
  isEntranceZone(x: number, y: number): boolean {
    return x === 0 && y >= 1 && y <= 4;
  }

  /**
   * Check if position is in the exit zone
   * Exit zone: right side (x=9), rows 5-8 (0-indexed: y: 5, 6, 7, 8)
   * Excludes corner (9,9) so characters can move freely
   */
  isExitZone(x: number, y: number): boolean {
    return x === 9 && y >= 5 && y <= 8;
  }

  /**
   * Check if position is a wall (border squares excluding entrance/exit)
   */
  isWall(x: number, y: number): boolean {
    // Top row (y=0) - all are walls
    if (y === 0) return true;
    // Bottom row (y=9) - all are walls
    if (y === 9) return true;
    // Left side (x=0) except entrance zone (y 1-4)
    if (x === 0 && (y < 1 || y > 4)) return true;
    // Right side (x=9) except exit zone (y 5-8)
    if (x === 9 && (y < 5 || y > 8)) return true;
    
    return false;
  }

  /**
   * Check if position is in the playable area (interior 8×8, rows 1-8, cols 1-8)
   * Note: 0-indexed, so rows 0-7, cols 0-7 are interior
   */
  isPlayableArea(x: number, y: number): boolean {
    return x >= 1 && x <= 8 && y >= 1 && y <= 8;
  }

  /**
   * Get all entrance zone positions
   * Entrance zone: left side (x=0), rows 1-4 (0-indexed)
   * Excludes corner (0,0) so characters can move freely
   */
  getEntranceZonePositions(): GridPosition[] {
    return [
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 }
    ];
  }

  /**
   * Get all exit zone positions
   * Exit zone: right side (x=9), rows 5-8 (0-indexed)
   * Excludes corner (9,9) so characters can move freely
   */
  getExitZonePositions(): GridPosition[] {
    return [
      { x: 9, y: 5 },
      { x: 9, y: 6 },
      { x: 9, y: 7 },
      { x: 9, y: 8 }
    ];
  }
}
