export interface GridPosition {
  x: number;
  y: number;
}

export class Grid {
  width: number;
  height: number;

  constructor(width: number = 8, height: number = 8) {
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
}
