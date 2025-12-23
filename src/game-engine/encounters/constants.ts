/**
 * Action cost constants for the action point system
 * 
 * These define how many action points (AP) each action costs.
 * Characters have 50 AP per turn by default.
 */
export const ACTION_COSTS = {
  MOVE: 15,
  PUSH: 25,
  PASS: 0,
} as const;

/**
 * Default action points per character per turn
 */
export const DEFAULT_AP = 50;

