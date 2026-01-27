import { BaseItem } from '../BaseItem.js';

/**
 * Vida extra
 */
export class PowerUpLife extends BaseItem {
  constructor(scene, x, y) {
    super(scene, x, y, 'bonus', {
      itemType: 'EXTRA_LIFE',
      ttl: 10000, // 10 seconds
      gravity: 450,
      bounce: 0.4
    });
    
    // Set to life frame (frame 8)
    this.setFrame(8);
    
    // Add pulsing alpha effect for heart (sin modificar scale)
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1.0, to: 0.7 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Grant extra life to hero
   * @param {Hero} hero - The hero picking up this item
   */
  onPickup(hero) {
    // Add life to hero
    if (typeof hero.addLife === 'function') {
      hero.addLife(1);
    } else {
      // Fallback: direct manipulation if method doesn't exist
      hero.lives = Math.min(hero.lives + 1, hero.maxLives || 99);
      this.scene.game.events.emit('hero:life_gained', hero.lives);
    }
    
    // Show floating +1 life text
    const lifeText = this.scene.add.text(
      this.x,
      this.y - 20,
      '+1 LIFE',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FF1493',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    lifeText.setDepth(100);
    
    this.scene.tweens.add({
      targets: lifeText,
      y: lifeText.y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => lifeText.destroy()
    });
    
    // Optional: play sound
    // this.scene.sound.play('powerup_life', { volume: 0.5 });
  }
}
