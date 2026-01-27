import { BaseHexBall } from './BaseHexBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

// HexBig = mismo tamaño que BigBall (no HugeBall)
export class HexBigBall extends BaseHexBall {
  constructor(scene, x, y, dirX = 1, dirY = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "hex_big", 180 * dirX, 180 * dirY, "hex_mid", BALL_SCORES.BIG, color);
  }
}
