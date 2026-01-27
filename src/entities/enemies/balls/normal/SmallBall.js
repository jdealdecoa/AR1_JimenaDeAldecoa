import { BaseBall } from './BaseBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export class SmallBall extends BaseBall {
  constructor(scene, x, y, direction = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "n_small", 240 * direction, "tiny", color, BALL_SCORES.SMALL, 850);
  }
}
