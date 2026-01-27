import { BaseItem } from '../BaseItem.js';
import { ITEMS } from '../../../core/constants.js';

/**
 * Escudo de un golpe
 */

export const SHIELD_CONFIG = {
  DURATION: ITEMS.DURATION.SHIELD, // 30 seconds shield duration
  INVULN_AFTER_BREAK: ITEMS.DURATION.SHIELD_INVULN_AFTER_BREAK, // 1 second invuln after break
  BLINK_INTERVAL: 200, // Visual feedback interval
  TINT_COLOR: 0x00FFFF // Cyan shield tint
};

export class PowerUpShield extends BaseItem {
  constructor(scene, x, y) {
    super(scene, x, y, 'bonus', {
      itemType: 'SHIELD',
      ttl: 8000, // 8 seconds before despawn
      gravity: 400,
      bounce: 0.5
    });
    
    // Set to shield frame (frame 3)
    this.setFrame(3);
    
    // Add cyan glow (sin rotación que interfiere con BaseItem)
    this.setTint(SHIELD_CONFIG.TINT_COLOR);
  }

  /**
   * Grant shield protection to hero
   * @param {Hero} hero - The hero picking up this item
   */
  onPickup(hero) {
    // Apply shield using hero's method or manual implementation
    if (typeof hero.setShield === 'function') {
      hero.setShield(SHIELD_CONFIG.DURATION);
    } else {
      // Fallback: manual shield implementation
      this.applyShieldManually(hero);
    }
    
    // Show shield activated text
    const shieldText = this.scene.add.text(
      this.x,
      this.y - 20,
      'SHIELD!',
      {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#00FFFF',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    shieldText.setDepth(100);
    
    this.scene.tweens.add({
      targets: shieldText,
      y: shieldText.y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => shieldText.destroy()
    });
    
    // Optional: play sound
    // this.scene.sound.play('powerup_shield', { volume: 0.5 });
  }

  /**
   * Manual shield implementation if hero doesn't have setShield method
   * @param {Hero} hero - The hero to protect
   */
  applyShieldManually(hero) {
    // Clear any existing shield timer
    if (hero.shieldTimer) {
      hero.shieldTimer.destroy();
    }
    
    // Enable shield (one-hit protection)
    hero.hasShield = true;
    // NOT invulnerable - shield will break on first hit
    
    // Visual feedback: cyan glow
    hero.setTint(SHIELD_CONFIG.TINT_COLOR);
    
    // Add pulsing effect
    hero._shieldPulse = this.scene.tweens.add({
      targets: hero,
      alpha: { from: 1, to: 0.7 },
      duration: SHIELD_CONFIG.BLINK_INTERVAL,
      yoyo: true,
      repeat: -1
    });
    
    // Set timer to auto-expire shield after 30 seconds if not hit
    hero.shieldTimer = this.scene.time.delayedCall(SHIELD_CONFIG.DURATION, () => {
      if (hero.hasShield) {
        hero.hasShield = false;
        hero.clearTint();
        hero.setAlpha(1);
        if (hero._shieldPulse) {
          hero._shieldPulse.stop();
          delete hero._shieldPulse;
        }
        hero.shieldTimer = null;
        
        console.log('Shield expired naturally after 30 seconds');
      }
    });
    
    console.log(`Shield activated - will block 1 hit for up to ${SHIELD_CONFIG.DURATION / 1000} seconds`);
  }
}
