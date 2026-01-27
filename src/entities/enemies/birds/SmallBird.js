import { BaseBird } from './BaseBird.js';
import { BIRD_SCORE, BIRD_SPEED } from './BirdConstants.js';

/**
 * SmallBird - Fast flying bird (ONLY bird type)
 * 
 * Quick bird that flies horizontally with arc entry pattern.
 * Can be customized with optional parameters.
 */
export class SmallBird extends BaseBird {
  constructor(scene, x, y, direction = 1, customSpeed = null, customScore = null) {
    const speed = customSpeed || BIRD_SPEED; // Use custom or default (250)
    const scoreValue = customScore || BIRD_SCORE; // Use custom or default (150)
    
    super(scene, x, y, 'bird_small', speed * direction, scoreValue);
    
    // Scale for small bird
    this.setScale(1.5, 1.5);
    
    // Adjust hitbox for small bird
    const hitboxWidth = this.width * 0.5;
    const hitboxHeight = this.height * 0.5;
    this.body.setSize(hitboxWidth, hitboxHeight);
    this.body.setOffset(
      (this.width - hitboxWidth) / 2,
      (this.height - hitboxHeight) / 2
    );
  }
}