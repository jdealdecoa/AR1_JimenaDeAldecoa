import { BaseItem } from '../BaseItem.js';

/**
 * Mejora de arma por niveles
 */

export const WEAPON_LEVELS = {
  0: { shots: 1, speedMultiplier: 1.0, spread: 0, reach: 1.0, fireRate: 1.0, name: 'Basic' },
  1: { shots: 1, speedMultiplier: 1.3, spread: 0, reach: 1.0, fireRate: 1.0, name: 'Fast' },
  2: { shots: 2, speedMultiplier: 1.3, spread: 15, reach: 1.0, fireRate: 1.0, name: 'Double' },
  3: { shots: 3, speedMultiplier: 1.3, spread: 20, reach: 1.1, fireRate: 1.2, name: 'Triple' },
  4: { shots: 4, speedMultiplier: 1.5, spread: 25, reach: 1.2, fireRate: 1.3, name: 'Quad' },
  5: { shots: 5, speedMultiplier: 1.5, spread: 30, reach: 1.3, fireRate: 1.5, name: 'MAX' }
};

export const MAX_WEAPON_LEVEL = 5;

export class PowerUpWeapon extends BaseItem {
  constructor(scene, x, y) {
    super(scene, x, y, 'item_weapon', {
      itemType: 'WEAPON_UPGRADE',
      ttl: 7000, // 7 seconds before despawn
      gravity: 450,
      bounce: 0.5
    });
    
    // Add weapon visual effects (orange/red glow)
    this.setTint(0xFF6600);
    
    // Add pulsing animation
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1.0, to: 1.25 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Rotate for visual appeal
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  /**
   * Upgrade hero's weapon
   * @param {Hero} hero - The hero picking up this item
   */
  onPickup(hero) {
    // Apply weapon upgrade using hero's method or manual implementation
    if (typeof hero.upgradeWeapon === 'function') {
      hero.upgradeWeapon();
    } else {
      // Fallback: manual weapon upgrade implementation
      this.upgradeWeaponManually(hero);
    }
    
    // Show weapon upgrade text
    const level = hero.weaponLevel || 1;
    const levelInfo = WEAPON_LEVELS[level] || WEAPON_LEVELS[MAX_WEAPON_LEVEL];
    
    const weaponText = this.scene.add.text(
      this.x,
      this.y - 20,
      `WEAPON UP! ${levelInfo.name}`,
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FF6600',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    weaponText.setDepth(100);
    
    this.scene.tweens.add({
      targets: weaponText,
      y: weaponText.y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => weaponText.destroy()
    });
    
    // Optional: play sound
    // this.scene.sound.play('powerup_weapon', { volume: 0.5 });
  }

  /**
   * Manual weapon upgrade implementation
   * @param {Hero} hero - The hero to upgrade
   */
  upgradeWeaponManually(hero) {
    // Initialize weapon level if not exists
    if (hero.weaponLevel === undefined) {
      hero.weaponLevel = 0;
    }
    
    // Increase weapon level (cap at MAX)
    if (hero.weaponLevel < MAX_WEAPON_LEVEL) {
      hero.weaponLevel++;
    }
    
    const levelInfo = WEAPON_LEVELS[hero.weaponLevel];
    console.log(`Weapon upgraded to Level ${hero.weaponLevel}: ${levelInfo.name}`);
    console.log(`Stats: ${levelInfo.shots} shots, ${levelInfo.speedMultiplier}x speed, ${levelInfo.spread}° spread`);
    
    // Store weapon stats on hero for use in shooting logic
    hero.weaponStats = levelInfo;
    
    // Optional: visual feedback on hero
    hero.setTint(0xFF6600);
    this.scene.time.delayedCall(500, () => {
      hero.clearTint();
    });
  }
}

/**
 * INTEGRATION NOTES FOR HERO SHOOTING:
 * 
 * In Hero.shootHarpoon() or similar methods, check for hero.weaponLevel:
 * 
 * Example integration:
 * ```javascript
 * shootHarpoon() {
 *   const level = this.weaponLevel || 0;
 *   const stats = WEAPON_LEVELS[level];
 *   
 *   const shots = stats.shots;
 *   const spread = stats.spread;
 *   
 *   if (shots === 1) {
 *     // Single shot
 *     new Harpoon(this.scene, this.x, this.y, stats.speedMultiplier);
 *   } else {
 *     // Multiple shots in a fan pattern
 *     const angleStep = spread / (shots - 1);
 *     const startAngle = -90 - (spread / 2);
 *     
 *     for (let i = 0; i < shots; i++) {
 *       const angle = startAngle + (angleStep * i);
 *       new Harpoon(this.scene, this.x, this.y, stats.speedMultiplier, angle);
 *     }
 *   }
 * }
 * ```
 */
