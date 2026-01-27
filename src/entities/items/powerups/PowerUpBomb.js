import { BaseItem } from '../BaseItem.js';
import { ITEMS } from '../../../core/constants.js';

/**
 * Bomba: daña todas las bolas
 */

export class PowerUpBomb extends BaseItem {
  constructor(scene, x, y) {
    super(scene, x, y, 'bonus', {
      itemType: 'BOMB',
      ttl: ITEMS.TTL.BOMB,
      gravity: 450,
      bounce: 0.6
    });
    // Set to bomb frame (frame 4 or 5)
    this.setFrame(4);
    // Red tint (sin animaciones que sobrescriben BaseItem)
    this.setTint(0xFF4444);
  }

  /**
   * Activate bomb effect - damage all balls on screen
   * @param {Hero} hero - The hero picking up this item
   */
  onPickup(hero) {
    const scene = this.scene;
    // Show bomb activation text
    const bombText = scene.add.text(
      this.x,
      this.y - 30,
      'BOMB!',
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#FF0000',
        stroke: '#FFFF00',
        strokeThickness: 6
      }
    ).setOrigin(0.5);
    bombText.setDepth(100);
    scene.tweens.add({
      targets: bombText,
      y: bombText.y - 80,
      scale: { from: 1, to: 2 },
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => bombText.destroy()
    });
    // Visual explosion effect at bomb position
    this.createExplosionEffect();
    // Damage all balls on screen
    this.damageAllBalls(scene);
    // Optional: Camera shake
    scene.cameras.main.shake(300, 0.005);
    // Optional: play sound
    // scene.sound.play('bomb_explosion', { volume: 0.7 });
  }

  /**
   * Create visual explosion effect
   */
  createExplosionEffect() {
    const scene = this.scene;
    
    // Create expanding circle
    const explosionCircle = scene.add.circle(this.x, this.y, 20, 0xFF6600, 0.8);
    explosionCircle.setDepth(99);
    
    scene.tweens.add({
      targets: explosionCircle,
      radius: 150,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => explosionCircle.destroy()
    });
    
    // Create particles (simple circles)
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const particle = scene.add.circle(
        this.x,
        this.y,
        5,
        Phaser.Math.Between(0, 1) > 0.5 ? 0xFF6600 : 0xFFFF00,
        1
      );
      particle.setDepth(99);
      
      const targetX = this.x + Math.cos(angle) * 100;
      const targetY = this.y + Math.sin(angle) * 100;
      
      scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Damage all balls on the screen
   * @param {Phaser.Scene} scene - The game scene
   */
  damageAllBalls(scene) {
    let totalTargets = 0;
    // Damage balls
    if (scene.ballsGroup) {
      const balls = scene.ballsGroup.getChildren();
      totalTargets += balls.length;
      console.log(`Bomb damaging ${balls.length} balls`);
      balls.forEach(ball => {
        if (ball && ball.active && typeof ball.takeDamage === 'function') {
          const delay = Phaser.Math.Between(0, 200);
          scene.time.delayedCall(delay, () => {
            if (ball && ball.active) {
              // Ensure robust removal from group before destruction
              if (scene.ballsGroup && scene.ballsGroup.contains(ball)) {
                scene.ballsGroup.remove(ball, true, true);
                console.log('[BOMB] Ball removed from group before destruction:', ball);
              }
              ball.takeDamage();
            }
          });
        }
      });
      // After all bomb effects, check for level completion after 1 second
      scene.time.delayedCall(1000, () => {
        // Prefer calling a public checkLevelCompletion method if it exists
        if (typeof scene.checkLevelCompletion === 'function') {
          scene.checkLevelCompletion();
        } else if (scene && scene.ballsGroup && scene.ballsGroup.getChildren().length === 0) {
          // Fallback: legacy logic
          if (typeof scene._levelCompleted !== 'undefined' && !scene._levelCompleted) {
            scene._levelCompleted = true;
            if (typeof scene.nextLevelKey === 'string') {
              scene.scene.start(scene.nextLevelKey);
            }
          }
        }
      });
    }
    // Damage birds (enemies)
    if (scene.birdsGroup) {
      const birds = scene.birdsGroup.getChildren();
      totalTargets += birds.length;
      console.log(`Bomb damaging ${birds.length} birds`);
      birds.forEach(bird => {
        if (bird && bird.active && typeof bird.takeDamage === 'function') {
          const delay = Phaser.Math.Between(0, 200);
          scene.time.delayedCall(delay, () => {
            if (bird && bird.active) {
              bird.takeDamage();
            }
          });
        }
      });
    }
    if (totalTargets === 0) {
      console.log('No targets to damage with bomb');
    }

  }
}
