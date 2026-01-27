import { BaseBall } from './BaseBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export class MidBall extends BaseBall {
  constructor(scene, x, y, direction = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "n_mid", 210 * direction, "small", color, BALL_SCORES.MID, 900);
  }
}
