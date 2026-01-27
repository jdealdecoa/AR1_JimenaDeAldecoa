import { BaseCrocodile } from './BaseCrocodile.js';
import { CROCODILE_SCORE, CROCODILE_SPEED } from './CrocodileConstants.js';

/**
 * Crocodile - Ground patrolling enemy
 * 
 * Standard crocodile that patrols, descends ladders,
 * and can be stunned then launched by player.
 */
export class Crocodile extends BaseCrocodile {
  constructor(scene, x, y, customSpeed = null, customScore = null) {
    const speed = customSpeed || CROCODILE_SPEED;
    const scoreValue = customScore || CROCODILE_SCORE;
    
    super(scene, x, y, 'crocodile', speed, scoreValue);
    
    // NO setScale aquí - ya se hace en BaseCrocodile
    
    // Adjust hitbox
    const hitboxWidth = this.width * 0.7;
    const hitboxHeight = this.height * 0.8;
    this.body.setSize(hitboxWidth, hitboxHeight);
    this.body.setOffset(
      (this.width - hitboxWidth) / 2,
      (this.height - hitboxHeight) / 2 + 10
    );
  }
}