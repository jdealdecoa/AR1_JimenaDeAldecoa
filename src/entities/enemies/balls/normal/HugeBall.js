import { BaseBall } from './BaseBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export class HugeBall extends BaseBall {
  constructor(scene, x, y, direction = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "n_huge", 150 * direction, "big", color, BALL_SCORES.HUGE, 1000);
  }
}
