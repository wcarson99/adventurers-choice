/**
 * Base type for all game actions
 */
export type Action = {
  type: string;
  [key: string]: unknown;
};

