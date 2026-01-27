import { BaseItem } from '../BaseItem.js';
import { ITEMS } from '../../../core/constants.js';

/**
 * Ralentiza todas las bolas
 */

export class PowerUpTimeSlow extends BaseItem {
  constructor(scene, x, y) {
    super(scene, x, y, 'bonus', {
      itemType: 'TIME_SLOW',
      ttl: ITEMS.TTL.TIME_SLOW,
      gravity: 450,
      bounce: 0.5
    });
    
    // Set to hourglass frame (frame 7)
    this.setFrame(7);
    
    // Yellow/orange visual effect for hourglass (sin animaciones que sobrescriben BaseItem)
    this.setTint(0xFFCC00);
  }

  /**
   * Activate slow motion effect
   * @param {Hero} hero - The hero picking up this item
   */
  onPickup(hero) {
    const scene = this.scene;
    
    // Show slow motion text
    const slowText = scene.add.text(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY - 100,
      'SLOW MOTION!',
      {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: '#FFCC00',
        stroke: '#FF6600',
        strokeThickness: 7
      }
    ).setOrigin(0.5);
    
    slowText.setDepth(1000);
    slowText.setScrollFactor(0);
    
    scene.tweens.add({
      targets: slowText,
      y: slowText.y - 70,
      alpha: 0,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => slowText.destroy()
    });
    
    // Apply slow motion effect
    this.slowAllBalls(scene, ITEMS.DURATION.TIME_SLOW, ITEMS.MULTIPLIER.SLOW_MOTION);
    
    // Optional: Screen tint effect
    const tintOverlay = scene.add.rectangle(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,
      scene.cameras.main.width,
      scene.cameras.main.height,
      0xFFCC00,
      0.15
    );
    tintOverlay.setDepth(998);
    tintOverlay.setScrollFactor(0);
    
    scene.time.delayedCall(ITEMS.DURATION.TIME_SLOW, () => {
      scene.tweens.add({
        targets: tintOverlay,
        alpha: 0,
        duration: 500,
        onComplete: () => tintOverlay.destroy()
      });
    });
    
    // Optional: play sound
    // scene.sound.play('time_slow', { volume: 0.5 });
  }

  /**
   * Slow down all balls on screen
   * @param {Phaser.Scene} scene - The game scene
   * @param {number} duration - Duration of slow effect in milliseconds
   * @param {number} slowMultiplier - Speed multiplier (e.g., 0.4 = 40% speed)
   */
  slowAllBalls(scene, duration, slowMultiplier) {
    let totalSlowed = 0;
    // Slow balls
    if (scene.ballsGroup) {
      const balls = scene.ballsGroup.getChildren();
      totalSlowed += balls.length;
      balls.forEach(ball => {
        if (!ball || !ball.active || !ball.body || ball._isSlowed || ball._isFrozen) return;
        ball._originalVelocity = { x: ball.body.velocity.x, y: ball.body.velocity.y };
        ball.body.setVelocity(ball.body.velocity.x * slowMultiplier, ball.body.velocity.y * slowMultiplier);
        if (ball.speedX !== undefined) {
          ball._originalSpeedX = ball.speedX;
          ball.speedX *= slowMultiplier;
        }
        ball.setTint(0xFFAA44);
        ball._isSlowed = true;
        ball._slowMultiplier = slowMultiplier;
      });
    }
    // Slow birds
    if (scene.birdsGroup) {
      const birds = scene.birdsGroup.getChildren();
      totalSlowed += birds.length;
      birds.forEach(bird => {
        if (!bird || !bird.active || !bird.body || bird._isSlowed || bird._isFrozen) return;
        bird._originalVelocity = { x: bird.body.velocity.x, y: bird.body.velocity.y };
        bird.body.setVelocity(bird.body.velocity.x * slowMultiplier, bird.body.velocity.y * slowMultiplier);
        if (bird.speedX !== undefined) {
          bird._originalSpeedX = bird.speedX;
          bird.speedX *= slowMultiplier;
        }
        bird.setTint(0xFFAA44);
        bird._isSlowed = true;
        bird._slowMultiplier = slowMultiplier;
      });
    }
    if (totalSlowed === 0) {
      return;
    }
    // Restore normal speed after duration
    scene.time.delayedCall(duration, () => {
      this.restoreNormalSpeed(scene);
    });
  }

  /**
   * Restore normal speed to all balls
   * @param {Phaser.Scene} scene - The game scene
   */
  restoreNormalSpeed(scene) {
    // Restore balls
    if (scene.ballsGroup) {
      const balls = scene.ballsGroup.getChildren();
      balls.forEach(ball => {
        if (!ball || !ball.active || !ball.body || !ball._isSlowed) return;
        const multiplier = ball._slowMultiplier || ITEMS.MULTIPLIER.SLOW_MOTION;
        ball.body.setVelocity(ball.body.velocity.x / multiplier, ball.body.velocity.y / multiplier);
        if (ball._originalSpeedX !== undefined) {
          ball.speedX = ball._originalSpeedX;
          delete ball._originalSpeedX;
        }
        ball.clearTint();
        if (ball.ballColor) {
          ball.setTint(ball.ballColor);
        }
        ball._isSlowed = false;
        delete ball._slowMultiplier;
        delete ball._originalVelocity;
      });
    }
    // Restore birds
    if (scene.birdsGroup) {
      const birds = scene.birdsGroup.getChildren();
      birds.forEach(bird => {
        if (!bird || !bird.active || !bird.body || !bird._isSlowed) return;
        const multiplier = bird._slowMultiplier || ITEMS.MULTIPLIER.SLOW_MOTION;
        bird.body.setVelocity(bird.body.velocity.x / multiplier, bird.body.velocity.y / multiplier);
        if (bird._originalSpeedX !== undefined) {
          bird.speedX = bird._originalSpeedX;
          delete bird._originalSpeedX;
        }
        bird.clearTint();
        bird._isSlowed = false;
        delete bird._slowMultiplier;
        delete bird._originalVelocity;
      });
    }
  }
}
