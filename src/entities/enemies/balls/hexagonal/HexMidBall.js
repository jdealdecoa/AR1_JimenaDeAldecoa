import { BaseHexBall } from './BaseHexBall.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

// HexMid = mismo tamaño que MidBall
export class HexMidBall extends BaseHexBall {
  constructor(scene, x, y, dirX = 1, dirY = 1, color = BALL_COLORS.RED) {
    super(scene, x, y, "hex_mid", 210 * dirX, 210 * dirY, "hex_small", BALL_SCORES.MID, color);
  }
}
