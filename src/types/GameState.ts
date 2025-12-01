/**
 * Game state snapshot returned after executing a turn
 */
export type GameState = {
  turn: number;
  [key: string]: unknown;
};

