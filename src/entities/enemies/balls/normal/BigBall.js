import { BaseBall } from './BaseBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export class BigBall extends BaseBall {
  constructor(scene, x, y, direction = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "n_big", 180 * direction, "mid", color, BALL_SCORES.BIG, 950);
  }
}
