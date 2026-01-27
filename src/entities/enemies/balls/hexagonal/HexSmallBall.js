import { BaseHexBall } from './BaseHexBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

// HexSmall = mismo tamaño que SmallBall
export class HexSmallBall extends BaseHexBall {
  constructor(scene, x, y, dirX = 1, dirY = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "hex_small", 240 * dirX, 240 * dirY, null, BALL_SCORES.SMALL, color);
  }
}
