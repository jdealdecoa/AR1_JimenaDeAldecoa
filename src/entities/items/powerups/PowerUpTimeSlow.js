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
    
    // Apply slow motion effect using timeScale
    scene.physics.world.timeScale = ITEMS.MULTIPLIER.SLOW_MOTION;
    
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
      // Restore normal speed
      scene.physics.world.timeScale = 1.0;
      
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
}
