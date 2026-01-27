import { BaseSpecialBall } from './BaseSpecialBall.js';
import { BALL_SCORES } from '../BallConstants.js';

/**
 * SpecialMidBall - Medium special ball
 * Uses sp_mid spritesheet (68x28, 1x2 frames)
 */
export class SpecialMidBall extends BaseSpecialBall {
  constructor(scene, x, y, direction = 1) {
    super(scene, x, y, "sp_mid", 210 * direction, BALL_SCORES.MID * 2);
  }
}
