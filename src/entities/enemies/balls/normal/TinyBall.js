import { BaseBall } from './BaseBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export class TinyBall extends BaseBall {
  constructor(scene, x, y, direction = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "n_tiny1", 270 * direction, null, color, BALL_SCORES.TINY, 800); 
  }
}
