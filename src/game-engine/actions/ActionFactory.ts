import { MoveAction } from './MoveAction';
import { PushAction } from './PushAction';
import { TurnAction } from './TurnAction';
import { PassAction } from './PassAction';

/**
 * Factory for creating action instances
 */
export class ActionFactory {
  /**
   * Create a MoveAction instance
   */
  static createMoveAction(targetPos: { x: number; y: number }): MoveAction {
    return new MoveAction(targetPos);
  }

  /**
   * Create a PushAction instance
   */
  static createPushAction(targetId: number): PushAction {
    return new PushAction(targetId);
  }

  /**
   * Create a TurnAction instance
   */
  static createTurnAction(direction: { dx: number; dy: number }): TurnAction {
    return new TurnAction(direction);
  }

  /**
   * Create a PassAction instance
   */
  static createPassAction(): PassAction {
    return new PassAction();
  }
}

