import { BaseSpecialBall } from './BaseSpecialBall.js';
import { BALL_SCORES } from '../BallConstants.js';

/**
 * SpecialBigBall - Large special ball
 * Uses sp_big spritesheet (100x42, 1x2 frames)
 */
export class SpecialBigBall extends BaseSpecialBall {
  constructor(scene, x, y, direction = 1) {
    super(scene, x, y, "sp_big", 180 * direction, BALL_SCORES.BIG * 2);
  }
}
